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

# Per-class augmentation config
TOTAL_PER_EFFECT = 100  # Per effect, per class
TRAIN_QUOTA_PER_EFFECT = 75  # At least 75 from train split per effect, per class

# Effects to apply
EFFECTS = {
	"gaussian": {"fn": "add_gaussian_noise"},
	"motion": {"fn": "add_motion_blur"},
	"night": {"fn": "add_night_bw"},
}


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def add_gaussian_noise(img: Image.Image, sigma: float = 25.0) -> Image.Image:
	"""Add zero-mean Gaussian noise with configurable sigma."""
	arr = np.array(img).astype(np.float32)
	noise = np.random.normal(0.0, sigma, arr.shape)
	arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
	return Image.fromarray(arr)


def add_motion_blur(img: Image.Image, strength: float = 5.0) -> Image.Image:
	"""Apply strong horizontal motion blur using Gaussian directional blur."""
	arr = np.array(img).astype(np.float32)
	# Apply Gaussian blur primarily in horizontal direction
	# sigma=[strength, 0.5, 0] = strong blur horizontally, weak vertically
	arr = gaussian_filter(arr, sigma=[strength, 0.5, 0])
	return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def add_night_bw(img: Image.Image) -> Image.Image:
	"""Convert to low-light grayscale to mimic night shots."""
	gray = img.convert("L")
	darker = ImageEnhance.Brightness(gray).enhance(0.35)
	contrast = ImageEnhance.Contrast(darker).enhance(0.85)
	tinted = ImageOps.colorize(contrast, black="#05050a", white="#c8c8c8")
	return tinted


def find_images(root: Path):
	items = []
	for class_dir in sorted(root.iterdir()):
		if not class_dir.is_dir():
			continue
		for split in ("train", "val", "test"):
			img_dir = class_dir / split / "images"
			lbl_dir = class_dir / split / "labels"
			if not img_dir.exists():
				continue
			for img_path in img_dir.iterdir():
				if img_path.suffix.lower() not in IMAGE_EXTS:
					continue
				label_path = lbl_dir / f"{img_path.stem}.txt"
				items.append(
					{
						"img_path": img_path,
						"label_path": label_path if label_path.exists() else None,
						"class_dir": class_dir,
						"split": split,
					}
				)
	return items


def pick_items(items, total_needed: int, train_quota: int):
	train_pool = [i for i in items if i["split"] == "train"]
	take_train = min(train_quota, total_needed, len(train_pool))

	chosen = []
	chosen_ids = set()

	if take_train:
		selected = random.sample(train_pool, take_train)
		chosen.extend(selected)
		chosen_ids.update(id(x) for x in selected)

	remaining = total_needed - len(chosen)
	pool = [i for i in items if id(i) not in chosen_ids]
	take_rest = min(remaining, len(pool))
	if take_rest:
		chosen.extend(random.sample(pool, take_rest))

	return chosen


def ensure_dirs(dst_img_path: Path):
	dst_img_path.parent.mkdir(parents=True, exist_ok=True)
	label_dir = dst_img_path.parent.parent / "labels"
	label_dir.mkdir(parents=True, exist_ok=True)
	return label_dir


def copy_original(item, copied: set):
	"""Copy the original image and label once into OUTPUT_ROOT mirroring structure."""
	key = item["img_path"].as_posix()
	if key in copied:
		return

	dst_img = OUTPUT_ROOT / item["class_dir"].name / item["split"] / "images" / item["img_path"].name
	label_dir = ensure_dirs(dst_img)
	shutil.copy2(item["img_path"], dst_img)

	if item["label_path"] and item["label_path"].exists():
		dst_lbl = label_dir / f"{item['img_path'].stem}.txt"
		shutil.copy2(item["label_path"], dst_lbl)

	copied.add(key)


def augment_and_save(item, effect_name: str, idx: int):
	img = Image.open(item["img_path"]).convert("RGB")

	if effect_name == "gaussian":
		aug = add_gaussian_noise(img)
	elif effect_name == "motion":
		aug = add_motion_blur(img)
	elif effect_name == "night":
		aug = add_night_bw(img)
	else:
		raise ValueError(f"Unknown effect: {effect_name}")

	dst_img = OUTPUT_ROOT / item["class_dir"].name / item["split"] / "images" / f"{item['img_path'].stem}_{effect_name}_{idx}{item['img_path'].suffix}"
	label_dir = ensure_dirs(dst_img)
	aug.save(dst_img)

	if item["label_path"] and item["label_path"].exists():
		dst_lbl = label_dir / f"{item['img_path'].stem}_{effect_name}_{idx}.txt"
		shutil.copy2(item["label_path"], dst_lbl)


def run():
	random.seed(42)
	np.random.seed(42)

	if not DATASET_ROOT.exists():
		raise FileNotFoundError(f"Dataset root not found: {DATASET_ROOT}")

	OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

	items = find_images(DATASET_ROOT)
	if not items:
		raise RuntimeError("No images found under the animals dataset.")

	print(f"Found {len(items)} images across all splits.")

	# Copy originals once into OUTPUT_ROOT, preserving structure
	copied = set()
	for itm in items:
		copy_original(itm, copied)

	print(f"Copied {len(copied)} originals into {OUTPUT_ROOT}.")

	# Group items by class
	items_by_class = defaultdict(list)
	for itm in items:
		items_by_class[itm["class_dir"].name].append(itm)

	print(f"\nProcessing {len(items_by_class)} animal classes...\n")

	# Per-class augmentation
	for class_name in sorted(items_by_class.keys()):
		class_items = items_by_class[class_name]
		print(f"Class: {class_name} ({len(class_items)} images)")

		for effect_name in EFFECTS:
			picks = pick_items(class_items, TOTAL_PER_EFFECT, TRAIN_QUOTA_PER_EFFECT)
			if len(picks) < TOTAL_PER_EFFECT:
				print(
					f"  {effect_name}: only {len(picks)} available (requested {TOTAL_PER_EFFECT})."
				)
			else:
				print(f"  {effect_name}: {len(picks)} augmented.")

			for idx, item in enumerate(picks, start=1):
				augment_and_save(item, effect_name, idx)
		print()

	print("Done. Augmented images saved per-class.")


if __name__ == "__main__":
	run()
