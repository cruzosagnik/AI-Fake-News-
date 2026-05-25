import asyncio
import os
import sys
from PIL import Image
import io

# Add the parent directory to the path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ocr_service import extract_text_from_image

async def run_diagnostics():
    log_file = os.path.join(os.path.dirname(__file__), "ocr_debug.log")
    with open(log_file, "w", encoding="utf-8") as f:
        f.write("=== OCR Diagnostics ===\n")
        f.write(f"Python: {sys.version}\n")
        f.write(f"Platform: {sys.platform}\n")
        
        # 1. Test pytesseract import
        try:
            import pytesseract
            f.write("pytesseract: Imported successfully\n")
        except ImportError as e:
            f.write(f"pytesseract: Import failed: {e}\n")
            return

        # 2. Test TESSDATA_PREFIX env var
        f.write(f"TESSDATA_PREFIX env: {os.environ.get('TESSDATA_PREFIX')}\n")

        # 3. Create a simple 100x100 white image with black text 'Test' to run OCR
        try:
            from PIL import ImageDraw
            img = Image.new('RGB', (100, 100), color = 'white')
            # Just some mock bytes
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_bytes = img_byte_arr.getvalue()
            
            f.write("Attempting extract_text_from_image...\n")
            text = await extract_text_from_image(img_bytes)
            f.write(f"OCR Success! Result: '{text}'\n")
        except Exception as e:
            import traceback
            f.write(f"OCR Failed:\n{traceback.format_exc()}\n")

if __name__ == "__main__":
    asyncio.run(run_diagnostics())
