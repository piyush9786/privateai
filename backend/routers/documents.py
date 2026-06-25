import uuid
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

from config import UPLOAD_DIR
from clients import get_collection, embed_text
from auth import get_current_user
from db import db_save_document, db_list_documents, db_get_document, db_delete_document_row

router = APIRouter(tags=["documents"])


@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    suffix = Path(file.filename).suffix.lower()
    tmp_path = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"

    content = await file.read()
    tmp_path.write_bytes(content)
    size_bytes = len(content)

    text = ""
    try:
        if suffix == ".pdf":
            loader = PyPDFLoader(str(tmp_path))
            pages = loader.load()
            text = "\n".join(p.page_content for p in pages)
        elif suffix in [".docx", ".doc"]:
            loader = Docx2txtLoader(str(tmp_path))
            docs = loader.load()
            text = "\n".join(d.page_content for d in docs)
        elif suffix in [".txt", ".md"]:
            text = content.decode("utf-8", errors="ignore")
        elif suffix in [".xlsx", ".xls", ".csv"]:
            if suffix == ".csv":
                df = pd.read_csv(tmp_path)
            else:
                df = pd.read_excel(tmp_path)
            text = df.to_string()
        else:
            db_save_document(user["id"], file.filename, suffix, size_bytes, 0, "unsupported", f"File type {suffix} not supported for RAG")
            return {"status": "unsupported", "message": f"File type {suffix} not supported for RAG"}

        chunks = []
        if text and text.strip():
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split_text(text)
            if chunks:
                col = get_collection(user["id"])
                embeddings_list = [embed_text(c) for c in chunks]
                ids = [str(uuid.uuid4()) for _ in chunks]
                metadatas = [{"source": file.filename, "chunk": i} for i in range(len(chunks))]
                col.add(documents=chunks, embeddings=embeddings_list, ids=ids, metadatas=metadatas)

        doc_id = db_save_document(user["id"], file.filename, suffix, size_bytes, len(chunks), "indexed" if chunks else "empty")
        return {"status": "ok", "filename": file.filename, "chunks": len(chunks), "preview": text[:500], "document_id": doc_id}
    except Exception as e:
        db_save_document(user["id"], file.filename, suffix, size_bytes, 0, "failed", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    return {"documents": db_list_documents(user["id"])}


@router.delete("/api/documents/{document_id}")
async def delete_document(document_id: str, user: dict = Depends(get_current_user)):
    doc = db_get_document(user["id"], document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        col = get_collection(user["id"])
        col.delete(where={"source": doc["filename"]})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove indexed chunks: {e}")
    db_delete_document_row(user["id"], document_id)
    return {"status": "deleted", "document_id": document_id}
