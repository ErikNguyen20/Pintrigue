from fastapi import Depends, FastAPI, HTTPException, status
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from database import create_tables_if_not_exist
from auth import router as auth_router
from users import router as users_router
from posts import router as posts_router
from file import router as file_router



# Load env vars
SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8000")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))
FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(',') if o]

# App
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables_if_not_exist()
    yield
app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
app.include_router(file_router)
app.mount("/static", StaticFiles(directory="uploads"), name="static")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root():
    return {"Hello": "World"}


# Run app
if __name__ == "__main__":
    uvicorn.run(app, host=API_HOST, port=API_PORT)