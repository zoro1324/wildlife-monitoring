import os
import shutil

script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

source_root = "dataset"
target_root = "animal_dataset"

classes = {
    "Bear": 0,
    "Elephant": 1,
    "Leopard": 2,
    "Lion": 3,
    "Tiger": 4,
    "Wolf": 5
}

splits = {
    "train": "train",
    "valid": "val",
    "test": "test"
}

for split in ["train", "val", "test"]:
    os.makedirs(f"{target_root}/images/{split}", exist_ok=True)
    os.makedirs(f"{target_root}/labels/{split}", exist_ok=True)

for animal, class_id in classes.items():
    print(f"\nProcessing {animal}...")
    for src_split, dst_split in splits.items():

        img_dir = f"{source_root}/{animal}/{src_split}/images"
        lbl_dir = f"{source_root}/{animal}/{src_split}/labels"

        if not os.path.exists(img_dir):
            print(f"  Skipping {src_split} (directory not found)")
            continue

        files = [f for f in os.listdir(img_dir) if f.lower().endswith((".jpg", ".png", ".jpeg"))]
        print(f"  {src_split}: {len(files)} images found")

        for file in files:
            name = os.path.splitext(file)[0]
            ext = os.path.splitext(file)[1]
            new_name = f"{animal.lower()}_{name}"

            src_img = f"{img_dir}/{file}"
            dst_img = f"{target_root}/images/{dst_split}/{new_name}{ext}"

            src_lbl = f"{lbl_dir}/{name}.txt"
            dst_lbl = f"{target_root}/labels/{dst_split}/{new_name}.txt"

            shutil.copy(src_img, dst_img)
            print(f"    Copied: {new_name}{ext}")

            if os.path.exists(src_lbl):
                with open(src_lbl, "r") as f:
                    lines = f.readlines()

                new_lines = []
                for line in lines:
                    parts = line.strip().split()
                    if parts:
                        parts[0] = str(class_id)
                        new_lines.append(" ".join(parts))

                with open(dst_lbl, "w") as f:
                    f.write("\n".join(new_lines))
            else:
                print(f"      Warning: No label file for {new_name}{ext}")

print("\nDataset reorganization complete!")

from PIL import Image
import os

for root, _, files in os.walk("animal_dataset/images"):
    for f in files:
        p = os.path.join(root, f)
        img = Image.open(p)
        if max(img.size) > 1920:
            img.thumbnail((1920, 1920))
            img.save(p)

            print(f"Resized image: {p}")