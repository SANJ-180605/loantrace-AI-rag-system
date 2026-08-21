import numpy as np
from typing import List, Dict, Any, Tuple

# Try importing sentence_transformers and faiss, with robust fallback
HAS_FAISS = False
HAS_ST = False

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

try:
    from sentence_transformers import SentenceTransformer
    # Initialize lightweight model
    ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    HAS_ST = True
except Exception:
    HAS_ST = False
    ST_MODEL = None


class FallbackTFIDFIndex:
    """Lightweight TF-IDF / Vector index fallback when PyTorch/FAISS is omitted or loading."""
    def __init__(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        self.vocab = {}
        self.doc_vectors = []
        self._build()

    def _build(self):
        for chunk in self.chunks:
            tokens = chunk["text"].lower().split()
            vec = {}
            for t in tokens:
                if t not in self.vocab:
                    self.vocab[t] = len(self.vocab)
                t_id = self.vocab[t]
                vec[t_id] = vec.get(t_id, 0) + 1
            self.doc_vectors.append(vec)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        q_tokens = query.lower().split()
        q_vec = {}
        for t in q_tokens:
            if t in self.vocab:
                t_id = self.vocab[t]
                q_vec[t_id] = q_vec.get(t_id, 0) + 1

        scores = []
        for i, doc_vec in enumerate(self.doc_vectors):
            dot = sum(val * doc_vec.get(k, 0) for k, val in q_vec.items())
            q_norm = np.sqrt(sum(v**2 for v in q_vec.values())) or 1.0
            d_norm = np.sqrt(sum(v**2 for v in doc_vec.values())) or 1.0
            cosine_sim = dot / (q_norm * d_norm)
            distance = float(1.0 - cosine_sim)
            scores.append((distance, i))

        scores.sort(key=lambda x: x[0])
        
        results = []
        for dist, idx in scores[:top_k]:
            c = self.chunks[idx].copy()
            c["distance"] = dist
            results.append(c)
        return results


def build_index(chunks: List[Dict[str, Any]]) -> Tuple[Any, List[Dict[str, Any]]]:
    """
    Layer 3: Embedding Layer & FAISS Indexing
    Converts chunks into embeddings and indexes them.
    """
    if not chunks:
        return None, []

    if HAS_ST and ST_MODEL and HAS_FAISS:
        try:
            texts = [c["text"] for c in chunks]
            embeddings = ST_MODEL.encode(texts, convert_to_numpy=True)
            embeddings = np.ascontiguousarray(embeddings.astype("float32"))
            
            # Normalize for cosine similarity
            faiss.normalize_L2(embeddings)
            
            dimension = embeddings.shape[1]
            index = faiss.IndexFlatIP(dimension)
            index.add(embeddings)
            return index, chunks
        except Exception as e:
            print(f"FAISS/ST embedding build failed, falling back to TF-IDF: {e}")

    # Fallback Index
    fallback_index = FallbackTFIDFIndex(chunks)
    return fallback_index, chunks


def search(query: str, index: Any, chunks: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Searches the FAISS or Fallback index for top K matching chunks.
    """
    if not chunks or index is None:
        return []

    if HAS_FAISS and isinstance(index, faiss.Index):
        try:
            q_emb = ST_MODEL.encode([query], convert_to_numpy=True)
            q_emb = np.ascontiguousarray(q_emb.astype("float32"))
            faiss.normalize_L2(q_emb)
            
            distances, indices = index.search(q_emb, top_k)
            results = []
            for i, idx in enumerate(indices[0]):
                if idx != -1 and idx < len(chunks):
                    c = chunks[idx].copy()
                    # Cosine distance = 1 - cosine_similarity
                    c["distance"] = float(1.0 - max(0.0, min(1.0, distances[0][i])))
                    results.append(c)
            return results
        except Exception as e:
            print(f"FAISS search failed, falling back: {e}")

    if isinstance(index, FallbackTFIDFIndex):
        return index.search(query, top_k=top_k)

    # Simple text match ranking fallback if index type unrecognized
    results = []
    q_words = set(query.lower().split())
    for c in chunks:
        c_text = c["text"].lower()
        matches = sum(1 for w in q_words if w in c_text)
        dist = 1.0 - (matches / max(len(q_words), 1))
        item = c.copy()
        item["distance"] = dist
        results.append(item)

    results.sort(key=lambda x: x["distance"])
    return results[:top_k]
