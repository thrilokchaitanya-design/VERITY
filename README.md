# VERITY — Evidence Intelligence

VERITY extracts factual claims from a report, checks them against uploaded source documents, and presents each finding with its supporting passage. Missing evidence is classified as **UNVERIFIABLE**, never as a contradiction.

## Run locally

Use Python 3.12+ and Node.js 18+.

### Quick start from the Projects folder

From `C:\Users\thril\Projects`, run:

```powershell
.\VERITY\start.ps1
```

This script uses VERITY's own virtual environment and correct backend/frontend folders. It installs missing dependencies, starts either server only when it is not already running, and checks both local URLs. This avoids looking for `requirements.txt` in the Projects folder or starting a second API on the same port.

### Manual start

1. In the API terminal, move into `VERITY/backend` before installing requirements or launching Uvicorn:

   ```powershell
   Set-Location .\VERITY\backend
   py -3.12 -m venv .venv
   .venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

   If the API is already running at `http://127.0.0.1:8000`, leave that instance running and do not start another one.

2. In another terminal, start the frontend from the Projects folder:

   ```powershell
   Set-Location .\VERITY\frontend
   npm install
   npm run dev -- --host 127.0.0.1
   ```

3. Open the local URL printed by Vite (normally `http://localhost:5173`).

Without an API key, VERITY uses local sentence selection and conservative keyword matching. For LLM-based claim extraction and verification, set `OPENAI_API_KEY` in the backend terminal before starting the API. `VERITY_MODEL` can override the default `gpt-4o-mini` model.

Supported uploads are TXT, Markdown, CSV, PDF, and DOCX, up to 20 MB each. Scanned PDFs need OCR, which is not included. Uploaded documents and analysis results are held in process memory; restarting the API clears them. This is a local MVP and does not include persistent storage, authentication, or production deployment controls. Review all findings against their original source.
