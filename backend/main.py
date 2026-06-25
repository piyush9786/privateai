"""PrivateAI backend — app assembly.

All actual route logic lives in routers/. This file only wires the app
together: middleware, static file mounts, DB initialization, and router
registration. If you're looking for a specific endpoint, check the router
that owns it (see routers/ for the breakdown) rather than this file.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import EXPORT_DIR
from db import init_db
from routers import health, models, system, chat, conversations, memory, documents, generative, agents, analytics, auth, admin

app = FastAPI(title="PrivateAI Enhanced")

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"] is invalid alongside allow_credentials=True per
    # the CORS spec, and browsers won't send the auth cookie under that
    # combination. In production the frontend and backend are same-origin
    # behind nginx, so this mainly matters for `npm run dev`.
    allow_origins=["http://localhost:5173", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.mount("/exports", StaticFiles(directory=str(EXPORT_DIR)), name="exports")

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(models.router)
app.include_router(system.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(memory.router)
app.include_router(documents.router)
app.include_router(generative.router)
app.include_router(agents.router)
app.include_router(analytics.router)
app.include_router(admin.router)
