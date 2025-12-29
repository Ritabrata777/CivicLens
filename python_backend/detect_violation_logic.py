import cv2
import easyocr
from ultralytics import YOLO
import numpy as np
import re
import logging

# Initialize Reader & Model (Module Level)
reader = easyocr.Reader(['en'], gpu=False)
model = None

def load_model():
    global model
    if model is None:
        try:
             # Expect 'best.pt' to be in the same directory or passed explicitly
             model = YOLO("best.pt") 
             logging.info("YOLO Model loaded.")
        except Exception as e:
             logging.error(f"Failed to load YOLO model: {e}")
             # Fallback to standard model if local fails? 
             # model = YOLO("yolov8n.pt")
    return model

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

def detect_violation_memory(image_bytes):
    current_model = load_model()
    if not current_model:
        return {"error": "Model not loaded"}
        
    # Convert bytes to cv2 image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return {"error": "Invalid image data"}
        
    results = current_model(img)
    
    violations = []
    plate_text = ""
    boxes_data = []
    
    all_boxes = []
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            label = current_model.names[cls]
            all_boxes.append({
                "label": label,
                "confidence": conf,
                "bbox": xyxy,
                "cls": cls
            })
            
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
        
        x1, y1, x2, y2 = map(int, xyxy)
        
        # 1: without helmet, 3: number plate (Assuming standard classes from user yaml)
        # Note: We should verify class IDs if possible, but assuming same model file.
        
        if label == "without helmet" or cls == 1: 
             # Check false positive IoU with "with helmet"
             is_false_positive = False
             for other_box in all_boxes:
                 if (other_box['label'] == 'with helmet' or other_box['cls'] == 0) and other_box['confidence'] > 0.25:
                     iou = get_iou(xyxy, other_box['bbox'])
                     if iou > 0.25: 
                         is_false_positive = True
                         break
             
             if not is_false_positive and conf > 0.5:
                 violations.append({
                     "type": "No Helmet",
                     "confidence": conf,
                     "bbox": xyxy
                 })

        if label == "number plate" or cls == 3:
             roi = img[y1:y2, x1:x2]
             # OCR Logic
             try:
                 # upscale
                 scale = 3
                 h, w = roi.shape[:2]
                 roi_up = cv2.resize(roi, (w*scale, h*scale), interpolation=cv2.INTER_CUBIC)
                 gray = cv2.cvtColor(roi_up, cv2.COLOR_BGR2GRAY)
                 clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                 enhanced = clahe.apply(gray)
                 
                 ocr_results = reader.readtext(enhanced, detail=0)
                 # Join and clean
                 text_raw = " ".join(ocr_results).upper()
                 text_clean = re.sub(r'[^A-Z0-9]', '', text_raw)
                 
                 # Simple logic: take the longest alphanumeric sequence that looks like a plate
                 # Or just return the cleaned text
                 if len(text_clean) > 4:
                     plate_text = text_clean # Improve logic if needed
             except Exception as e:
                 logging.error(f"OCR Failed: {e}")

    return {
        "violation_detected": len(violations) > 0,
        "violations": violations,
        "license_plate": plate_text,
        "all_detections": boxes_data
    }
