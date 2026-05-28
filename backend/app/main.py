from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# SAFE IMPORTS
# -----------------------------
try:
    from app.api.analyze import router as analyze_router
except Exception as e:
    print(f"Error importing analyze router: {e}")
    analyze_router = None

try:
    from app.api.auth import router as auth_router
except Exception as e:
    print(f"Error importing auth router: {e}")
    auth_router = None

try:
    from app.api.debate import router as debate_router
except Exception as e:
    print(f"Error importing debate router: {e}")
    debate_router = None

try:
    from app.database.mongo import connect_db, close_db
except Exception as e:
    print(f"Error importing mongo db: {e}")

    async def connect_db():
        print("MongoDB connection skipped")

    async def close_db():
        print("MongoDB close skipped")


logger = logging.getLogger(__name__)

APP_ENV = os.getenv("APP_ENV", "development")
IS_PROD = APP_ENV == "production"

# -----------------------------
# CORS CONFIG
# -----------------------------
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_env_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

ALLOWED_ORIGINS = list({
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    *_env_origins,
})

if IS_PROD and FRONTEND_URL == "http://localhost:5173":
    logger.warning(
        "⚠️ FRONTEND_URL not configured for production"
    )
else:
    logger.info(f"✅ Allowed origins: {ALLOWED_ORIGINS}")


# -----------------------------
# DATABASE LIFESPAN
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
        print("✅ Database connected")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

    yield

    try:
        await close_db()
        print("✅ Database closed")
    except Exception as e:
        print(f"❌ Database close failed: {e}")


# -----------------------------
# FASTAPI APP
# -----------------------------
app = FastAPI(
    title="VerifyX",
    description="Explainable AI-powered misinformation detection platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
)


# -----------------------------
# CORS MIDDLEWARE
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# ROUTERS
# -----------------------------
if analyze_router:
    app.include_router(analyze_router)

if auth_router:
    app.include_router(auth_router, prefix="/auth")

if debate_router:
    app.include_router(debate_router)


# -----------------------------
# GLOBAL ERROR HANDLER
# -----------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")

    headers = {}

    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    logger.error(
        f"Unhandled exception on {request.method} {request.url}: {exc}"
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc)
        },
        headers=headers,
    )


# -----------------------------
# ROOT ROUTE
# -----------------------------
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "message": "VerifyX API is running",
        "version": "1.0.0",
        "env": APP_ENV
    }


# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {
        "status": "ok"
    }