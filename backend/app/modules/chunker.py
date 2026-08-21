from typing import List, Dict, Any

def chunk_pages(pages: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, Any]]:
    """
    Layer 3: Chunking
    Splits page text into manageable sliding window chunks.
    Preserves page number and metadata for traceable auditing.
    """
    chunks = []
    chunk_counter = 100

    for page_info in pages:
        p_num = page_info["page"]
        text = page_info.get("text", "")
        
        if not text.strip():
            continue
            
        words = text.split()
        if len(words) <= chunk_size:
            chunk_counter += 1
            chunks.append({
                "chunk_id": chunk_counter,
                "page": p_num,
                "text": text,
                "word_count": len(words)
            })
        else:
            start = 0
            while start < len(words):
                end = min(start + chunk_size, len(words))
                chunk_words = words[start:end]
                chunk_text = " ".join(chunk_words)
                
                chunk_counter += 1
                chunks.append({
                    "chunk_id": chunk_counter,
                    "page": p_num,
                    "text": chunk_text,
                    "word_count": len(chunk_words)
                })
                
                if end == len(words):
                    break
                start += (chunk_size - overlap)
                
    return chunks
