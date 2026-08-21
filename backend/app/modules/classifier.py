import re
from typing import List, Dict

# Standard Document Types
DOC_TYPES = {
    "URLA 1003": "Uniform Residential Loan Application (URLA 1003)",
    "Form 1008": "Transmittal Summary (Form 1008)",
    "Loan Estimate": "Loan Estimate",
    "Closing Disclosure": "Closing Disclosure",
    "Form 1040": "IRS Form 1040 (Tax Return)",
    "W-2": "Form W-2 (Wage and Tax Statement)",
    "Paystub": "Paystub (Earnings Statement)",
    "Checking Statement": "Checking Statement",
    "Other": "Supporting Document / Disclosure"
}

def classify_page_text(text: str) -> str:
    """Classifies a single page's text into a document type based on keywords."""
    text_upper = text.upper()
    
    if "UNIFORM RESIDENTIAL LOAN APPLICATION" in text_upper or "URLA 1003" in text_upper:
        return "URLA 1003"
    elif "TRANSMITTAL SUMMARY" in text_upper or "FORM 1008" in text_upper:
        return "Form 1008"
    elif "LOAN ESTIMATE" in text_upper:
        return "Loan Estimate"
    elif "CLOSING DISCLOSURE" in text_upper:
        return "Closing Disclosure"
    elif "FORM W-2" in text_upper or "W-2 WAGE AND TAX" in text_upper:
        return "W-2"
    elif "FORM 1040" in text_upper or "INDIVIDUAL INCOME TAX RETURN" in text_upper:
        return "Form 1040"
    elif "PAYSTUB" in text_upper or "EARNINGS STATEMENT" in text_upper or "GROSS PAY" in text_upper or "YTD GROSS" in text_upper:
        return "Paystub"
    elif "CHASE BANK" in text_upper or "STATEMENT OF ACCOUNT" in text_upper or "CHECKING STATEMENT" in text_upper or "ACCOUNT STATEMENT" in text_upper:
        return "Checking Statement"
    else:
        return "Other"

def build_document_lattice(pages: List[Dict]) -> Dict:
    """
    Groups page classifications into logical documents.
    Returns a dictionary representing the Document Structure Lattice (DSL).
    """
    classified_pages = []
    for page in pages:
        p_num = page["page"]
        text = page["text"]
        doc_type = classify_page_text(text)
        classified_pages.append({"page": p_num, "text": text, "type": doc_type})

    documents = []
    current_doc = None
    
    # We step through pages and group them
    for i, p in enumerate(classified_pages):
        p_num = p["page"]
        p_text = p["text"]
        p_type = p["type"]
        
        # Decide if this page starts a new document:
        start_new = False
        
        if current_doc is None:
            start_new = True
        elif current_doc["type"] != p_type:
            start_new = True
        else:
            # Same type, but does it represent a distinct separate document instance?
            # (e.g. consecutive paystubs or checking statements)
            if p_type == "Checking Statement":
                # Check for start markers (like Page 1, or statement header)
                if "PAGE 1 OF" in p_text.upper() or "STATEMENT OF ACCOUNT" in p_text.upper() or "CHASE BANK" in p_text.upper():
                    # If the text has Page 1 or is explicitly starting, treat as new
                    if i > 0 and classified_pages[i-1]["type"] == "Checking Statement":
                        # If previous page was page 1 and this is page 2, do not start new.
                        # But if this page says "Page 1 of", it's a new statement!
                        if "PAGE 1" in p_text.upper():
                            start_new = True
            elif p_type == "Paystub":
                # In mortgage loans, each paystub is usually 1 page.
                # If the page explicitly has a "Pay Period" or "Earnings Statement" or "Stub X of Y", it starts a new paystub.
                # Since each paystub in our package is 1 page, we can split them or detect stub markers.
                # Let's say if we see a header, it starts a new paystub.
                if "PAYSTUB" in p_text.upper() or "EARNINGS STATEMENT" in p_text.upper():
                    start_new = True
            elif p_type == "W-2":
                # W-2 is usually a single page.
                start_new = True
            elif p_type == "Form 1040":
                # If page 1 of 1040:
                if "PAGE 1" in p_text.upper():
                    start_new = True

        if start_new:
            if current_doc:
                documents.append(current_doc)
            
            doc_id = len(documents) + 1
            current_doc = {
                "id": f"doc_{p_type.lower().replace(' ', '_')}_{doc_id}",
                "type": p_type,
                "name": DOC_TYPES.get(p_type, p_type),
                "pages": [p_num],
                "start_page": p_num,
                "end_page": p_num,
                "page_count": 1
            }
        else:
            current_doc["pages"].append(p_num)
            current_doc["end_page"] = p_num
            current_doc["page_count"] = len(current_doc["pages"])

    if current_doc:
        documents.append(current_doc)

    # Calculate counts by type
    counts_by_type = {}
    for d in documents:
        t = d["type"]
        counts_by_type[t] = counts_by_type.get(t, 0) + 1

    # Find the longest document
    longest_doc = None
    max_pages = 0
    for d in documents:
        if d["page_count"] > max_pages:
            max_pages = d["page_count"]
            longest_doc = d

    # Format the Lattice structure response
    lattice = {
        "documents": documents,
        "total_documents": len(documents),
        "counts_by_type": counts_by_type,
        "longest_document": longest_doc,
        "total_pages": len(pages)
    }
    return lattice
