#!/usr/bin/env python3
"""
Image cropping script to remove transparent edges
"""

from PIL import Image
import numpy as np
import sys

def crop_transparent_edges(input_path, output_path, margin=5):
    """
    Crop transparent edges from an image
    
    Args:
        input_path: Path to input image
        output_path: Path to save cropped image
        margin: Additional margin to keep around the content
    """
    try:
        # Open the image
        img = Image.open(input_path)
        print(f'📏 Original size: {img.size}')
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Find non-transparent pixels (alpha > 0)
        alpha = img_array[:, :, 3]
        non_transparent = alpha > 0
        
        # Find bounding box of non-transparent content
        rows = np.any(non_transparent, axis=1)
        cols = np.any(non_transparent, axis=0)
        
        if np.any(rows) and np.any(cols):
            # Get the bounds
            top, bottom = np.where(rows)[0][[0, -1]]
            left, right = np.where(cols)[0][[0, -1]]
            
            # Add margin
            top = max(0, top - margin)
            left = max(0, left - margin)
            bottom = min(img.size[1] - 1, bottom + margin)
            right = min(img.size[0] - 1, right + margin)
            
            # Crop the image
            cropped_img = img.crop((left, top, right + 1, bottom + 1))
            
            print(f'✂️  Cropped size: {cropped_img.size}')
            print(f'📐 Crop area: left={left}, top={top}, right={right}, bottom={bottom}')
            
            # Save the cropped image
            cropped_img.save(output_path)
            print(f'✅ Successfully saved cropped image to: {output_path}')
            
            # Calculate size reduction
            original_area = img.size[0] * img.size[1]
            cropped_area = cropped_img.size[0] * cropped_img.size[1]
            reduction = (1 - cropped_area / original_area) * 100
            print(f'📊 Size reduction: {reduction:.1f}%')
            
            return True
        else:
            print('❌ No non-transparent pixels found')
            return False
            
    except Exception as e:
        print(f'❌ Error processing image: {e}')
        return False

if __name__ == '__main__':
    input_file = 'images/pagelogo.png'
    output_file = 'images/pagelogo_cropped.png'
    
    print('🖼️  Starting image cropping...')
    success = crop_transparent_edges(input_file, output_file)
    
    if success:
        print('🎉 Image cropping completed successfully!')
    else:
        print('💥 Image cropping failed!')
        sys.exit(1) 