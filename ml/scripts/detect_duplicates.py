import sys
import json
import os
import cv2
import imagehash
import numpy as np
import base64
import io
import logging
from PIL import Image
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Configure file logging
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'debug_log.txt')
logging.basicConfig(filename=log_file, level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

logging.getLogger("transformers").setLevel(logging.ERROR)

logging.info("Starting detect_duplicates script")

MODEL_NAME = 'all-MiniLM-L6-v2'
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            logging.info("Loading model...")
            _model = SentenceTransformer(MODEL_NAME)
            logging.info("Model loaded.")
        except Exception as e:
            logging.error(f"Error loading AI model: {e}")
            sys.stderr.write(f"Error loading AI model: {e}\n")
            return None
    return _model

def get_image_phash(image_input):
    if not image_input:
        return None
    
    img = None
    try:
        # Check if Data URI
        if isinstance(image_input, str) and image_input.startswith('data:image'):
            # defined as data:image/<type>;base64,<data>
            try:
                header, encoded = image_input.split(',', 1)
                data = base64.b64decode(encoded)
                img = Image.open(io.BytesIO(data))
                logging.debug("Processed Data URI image")
            except Exception as inner_e:
                logging.error(f"Failed to decode Data URI: {inner_e}")
                return None
        elif isinstance(image_input, str) and os.path.exists(image_input):
             img = Image.open(image_input)
             logging.debug(f"Opened image file: {image_input}")
        
        if img:
            return imagehash.phash(img, hash_size=16)
            
    except Exception as e:
        logging.error(f"Error processing image for hash: {e}")
        # sys.stderr.write(f"Error processing image for hash: {e}\n")
        return None
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

def detect_duplicates(mongo_uri, target_issue_id, project_root, db_name=None):
    try:
        logging.info(f"Connecting to MongoDB. URI len: {len(mongo_uri)}, DB: {db_name}")
        client = MongoClient(mongo_uri)
        db = client.get_database(db_name) if db_name else client.get_database()
        collection = db['issues']
    except Exception as e:
        logging.error(f"Database connection failed: {str(e)}")
        return {"error": f"Database connection failed: {str(e)}"}

    logging.info(f"Searching for target issue: {target_issue_id}")
    target = collection.find_one({"_id": target_issue_id})
    if not target:
        logging.error("Target issue not found in MongoDB")
        return {"error": "Target issue not found in MongoDB"}

    logging.info("Target issue found. Calculating embeddings...")
    target_text = (target.get('title', "") or "") + ". " + (target.get('description', "") or "")
    target_vec = get_text_embedding(target_text)
    
    target_img_phash = None
    target_img_url = target.get('image_url')
    if target_img_url:
        logging.info("Processing target image...")
        if target_img_url.startswith('data:'):
            target_img_phash = get_image_phash(target_img_url)
        else:
            clean_rel = target_img_url.lstrip('/').lstrip('\\')
            p1 = os.path.join(project_root, 'public', clean_rel)
            p2 = os.path.join(project_root, clean_rel)
            final_path = p1 if os.path.exists(p1) else (p2 if os.path.exists(p2) else None)
            target_img_phash = get_image_phash(final_path)

    # Find candidates: exclude target itself and rejected issues
    logging.info("Finding candidates...")
    candidates = list(collection.find({
        "_id": {"$ne": target_issue_id},
        "status": {"$ne": "Rejected"}
    }))
    logging.info(f"Found {len(candidates)} candidates.")

    results = []
    
    for row in candidates:
        c_text = (row.get('title', "") or "") + ". " + (row.get('description', "") or "")
        c_vec = get_text_embedding(c_text)
        
        score_text = float(compare_vectors(target_vec, c_vec))
        
        score_image = 0.0
        c_img_rel = row.get('image_url')
        
        if c_img_rel and target_img_phash:
            c_hash = None
            if c_img_rel.startswith('data:'):
                c_hash = get_image_phash(c_img_rel)
            else:
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
                "id": row['_id'],
                "title": row.get('title', ''),
                "score": round(final_score * 100, 1),
                "image_score": round(score_image * 100, 1),
                "text_score": round(score_text * 100, 1),
                "match_type": "AI-Semantic"
            })

    results.sort(key=lambda x: x['score'], reverse=True)
    logging.info(f"Refinement complete. Matches found: {len(results)}")
    return {"matches": results[:10]} # Top 10

if __name__ == "__main__":
    if len(sys.argv) < 4:
        # expects: script.py <target_id> <project_root_path> <mongo_uri>
        logging.error("Insufficient arguments")
        print(json.dumps({"error": "Usage: script.py <target_id> <project_root_path> <mongo_uri>"}))
        sys.exit(1)
    
    t_id = sys.argv[1]
    root = sys.argv[2]
    mongo_uri = sys.argv[3]
    db_name = sys.argv[4] if len(sys.argv) > 4 else None
    
    logging.info(f"Main called with ID: {t_id}")
    
    try:
        out = detect_duplicates(mongo_uri, t_id, root, db_name)
        print(json.dumps(out))
        logging.info("Success, output printed.")
    except Exception as e:
        # Print error to stderr so as not to corrupt JSON stdout
        logging.error(f"Global exception: {e}")
        sys.stderr.write(str(e))
        # Return empty matches or error json
        print(json.dumps({"error": str(e)}))
