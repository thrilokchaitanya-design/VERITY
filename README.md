# VERITY — Evidence Intelligence

VERITY extracts factual claims from a report, checks them against uploaded source documents, and presents each finding with its supporting passage. Missing evidence is classified as **UNVERIFIABLE**, never as a contradiction.

## Run locally

Use Python 3.10+ and Node.js 18+.

1. Start the API from `VERITY/backend`:

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. In another terminal, start the frontend from `VERITY/frontend`:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the local URL printed by Vite (normally `http://localhost:5173`).

Without an API key, VERITY uses local sentence selection and conservative keyword matching. For LLM-based claim extraction and verification, set `OPENAI_API_KEY` in the backend terminal before starting the API. `VERITY_MODEL` can override the default `gpt-4o-mini` model.

Supported uploads are TXT, Markdown, CSV, PDF, and DOCX, up to 20 MB each. Scanned PDFs need OCR, which is not included. Uploaded documents and analysis results are held in process memory; restarting the API clears them. This is a local MVP and does not include persistent storage, authentication, or production deployment controls. Review all findings against their original source.
