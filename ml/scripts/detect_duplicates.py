import sqlite3
import sys
import json
import os
import cv2
import imagehash
import numpy as np
from PIL import Image
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Suppress heavy logging from transformers
import logging
logging.getLogger("transformers").setLevel(logging.ERROR)

MODEL_NAME = 'all-MiniLM-L6-v2'
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            _model = SentenceTransformer(MODEL_NAME)
        except Exception as e:
            sys.stderr.write(f"Error loading AI model: {e}\n")
            return None
    return _model

def get_image_phash(image_path):
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        img = Image.open(image_path)
        return imagehash.phash(img, hash_size=16)
    except Exception:
        return None

def compare_hashes(hash1, hash2):
    if hash1 is None or hash2 is None:
        return 0.0
    diff = hash1 - hash2
    if diff == 0: return 1.0
    # Allow some tolerance. 16x16 hash = 256 bits. 
    # Difference of > 20 bits is usually different image.
    if diff > 30: return 0.0
    return 1.0 - (diff / 30.0)

def get_text_embedding(text):
    model = get_model()
    if not model or not text.strip():
        return np.zeros((1, 384))
    
    # Check if CUDA available for speed (likely not on simple VPS but good to have)
    embedding = model.encode([text])
    return embedding

def compare_vectors(vec1, vec2):
    score = cosine_similarity(vec1, vec2)[0][0]
    return max(0.0, score)

def detect_duplicates(db_path, target_issue_id, project_root):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM issues WHERE id = ?", (target_issue_id,))
    target = cursor.fetchone()
    if not target:
        return {"error": "Target issue not found"}

    target_text = (target['title'] or "") + ". " + (target['description'] or "")
    target_vec = get_text_embedding(target_text)
    
    target_img_phash = None
    if target['image_url']:
        clean_rel = target['image_url'].lstrip('/').lstrip('\\')
        p1 = os.path.join(project_root, 'public', clean_rel)
        p2 = os.path.join(project_root, clean_rel)
        # Check if exists
        final_path = p1 if os.path.exists(p1) else (p2 if os.path.exists(p2) else None)
        
        target_img_phash = get_image_phash(final_path)

    cursor.execute("SELECT id, title, description, image_url FROM issues WHERE id != ? AND status != 'Rejected'", (target_issue_id,))
    candidates = cursor.fetchall()

    results = []
    
    for row in candidates:
        c_text = (row['title'] or "") + ". " + (row['description'] or "")
        c_vec = get_text_embedding(c_text)
        
        score_text = float(compare_vectors(target_vec, c_vec))
        
        score_image = 0.0
        c_img_rel = row['image_url']
        
        if c_img_rel and target_img_phash:
            clean_rel_c = c_img_rel.lstrip('/').lstrip('\\')
            cp1 = os.path.join(project_root, 'public', clean_rel_c)
            cp2 = os.path.join(project_root, clean_rel_c)
            c_path = cp1 if os.path.exists(cp1) else (cp2 if os.path.exists(cp2) else None)
            
            c_hash = get_image_phash(c_path)
            score_image = compare_hashes(target_img_phash, c_hash)

        # Smart Weighting Logic
        if score_image >= 0.95:
            # If images are identical, it's a duplicate.
            final_score = score_image
        elif score_text >= 0.90:
            # If text is nearly unique identical
            final_score = score_text
        else:
            # Mixed weight
            final_score = (score_text * 0.6) + (score_image * 0.4)

        if final_score > 0.55: # Filter low relevance
            results.append({
                "id": row['id'],
                "title": row['title'],
                "score": round(final_score * 100, 1),
                "image_score": round(score_image * 100, 1),
                "text_score": round(score_text * 100, 1),
                "match_type": "AI-Semantic"
            })

    results.sort(key=lambda x: x['score'], reverse=True)
    return {"matches": results[:10]} # Top 10

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: script.py <target_id> <project_root_path>"}))
        sys.exit(1)
    
    t_id = sys.argv[1]
    root = sys.argv[2]
    db_p = os.path.join(root, 'civic-lens.db')
    
    try:
        out = detect_duplicates(db_p, t_id, root)
        print(json.dumps(out))
    except Exception as e:
        # Print error to stderr so as not to corrupt JSON stdout
        sys.stderr.write(str(e))
        # Return empty matches or error json
        print(json.dumps({"error": str(e)}))
