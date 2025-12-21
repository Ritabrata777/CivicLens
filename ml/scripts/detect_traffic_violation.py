import sys
import json
import os

# Context manager to suppress stdout/stderr
class SuppressOutput:
    def __enter__(self):
        self._original_stdout = sys.stdout
        self._original_stderr = sys.stderr
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout.close()
        sys.stderr.close()
        sys.stdout = self._original_stdout
        sys.stderr = self._original_stderr

# Import heavy libs silently
with SuppressOutput():
    import cv2
    import easyocr
    from ultralytics import YOLO

# Initialize EasyOCR Reader silently
with SuppressOutput():
    reader = easyocr.Reader(['en'], gpu=False)

def detect_violation(image_path, model_path='ml/runs/detect/train/weights/best.pt'):
    # 1. Load Model
    # Try to load custom trained model first, else fallback to standard
    if os.path.exists(model_path):
        with SuppressOutput():
            model = YOLO(model_path)
        using_custom = True
    else:
        return {
            "error": "Custom model not found. Please run 'python python/train_helmet_model.py' first."
        }
        
    # 2. Run Inference
    with SuppressOutput():
        results = model(image_path)
    
    # Classes from user's yaml:
    # 0: "with helmet"
    # 1: "without helmet"
    # 2: "rider"
    # 3: "number plate"
    
    violations = []
    plate_text = ""
    boxes_data = []
    
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            label = model.names[cls]
            
            boxes_data.append({
                "label": label,
                "confidence": conf,
                "bbox": xyxy
            })
            
            # Helper to crop image for OCR
            x1, y1, x2, y2 = map(int, xyxy)
            
            if cls == 1: # without helmet
                violations.append({
                    "type": "No Helmet",
                    "confidence": conf,
                    "bbox": xyxy
                })
            
            if cls == 3: # number plate
                # Crop and read
                img = cv2.imread(image_path)
                if img is not None:
                    roi = img[y1:y2, x1:x2]
                    
                    # Upscale for better small text recognition
                    scale = 3
                    width = int(roi.shape[1] * scale)
                    height = int(roi.shape[0] * scale)
                    roi = cv2.resize(roi, (width, height), interpolation=cv2.INTER_CUBIC)

                    # Preprocessing for better OCR
                    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                    
                    # Enhance contrast
                    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
                    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                    enhanced = clahe.apply(gray)
                    
                    # OCR with detail=1 to get bounding boxes
                    ocr_results = reader.readtext(enhanced, detail=1)

                    if ocr_results:
                        # Robust Sorting: Top-to-Bottom, Left-to-Right
                        # 1. Sort by Y first to get rough vertical order
                        ocr_results.sort(key=lambda x: x[0][0][1])
                        
                        # 2. Group into lines based on Y-tolerance
                        lines = []
                        current_line = []
                        last_y = -1
                        y_tolerance = 20 # pixels
                        
                        for res in ocr_results:
                            y = res[0][0][1]
                            if last_y == -1 or abs(y - last_y) < y_tolerance:
                                current_line.append(res)
                            else:
                                lines.append(current_line)
                                current_line = [res]
                                last_y = y
                        if current_line:
                            lines.append(current_line)
                        
                        # 3. Sort each line by X and flatten
                        final_sorted_results = []
                        for line in lines:
                            line.sort(key=lambda x: x[0][0][0])
                            final_sorted_results.extend(line)
                        
                        sorted_text = [res[1] for res in final_sorted_results]
                        
                        # Semantic Reordering for Indian Plates
                        
                        # Valid State Codes from User
                        VALID_STATES = {
                            "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DN", "DL", "GA", "GJ", 
                            "HR", "HP", "JK", "JH", "KA", "KL", "LA", "LD", "MP", "MH", "MN", "ML", 
                            "MZ", "NL", "OD", "PY", "PB", "RJ", "SK", "TN", "TS", "TG", "TR", "UP", 
                            "UK", "WB"
                        }
                        
                        # Common OCR corrections for State Codes
                        OCR_CORRECTIONS = {
                            "ME": "WB", # M inverted is W, E often misread B? Or just context 
                            "MB": "WB",
                            "MW": "MH",
                            "MD": "MP" 
                        }
                        
                        ordered_tokens = []
                        main_number = ""
                        state_code = ""
                        others = []
                        
                        import re
                        for token in sorted_text:
                            # Clean and upper
                            clean_token = re.sub(r'[^A-Z0-9]', '', token.upper())
                            if not clean_token: continue
                            
                            # Check for 4-digit number (e.g. 6539)
                            if re.fullmatch(r'\d{4}', clean_token) and not main_number:
                                main_number = clean_token
                            
                            # Check for potential state code (2 letters)
                            elif re.fullmatch(r'[A-Z]{2}', clean_token) and not state_code:
                                # 1. Exact match
                                if clean_token in VALID_STATES:
                                    state_code = clean_token
                                # 2. Correction match
                                elif clean_token in OCR_CORRECTIONS:
                                    state_code = OCR_CORRECTIONS[clean_token]
                                else:
                                    others.append(clean_token)
                            else:
                                others.append(clean_token)
                        
                        # Assembler: State + Others + Number
                        final_parts = []
                        if state_code: final_parts.append(state_code)
                        final_parts.extend(others)
                        if main_number: final_parts.append(main_number)
                        
                        if not main_number and not state_code:
                             # Fallback to visual order
                             plate_text = " ".join(sorted_text).upper()
                             plate_text = re.sub(r'[^A-Z0-9 ]', '', plate_text)
                        else:
                             plate_text = " ".join(final_parts)
    
    return {
        "violation_detected": len(violations) > 0,
        "violations": violations,
        "license_plate": plate_text,
        "all_detections": boxes_data,
        "raw_ocr": [res[1] for res in ocr_results] if 'ocr_results' in locals() and ocr_results else []
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing image path"}))
        sys.exit(1)
        
    img_path = sys.argv[1]
    
    # Optional: Allow passing model path as 2nd arg
    model_p = 'ml/runs/detect/train/weights/best.pt'
    if len(sys.argv) > 2:
        model_p = sys.argv[2]
        
    # Check if model exists, if not maybe look in sibling dir?
    if not os.path.exists(model_p):
         # check if we are in root and model is in runs/...
         pass 

    try:
        result = detect_violation(img_path, model_p)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
