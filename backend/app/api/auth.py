from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Optional
import os

import bcrypt
from jose import JWTError, jwt

from app.models.user import UserCreate, UserLogin
from app.database.mongo import get_db

router = APIRouter()

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')
    if len(plain_bytes) > 72:
        plain_bytes = plain_bytes[:72]
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)


JWT_SECRET = os.getenv("JWT_SECRET", "truthlens_super_secret_key_change_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")


@router.post("/register")
async def register(user: UserCreate):
    db = get_db()

    if db is None:
        # Offline mode: return a mock token
        mock_id = "offline_user"
        token = create_access_token({"sub": mock_id, "email": user.email, "name": user.name})
        return {
            "token": token,
            "user": {"id": mock_id, "name": user.name, "email": user.email},
        }

    # Check if email already exists
    existing = await db["users"].find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    hashed_pw = hash_password(user.password)
    doc = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
        "createdAt": datetime.utcnow(),
    }
    result = await db["users"].insert_one(doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "email": user.email, "name": user.name})
    return {
        "token": token,
        "user": {"id": user_id, "name": user.name, "email": user.email},
    }


@router.post("/login")
async def login(credentials: UserLogin):
    db = get_db()

    if db is None:
        # Offline mode
        mock_id = "offline_user"
        token = create_access_token({"sub": mock_id, "email": credentials.email, "name": "User"})
        return {
            "token": token,
            "user": {"id": mock_id, "name": "User", "email": credentials.email},
        }

    user_doc = await db["users"].find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = str(user_doc["_id"])
    token = create_access_token({
        "sub": user_id,
        "email": user_doc["email"],
        "name": user_doc["name"],
    })
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user_doc["name"],
            "email": user_doc["email"],
        },
    }
