# 🔒 PrivateAI — On-Premise RAG Intelligence

A fully local, private AI platform featuring Retrieval-Augmented Generation (RAG), built on Ollama, ChromaDB, FastAPI, and a Vanilla JS frontend. Every model, embedding, and document stays on your own machine — nothing is sent to a third-party API.

---

## ✨ Features

- 💬 **Local LLM Chat** — powered by Ollama. Ships with Llama 3.2 by default, with Qwen 3 8B available as an additional model.
- 📂 **Document RAG** — upload PDFs, DOCX, TXT, Markdown, CSV, or Excel files and chat with their contents.
- 🧠 **Vector Search** — ChromaDB stores embeddings for semantic retrieval over your uploaded documents.
- 📊 **Data & Visualization Tools** — read/create Excel files, generate charts, flowcharts, and simple AI-guided images, all from the chat interface.
- 🎙️ **Voice Transcription** — convert recorded audio to text.
- 💾 **Exports** — generated files (charts, spreadsheets, images) are saved and downloadable via the app.
- 🔒 **100% Private** — all inference, embedding, and storage happens inside your own Docker network. No data leaves your machine.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, LangChain, ChromaDB client |
| Frontend | Vanilla HTML / CSS / JS |
| LLM runtime | Ollama |
| Default chat model | `llama3.2` |
| Additional chat model | `qwen3:8b` |
| Embedding model | `nomic-embed-text` |
| Vector database | ChromaDB |
| Reverse proxy | Nginx |
| Orchestration | Docker Compose |

---

## 📐 Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│    Nginx     │─────▶│   Backend   │
│ (frontend)  │ :3001│ (reverse     │ :8000│  (FastAPI)  │
└─────────────┘      │  proxy)      │      └──────┬──────┘
                      └──────────────┘             │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                   ┌─────────────┐     ┌─────────────┐
                                   │   Ollama    │     │  ChromaDB   │
                                   │(LLM + embed)│     │  (vectors)  │
                                   └─────────────┘     └─────────────┘
```

All five services run as separate containers on a shared Docker bridge network (`privateai_net`) and talk to each other by container name (`ollama`, `chromadb`, `backend`).

| Service | Container name | Internal port | Host port |
|---|---|---|---|
| Nginx | `privateai_nginx` | 80 | **3001** |
| Backend (FastAPI) | `privateai_backend` | 8000 | 8002 |
| Ollama | `privateai_ollama` | 11434 | 11435 |
| ChromaDB | `privateai_chromadb` | 8000 | 8003 |
| Model-init (one-shot) | `privateai_model_init` | — | — |

---

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose v2 (`docker compose`, not the legacy `docker-compose`)
- ~8 GB free disk space for models (more if you add larger ones)
- 8 GB+ RAM recommended; a GPU is optional but significantly speeds up generation

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/piyush9786/privateai.git
cd privateai

# 2. Set up environment variables
cp .env.example .env

# 3. Launch the full stack
docker compose up -d

# 4. Watch the first-run model download (a few GB, only happens once)
docker compose logs -f model-init
```

Once `model-init` logs `Models ready!` and exits, open:

```
http://localhost:3001
```

### Stopping / restarting

```bash
docker compose down          # stop everything, keep data (models, vectors, uploads)
docker compose down -v       # stop everything AND wipe all volumes (full reset)
docker compose up -d         # start again
docker compose restart backend   # restart just one service after a code change
```

---

## ⚙️ Configuration

All configuration is via environment variables, set in `.env` (copied from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_MODEL` | `llama3.2` | Chat model used when none is specified |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model used for RAG |
| `APP_SECRET` | `changeme-in-production-please` | App secret placeholder — change before any non-local deployment |
| `CHUNK_SIZE` | `1000` | Character chunk size for document splitting before embedding |
| `CHUNK_OVERLAP` | `200` | Overlap between consecutive chunks |

---

## 🤖 Available Models

The stack pulls these models automatically on first startup via the `model-init` service:

| Model | Tag | Size | Purpose |
|---|---|---|---|
| Llama 3.2 | `llama3.2` | ~2 GB | Default chat model |
| Nomic Embed Text | `nomic-embed-text` | ~270 MB | Embeddings for RAG |
| Qwen 3 8B | `qwen3:8b` | ~5.2 GB | Additional chat model, stronger reasoning |

### Adding or pulling models manually

You can pull any additional Ollama model into the running stack at any time:

```bash
docker compose exec ollama ollama pull <model-name>
docker compose exec ollama ollama list
```

The new model will automatically appear in the model dropdown in the UI (it calls Ollama's `/api/tags` under the hood) — no restart needed.

### Notes on Qwen 3 8B

- It's noticeably slower than `llama3.2` on CPU-only setups (3.2B vs 8B parameters), so expect longer response times without a GPU.
- Qwen 3 defaults to a "thinking" mode that reasons step-by-step before answering. The backend currently forwards the raw model output, so `<think>...</think>` content (if present) will appear inline in the response.

---

## 📡 API Reference

The backend exposes a REST API under `/api/`, proxied through Nginx at `http://localhost:3001/api/...` (directly reachable at `http://localhost:8002/api/...` too).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/models` | List models available in Ollama |
| `POST` | `/api/chat` | Send a chat message; optional RAG context injection |
| `POST` | `/api/upload` | Upload a document for RAG ingestion (PDF/DOCX/TXT/MD/XLSX/CSV) |
| `POST` | `/api/pdf/read` | Extract and return text from a PDF |
| `POST` | `/api/excel/read` | Read a spreadsheet/CSV and return rows, columns, and stats |
| `POST` | `/api/excel/create` | Generate an Excel file from supplied data or an AI-generated prompt |
| `POST` | `/api/chart/create` | Render a bar/line/pie/scatter/area/histogram chart as PNG |
| `POST` | `/api/flowchart/create` | Generate a step-by-step flowchart from a prompt or step list |
| `POST` | `/api/image/generate` | Generate an AI-color-guided abstract image |
| `POST` | `/api/voice/transcribe` | Transcribe an uploaded audio file to text |
| `GET` | `/api/rag/info` | Get the current count of documents in the vector store |
| `DELETE` | `/api/rag/clear` | Clear the entire RAG vector collection |

### Example: chat with RAG enabled

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Summarize the uploaded document"}],
    "use_rag": true
  }'
```

---

## 🗂️ Project Structure

```
privateai/
├── backend/
│   ├── main.py            # FastAPI application — all API routes
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile          # Backend container build
├── docker/
│   └── nginx.conf          # Reverse proxy + static file serving config
├── frontend/
│   └── index.html          # Single-page Vanilla JS frontend
├── docker-compose.yml      # Full stack orchestration
├── .env.example             # Environment variable template
└── README.md
```

---

## 🐛 Known Issues & Fixes Applied

This copy includes the following fixes over the original repository:

1. **Upload crash on near-empty documents** — uploading a blank or whitespace-only `.txt`/`.md` file (or a scanned PDF with no extractable text) previously caused ChromaDB to throw `ValueError: Expected IDs to be a non-empty list, got 0 IDs`, surfacing as an HTTP 500 to the user. Fixed by checking the chunk count before calling `collection.add(...)`.

2. **`langchain-ollama` / `langchain` version conflict** — the original `requirements.txt` pinned `langchain==0.2.5` alongside `langchain-ollama==0.1.1`, an old version of `langchain-ollama` whose `OllamaEmbeddings` class doesn't accept a `base_url` argument at all. This caused an import-time crash (`pydantic.v1.error_wrappers.ValidationError: extra fields not permitted`) that killed the backend container before it ever started serving requests. Fixed by moving `langchain`, `langchain-community`, and `langchain-ollama` to compatible version ranges (`0.3.x` / `0.2.x` respectively) so pip can resolve a consistent set.

### Troubleshooting

- **Backend container keeps restarting / `Connection refused` from Nginx**: check `docker compose logs backend` for a Python traceback. An import-time crash means the FastAPI app never actually starts listening, which is why Nginx gets connection-refused errors on every `/api/...` call.
- **`docker compose build` fails with `ResolutionImpossible`**: this means two pinned package versions in `requirements.txt` are mutually incompatible. Loosen the pin to a version range (as done in the fix above) and rebuild with `docker compose build --no-cache backend`.
- **Stale image after fixing `requirements.txt`**: a plain `docker compose restart` or `up -d` will **not** pick up dependency changes — you must rebuild the image with `docker compose build backend` (or `--no-cache` if you've changed pins) before bringing it back up.
- **Model not appearing in the dropdown after pulling it**: refresh the page — the model list is fetched fresh from `/api/models` on load.

---

## 🤝 Contributing

Issues and pull requests are welcome. Please include reproduction steps and relevant container logs (`docker compose logs <service>`) when reporting a bug.

## 📄 License

No license file is currently published with this repository — check with the repository owner before reuse or redistribution.
