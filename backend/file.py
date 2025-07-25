from fastapi import APIRouter, Depends, HTTPException, Query, status, Response, UploadFile, File
from sqlalchemy.orm import Session
import uuid
import hashlib
import os

from database import (
    AuthUser,
)
from auth import get_db, get_current_user 

import models


# Storage class
class LocalStorage:
    ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/tiff", "video/mp4"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    def __init__(self, base_path: str = "uploads", base_url: str = "/static"):
        os.makedirs(base_path, exist_ok=True)
        self.base_path = base_path
        self.base_url = base_url
        self.server_url = os.getenv("SERVER_URL", "http://localhost:8000")

    async def save(self, filename: str, content: bytes) -> str:
        path = os.path.join(self.base_path, filename)
        if os.path.exists(path):
            return f"{self.server_url}{self.base_url}/{filename}"
        
        with open(path, "wb") as f:
            f.write(content)
        return f"{self.server_url}{self.base_url}/{filename}"



# Dependency injector
def get_storage():
    return LocalStorage()  # Replace with S3Storage when switching to cloud


# APIRouter setup
router = APIRouter(
    prefix="/file",
    tags=["file"],
    dependencies=[Depends(get_current_user)]
)


# Upload endpoint
@router.post("/upload-file", response_model=models.FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...), 
    storage: LocalStorage = Depends(get_storage), 
    current_user: AuthUser = Depends(get_current_user)
):
    if file.content_type not in LocalStorage.ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type.")

    contents = await file.read()
    if len(contents) > LocalStorage.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB).")

    ext = os.path.splitext(file.filename)[1]
    unique_name = hashlib.sha256(contents).hexdigest() + ext

    file_url = await storage.save(unique_name, contents)
    return models.FileUploadResponse(url=file_url)
