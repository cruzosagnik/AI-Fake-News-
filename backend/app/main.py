from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from app.api.analyze import router as analyze_router
from app.api.auth import router as auth_router
from app.api.debate import router as debate_router
from app.database.mongo import connect_db, close_db

APP_ENV = os.getenv("APP_ENV", "development")
IS_PROD = APP_ENV == "production"

# Build allowed origins list from env — supports comma-separated list
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_env_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

ALLOWED_ORIGINS: list[str] = list({
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    *_env_origins,
})


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="VerifyX",
    description="Explainable AI-powered misinformation detection platform",
    version="1.0.0",
    lifespan=lifespan,
    # Disable interactive docs in production
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(auth_router, prefix="/auth")
app.include_router(debate_router)


@app.get("/")
async def root():
    return {"message": "VerifyX API is running", "version": "1.0.0", "env": APP_ENV}


@app.get("/health")
async def health():
    return {"status": "ok"}
