from sentence_transformers import SentenceTransformer
import sys

print("Starting model download...")
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model downloaded and cached successfully.")
except Exception as e:
    print(f"Error downloading model: {e}")
    sys.exit(1)
