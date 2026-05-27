from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

load_dotenv()

from app.api.analyze import router as analyze_router
from app.api.auth import router as auth_router
from app.api.debate import router as debate_router
from app.database.mongo import connect_db, close_db

logger = logging.getLogger(__name__)

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

if IS_PROD and FRONTEND_URL == "http://localhost:5173":
    logger.warning(
        "⚠️  CORS WARNING: Running in production but FRONTEND_URL is not set. "
        "Set FRONTEND_URL and ALLOWED_ORIGINS in your Render environment variables "
        "to your Vercel frontend URL (e.g. https://your-app.vercel.app). "
        "All cross-origin requests from the frontend will be BLOCKED."
    )
else:
    logger.info(f"✅ CORS allowed origins: {ALLOWED_ORIGINS}")


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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(auth_router, prefix="/auth")
app.include_router(debate_router)


# Ensure CORS headers are present even on unhandled 500 errors.
# Without this, a server crash strips the CORS headers and the browser
# reports a misleading "CORS error" instead of the real server error.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers=headers,
    )


@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"message": "VerifyX API is running", "version": "1.0.0", "env": APP_ENV}


@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok"}
