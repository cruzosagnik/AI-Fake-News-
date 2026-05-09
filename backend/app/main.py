from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from app.api.analyze import router as analyze_router
from app.api.auth import router as auth_router
from app.database.mongo import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="TruthLens AI",
    description="Explainable AI-powered misinformation detection platform",
    version="1.0.0",
    lifespan=lifespan,
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(auth_router, prefix="/auth")


@app.get("/")
async def root():
    return {"message": "TruthLens AI API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
