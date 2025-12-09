# backend/pdf_parser.py
import fitz  # PyMuPDF
from typing import List

def extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    texts: List[str] = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()
    return "\n".join(texts)
