import os
import shutil
import zipfile
import sys
import random
from pathlib import Path

# Configuration: locations relative to this script
SCRIPT_DIR = Path(__file__).parent
ZIPS_DIR = SCRIPT_DIR / "zips"
OUTPUT_ROOT = SCRIPT_DIR / "animals"  # Output folder per-zip will live here


def extract_and_organize_yolo_data(zip_path, output_folder, train_size=1200, val_size=300):
    """
    Extract YOLO data from zip file and reorganize into train/val folders.
    
    Parameters:
    -----------
    zip_path : str
        Path to the zip file containing YOLO data with train/test/val folders
    output_folder : str
        Name/path of the output folder to create
    train_size : int
        Number of images for training (default: 1200)
    val_size : int
        Number of images for validation (default: 300)
    """
    
    # Convert to absolute path if relative
    zip_path = Path(zip_path)
    if not zip_path.is_absolute():
        zip_path = SCRIPT_DIR / zip_path
    
    zip_path = zip_path.resolve()
    
    # Validate inputs
    if not zip_path.exists():
        raise FileNotFoundError(f"Zip file not found: {zip_path}\n\nMake sure the zip file exists at: {zip_path}")
    
    if not zipfile.is_zipfile(zip_path):
        raise ValueError(f"File is not a valid zip file: {zip_path}")
    
    # Create output directory
    output_path = Path(output_folder)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    train_images_dir = output_path / "train" / "images"
    train_labels_dir = output_path / "train" / "labels"
    val_images_dir = output_path / "val" / "images"
    val_labels_dir = output_path / "val" / "labels"
    
    train_images_dir.mkdir(parents=True, exist_ok=True)
    train_labels_dir.mkdir(parents=True, exist_ok=True)
    val_images_dir.mkdir(parents=True, exist_ok=True)
    val_labels_dir.mkdir(parents=True, exist_ok=True)
    
    # Extract zip file to temporary directory
    extract_path = output_path / "temp_extract"
    extract_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Extracting zip file: {zip_path}")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    
    # Find and collect all images and labels
    all_image_files = []
    all_label_files = []
    
    # Search for images and labels in the extracted directory
    for root, dirs, files in os.walk(extract_path):
        for file in files:
            file_path = Path(root) / file
            # Common image extensions for YOLO
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif')):
                all_image_files.append(file_path)
            # Label files are typically .txt
            elif file.lower().endswith('.txt') and 'label' in root.lower():
                all_label_files.append(file_path)
    
    if not all_image_files:
        raise ValueError("No image files found in the zip archive")
    
    print(f"Found {len(all_image_files)} images and {len(all_label_files)} labels")
    
    # Check if we have enough data for training
    if len(all_image_files) < train_size:
        raise ValueError(
            f"Not enough images for training. Need at least {train_size}, but found {len(all_image_files)}"
        )
    
    # Adjust val_size based on total available images
    # If total images < 1500, use remaining images for validation
    if len(all_image_files) < 1500:
        adjusted_val_size = len(all_image_files) - train_size
        print(f"Total images ({len(all_image_files)}) < 1500. Using {train_size} for train and {adjusted_val_size} for val")
    else:
        adjusted_val_size = val_size
        total_needed = train_size + val_size
        if len(all_image_files) < total_needed:
            raise ValueError(
                f"Not enough images. Need {total_needed}, but found {len(all_image_files)}"
            )
    
    # Create a mapping of image files to their corresponding label files
    image_label_pairs = []
    for img_path in all_image_files:
        img_name = img_path.stem  # filename without extension
        # Find corresponding label file
        corresponding_label = None
        for label_path in all_label_files:
            if label_path.stem == img_name:
                corresponding_label = label_path
                break
        
        image_label_pairs.append((img_path, corresponding_label))
    
    # Sort then shuffle for deterministic order across runs if seeded
    image_label_pairs.sort(key=lambda x: x[0].name)
    random.shuffle(image_label_pairs)
    
    # Split data: train (1200) and val (adjusted based on total images)
    train_pairs = image_label_pairs[:train_size]
    val_pairs = image_label_pairs[train_size:train_size + adjusted_val_size]
    
    print(f"\nCopying {len(train_pairs)} training samples...")
    # Copy training data
    for img_path, label_path in train_pairs:
        shutil.copy2(img_path, train_images_dir / img_path.name)
        if label_path and label_path.exists():
            shutil.copy2(label_path, train_labels_dir / label_path.name)
    
    print(f"Copying {len(val_pairs)} validation samples...")
    # Copy validation data
    for img_path, label_path in val_pairs:
        shutil.copy2(img_path, val_images_dir / img_path.name)
        if label_path and label_path.exists():
            shutil.copy2(label_path, val_labels_dir / label_path.name)
    
    # Clean up temporary extraction directory
    print("Cleaning up temporary files...")
    shutil.rmtree(extract_path)
    
    print(f"\n✓ Successfully organized YOLO data!")
    print(f"├── Train: {len(list(train_images_dir.glob('*')))} images, "
          f"{len(list(train_labels_dir.glob('*')))} labels")
    print(f"└── Val: {len(list(val_images_dir.glob('*')))} images, "
          f"{len(list(val_labels_dir.glob('*')))} labels")
    print(f"\nOutput directory: {output_path.absolute()}")


def main():
    """
    Main function to run the data preprocessing.
    """
    
    # Iterate over all zip files in ZIPS_DIR and create per-zip output folder under OUTPUT_ROOT
    if not ZIPS_DIR.exists():
        print(f"Error: zips folder not found at {ZIPS_DIR}")
        return

    zips = sorted([p for p in ZIPS_DIR.iterdir() if p.suffix.lower() == ".zip"])
    if not zips:
        print(f"No zip files found in {ZIPS_DIR}")
        return

    print(f"Found {len(zips)} zip file(s) in {ZIPS_DIR}\n")

    for zp in zips:
        out_dir = OUTPUT_ROOT / zp.stem
        print(f"=== Processing {zp.name} -> {out_dir} ===")
        try:
            extract_and_organize_yolo_data(
                zip_path=zp,
                output_folder=out_dir,
                train_size=1200,
                val_size=300
            )
        except Exception as e:
            print(f"Error processing {zp.name}: {e}\n")
            continue
        print()


if __name__ == "__main__":
    main()
