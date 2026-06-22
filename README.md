# 🔒 PrivateAI — On-Premise Agentic AI Platform

A fully local, private AI platform with an agentic chat interface, persistent memory, document retrieval (RAG), custom agent personas, and a real enterprise-style dashboard. Built on Ollama, ChromaDB, FastAPI, and React. Every model, embedding, document, and memory stays on your own machine — nothing is sent to a third-party API.

---

## ✨ Features

- 💬 **Agentic Chat** — the model doesn't just answer; it decides when to call tools (search documents, build a chart, generate a spreadsheet, draw a flowchart, generate an image, transcribe audio) mid-conversation, and the UI shows a live status trail while each one runs.
- 🤖 **Custom Agent Presets** — define named instruction sets (e.g. "Concise Coder," "Document Analyst") and switch between them in chat. Presets layer custom instructions on top of the base assistant — they never disable reliable tool-calling (document search, memory recall) underneath.
- 🧠 **Opt-in Persistent Memory** — the agent can propose remembering a fact about you (preferences, ongoing projects, etc.), but **nothing is saved without your explicit approval**. Stored memories are visible and deletable at any time.
- 📂 **Document RAG** — upload PDFs, DOCX, TXT, Markdown, CSV, or Excel files; they're chunked, embedded, and become searchable in chat. A real document table tracks every upload (filename, size, status, chunk count) with one-click delete that also removes the matching vectors from the store.
- 💾 **Persistent Conversations** — every chat is saved to disk (SQLite) and survives container restarts. Full history is browsable and resumable.
- 📊 **Generative Tools** — chart building, spreadsheet generation, flowchart drawing, simple AI-guided images, and voice transcription, all invoked automatically by the agent when relevant.
- 🎙️ **Voice Input** — record in the browser, transcribed locally via the `/api/voice/transcribe` endpoint (audio is transcoded from WebM/Opus to WAV via `pydub`/`ffmpeg` before transcription — see Known Issues).
- 🖥️ **Enterprise Dashboard UI** — a multi-page React app (Dashboard, Chat, Documents, Models, Agents, Knowledge Bases, Analytics, Users, Security, Deployment). Chat, Documents, Dashboard, Models, and Agents are fully wired to the real backend; the remaining pages are visual scaffolding pending further wiring (see breakdown below).
- ⚡ **GPU Acceleration** — Ollama runs on your NVIDIA GPU when available, with real enforced memory/CPU limits and VRAM-reducing settings tuned for small (3–4 GB) laptop GPUs.
- 🔒 **100% Private** — all inference, embedding, and storage happens inside your own Docker network. No data leaves your machine, ever.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI (routers-based structure), LangChain, ChromaDB client, SQLite |
| Frontend | React + Vite + TypeScript, Tailwind CSS, shadcn/ui, React Router |
| LLM runtime | Ollama (GPU-accelerated via NVIDIA Container Toolkit) |
| Default chat model | `llama3.2` |
| Additional chat model | `qwen3:8b` |
| Embedding model | `nomic-embed-text` |
| Vector database | ChromaDB |
| Conversation/document/agent metadata store | SQLite (`conversations`, `messages`, `documents`, `agent_presets` tables) |
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

The backend also writes to a local SQLite database (`/app/data/conversations.db`, on the `app_data` volume) for conversation history, document metadata, and agent presets — separate from ChromaDB, which only holds vector embeddings.

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

**After cloning, always check the backend actually started cleanly** — this project has twice hit a backend crash-on-import bug (see [Known Issues](#-known-issues--fixes-applied), #2) that silently leaves the container running while the app inside it is dead:

```bash
docker compose logs --tail 30 backend
```

Look for `Application startup complete` with no traceback after it. If you see a `pydantic.v1.error_wrappers.ValidationError` mentioning `OllamaEmbeddings`, see the fix below before doing anything else.

### Stopping / restarting

```bash
docker compose down          # stop everything, keep data
docker compose down -v       # stop everything AND wipe all volumes (full reset)
docker compose up -d
docker compose restart backend   # restart one service after a code change
docker compose build --no-cache backend   # rebuild after changing requirements.txt or backend code
docker compose build --no-cache nginx     # rebuild after changing the React frontend
```

### Using VS Code

The project works fine opened directly as a folder in VS Code (`code ~/Project/privateai`). The **Docker extension** (Microsoft) is worth installing — it lists running containers, streams logs in-editor, and lets you restart/attach a shell without leaving the editor. It follows whichever Docker context your terminal is currently using (see [GPU Setup](#-gpu-setup-nvidia) for the context split), so make sure `docker context ls` shows `default` as active before expecting it to see the GPU-enabled stack.

---

## 🖥️ GPU Setup (NVIDIA)

Ollama is configured in `docker-compose.yml` with a real GPU device reservation and **enforced resource limits**, tuned for small (3–4 GB) laptop GPUs:

```yaml
deploy:
  resources:
    limits:
      memory: 16g
      cpus: "6"
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
environment:
  - OLLAMA_GPU_OVERHEAD=1073741824   # reserve ~1GB VRAM for the OS/display
  - OLLAMA_FLASH_ATTENTION=1          # roughly halves KV cache VRAM usage
  - OLLAMA_KV_CACHE_TYPE=q8_0         # quantized attention cache
  - OLLAMA_CONTEXT_LENGTH=2048        # smaller context = less VRAM per request
```

A few honest notes on these settings:
- `deploy.resources.limits` (memory/cpus) is genuinely enforced by Docker outside Swarm mode — confirmed via `docker inspect privateai_ollama --format '{{.HostConfig.Memory}}'`.
- `deploy.resources.reservations.memory` (if you're tempted to add it back) has **no effect** outside Swarm mode — don't bother, it's dead config.
- Ollama has **no reliable hard VRAM cap** as of this writing (see [ollama/ollama#16561](https://github.com/ollama/ollama/issues/16561) and [#5754](https://github.com/ollama/ollama/issues/5754)) — the env vars above *reduce* peak VRAM usage, they don't *guarantee* a ceiling.

This requires the **NVIDIA Container Toolkit** on the host and a Docker daemon that actually supports GPU passthrough.

> ⚠️ **Docker Desktop on Linux does not support GPU passthrough** — this is a known platform limitation, not a configuration issue. Containers built/run under Desktop's `desktop-linux` context are completely isolated from Docker Engine's `default` context (separate VM, separate everything) — Desktop's GUI will never show GPU-enabled containers, full stop, no setting fixes this.
>
> The practical split that works: install plain **Docker Engine (CE)** alongside Desktop, and always run this project under `default`:
> ```bash
> docker context ls                  # see available contexts; check which is active (*)
> docker context use default         # required for GPU — use this for PrivateAI, always
> docker context use desktop-linux   # switch to Desktop's GUI for unrelated/general Docker use
> ```
> **Opening Docker Desktop silently switches your active context to `desktop-linux`.** If `docker compose` commands for this project start behaving strangely (missing containers, port conflicts with a "duplicate" stack), check `docker context ls` first — this single habit resolves the large majority of confusing Docker issues with this setup.
>
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

1. The model receives the conversation plus a system prompt instructing it to use tools proactively (e.g. always search the vault before answering questions about uploaded files, rather than guessing from a filename). If an `agent_id` is passed, that preset's custom instructions are appended **after** the base rules — layered on top, never replacing them.
2. If the model requests a tool call, the backend executes it, streams a `status` event (e.g. *"Searching the vault…"*) so the UI can show live progress, and feeds the result back to the model.
3. This repeats (capped at 6 rounds) until the model returns a plain-text answer, which streams to the UI token by token.

### Available tools
- `search_documents` — semantic search over your uploaded documents
- `recall_memories` — semantic search over previously confirmed memories
- `propose_memory` — proposes saving a fact about you; **pauses the stream and waits for explicit approval** before writing anything
- `create_chart` / `create_spreadsheet` / `create_flowchart` / `generate_image` — generate and save a file, returned as a download link
- `read_spreadsheet` / `transcribe_voice_note` — read back previously uploaded files

Note: tool-calling reliability depends on the model. Smaller models occasionally over- or under-use tools (e.g. generating an unrequested image, or skipping a document search) — this is a model-judgment issue, not a code bug. If you see this often with a particular model, tightening the relevant tool's `description` field in `routers/chat.py` is the fix, not a backend change.

### Agent presets, specifically
Custom agents (created via the Agents page or `POST /api/agents`) store a `name`, `description`, and `system_prompt`. They share the same document vault, memory store, and tool set as the default assistant — only the instructions layered on top change. This means there's no real per-agent "knowledge base" isolation; every agent can see every uploaded document and every stored memory.

### Memory, specifically
Memory is opt-in by design. When the agent calls `propose_memory`, the backend does **not** write to the memory store — it sends a `memory_proposal` event with the proposed text and pauses. The frontend shows an approve/reject card; only on approval does `POST /api/memory/confirm` actually persist it to a dedicated ChromaDB collection (`privateai_memories`), separate from your document vault. Everything stored is visible and deletable via `GET /api/memory/list` / `DELETE /api/memory/{id}`.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/models` | List models available in Ollama |
| `GET` | `/api/models/catalog` | Small curated list of pullable models (Ollama has no official search API) |
| `POST` | `/api/models/pull` | Pull a model by name, SSE progress stream |
| `DELETE` | `/api/models/{name}` | Delete an installed model |
| `GET` | `/api/system/status` | Real Ollama running-model + VRAM split, ChromaDB reachability |
| `POST` | `/api/chat` | Single-turn chat, no tool-calling (legacy/simple path) |
| `POST` | `/api/chat/stream` | Agentic chat with tool-calling, SSE streaming; accepts optional `agent_id` |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations` | List saved conversations |
| `GET` | `/api/conversations/{id}` | Get full message history for one conversation |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation and its messages |
| `POST` | `/api/agents` | Create a custom agent preset |
| `GET` | `/api/agents` | List agent presets |
| `GET` | `/api/agents/{id}` | Get one agent preset |
| `PUT` | `/api/agents/{id}` | Update an agent preset |
| `DELETE` | `/api/agents/{id}` | Delete an agent preset |
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
| `POST` | `/api/voice/transcribe` | Transcribe an uploaded audio file (transcodes WebM/Opus → WAV first) |
| `GET` | `/api/rag/info` | Total indexed chunk count |
| `DELETE` | `/api/rag/clear` | Clear the entire RAG vector collection |

### Example: agentic chat (SSE)

```bash
curl -N -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "What is the topic of my uploaded file?"}],
    "conversation_id": null,
    "agent_id": null
  }'
```

Response is a stream of Server-Sent Events: `status` (tool running), `media` (a generated file is ready), `memory_proposal` (awaiting your approval), `token` (answer text), `done`.

---

## 🗂️ Project Structure

```
privateai/
├── backend/
│   ├── main.py              # App assembly only: middleware, static mount, DB init,
│   │                        # router registration. ~35 lines — no route logic lives here.
│   ├── config.py            # Env vars, paths, the curated model catalog
│   ├── clients.py           # ChromaDB client, embeddings, get_collection()/get_memory_collection()
│   ├── db.py                # All SQLite logic: conversations, messages, documents, agent_presets
│   ├── routers/
│   │   ├── health.py
│   │   ├── models.py        # list, catalog, pull (streaming), delete
│   │   ├── system.py        # /api/system/status
│   │   ├── chat.py          # agent tools, the tool-calling loop, both chat endpoints
│   │   ├── conversations.py
│   │   ├── memory.py
│   │   ├── documents.py     # upload + document CRUD
│   │   ├── generative.py    # pdf, excel, chart, flowchart, image, voice, rag info/clear
│   │   └── agents.py        # agent preset CRUD
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-react/          # Current frontend — React + Vite + Tailwind dashboard
│   ├── src/app/
│   │   ├── routes.tsx       # React Router config
│   │   ├── pages/           # ChatPage, DocumentsPage, DashboardPage, ModelsPage, AgentsPage
│   │   │                    # (all wired) + 6 others (mock data, see breakdown below)
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

> **Why the backend is split this way:** `main.py` was originally a single ~1,150-line file with every route, tool, and DB call in one place. It's now ~35 lines that only wire the app together — every actual endpoint lives in the router that owns it. If you're hunting for specific behavior (e.g. "where does chart generation happen"), go straight to the matching router rather than searching `main.py`.

---

## 🧭 Dashboard Pages — What's Real vs. Mock

The React dashboard ports an 11-page enterprise UI design. Five pages are fully wired to the live backend; the rest currently show the design's original placeholder data, since there's no backend equivalent yet for things like user management or deployment pipelines — and for some (Users, Security, Deployment), a real version would need to be deliberately scoped down to what a single-user local app can honestly support, not just wired to fake enterprise metrics.

| Page | Status |
|---|---|
| Chat | ✅ Fully wired — real models, real streaming, real tool activity, real memory proposals, real agent presets, real voice input |
| Documents | ✅ Fully wired — real upload, real document table, real delete (cascades to vector store) |
| Dashboard (overview) | ✅ Fully wired — real document/conversation/memory/model counts, real recent activity, real Ollama VRAM/reachability status (no fabricated metrics) |
| Models | ✅ Fully wired — real installed models, real pull (with live progress) and delete, curated catalog |
| Agents | ✅ Fully wired — real CRUD on custom instruction presets |
| Knowledge Bases | ⚪ Mock data |
| Analytics | ⚪ Mock data |
| Users | ⚪ Mock data (no auth/user system exists) |
| Security | ⚪ Mock data |
| Deployment | ⚪ Mock data |

---

## 🐛 Known Issues & Fixes Applied

1. **Upload crash on near-empty documents** — a blank or whitespace-only file used to crash ChromaDB's `add()` call with an unhandled 500. Fixed by checking the chunk count before writing.
2. **`langchain-ollama` / `langchain` version conflict (recurring — read this one)** — the original pinned exact versions (`langchain==0.2.5`, `langchain-community==0.2.5`, `langchain-ollama==0.1.1`) are mutually incompatible: that `langchain-ollama` version's `OllamaEmbeddings` doesn't accept a `base_url` argument at all, crashing the backend at import time with `pydantic.v1.error_wrappers.ValidationError: extra fields not permitted`. **This has regressed twice** — once from the original clone, and again after a later file handoff reintroduced the exact pins. The fix is moving to version ranges:
   ```
   langchain>=0.3.0,<0.4.0
   langchain-community>=0.3.0,<0.4.0
   langchain-ollama>=0.2.0,<0.3.0
   ```
   **After cloning or restoring `backend/` from any source, always check `backend/requirements.txt` still has these as ranges, not exact pins, before assuming the backend will start.** A crashed backend leaves the container "running" (uvicorn's `--reload` watcher keeps relaunching the dead process), so `docker compose ps` alone won't tell you it's broken — check the logs.
3. **Ollama healthcheck always failing** — the original healthcheck used `curl`, which isn't installed in the `ollama/ollama` image, so it reported "unhealthy" even when working correctly. Fixed by using `ollama list` instead.
4. **Model not searching uploaded documents** — smaller models (e.g. `llama3.2`) would sometimes answer questions about uploaded files by guessing from the filename instead of calling `search_documents`. Fixed with an explicit system prompt instructing the agent to always search before answering document-related questions.
5. **Voice transcription silently broken** — `speech_recognition`'s `AudioFile` only reads WAV/AIFF/FLAC, but browsers' `MediaRecorder` produces WebM/Opus. The endpoint was handing raw WebM bytes straight to `AudioFile`, which always failed. Fixed by transcoding through `pydub`/`ffmpeg` to WAV first (both were already in the Dockerfile/requirements, just never wired up).
6. **`deploy.resources.reservations.memory` silently does nothing** — outside Docker Swarm mode, this key is accepted by Compose's schema but has zero effect at runtime. Only `deploy.resources.limits` (memory/cpus) is actually enforced outside Swarm. Don't rely on `reservations.memory` for anything.

### Troubleshooting

- **Backend container keeps restarting, or chat silently does nothing**: check `docker compose logs --tail 50 backend` for a Python traceback — an import-time crash means the app never starts listening, so requests will hang or reset rather than return an error. See issue #2 above; this is the single most common cause.
- **`docker compose build` fails with `ResolutionImpossible`**: two pinned package versions are mutually incompatible — loosen the pin to a version range and rebuild with `--no-cache`.
- **Frontend changes not appearing**: a plain `docker compose up -d` does **not** rebuild the React app — you must `docker compose build --no-cache nginx` first, since the build happens inside the image, not via a bind mount.
- **GPU not detected**: see [GPU Setup](#-gpu-setup-nvidia) above — Docker Desktop on Linux is a common, non-obvious blocker, and a silently-switched context is the most common cause of "it was working yesterday."
- **System crashes/freezes under heavy load**: rule out an actual backend crash-loop (issue #2) before assuming hardware — a dead backend can look like a frozen request. If the backend is confirmed healthy and the *machine itself* becomes unresponsive under load regardless of which OS is running, that's a genuine hardware concern (power delivery, thermal, RAM) worth diagnosing separately — a charger swap and a `memtest86+` pass are the most informative first checks.

---

## 🤝 Contributing

Issues and pull requests are welcome. Please include reproduction steps and relevant container logs (`docker compose logs <service>`) when reporting a bug.

## 📄 License

No license file is currently published with this repository — check with the repository owner before reuse or redistribution.