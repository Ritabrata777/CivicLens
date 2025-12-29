import easyocr
import sys
import json
import re
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize reader once
reader = easyocr.Reader(['en'], gpu=False)

def extract_text(image_path):
    if not os.path.exists(image_path):
        return []
    try:
        logging.info(f"Reading text from: {image_path}")
        result = reader.readtext(image_path, detail=0)
        return result
    except Exception as e:
        logging.error(f"Error reading text: {e}")
        return []

def verify_voter_card(front_path, back_path, voter_id_input):
    # 1. Extract Text
    front_text = extract_text(front_path)
    back_text = []
    if back_path and back_path != "NONE":
         back_text = extract_text(back_path)
    
    all_text = " ".join(front_text + back_text).upper()
    voter_id_input = voter_id_input.upper().strip()
    
    logging.info(f"Extracted Text Length: {len(all_text)}")
    
    # 2. Heuristic Checks
    
    # Check A: Does the input ID exist in the extracted text?
    id_match = voter_id_input in all_text.replace(" ", "") or voter_id_input in all_text
    
    # Check B: Regex Pattern (ABC1234567)
    pattern_match = re.search(r'[A-Z]{3}[0-9]{7}', all_text)
    
    # Check C: Keywords (Front)
    front_join = " ".join(front_text).upper()
    keywords_front = ["ELECTION", "COMMISSION", "IDENTITY", "CARD", "ELECTOR", "NAME", "FATHER"]
    front_score = sum(1 for k in keywords_front if k in front_join)
    
    # Check D: Keywords (Back)
    back_join = " ".join(back_text).upper()
    keywords_back = ["ADDRESS", "DATE", "ASSEMBLY", "CONSTITUENCY", "SEX", "AGE"]
    back_score = sum(1 for k in keywords_back if k in back_join)
    
    # DECISION LOGIC
    is_valid = False
    reason = ""
    
    if back_path and back_path != "NONE":
         # Check Pseudo-Duplicate: If extracted text is identical (or nearly identical), likely same image
         if front_text == back_text and len(front_text) > 0:
             return {
                 "match": False,
                 "reason": "Duplicate images detected. Please upload different photos for the front and back of the ID.",
                 "extracted_text": front_text + back_text,
                 "debug": { "front_score": 0, "back_score": 0, "id_found": False }
             }

    if id_match:
        # Check if back side is valid (if provided)
        if back_path and back_path != "NONE" and back_score < 1:
             is_valid = False
             reason = "Voter ID number matches, but the back side of the ID appears invalid (no keywords found)."
        else:
            is_valid = True
            reason = "Voter ID verified successfully."
            
    elif pattern_match:
         is_valid = False
         reason = f"Found a similar ID pattern ({pattern_match.group(0)}) but it did not match the provided ID ({voter_id_input})."
    else:
        is_valid = False
        reason = "Could not find the provided Voter ID number on the document."
        
    # Quality check
    if is_valid:
        if front_score < 2:
            reason += " Warning: Front document missing standard keywords."
        if back_path and back_path != "NONE" and back_score < 2:
             # This might not be reached if we enforce strict check above, but good for borderline cases if we lower threshold
             reason += " Warning: Back document seems to have low clarity or missing keywords."
    
    return {
        "match": is_valid,
        "reason": reason,
        "extracted_text": front_text + back_text,
        "debug": {
            "front_score": front_score,
            "back_score": back_score,
            "id_found": id_match
        }
    }

if __name__ == "__main__":
    try:
        # Args: script.py front_path back_path voter_id
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Missing arguments"}))
            sys.exit(1)
            
        front_image_path = sys.argv[1]
        back_image_path = sys.argv[2]
        voter_id_number = sys.argv[3]

        result = verify_voter_card(front_image_path, back_image_path, voter_id_number)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
