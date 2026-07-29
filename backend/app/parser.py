from pathlib import Path

import pdfplumber
from docx import Document


class UnsupportedFileTypeError(ValueError):
    """Raised when a file type is not supported for text extraction."""


def extract_text(file_path: str) -> str:
    """Extract text from a PDF or DOCX file and return it as a single string."""
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File was not found: {path}")

    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf_text(path)

    if suffix == ".docx":
        return _extract_docx_text(path)

    raise UnsupportedFileTypeError(f"Unsupported file type: {suffix}")


def _extract_pdf_text(file_path: Path) -> str:
    """Extract text from every page of a PDF file using pdfplumber."""
    extracted_pages = []

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if text.strip():
                extracted_pages.append(text.strip())

    return "\n\n".join(extracted_pages)


def _extract_docx_text(file_path: Path) -> str:
    """Extract all non-empty paragraphs from a DOCX file using python-docx."""
    document = Document(file_path)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs)
