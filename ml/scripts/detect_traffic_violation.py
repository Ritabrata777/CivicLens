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
                    # OCR
                    ocr_result = reader.readtext(roi, detail=0)
                    if ocr_result:
                        plate_text = " ".join(ocr_result).upper().replace(" ", "")
    
    return {
        "violation_detected": len(violations) > 0,
        "violations": violations,
        "license_plate": plate_text,
        "all_detections": boxes_data
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
