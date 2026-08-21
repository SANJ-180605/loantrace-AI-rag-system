import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
from uuid import uuid4

from app.modules.pdf_processor import extract_pages
from app.modules.chunker import chunk_pages
from app.modules.retriever import build_index, search
from app.modules.classifier import build_document_lattice
from app.modules.ner import regex_filter_chunks, run_gliner_extraction
from app.modules.llm import (
    extract_document_fields,
    classify_query,
    generate_answer,
    generate_answer_structure,
    generate_answer_aggregation,
    generate_answer_verification,
    NO_DATA_MSG
)
from app.modules.trust_layer import (
    confidence_from_distance,
    should_answer,
    source_pages,
    calculate_retrieval_entropy,
    build_metadata_covariance_matrix,
    get_thread_semaphore_status
)

app = FastAPI(title="LoanTrace AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5175", "http://127.0.0.1:5175", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS: Dict[str, Dict[str, Any]] = {}

class QuestionRequest(BaseModel):
    session_id: str
    question: str
    top_k: int = 5

def parse_cited_pages(text: str) -> List[int]:
    if "Oops! There is no data" in text:
        return []
    pages = set()
    matches = re.findall(r"\(Pages?\s*([\d\s\-\,]+)\)", text, re.IGNORECASE)
    for m in matches:
        parts = m.replace("and", ",").split(",")
        for p in parts:
            p = p.strip()
            if "-" in p:
                try:
                    s, e = map(int, p.split("-"))
                    pages.update(range(s, e + 1))
                except Exception:
                    pass
            elif p.isdigit():
                pages.add(int(p))
    return sorted(list(pages))


@app.get("/")
def root():
    return {"message": "LoanTrace AI backend is running"}

@app.post("/upload")
@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    pdf_bytes = await file.read()
    pages = extract_pages(pdf_bytes)
    chunks = chunk_pages(pages)

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No selectable text found in PDF.",
        )

    selected_chunks = regex_filter_chunks(chunks)
    facts_db = run_gliner_extraction(selected_chunks)
    index, _ = build_index(chunks)
    lattice = build_document_lattice(pages)
    
    for doc in lattice["documents"]:
        doc_type = doc["type"]
        if doc_type in ["URLA 1003", "Form 1008", "Loan Estimate", "Closing Disclosure", "W-2", "Form 1040", "Paystub", "Checking Statement"]:
            doc_pages = doc["pages"]
            doc_text = "\n\n".join([pages[p - 1]["text"] for p in doc_pages if p <= len(pages)])
            extracted = extract_document_fields(doc_text, doc_type)
            doc["extracted_fields"] = extracted
        else:
            doc["extracted_fields"] = {}
            
    covariance_matrix = build_metadata_covariance_matrix(lattice["documents"])
    
    session_id = str(uuid4())
    SESSIONS[session_id] = {
        "filename": file.filename,
        "pages": pages,
        "chunks": chunks,
        "index": index,
        "lattice": lattice,
        "covariance_matrix": covariance_matrix,
        "facts_db": facts_db
    }

    return {
        "session_id": session_id,
        "filename": file.filename,
        "total_pages": len(pages),
        "total_chunks": len(chunks),
        "lattice": lattice,
        "covariance_matrix": covariance_matrix,
        "facts_db": facts_db,
        "semaphore_status": get_thread_semaphore_status(),
        "message": "PDF processed successfully",
    }

@app.get("/session/{session_id}")
@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "filename": session["filename"],
        "lattice": session["lattice"],
        "covariance_matrix": session["covariance_matrix"],
        "facts_db": session.get("facts_db", {}),
        "total_pages": len(session["pages"]),
        "total_chunks": len(session["chunks"]),
        "semaphore_status": get_thread_semaphore_status()
    }

@app.get("/session/{session_id}/page/{page_num}")
@app.get("/api/session/{session_id}/page/{page_num}")
def get_page_text(session_id: str, page_num: int):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if page_num < 1 or page_num > len(session["pages"]):
        raise HTTPException(status_code=400, detail="Invalid page number")
    return {
        "page": page_num,
        "text": session["pages"][page_num - 1]["text"]
    }

@app.post("/ask")
@app.post("/api/ask")
def ask_question(payload: QuestionRequest):
    session = SESSIONS.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Upload the PDF again.")

    classification = classify_query(payload.question)
    route = classification.get("route", "LLM_REASONING")
    target_docs = classification.get("target_document_types", [])
    semaphore = get_thread_semaphore_status()

    # Route: VERIFICATION
    if route == "VERIFICATION":
        answer = generate_answer_verification(payload.question, session["covariance_matrix"])
        if "Oops! There is no data" in answer:
            return {
                "answer": NO_DATA_MSG,
                "source_pages": [],
                "confidence": 0,
                "entropy": 0.0,
                "route": "VERIFICATION",
                "explanation": "No relevant data found in document package.",
                "semaphore_status": semaphore,
                "evidence": []
            }

        src_pages = parse_cited_pages(answer)
        if not src_pages:
            for row in session["covariance_matrix"]["matrix"]:
                for doc_type, val_info in row.get("values", {}).items():
                    if val_info and val_info.get("pages"):
                        src_pages.extend(val_info["pages"])
            src_pages = sorted(list(set(src_pages)))

        if not src_pages:
            src_pages = [1]

        evidence = [
            {
                "page": p,
                "text": session["pages"][p - 1]["text"][:300] if p <= len(session["pages"]) else f"Page {p} verification record.",
                "distance": 0.0
            }
            for p in src_pages[:4]
        ]
        
        return {
            "answer": answer,
            "source_pages": src_pages,
            "confidence": 98,
            "entropy": 0.0,
            "route": "VERIFICATION",
            "explanation": classification.get("explanation", "Verification & Reconciliation Route"),
            "semaphore_status": semaphore,
            "evidence": evidence
        }

    # Route: AGGREGATION
    elif route == "AGGREGATION":
        is_structural = any(k in payload.question.lower() for k in ["how many", "longest", "begin", "start", "separate documents", "pages does"])
        if is_structural:
            answer = generate_answer_structure(payload.question, session["lattice"])
            if "Oops! There is no data" in answer:
                return {
                    "answer": NO_DATA_MSG,
                    "source_pages": [],
                    "confidence": 0,
                    "entropy": 0.0,
                    "route": "AGGREGATION",
                    "explanation": "No relevant data found.",
                    "semaphore_status": semaphore,
                    "evidence": []
                }
            src_pages = parse_cited_pages(answer)
            if not src_pages:
                for doc in session["lattice"]["documents"]:
                    src_pages.extend(doc["pages"])
                src_pages = sorted(list(set(src_pages)))
            if not src_pages:
                src_pages = [1]

            evidence = [
                {
                    "page": p,
                    "text": session["pages"][p - 1]["text"][:300] if p <= len(session["pages"]) else f"Page {p} document structure content.",
                    "distance": 0.0
                }
                for p in src_pages[:4]
            ]
            return {
                "answer": answer,
                "source_pages": src_pages,
                "confidence": 100,
                "entropy": 0.0,
                "route": "AGGREGATION (STRUCTURE)",
                "explanation": classification.get("explanation", "Aggregation over Document Lattice"),
                "semaphore_status": semaphore,
                "evidence": evidence
            }

    # Route: DIRECT_LOOKUP & Fallbacks
    results = search(payload.question, session["index"], session["chunks"], payload.top_k)
    retrieval_entropy = calculate_retrieval_entropy(results)
    
    answer = generate_answer(payload.question, results)
    
    if "Oops! There is no data" in answer:
        return {
            "answer": NO_DATA_MSG,
            "source_pages": [],
            "confidence": 0,
            "entropy": retrieval_entropy,
            "route": route,
            "explanation": "No relevant data found in document package.",
            "semaphore_status": semaphore,
            "evidence": []
        }

    cited_pages = parse_cited_pages(answer)
    final_sources = cited_pages if cited_pages else source_pages(results)
    confidence = confidence_from_distance(results[0]["distance"]) if results else 90

    return {
        "answer": answer,
        "source_pages": final_sources,
        "confidence": confidence,
        "entropy": retrieval_entropy,
        "route": route,
        "explanation": classification.get("explanation", "Direct semantic search reasoning path"),
        "semaphore_status": semaphore,
        "evidence": results
    }
