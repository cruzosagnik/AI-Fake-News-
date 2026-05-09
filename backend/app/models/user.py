from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    password: str
    createdAt: datetime = datetime.utcnow()


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    createdAt: datetime
