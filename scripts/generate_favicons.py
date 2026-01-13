#!/usr/bin/env python3
"""
Generate favicon files from pagelogo.png
"""

from PIL import Image
import os
import sys

# Change to project root directory if running from scripts/
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
if os.path.basename(script_dir) == 'scripts':
    os.chdir(project_root)

def generate_favicons():
    # Source image path
    source_path = "images/pagelogo_round.png"
    
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found!")
        return
    
    # Load the source image
    print(f"Loading source image: {source_path}")
    img = Image.open(source_path)
    print(f"Source image size: {img.size}")
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Define favicon sizes to generate
    favicon_configs = [
        {"size": (16, 16), "filename": "favicon-16x16.png"},
        {"size": (32, 32), "filename": "favicon-32x32.png"},
        {"size": (180, 180), "filename": "apple-touch-icon.png"},
    ]
    
    # Generate PNG favicons
    for config in favicon_configs:
        size = config["size"]
        filename = config["filename"]
        
        print(f"Generating {filename} ({size[0]}x{size[1]})...")
        
        # Resize image with high quality
        resized = img.resize(size, Image.Resampling.LANCZOS)
        
        # Save as PNG
        resized.save(filename, "PNG", optimize=True)
        print(f"✓ Saved {filename}")
    
    # Generate ICO favicon (32x32)
    print("Generating favicon.ico...")
    ico_img = img.resize((32, 32), Image.Resampling.LANCZOS)
    ico_img.save("favicon.ico", "ICO", sizes=[(32, 32)])
    print("✓ Saved favicon.ico")
    
    print("\n🎉 All favicon files generated successfully!")
    print("Files created:")
    for config in favicon_configs:
        print(f"  - {config['filename']}")
    print("  - favicon.ico")

if __name__ == "__main__":
    generate_favicons() 