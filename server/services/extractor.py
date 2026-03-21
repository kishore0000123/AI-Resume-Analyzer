import io
from pdfminer.high_level import extract_text as pdfminer_extract


def extract_text_from_bytes(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using pdfminer.six."""
    try:
        pdf_stream = io.BytesIO(file_bytes)
        text = pdfminer_extract(pdf_stream)
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")
