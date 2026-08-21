# 🏦 LoanTrace AI (AI Loan Document Analyzer & RAG System)

An end-to-end AI platform built with **FastAPI** and **React** for automated financial document processing, PDF entity extraction (GLiNER NER), vector search (RAG), and data trust verification.

---

## ✨ Features

- 📑 **PDF Document Processing:** Extract and parse complex multi-page financial packages and loan documents.
- 🎯 **GLiNER NER Entity Extraction:** Recognize key financial entities, borrower details, income figures, and liabilities automatically.
- 🔍 **Vector Retrieval & RAG System:** Query documents with intelligent semantic retrieval and exact page citations.
- 🛡️ **Trust & Confidence Verification:** Multi-stage LLM response verification with retrieval entropy, source page attribution, and distance scoring.
- 💻 **Full-Stack Architecture:** Sleek React frontend with dynamic visual dashboards & FastAPI backend REST endpoints.

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, Pydantic, PyPDF, GLiNER, Vector Search
- **Frontend:** React, HTML5, CSS3, JavaScript, Vite
- **AI/LLM:** Retrieval-Augmented Generation (RAG), Named Entity Recognition (NER), Custom Verification Pipeline

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt   # or install dependencies (fastapi, uvicorn, etc.)
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI endpoints
│   │   ├── modules/
│   │   │   ├── chunker.py       # Document chunking logic
│   │   │   ├── classifier.py    # Document lattice classifier
│   │   │   ├── llm.py           # LLM extraction & generation
│   │   │   ├── ner.py           # GLiNER entity extraction
│   │   │   ├── pdf_processor.py # PDF text & page parser
│   │   │   ├── retriever.py     # Vector index & search
│   │   │   └── trust_layer.py   # Confidence & entropy scoring
├── frontend/                    # React dynamic dashboard UI
├── .gitignore
└── README.md
```

---

## 📄 License

MIT License.
