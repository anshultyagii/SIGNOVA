"""
WLASL (Word-Level American Sign Language) Dataset Downloader
Downloads annotations and video instances for 2,000 sign words and numbers.
Dataset Reference: https://dxli94.github.io/WLASL/
"""

import os
import json
import urllib.request
import argparse

WLASL_JSON_URL = "https://raw.githubusercontent.com/dxli94/WLASL/master/data/WLASL_v0.3.json"

def download_wlasl_index(output_dir="./data"):
    os.makedirs(output_dir, exist_ok=True)
    target_path = os.path.join(output_dir, "WLASL_v0.3.json")
    
    if not os.path.exists(target_path):
        print(f"[+] Downloading WLASL index from {WLASL_JSON_URL}...")
        urllib.request.urlretrieve(WLASL_JSON_URL, target_path)
        print(f"[✓] Saved WLASL annotations to {target_path}")
    else:
        print(f"[i] WLASL annotations already present at {target_path}")

    with open(target_path, "r") as f:
        data = json.load(f)

    total_glosses = len(data)
    total_instances = sum(len(entry["instances"]) for entry in data)
    print(f"==================================================")
    print(f" WLASL Dataset Profile:")
    print(f" - Unique Sign Words: {total_glosses}")
    print(f" - Total Video Instances: {total_instances}")
    print(f"==================================================")

    # Sample top 20 words
    print("Sample Sign Words included in dataset:")
    for entry in data[:20]:
        print(f"  • {entry['gloss']} ({len(entry['instances'])} video clips)")

    return data

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output_dir", default="./data", help="Output directory for annotations")
    args = parser.parse_args()
    download_wlasl_index(args.output_dir)
