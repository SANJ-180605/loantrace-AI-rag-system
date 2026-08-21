import re
from typing import List, Dict, Any

KEYWORD_PATTERNS = [
    r"LOAN\s*AMOUNT", r"INTEREST\s*RATE", r"BORROWER", r"PROPERTY\s*ADDRESS",
    r"MONTHLY\s*INCOME", r"WAGE", r"SALARY", r"GROSS\s*PAY", r"PURCHASE\s*PRICE",
    r"DOWN\s*PAYMENT", r"CLOSING\s*COSTS", r"TAX\s*RETURN", r"CHECKING\s*ACCOUNT"
]

def regex_filter_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Layer 5: Trust Layer - Regex Pre-filter
    Filters chunks containing critical loan financial entities for GLiNER NER processing.
    """
    selected = []
    combined_pattern = "|".join(KEYWORD_PATTERNS)
    regex = re.compile(combined_pattern, re.IGNORECASE)

    for chunk in chunks:
        if regex.search(chunk["text"]):
            selected.append(chunk)
            
    # Fallback: if no regex match, take top 10 chunks
    if not selected:
        selected = chunks[:10]
        
    return selected


def run_gliner_extraction(chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Layer 5: Trust Layer - Entity Extraction (GLiNER / Heuristic Rule Engine)
    Extracts key named entities across chunks (borrower name, loan amount, rates, etc.)
    """
    facts_db = {
        "borrower_names": [],
        "loan_amounts": [],
        "interest_rates": [],
        "property_addresses": [],
        "monthly_incomes": [],
        "dates": []
    }

    for chunk in chunks:
        text = chunk["text"]
        p_num = chunk["page"]

        # Regex Entity Extraction
        loan_matches = re.findall(r"loan\s*amount:?\s*\$?([\d,]+(?:\.\d{2})?)", text, re.IGNORECASE)
        for val in loan_matches:
            facts_db["loan_amounts"].append({"value": f"${val}", "page": p_num})

        rate_matches = re.findall(r"interest\s*rate:?\s*([\d\.]+%?)", text, re.IGNORECASE)
        for val in rate_matches:
            facts_db["interest_rates"].append({"value": val, "page": p_num})

        borrower_matches = re.findall(r"borrower:?\s*([A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+)", text)
        for val in borrower_matches:
            facts_db["borrower_names"].append({"value": val, "page": p_num})

    return facts_db
