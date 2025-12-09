# SmartDocs – LMA-style Loan Document Analyzer

SmartDocs is an AI-powered assistant for reviewing long, LMA-style loan agreements. It ingests PDF loan documents, extracts key deal terms, scores risk by topic, detects deviations from market-standard language, and presents everything in an underwriter-friendly dashboard.

## Overview

The project is a full-stack app:

- **Frontend**: React + Vite SPA (web) plus an Electron desktop shell
- **Backend**: FastAPI service exposing a single `POST /analyze` endpoint
- **AI**: OpenAI models called from the backend analyzer pipeline
- **Hosting**:
  - Frontend on Netlify ([smartdocs-ai-analyzer.netlify.app](https://smartdocs-ai-analyzer.netlify.app))
  - Backend on Render ([smartdocs-backend.onrender.com](https://smartdocs-backend.onrender.com))

## Features

- Upload loan agreement PDFs and extract a structured deal header (borrower, facilities, governing law, margins, tenor, etc.)
- Generate clause-level analysis grouped by topics (covenants, events of default, transferability, sanctions, ESG)
- Label each clause with severity and status (e.g., GREEN, AMBER, DEVIATION)
- Compute overall document risk, deviation percentage, and estimated manual review hours saved
- Visualize risk with topic summary cards, risk heatmap, and an interactive Clause Explorer
- Ship as both a web app and a desktop prototype (Electron)

## Tech Stack

- **Frontend**: React 18, Vite, Ant Design, Recharts, Axios
- **Desktop shell**: Electron, concurrently, wait-on
- **Backend**: FastAPI, Uvicorn, Pydantic, python-multipart
- **AI**: OpenAI Python SDK (`OPENAI_API_KEY` via env var)
- **Hosting**: Netlify (frontend), Render (backend)

## Project Structure

```
smartdocs/
├─ .git/
├─ .vscode/
├─ backend/
│  ├─ app.py              # FastAPI app + CORS + /analyze route
│  ├─ analyzer.py         # PDF + OpenAI analysis pipeline
│  ├─ models.py           # Pydantic models (AnalyzeResponse, etc.)
│  ├─ config.py           # Config values (e.g. BACKEND_PORT)
│  ├─ sample_docs/        # Local sample PDFs for testing
│  └─ requirements.txt    # Backend Python dependencies
├─ electron/
│  └─ ...                 # Electron entry (main process) if separated
├─ src/
│  ├─ components/
│  │  ├─ ClauseDetailDrawer.jsx
│  │  ├─ ClauseTable.jsx
│  │  ├─ DealHeader.jsx
│  │  ├─ HeatmapChart.jsx
│  │  ├─ RiskSummary.jsx
│  │  └─ TopicRiskChart.jsx
│  ├─ styles/
│  │  └─ globals.css
│  ├─ utils/
│  │  └─ exportReport.js
│  ├─ apiClient.js        # Axios client pointing to backend /analyze
│  ├─ App.jsx             # Root React component & main layout
│  ├─ main.jsx            # React/Vite entry point
│  ├─ index.html          # Vite HTML template
│  ├─ package.json        # Frontend deps & scripts (dev, build, preview)
│  └─ package-lock.json
├─ node_modules/
├─ .env                   # Local env vars (not committed)
├─ .gitignore
├─ LICENSE
├─ package.json           # Root (Electron + orchestration) scripts
├─ package-lock.json
└─ README.md
```

### Package Scripts

**Root `package.json`** (Electron + orchestration):
- `dev:frontend` – cd src && npm run dev
- `dev:electron` – wait for Vite dev server then start Electron
- `dev` – run both concurrently for desktop development
- `build` – cd src && npm install && npm run build for Netlify

**`src/package.json`** (frontend):
- `dev` – vite
- `build` – vite build
- `preview` – vite preview

**`backend/requirements.txt`**:
```
fastapi
uvicorn[standard]
python-multipart
pydantic
openai
```

## How It Works (End-to-End Flow)

1. User uploads PDF in the React UI
2. `src/apiClient.js` sends a multipart/form-data `POST` request to `/analyze` on the backend:
   ```javascript
   const API_BASE = 'https://smartdocs-backend.onrender.com';
   ```
3. FastAPI backend (`backend/app.py`):
   - Saves the uploaded file into `sample_docs/`
   - Calls `analyzer.analyze_document(file_path)`
4. Analyzer (`backend/analyzer.py`):
   - Reads the PDF, chunks content, and calls OpenAI using `OPENAI_API_KEY`
   - Extracts deal metadata, topic-specific clauses with labels and severity, aggregated risk scores
   - Returns a dictionary conforming to `AnalyzeResponse`
5. Response is returned as JSON and deserialized on the frontend
6. React components update the dashboard: header, KPIs, heatmaps, topic cards, table, and drawer

## Local Development

### Prerequisites

- Node.js (LTS) and npm
- Python 3.10+ and virtualenv (or Conda)
- OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/Tomisin92/smartdocs.git
cd smartdocs
```

### 2. Backend setup (FastAPI)

```bash
cd backend

# Create & activate virtual environment
python -m venv smartdocenv
conda activate smartdocenv   # Windows

# Install dependencies
pip install -r requirements.txt

# Export your OpenAI key
export OPENAI_API_KEY="sk-..."   # Windows PowerShell: $env:OPENAI_API_KEY="sk-..."
```

Run the backend locally:

```bash
uvicorn app:app --reload --port 8000
```

- Docs at: http://127.0.0.1:8000/docs
- Health check: try `POST /analyze` with a small PDF

### 3. Frontend setup (web)

In another terminal:

```bash
cd smartdocs/src
npm install
npm run dev
```

App will be available at http://localhost:5173

For pure local development, set `API_BASE` in `src/apiClient.js`:

```javascript
const API_BASE = 'http://127.0.0.1:8000';
```

### 4. Desktop (Electron) dev

From the project root:

```bash
npm install        # install root-level deps (electron, concurrently, wait-on)
npm run dev        # runs Vite dev server and Electron together
```

Electron will open a desktop window pointing at the Vite app.

## Production Deployment

### Backend – Render

The FastAPI service is deployed as a Render Web Service:

- **Repository**: `Tomisin92/smartdocs`
- **Root Directory**: `backend`
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Environment Variables** (Render → Settings → Environment):
  - `OPENAI_API_KEY` – your OpenAI key (no quotes)

Render exposes a public URL: https://smartdocs-backend.onrender.com

OpenAPI docs at `/docs` and `/openapi.json`

### Frontend – Netlify

Netlify builds the React + Vite app:

- **Repo**: `Tomisin92/smartdocs`
- **Branch**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

Netlify exposes the frontend at: https://smartdocs-ai-analyzer.netlify.app

The frontend's `src/apiClient.js` is configured to call the Render backend:

```javascript
const API_BASE = 'https://smartdocs-backend.onrender.com';
```

Auto-deploy: Whenever you push to `main`, Netlify auto-deploys the frontend and Render can be configured to auto-deploy the backend.

## Typical Development Workflow

1. **Code locally**:
   - Update backend logic in `backend/analyzer.py`, models in `backend/models.py`, or routes in `backend/app.py`
   - Update frontend UI/UX in `src/components`, layout in `App.jsx`, or API wiring in `src/apiClient.js`

2. **Run locally**:
   - Backend: `uvicorn app:app --reload --port 8000` from `backend/`
   - Frontend: `npm run dev` from `src/` (or `npm run dev` from root for Electron)

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Describe feature or fix"
   git push
   ```

4. **Deployment**:
   - Netlify picks up the push and rebuilds the SPA
   - Render (if auto-deploy is enabled) rebuilds and restarts the backend

5. **Verify**:
   - Hit the Netlify URL, upload a PDF, and confirm updated behavior
   - Check Render Logs if any `/analyze` requests fail

## Environment Variables

### Backend (Render or local)

- `OPENAI_API_KEY` – required for AI calls
- Optionally, `BACKEND_PORT` (via `config.py`) if you want to customize local port

### Frontend

Currently uses a hard-coded `API_BASE`. You can refactor to use Vite env vars:

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL;
```

Then configure in `.env` / Netlify UI.

## Known Limitations / Future Work

- **Auth**: No authentication; any user with the URL can upload and analyze documents
- **File size / rate limits**: Large PDFs can increase latency and cost on OpenAI; consider streaming or chunked processing
- **Model configuration**: Model choice and prompts are currently coded directly in `analyzer.py`; could be externalized
- **Observability**: Minimal monitoring/logging; production-grade deployment would add better tracing and metrics

## Running Tests (if/when added)

```bash
# Backend
cd backend
pytest

# Frontend
cd ../src
npm test
```

## License

See [LICENSE](LICENSE) file for details.

---

Built with ❤️ for streamlining loan document review