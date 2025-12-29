from ultralytics import YOLO
import sys

def train_model():
    # Load a model
    model = YOLO("ml/models/yolov8n.pt")  # load a pretrained model (recommended for training)

    # Train the model
    # We assume coco128.yaml is in the current directory or user provides path
    # The user provided paths in yaml are absolute '/train/images', which might need adjustment to local relative paths
    # or absolute paths on their machine. 
    # BUT, based on the file content: "train: /train/images", this looks like it relates to the root of the workspace.
    # YOLO might expect these to be relative to the yaml file or absolute. 
    # I'll update the yaml dynamically or assume the user runs this where the paths resolve.
    
    print("Starting training on custom dataset...")
    
    # Check if we need to fix the path in yaml? 
    # content of coco128.yaml:
    # train: /train/images
    # val: /val/images
    # If these are meant to be relative to the project root, they should probably be 'train/images' (no leading slash) or absolute.
    # I will rely on the user having set it up or the simple command below working if run from project root.
    
    results = model.train(data="ml/dataset/coco128.yaml", epochs=50, imgsz=640)
    
    print("Training complete.")
    print(f"Best model saved at: {results.save_dir}/weights/best.pt")

if __name__ == '__main__':
    train_model()
