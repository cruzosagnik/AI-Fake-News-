import asyncio
from PIL import Image
import io
from typing import Union


async def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract text from an image using pytesseract OCR.
    Runs in a thread executor to avoid blocking the event loop.
    """
    try:
        import pytesseract

        loop = asyncio.get_event_loop()

        def _ocr():
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to RGB if needed
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            text = pytesseract.image_to_string(image, lang="eng+hin+ben")
            return text.strip()

        text = await loop.run_in_executor(None, _ocr)
        if not text:
            raise ValueError("OCR returned empty text")
        return text
    except ImportError:
        raise ValueError("pytesseract is not installed. Install it with: pip install pytesseract")
    except Exception as e:
        raise ValueError(f"OCR failed: {e}")


async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from a PDF file using PyPDF2.
    """
    try:
        import PyPDF2
        import io as _io

        loop = asyncio.get_event_loop()

        def _extract():
            reader = PyPDF2.PdfReader(_io.BytesIO(pdf_bytes))
            texts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    texts.append(page_text)
            return "\n".join(texts).strip()

        text = await loop.run_in_executor(None, _extract)
        if not text:
            raise ValueError("PDF has no extractable text")
        return text
    except ImportError:
        raise ValueError("PyPDF2 is not installed. Install it with: pip install PyPDF2")
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {e}")
