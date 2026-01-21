import os
from pathlib import Path

from PIL import Image


DATASET_ROOT = Path(__file__).parent / "animals"
MAX_SIZE = 360  # Target max dimension for YOLO img size
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def resize_image(path: Path) -> bool:
    img = Image.open(path)
    # If already within limit, skip
    if max(img.size) <= MAX_SIZE:
        return False

    # Preserve aspect ratio, limit longest side to MAX_SIZE
    img.thumbnail((MAX_SIZE, MAX_SIZE))
    img.save(path)
    return True


def run():
    if not DATASET_ROOT.exists():
        raise FileNotFoundError(f"Dataset root not found: {DATASET_ROOT}")

    count = 0
    for root, _, files in os.walk(DATASET_ROOT):
        for fname in files:
            p = Path(root) / fname
            if p.suffix.lower() not in IMAGE_EXTS:
                continue
            if resize_image(p):
                count += 1
                print(f"Resized: {p}")

    print(f"Done. Resized {count} images (max side now <= {MAX_SIZE}).")


if __name__ == "__main__":
    run()