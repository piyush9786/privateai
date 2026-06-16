# 🔒 PrivateAI - On-Premise RAG Intelligence

A fully local, private AI platform featuring Retrieval-Augmented Generation (RAG) using Ollama, ChromaDB, FastAPI, and a modern Vanilla JS frontend.

## ✨ Features
- 💬 **Local LLM Chat:** Powered by Ollama (Llama 3.2).
- 📂 **Document RAG:** Upload PDFs, DOCX, or TXT files and chat with them.
- 🧠 **Vector Database:** ChromaDB for semantic search and embeddings.
- 💾 **Chat History & Export:** Save chats locally and export to Markdown.
- 🔒 **100% Private:** No data ever leaves your local network.

## 🛠️ Tech Stack
- **Backend:** Python 3.11, FastAPI, LangChain, ChromaDB
- **Frontend:** Vanilla HTML/CSS/JS
- **LLM:** Ollama (Llama 3.2, nomic-embed-text)
- **Deployment:** Docker Compose

## 🚀 Quick Start
1. Clone the repository: `git clone https://github.com/piyush9786/privateai.git`
2. Navigate to the folder: `cd privateai`
3. Setup environment: `cp .env.example .env`
4. Launch with Docker: `docker compose up -d`
5. Open your browser: `http://localhost:3001`
