from sentence_transformers import SentenceTransformer
from ultralytics import YOLO
import easyocr
import sys
import os

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

print("Starting model downloads...")

try:
    print("\n[1/3] Downloading Sentence Transformer (all-MiniLM-L6-v2)...")
    # This downloads the model to the local huggingface cache
    st_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✔ Sentence Transformer ready.")

    print("\n[2/3] Downloading YOLOv8 Nano (yolov8n.pt)...")
    # This downloads yolov8n.pt to the current directory if not found
    yolo_model = YOLO('yolov8n.pt')
    print("✔ YOLOv8n ready.")

    print("\n[3/3] Downloading EasyOCR English detection model...")
    # Initializing the reader triggers the download of detection and recognition models
    reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    print("✔ EasyOCR models ready.")

    print("\nAll models downloaded and cached successfully.")

except Exception as e:
    print(f"\n❌ Error downloading models: {e}")
    sys.exit(1)
