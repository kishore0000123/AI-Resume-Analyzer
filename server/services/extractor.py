import fitz  # PyMuPDF
import io

def extract_text_from_bytes(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF (fitz)."""
    try:
        pdf_stream = io.BytesIO(file_bytes)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        text = "\n".join(text_parts)
        # Clean text
        text = text.replace('\n', ' ').strip()
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")
