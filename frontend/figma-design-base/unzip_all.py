#!/usr/bin/env python3
"""
Script to unzip all zip files in the current directory and extract their contents
into folders named after each zip file (without the .zip extension).
"""

import os
import zipfile
from pathlib import Path


def unzip_all_files(directory=None):
    """
    Unzip all zip files in the specified directory (or current directory if None).
    Each zip file will be extracted into a folder with the same name (without .zip).
    """
    if directory is None:
        directory = Path(__file__).parent
    else:
        directory = Path(directory)
    
    # Find all zip files in the directory
    zip_files = list(directory.glob("*.zip"))
    
    if not zip_files:
        print(f"No zip files found in {directory}")
        return
    
    print(f"Found {len(zip_files)} zip file(s) to extract:")
    
    for zip_file in zip_files:
        # Create folder name by removing .zip extension
        folder_name = zip_file.stem
        extract_path = directory / folder_name
        
        print(f"\nExtracting {zip_file.name} -> {folder_name}/")
        
        try:
            # Create the extraction folder if it doesn't exist
            extract_path.mkdir(exist_ok=True)
            
            # Extract the zip file
            with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            
            # Count extracted files
            extracted_count = sum(len(files) for _, _, files in os.walk(extract_path))
            print(f"  ✓ Successfully extracted {extracted_count} file(s)")
            
        except zipfile.BadZipFile:
            print(f"  ✗ Error: {zip_file.name} is not a valid zip file")
        except Exception as e:
            print(f"  ✗ Error extracting {zip_file.name}: {str(e)}")
    
    print(f"\n✓ Extraction complete!")


if __name__ == "__main__":
    # Unzip all files in the script's directory
    unzip_all_files()

