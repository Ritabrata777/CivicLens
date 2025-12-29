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
    import cv2
    import easyocr
    from ultralytics import YOLO
    import re

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
    
    # Helper to calculate IoU
    def get_iou(boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])
        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        iou = interArea / float(boxAArea + boxBArea - interArea)
        return iou

    # Collect all boxes first
    all_boxes = []
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            label = model.names[cls]
            all_boxes.append({
                "label": label,
                "confidence": conf,
                "bbox": xyxy,
                "cls": cls
            })
    
    # Process Logic
    for box_data in all_boxes:
        cls = box_data['cls']
        conf = box_data['confidence']
        xyxy = box_data['bbox']
        label = box_data['label']
        
        boxes_data.append({
            "label": label,
            "confidence": conf,
            "bbox": xyxy
        })
        
        # Helper to crop image for OCR
        x1, y1, x2, y2 = map(int, xyxy)
            
        if cls == 1: # without helmet
            # Check if we have a conflicting "with helmet" detection
            is_false_positive = False
            for other_box in all_boxes:
                if other_box['label'] == 'with helmet' and other_box['confidence'] > 0.25:
                    iou = get_iou(xyxy, other_box['bbox'])
                    if iou > 0.25: # Significant overlap
                        is_false_positive = True
                        break
            
            if not is_false_positive and conf > 0.5:
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
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                enhanced = clahe.apply(gray)
                
                # OCR with detail=1 to get bounding boxes
                ocr_results = reader.readtext(enhanced, detail=1)

                if ocr_results:
                    # Robust Sorting: Top-to-Bottom, Left-to-Right
                    ocr_results.sort(key=lambda x: x[0][0][1])
                    
                    lines = []
                    current_line = []
                    last_y = -1
                    y_tolerance = 20 
                    
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
                    
                    final_sorted_results = []
                    for line in lines:
                        line.sort(key=lambda x: x[0][0][0])
                        final_sorted_results.extend(line)
                    
                    sorted_text = [res[1] for res in final_sorted_results]
                    
                    # Semantic Reordering for Indian Plates
                    VALID_STATES = {
                        "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DN", "DL", "GA", "GJ", 
                        "HR", "HP", "JK", "JH", "KA", "KL", "LA", "LD", "MP", "MH", "MN", "ML", 
                        "MZ", "NL", "OD", "PY", "PB", "RJ", "SK", "TN", "TS", "TG", "TR", "UP", 
                        "UK", "WB"
                    }
                    
                    OCR_CORRECTIONS = {
                        "ME": "WB", "MB": "WB", "MW": "MH", "MD": "MP", "D": "UP", "0": "Q"
                    }

                    # Improved Logic: Find State, District (Digits), Series (Letters), Number (Digits)
                    full_str = "".join(sorted_text).upper()
                    clean_str = re.sub(r'[^A-Z0-9]', '', full_str)
                    
                    # Regex for standard format: Adjusted to allow 1-2 chars for state
                    # Group 1: State (1-2 chars)
                    # Group 2: District (2 digits)
                    # Group 3: Series (1-3 chars/digits mixed)
                    # Group 4: Number (4 digits)
                    match = re.search(r'([A-Z]{1,2})[ .]?(\d{2})[ .]?([A-Z0-9]{1,3})[ .]?(\d{4})', clean_str)
                    
                    if match:
                        state, district, series, number = match.groups()
                        
                        # Fix Series: Replace 0 with Q
                        series = series.replace('0', 'Q')
                        
                        # Re-verify state
                        if state in OCR_CORRECTIONS:
                            state = OCR_CORRECTIONS[state]
                            
                        plate_text = f"{state} {district} {series} {number}"
                    else:
                        # Fallback
                        plate_text = " ".join(sorted_text).upper()
                        plate_text = re.sub(r'[^A-Z0-9 ]', '', plate_text)
                        
                        # Check if we can apply simple corrections on the fallback string
                        # e.g. replace 0E with QE if found?
                        pass
    
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
