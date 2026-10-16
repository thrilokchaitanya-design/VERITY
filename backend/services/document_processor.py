from pathlib import Path
from io import BytesIO


class DocumentProcessor:
    """Extract readable text from supported report and evidence files."""

    @staticmethod
    def extract_text(content: bytes, filename: str) -> str:
        extension = Path(filename).suffix.lower()
        if extension in {".txt", ".md", ".markdown", ".csv"}:
            return content.decode("utf-8-sig", errors="replace")
        if extension == ".pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(BytesIO(content))
                return "\n\n".join(f"[Page {i + 1}]\n{page.extract_text() or ''}" for i, page in enumerate(reader.pages))
            except Exception as exc:
                raise ValueError(f"Could not read PDF: {exc}") from exc
        if extension == ".docx":
            try:
                from docx import Document
                document = Document(BytesIO(content))
                return "\n".join(paragraph.text for paragraph in document.paragraphs)
            except Exception as exc:
                raise ValueError(f"Could not read DOCX: {exc}") from exc
        raise ValueError("Supported formats are TXT, Markdown, CSV, PDF, and DOCX.")
