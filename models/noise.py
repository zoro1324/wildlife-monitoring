import os
import random
import shutil
from pathlib import Path
from collections import defaultdict

import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

# Root folder that contains class subfolders (Bear, Bison, etc.)
DATASET_ROOT = Path(__file__).parent / "animals"
# Output root to store copies plus augmented variants
OUTPUT_ROOT = Path(__file__).parent / "animal_with_noise"

# Target counts per split per class
TARGET_COUNTS = {
    "train": 1500,
    "val": 500,
    "test": 300
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}

# --- Augmentation Functions ---

def add_gaussian_noise(img: Image.Image) -> Image.Image:
    """Add zero-mean Gaussian noise."""
    sigma = 25.0
    arr = np.array(img).astype(np.float32)
    noise = np.random.normal(0.0, sigma, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def add_motion_blur(img: Image.Image) -> Image.Image:
    """Apply horizontal motion blur."""
    strength = 5.0
    arr = np.array(img).astype(np.float32)
    arr = gaussian_filter(arr, sigma=[strength, 0.5, 0])
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def add_night_bw(img: Image.Image) -> Image.Image:
    """Convert to low-light grayscale."""
    gray = img.convert("L")
    darker = ImageEnhance.Brightness(gray).enhance(0.35)
    contrast = ImageEnhance.Contrast(darker).enhance(0.85)
    tinted = ImageOps.colorize(contrast, black="#05050a", white="#c8c8c8")
    return tinted


def add_brightness(img: Image.Image) -> Image.Image:
    """Randomly adjust brightness."""
    factor = random.uniform(0.7, 1.3)
    return ImageEnhance.Brightness(img).enhance(factor)


def add_contrast(img: Image.Image) -> Image.Image:
    """Randomly adjust contrast."""
    factor = random.uniform(0.7, 1.3)
    return ImageEnhance.Contrast(img).enhance(factor)


def flip_horizontal(img: Image.Image) -> Image.Image:
    """Flip image horizontally."""
    return img.transpose(Image.FLIP_LEFT_RIGHT)


# --- Label Handling ---

def copy_label(src_path: Path, dst_path: Path):
    """Simply copy the label file."""
    if src_path and src_path.exists():
        shutil.copy2(src_path, dst_path)


def flip_label(src_path: Path, dst_path: Path):
    """Copy label with horizontal flip adjustment for YOLO format."""
    if not src_path or not src_path.exists():
        return

    try:
        with open(src_path, 'r') as f:
            lines = f.readlines()
        
        new_lines = []
        for line in lines:
            parts = line.strip().split()
            # YOLO format: class x_center y_center width height (normalized)
            if len(parts) >= 5:
                # Keep class, width, height, y_center same. Flip x_center.
                # x_new = 1.0 - x_old
                cls_id = parts[0]
                x = float(parts[1])
                rest = parts[2:]
                
                new_x = 1.0 - x
                # Reconstruct line
                new_line = f"{cls_id} {new_x:.6f} " + " ".join(rest) + "\n"
                new_lines.append(new_line)
            else:
                # If format is weird, just copy it? Or skip? strict YOLO assumes 5 parts.
                new_lines.append(line)
        
        with open(dst_path, 'w') as f:
            f.writelines(new_lines)
            
    except Exception as e:
        print(f"Warning: Failed to process label {src_path} for flip: {e}")
        # Fallback to copy if parsing fails? No, incorrect labels are worse.
        pass

# Map effects to (image_func, label_func)
EFFECTS_MAP = {
    "gaussian": (add_gaussian_noise, copy_label),
    "motion": (add_motion_blur, copy_label),
    "night": (add_night_bw, copy_label),
    "brightness": (add_brightness, copy_label),
    "contrast": (add_contrast, copy_label),
    "flip": (flip_horizontal, flip_label),
}


def find_images(root: Path):
    """
    Find all images grouped by class and split.
    Returns dict: items[class][split] = list of dicts(img_path, label_path)
    """
    items = defaultdict(lambda: defaultdict(list))
    
    if not root.exists():
        return items

    for class_dir in sorted(root.iterdir()):
        if not class_dir.is_dir():
            continue
        
        class_name = class_dir.name
        
        for split in ("train", "val", "test"):
            img_dir = class_dir / split / "images"
            lbl_dir = class_dir / split / "labels"
            
            if not img_dir.exists():
                continue
            
            for img_path in img_dir.iterdir():
                if img_path.suffix.lower() not in IMAGE_EXTS:
                    continue
                
                label_path = lbl_dir / f"{img_path.stem}.txt"
                items[class_name][split].append({
                    "img_path": img_path,
                    "label_path": label_path if label_path.exists() else None,
                    "name": img_path.name,
                    "stem": img_path.stem,
                    "suffix": img_path.suffix
                })
    return items


def ensure_dirs(dst_img_path: Path):
    dst_img_path.parent.mkdir(parents=True, exist_ok=True)
    label_dir = dst_img_path.parent.parent / "labels"
    label_dir.mkdir(parents=True, exist_ok=True)
    return label_dir


def process_split(class_name, split, original_items, target_count):
    """
    Process a single split:
    1. Copy originals (up to target_count).
    2. Augment to reach target_count if needed.
    """
    
    # Shuffle originals to ensure random selection if we have too many
    random.shuffle(original_items)
    
    count_originals = len(original_items)
    
    # 1. Selection Strategy
    if count_originals > target_count:
        # Downsample
        selected_originals = original_items[:target_count]
        augment_needed = 0
    else:
        # Take all
        selected_originals = original_items
        augment_needed = target_count - count_originals
    
    print(f"  {split.capitalize()}: Found {count_originals}. Keeping {len(selected_originals)}. Need {augment_needed} augmentations.")
    
    # 2. Copy Originals
    for item in selected_originals:
        dst_img = OUTPUT_ROOT / class_name / split / "images" / item["name"]
        dst_lbl_dir = ensure_dirs(dst_img)
        
        shutil.copy2(item["img_path"], dst_img)
        if item["label_path"]:
            shutil.copy2(item["label_path"], dst_lbl_dir / item["label_path"].name)

    # 3. Augment if needed
    if augment_needed > 0:
        effect_names = list(EFFECTS_MAP.keys())
        
        # Source pool for augmentation: the selected originals
        # We need to generate `augment_needed` images.
        # We randomly pick a source image and an effect for each needed slot.
        
        for i in range(augment_needed):
            source_item = random.choice(selected_originals)
            effect_name = random.choice(effect_names)
            img_func, lbl_func = EFFECTS_MAP[effect_name]
            
            # Load image
            img = Image.open(source_item["img_path"]).convert("RGB")
            
            # Apply effect
            aug_img = img_func(img)
            
            # Construct new filename
            # e.g. Bear_001_flip_0.jpg
            new_filename = f"{source_item['stem']}_{effect_name}_{i}{source_item['suffix']}"
            dst_img_path = OUTPUT_ROOT / class_name / split / "images" / new_filename
            dst_lbl_dir = ensure_dirs(dst_img_path)
            
            # Save image
            aug_img.save(dst_img_path)
            
            # Handle label
            if source_item["label_path"]:
                dst_lbl_path = dst_lbl_dir / f"{source_item['stem']}_{effect_name}_{i}.txt"
                lbl_func(source_item["label_path"], dst_lbl_path)


def run():
    random.seed(42)
    np.random.seed(42)

    if not DATASET_ROOT.exists():
        raise FileNotFoundError(f"Dataset root not found: {DATASET_ROOT}")
    
    # Clear output directory if it exists? 
    # The user might want a clean state. Let's start fresh to avoid mixing old runs.
    if OUTPUT_ROOT.exists():
        print(f"Removing existing output directory: {OUTPUT_ROOT}")
        shutil.rmtree(OUTPUT_ROOT)
    
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    print("Scanning images...")
    # items[class][split] = list
    all_items = find_images(DATASET_ROOT)
    
    if not all_items:
        print("No images found.")
        return

    print(f"Found classes: {list(all_items.keys())}")
    
    for class_name, splits in sorted(all_items.items()):
        print(f"\nProcessing Class: {class_name}")
        
        for split_name in ["train", "val", "test"]:
            target = TARGET_COUNTS.get(split_name, 0)
            items = splits.get(split_name, [])
            
            process_split(class_name, split_name, items, target)
            
    print("\nProcessing Complete.")
    print(f"Output saved to: {OUTPUT_ROOT}")
    print("Counts per class should be:")
    print(f"  Train: {TARGET_COUNTS['train']}")
    print(f"  Val:   {TARGET_COUNTS['val']}")
    print(f"  Test:  {TARGET_COUNTS['test']}")


if __name__ == "__main__":
    run()
