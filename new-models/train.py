from ultralytics import YOLO


model = YOLO("yolov8n.pt")

model.train(
    data="data.yaml",
    epochs=150,
    imgsz=640,
    batch=16,
    device=0,
    name="150-epochs",
)

model.val()