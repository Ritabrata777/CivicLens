import sys
import json
import os
import imagehash
import numpy as np
import base64
import io
import logging
from PIL import Image
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import requests
import re

logging.basicConfig(level=logging.INFO)

MODEL_NAME = 'all-MiniLM-L6-v2'
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def get_image_phash(image_input):
    if not image_input:
        return None
    img = None
    try:
        # Check if Data URI
        if isinstance(image_input, str) and image_input.startswith('data:image'):
            try:
                header, encoded = image_input.split(',', 1)
                data = base64.b64decode(encoded)
                img = Image.open(io.BytesIO(data))
            except Exception as e:
                return None
        # Handle URL (Cloud storage) - IMPORTANT for Production
        elif isinstance(image_input, str) and image_input.startswith('http'):
            try:
                response = requests.get(image_input, stream=True)
                if response.status_code == 200:
                    img = Image.open(response.raw)
            except:
                return None
        
        if img:
            return imagehash.phash(img, hash_size=16)
            
    except Exception as e:
        return None
    return None

def compare_hashes(hash1, hash2):
    if hash1 is None or hash2 is None:
        return 0.0
    diff = hash1 - hash2
    if diff == 0: return 1.0
    if diff > 30: return 0.0
    return 1.0 - (diff / 30.0)

def get_text_embedding(text):
    model = get_model()
    if not model or not text.strip():
        return np.zeros((1, 384))
    return model.encode([text])

def compare_vectors(vec1, vec2):
    score = cosine_similarity(vec1, vec2)[0][0]
    return max(0.0, score)

UTILITY_KEYWORDS = {
    "water": ["water", "drinking water", "water supply", "tap", "pipeline", "pipe", "tank", "tanker"],
    "lpg": ["lpg", "gas", "cylinder", "domestic gas", "gas supply", "bharat gas", "indane", "hp gas"],
    "electricity": ["electricity", "power", "current", "voltage", "meter", "transformer", "load shedding", "outage"],
}

def normalize_text(value):
    return re.sub(r"\s+", " ", (value or "").lower()).strip()

def extract_utility_tags(text):
    normalized = normalize_text(text)
    tags = set()

    for tag, keywords in UTILITY_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            tags.add(tag)

    return tags

def normalize_location_token(text):
    normalized = normalize_text(text)
    normalized = re.sub(r"[^a-z0-9\s,-]", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()

def get_issue_locality_tokens(issue):
    tokens = set()
    postal_code = normalize_text(issue.get('postal_code', ''))
    location_address = normalize_location_token(issue.get('location_address', ''))

    if postal_code:
        tokens.add(postal_code)

    for part in re.split(r"[,/-]", location_address):
        part = part.strip()
        if len(part) >= 4:
            tokens.add(part)

    return tokens

def detect_duplicates(mongo_uri, target_issue_id, project_root, db_name=None):
    try:
        client = MongoClient(mongo_uri)
        db = client.get_database(db_name) if db_name else client.get_database()
        collection = db['issues']
    except Exception as e:
        return {"error": f"Database connection failed: {str(e)}"}

    target = collection.find_one({"_id": target_issue_id})
    if not target:
        return {"error": "Target issue not found"}

    target_category = normalize_text(target.get('category', ''))
    target_text = " ".join(filter(None, [
        target.get('category', ""),
        target.get('title', ""),
        target.get('description', "")
    ]))
    target_vec = get_text_embedding(target_text)
    target_utility_tags = extract_utility_tags(target_text)
    target_location_tokens = get_issue_locality_tokens(target)
    
    target_img_phash = None
    target_img_url = target.get('imageUrl') # Mongoose stores it as imageUrl, script had image_url?
    # Checking schema: src/db/models/Issue.ts usually has imageUrl.
    # Note: The original script used 'image_url' in some places, but schema likely matches.
    # Let's fallback to checking both keys.
    if not target_img_url: 
         target_img_url = target.get('image_url')

    if target_img_url:
        target_img_phash = get_image_phash(target_img_url)

    candidates = list(collection.find({
        "_id": {"$ne": target_issue_id},
        "status": {"$ne": "Rejected"}
    }))

    results = []
    
    for row in candidates:
        candidate_category = normalize_text(row.get('category', ''))
        c_text = " ".join(filter(None, [
            row.get('category', ""),
            row.get('title', ""),
            row.get('description', "")
        ]))
        c_vec = get_text_embedding(c_text)
        
        score_text = float(compare_vectors(target_vec, c_vec))
        candidate_utility_tags = extract_utility_tags(c_text)
        candidate_location_tokens = get_issue_locality_tokens(row)
        
        score_image = 0.0
        c_img_rel = row.get('imageUrl') or row.get('image_url')
        
        if c_img_rel and target_img_phash:
            c_hash = get_image_phash(c_img_rel)
            score_image = compare_hashes(target_img_phash, c_hash)

        same_category = target_category and candidate_category and target_category == candidate_category
        both_domestic = target_category == "domestic utilities" and candidate_category == "domestic utilities"
        shared_utility_tags = target_utility_tags.intersection(candidate_utility_tags)
        shared_location_tokens = target_location_tokens.intersection(candidate_location_tokens)

        category_boost = 0.08 if same_category else 0.0
        utility_boost = 0.12 if shared_utility_tags else 0.0
        location_boost = 0.10 if shared_location_tokens else 0.0

        if score_image >= 0.95:
            final_score = score_image
        elif score_text >= 0.90:
            final_score = score_text
        elif both_domestic:
            # Domestic utility complaints often describe the same outage with weak images and different wording.
            final_score = (score_text * 0.82) + category_boost + utility_boost + location_boost
        else:
            final_score = (score_text * 0.6) + (score_image * 0.4) + category_boost + utility_boost + location_boost

        final_score = min(final_score, 1.0)
        threshold = 0.45 if both_domestic else 0.55

        if final_score > threshold:
            results.append({
                "id": str(row['_id']), # ID to string
                "title": row.get('title', ''),
                "score": round(final_score * 100, 1),
                "image_score": round(score_image * 100, 1),
                "text_score": round(score_text * 100, 1),
                "match_type": "AI-Semantic",
                "image_url": row.get('image_url') or row.get('imageUrl') or '',
                "location_address": row.get('location_address', ''),
                "postal_code": row.get('postal_code', ''),
                "category": row.get('category', ''),
                "shared_utilities": sorted(list(shared_utility_tags))
            })

    results.sort(key=lambda x: x['score'], reverse=True)
    return {"matches": results[:10]}
