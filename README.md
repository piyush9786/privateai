# 🔒 PrivateAI — On-Premise Agentic AI Platform

A fully local, private AI platform with an agentic chat interface, persistent memory, document retrieval (RAG), and a real enterprise-style dashboard. Built on Ollama, ChromaDB, FastAPI, and React. Every model, embedding, document, and memory stays on your own machine — nothing is sent to a third-party API.

---

## ✨ Features

- 💬 **Agentic Chat** — the model doesn't just answer; it decides when to call tools (search documents, build a chart, generate a spreadsheet, draw a flowchart, generate an image, transcribe audio) mid-conversation, and the UI shows a live status trail while each one runs.
- 🧠 **Opt-in Persistent Memory** — the agent can propose remembering a fact about you (preferences, ongoing projects, etc.), but **nothing is saved without your explicit approval**. Stored memories are visible and deletable at any time.
- 📂 **Document RAG** — upload PDFs, DOCX, TXT, Markdown, CSV, or Excel files; they're chunked, embedded, and become searchable in chat. A real document table tracks every upload (filename, size, status, chunk count) with one-click delete that also removes the matching vectors from the store.
- 💾 **Persistent Conversations** — every chat is saved to disk (SQLite) and survives container restarts. Full history is browsable and resumable.
- 📊 **Generative Tools** — chart building, spreadsheet generation, flowchart drawing, simple AI-guided images, and voice transcription, all invoked automatically by the agent when relevant.
- 🖥️ **Enterprise Dashboard UI** — a multi-page React app (Dashboard, Chat, Documents, Models, Agents, Knowledge Bases, Analytics, Users, Security, Deployment). Chat and Documents are fully wired to the real backend; the remaining pages are visual scaffolding pending further wiring.
- ⚡ **GPU Acceleration** — Ollama runs on your NVIDIA GPU when available, configured via Docker Compose device reservations.
- 🔒 **100% Private** — all inference, embedding, and storage happens inside your own Docker network. No data leaves your machine, ever.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, LangChain, ChromaDB client, SQLite |
| Frontend | React + Vite + TypeScript, Tailwind CSS, shadcn/ui, React Router |
| LLM runtime | Ollama (GPU-accelerated via NVIDIA Container Toolkit) |
| Default chat model | `llama3.2` |
| Additional chat model | `qwen3:8b` |
| Embedding model | `nomic-embed-text` |
| Vector database | ChromaDB |
| Conversation & document metadata store | SQLite (`conversations`, `messages`, `documents` tables) |
| Reverse proxy / static hosting | Nginx |
| Orchestration | Docker Compose |

---

## 📐 Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│    Nginx     │─────▶│   Backend   │
│ (React SPA) │ :3001│ (built React │ :8000│  (FastAPI)  │
└─────────────┘      │  app + proxy)│      └──────┬──────┘
                      └──────────────┘             │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                   ┌─────────────┐     ┌─────────────┐
                                   │   Ollama    │     │  ChromaDB   │
                                   │ (LLM + embed,│    │ (documents +│
                                   │  GPU-accel.) │     │  memories)  │
                                   └─────────────┘     └─────────────┘
```

The backend also writes to a local SQLite database (`/app/data/conversations.db`, on the `app_data` volume) for conversation history and document metadata — separate from ChromaDB, which only holds vector embeddings.

All services run as separate containers on a shared Docker bridge network (`privateai_net`) and talk to each other by container name (`ollama`, `chromadb`, `backend`).

| Service | Container name | Internal port | Host port |
|---|---|---|---|
| Nginx (serves built React app, proxies `/api`) | `privateai_nginx` | 80 | **3001** |
| Backend (FastAPI) | `privateai_backend` | 8000 | 8002 |
| Ollama | `privateai_ollama` | 11434 | 11435 |
| ChromaDB | `privateai_chromadb` | 8000 | 8003 |
| Model-init (one-shot) | `privateai_model_init` | — | — |

---

## 🚀 Quick Start

### Prerequisites
- Docker Engine (not Docker Desktop, if you want GPU acceleration on Linux — see [GPU Setup](#-gpu-setup-nvidia) below)
- ~8 GB free disk space for models
- 8 GB+ RAM recommended

### Setup

```bash
git clone https://github.com/piyush9786/privateai.git
cd privateai
cp .env.example .env
docker compose up -d
docker compose logs -f model-init
```

Once `model-init` logs `Models ready!` and exits, open:

```
http://localhost:3001
```

You'll land directly on the dashboard (no login — authentication isn't implemented yet).

### Stopping / restarting

```bash
docker compose down          # stop everything, keep data
docker compose down -v       # stop everything AND wipe all volumes (full reset)
docker compose up -d
docker compose restart backend   # restart one service after a code change
docker compose build --no-cache backend   # rebuild after changing requirements.txt or main.py
docker compose build --no-cache nginx     # rebuild after changing the React frontend
```

---

## 🖥️ GPU Setup (NVIDIA)

Ollama is configured in `docker-compose.yml` to request a GPU via:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

This requires the **NVIDIA Container Toolkit** on the host and a Docker daemon that actually supports GPU passthrough.

> ⚠️ **Docker Desktop on Linux does not support GPU passthrough** — this is a known platform limitation, not a configuration issue. If you're on Linux, install plain **Docker Engine (CE)** alongside or instead of Docker Desktop. The two can coexist via separate contexts:
> ```bash
> docker context ls                  # see available contexts
> docker context use default         # switch to GPU-capable Docker Engine
> docker context use desktop-linux   # switch back to Docker Desktop
> ```
> Docker Desktop on Windows (via WSL2) and macOS handle GPU passthrough differently and may not have this limitation.

To verify GPU access once the stack is running:

```bash
docker exec privateai_ollama nvidia-smi
docker exec privateai_ollama ollama ps   # shows % GPU vs CPU for a loaded model
```

VRAM is the real constraint for laptop GPUs — a 3–4 GB card comfortably fits `llama3.2` (~2.6 GB) at 100% GPU, while larger models like `qwen3:8b` (~5.2 GB) may partially fall back to CPU rather than fail outright.

---

## ⚙️ Configuration

Set via `.env` (copied from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_MODEL` | `llama3.2` | Chat model used when none is specified |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model used for RAG and memory |
| `APP_SECRET` | `changeme-in-production-please` | Placeholder — change before any non-local deployment |
| `CHUNK_SIZE` | `1000` | Character chunk size for document splitting |
| `CHUNK_OVERLAP` | `200` | Overlap between consecutive chunks |

---

## 🤖 How the Agent Works

Every chat request goes through `/api/chat/stream`, which runs an agent loop against Ollama's tool-calling API:

1. The model receives the conversation plus a system prompt instructing it to use tools proactively (e.g. always search the vault before answering questions about uploaded files, rather than guessing from a filename).
2. If the model requests a tool call, the backend executes it, streams a `status` event (e.g. *"Searching the vault…"*) so the UI can show live progress, and feeds the result back to the model.
3. This repeats (capped at 6 rounds) until the model returns a plain-text answer, which streams to the UI token by token.

### Available tools
- `search_documents` — semantic search over your uploaded documents
- `recall_memories` — semantic search over previously confirmed memories
- `propose_memory` — proposes saving a fact about you; **pauses the stream and waits for explicit approval** before writing anything
- `create_chart` / `create_spreadsheet` / `create_flowchart` / `generate_image` — generate and save a file, returned as a download link
- `read_spreadsheet` / `transcribe_voice_note` — read back previously uploaded files

### Memory, specifically
Memory is opt-in by design. When the agent calls `propose_memory`, the backend does **not** write to the memory store — it sends a `memory_proposal` event with the proposed text and pauses. The frontend shows an approve/reject card; only on approval does `POST /api/memory/confirm` actually persist it to a dedicated ChromaDB collection (`privateai_memories`), separate from your document vault. Everything stored is visible and deletable via `GET /api/memory/list` / `DELETE /api/memory/{id}`.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/models` | List models available in Ollama |
| `POST` | `/api/chat` | Single-turn chat, no tool-calling (legacy/simple path) |
| `POST` | `/api/chat/stream` | Agentic chat with tool-calling, SSE streaming |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations` | List saved conversations |
| `GET` | `/api/conversations/{id}` | Get full message history for one conversation |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation and its messages |
| `POST` | `/api/memory/confirm` | Approve or reject a pending memory proposal |
| `GET` | `/api/memory/list` | List all confirmed memories |
| `DELETE` | `/api/memory/{id}` | Delete a stored memory |
| `POST` | `/api/upload` | Upload a document for RAG ingestion |
| `GET` | `/api/documents` | List all uploaded documents with status/size/chunk count |
| `DELETE` | `/api/documents/{id}` | Delete a document's metadata row **and** its vectors from ChromaDB |
| `POST` | `/api/pdf/read` | Extract text from a PDF |
| `POST` | `/api/excel/read` | Read a spreadsheet/CSV and return rows, columns, stats |
| `POST` | `/api/excel/create` | Generate an Excel file |
| `POST` | `/api/chart/create` | Render a chart as PNG |
| `POST` | `/api/flowchart/create` | Generate a flowchart PNG |
| `POST` | `/api/image/generate` | Generate an AI-palette-guided abstract image |
| `POST` | `/api/voice/transcribe` | Transcribe an uploaded audio file |
| `GET` | `/api/rag/info` | Total indexed chunk count |
| `DELETE` | `/api/rag/clear` | Clear the entire RAG vector collection |

### Example: agentic chat (SSE)

```bash
curl -N -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "What is the topic of my uploaded file?"}],
    "conversation_id": null
  }'
```

Response is a stream of Server-Sent Events: `status` (tool running), `media` (a generated file is ready), `memory_proposal` (awaiting your approval), `token` (answer text), `done`.

---

## 🗂️ Project Structure

```
privateai/
├── backend/
│   ├── main.py              # FastAPI app — agent loop, tools, all API routes
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-react/          # Current frontend — React + Vite + Tailwind dashboard
│   ├── src/app/
│   │   ├── routes.tsx       # React Router config
│   │   ├── pages/           # ChatPage, DocumentsPage (wired) + 9 others (mock data)
│   │   └── components/      # DashboardLayout (sidebar/nav), shadcn/ui components
│   └── Dockerfile           # Multi-stage: npm build → nginx:alpine
├── frontend/                # Previous frontend (vanilla JS) — no longer used by
│                             # docker-compose.yml, kept on disk for reference
├── docker/
│   └── nginx.conf           # Reverse proxy + SPA fallback config
├── docker-compose.yml
├── .env.example
└── README.md
```

> **Note:** `frontend/` (vanilla JS) was the original implementation and has been superseded by `frontend-react/`. It's no longer referenced by `docker-compose.yml` and can be deleted once you're confident the migration covers everything you need.

---

## 🧭 Dashboard Pages — What's Real vs. Mock

The React dashboard ports an 11-page enterprise UI design. Two pages are fully wired to the live backend; the rest currently show the design's original placeholder data, since there's no backend equivalent yet for things like user management or deployment pipelines.

| Page | Status |
|---|---|
| Chat | ✅ Fully wired — real models, real streaming, real tool activity, real memory proposals |
| Documents | ✅ Fully wired — real upload, real document table, real delete (cascades to vector store) |
| Dashboard (overview) | ⚪ Mock data |
| Models | ⚪ Mock data |
| Agents | ⚪ Mock data |
| Knowledge Bases | ⚪ Mock data |
| Analytics | ⚪ Mock data |
| Users | ⚪ Mock data (no auth/user system exists) |
| Security | ⚪ Mock data |
| Deployment | ⚪ Mock data |

---

## 🐛 Known Issues & Fixes Applied

1. **Upload crash on near-empty documents** — a blank or whitespace-only file used to crash ChromaDB's `add()` call with an unhandled 500. Fixed by checking the chunk count before writing.
2. **`langchain-ollama` / `langchain` version conflict** — the original pinned versions were mutually incompatible (`OllamaEmbeddings` didn't accept `base_url` in the pinned `langchain-ollama` version), crashing the backend at import time. Fixed by moving to compatible version ranges.
3. **Ollama healthcheck always failing** — the original healthcheck used `curl`, which isn't installed in the `ollama/ollama` image, so it reported "unhealthy" even when working correctly. Fixed by using `ollama list` instead.
4. **Model not searching uploaded documents** — smaller models (e.g. `llama3.2`) would sometimes answer questions about uploaded files by guessing from the filename instead of calling `search_documents`. Fixed with an explicit system prompt instructing the agent to always search before answering document-related questions.

### Troubleshooting

- **Backend container keeps restarting**: check `docker compose logs backend` for a Python traceback — an import-time crash means the app never starts listening, so Nginx will show connection-refused errors on every `/api/...` call.
- **`docker compose build` fails with `ResolutionImpossible`**: two pinned package versions are mutually incompatible — loosen the pin to a version range and rebuild with `--no-cache`.
- **Frontend changes not appearing**: a plain `docker compose up -d` does **not** rebuild the React app — you must `docker compose build --no-cache nginx` first, since the build happens inside the image, not via a bind mount.
- **GPU not detected**: see [GPU Setup](#-gpu-setup-nvidia) above — Docker Desktop on Linux is a common, non-obvious blocker.

---

## 🤝 Contributing

Issues and pull requests are welcome. Please include reproduction steps and relevant container logs (`docker compose logs <service>`) when reporting a bug.

## 📄 License

No license file is currently published with this repository — check with the repository owner before reuse or redistribution.
