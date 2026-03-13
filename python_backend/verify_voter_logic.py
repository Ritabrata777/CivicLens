import easyocr
import re
import logging
import numpy as np
import cv2

# Initialize reader once (Global)
# In a module, this runs on import. In FastAPI app, we might control this better, but this is fine.
reader = easyocr.Reader(['en'], gpu=False)

def extract_text_from_bytes(image_bytes):
    if not image_bytes:
        return []
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # EasyOCR reads directly from numpy array
        result = reader.readtext(img, detail=0)
        return result
    except Exception as e:
        logging.error(f"Error reading text: {e}")
        return []

def verify_voter_card_memory(front_bytes, back_bytes, voter_id_input):
    # 1. Extract Text
    front_text = extract_text_from_bytes(front_bytes)
    back_text = []
    if back_bytes:
         back_text = extract_text_from_bytes(back_bytes)
    
    all_text = " ".join(front_text + back_text).upper()
    voter_id_input = voter_id_input.upper().strip()
    
    # 2. Heuristic Checks
    id_match = voter_id_input in all_text.replace(" ", "") or voter_id_input in all_text
    pattern_match = re.search(r'[A-Z]{3}[0-9]{7}', all_text)
    
    front_join = " ".join(front_text).upper()
    keywords_front = ["ELECTION", "COMMISSION", "IDENTITY", "CARD", "ELECTOR", "NAME", "FATHER"]
    front_score = sum(1 for k in keywords_front if k in front_join)
    
    back_join = " ".join(back_text).upper()
    keywords_back = ["ADDRESS", "DATE", "ASSEMBLY", "CONSTITUENCY", "SEX", "AGE"]
    back_score = sum(1 for k in keywords_back if k in back_join)
    
    is_valid = False
    reason = ""
    
    if back_bytes:
         if front_text == back_text and len(front_text) > 0:
             return {
                 "match": False,
                 "reason": "Duplicate images detected.",
                 "extracted_text": front_text + back_text
             }

    if id_match:
        if back_bytes and back_score < 1:
             is_valid = False
             reason = "Voter ID number matches, but back side appears invalid."
        else:
            is_valid = True
            reason = "Voter ID verified successfully."
    elif pattern_match:
         is_valid = False
         reason = f"Found a similar ID pattern ({pattern_match.group(0)}) but it did not match."
    else:
        is_valid = False
        reason = "Could not find the provided Voter ID number."
        
    return {
        "match": is_valid,
        "reason": reason,
        "extracted_text": front_text + back_text
    }
