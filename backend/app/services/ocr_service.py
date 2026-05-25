import asyncio
import os
import sys
import logging
from PIL import Image
import io

_logger = logging.getLogger(__name__)


def _configure_tesseract():
    """Configure Tesseract executable path and tessdata directory for all platforms."""
    try:
        import pytesseract

        # ── Linux (Render/Ubuntu) ──────────────────────────────────────────────
        if sys.platform != "win32":
            # Only auto-detect if not already explicitly set via env var
            if not os.environ.get("TESSDATA_PREFIX"):
                # Search common Ubuntu locations (varies by Tesseract version)
                linux_candidates = [
                    "/usr/share/tesseract-ocr/5/tessdata",      # Ubuntu 22.04 Tesseract 5
                    "/usr/share/tesseract-ocr/4.00/tessdata",   # Ubuntu 20.04 Tesseract 4
                    "/usr/share/tessdata",                       # Some distros
                    "/usr/local/share/tessdata",
                ]
                for path in linux_candidates:
                    if os.path.isdir(path):
                        os.environ["TESSDATA_PREFIX"] = path
                        _logger.info(f"✅ Tesseract tessdata found at: {path}")
                        break
            return  # tesseract is on PATH on Linux via apt

        # ── Windows (local dev) ────────────────────────────────────────────────
        # Set TESSDATA_PREFIX to local bundled tessdata/ folder if not already set
        if not os.environ.get("TESSDATA_PREFIX"):
            _tessdata_dir = os.path.join(os.path.dirname(__file__), "..", "..", "tessdata")
            _tessdata_dir = os.path.abspath(_tessdata_dir)
            if os.path.isdir(_tessdata_dir):
                os.environ["TESSDATA_PREFIX"] = _tessdata_dir

        # Find tesseract.exe from common UB-Mannheim install locations
        candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Tesseract-OCR", "tesseract.exe"),
            os.path.join(os.environ.get("APPDATA", ""), "Tesseract-OCR", "tesseract.exe"),
        ]
        for path in candidates:
            if os.path.isfile(path):
                pytesseract.pytesseract.tesseract_cmd = path
                return
        # Fall back to PATH lookup
    except ImportError:
        pass


def _get_available_langs() -> list[str]:
    """Return the list of installed Tesseract language packs."""
    try:
        import pytesseract
        return pytesseract.get_languages()
    except Exception:
        return ["eng"]


def _best_lang_string() -> str:
    """
    Return the best lang string based on what's actually installed.
    Prefers eng+hin+ben, falls back progressively to avoid TesseractError.
    """
    available = set(_get_available_langs())
    preferred = ["eng", "hin", "ben"]
    langs = [l for l in preferred if l in available]
    if not langs:
        langs = ["eng"]
    lang_str = "+".join(langs)
    _logger.info(f"OCR using languages: {lang_str} (available: {sorted(available)})")
    return lang_str


async def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract text from an image using pytesseract OCR.
    Runs in a thread executor to avoid blocking the event loop.
    """
    try:
        import pytesseract
        _configure_tesseract()

        lang = _best_lang_string()
        loop = asyncio.get_event_loop()

        def _ocr():
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            try:
                return pytesseract.image_to_string(image, lang=lang).strip()
            except Exception:
                # Last resort: English only
                _logger.warning("Multi-lang OCR failed, retrying with English only")
                return pytesseract.image_to_string(image, lang="eng").strip()

        text = await loop.run_in_executor(None, _ocr)
        if not text:
            raise ValueError("OCR returned empty text — image may have no readable text")
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
