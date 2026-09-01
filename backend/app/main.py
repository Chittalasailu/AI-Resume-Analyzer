import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Final, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

load_dotenv()

from app.ai import AnalysisError, EmptyResumeTextError, analyze_resume
from app.database import get_db, init_db
from app.models import (
    Analysis,
    User,
    add_analysis,
    delete_analysis,
    get_analyses_by_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    save_user,
)
from app.parser import UnsupportedFileTypeError, extract_text

# Base directory for the backend project.
BASE_DIR: Final[Path] = Path(__file__).resolve().parent.parent
UPLOAD_DIR: Final[Path] = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

IS_RENDER: Final[bool] = os.getenv("RENDER") is not None
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    if IS_RENDER:
        raise RuntimeError(
            "JWT_SECRET environment variable must be set when running on Render."
        )
    SECRET_KEY = "dev-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resume_analyzer")


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class AnalysisRequest(BaseModel):
    filename: str
    ats_score: int
    skills: list[str]
    strengths: list[str]
    suggestions: list[str]
    summary: str
    job_match: Optional[int] = 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# FastAPI application instance.
app = FastAPI(
    title="AI Resume Analyzer API",
    version="1.0.0",
    description="Backend API for uploading resumes and preparing analysis workflows.",
    lifespan=lifespan,
)

# Enable CORS for local development and the deployed frontend(s).
# FRONTEND_URL can be set to add/override the production origin without a code change.
DEFAULT_ALLOWED_ORIGINS: Final[list[str]] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://ai-resume-analyzer-tan-theta.vercel.app",
    "https://ai-resume-analyzer-sailu1.vercel.app",
]
extra_frontend_url = os.getenv("FRONTEND_URL")
allowed_origins = list(DEFAULT_ALLOWED_ORIGINS)
if extra_frontend_url and extra_frontend_url not in allowed_origins:
    allowed_origins.append(extra_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = get_user_by_id(db, payload.get("sub"))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


@app.get("/")
def read_root():
    return {"message": "AI Resume Analyzer API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    logger.info("Signup request received for username=%s", payload.username)
    try:
        logger.info("Signup request validation passed")
        logger.info("Signup email validation passed for %s", payload.email)

        existing_user = get_user_by_username(db, payload.username) or get_user_by_email(
            db, str(payload.email)
        )
        if existing_user:
            logger.warning("Signup rejected: user already exists for username=%s email=%s", payload.username, payload.email)
            raise HTTPException(status_code=400, detail="User already exists")

        logger.info("Signup password hashing started")
        password_hash = hash_password(payload.password)
        logger.info("Signup password hashing completed")

        logger.info("Signup saving user to database")
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            username=payload.username,
            email=str(payload.email),
            password_hash=password_hash,
        )
        save_user(db, user)
        logger.info("Signup user saved successfully id=%s", user_id)

        return {"message": "User created successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Signup failed with unexpected exception")
        raise HTTPException(status_code=500, detail=f"Signup failed: {exc}") from exc


@app.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_username(db, payload.username)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@app.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user: object = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in {".pdf", ".docx"}:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )

    destination = UPLOAD_DIR / Path(file.filename).name

    try:
        # Save uploaded file
        with destination.open("wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)

        # Extract text
        extracted_text = extract_text(str(destination))

        # Analyze using Gemini
        analysis = analyze_resume(extracted_text)

        new_analysis = Analysis(
            id=str(uuid.uuid4()),
            user_id=user.id,
            filename=destination.name,
            ats_score=analysis.get("ats_score", 0),
            skills=analysis.get("skills", []),
            strengths=analysis.get("strengths", []),
            suggestions=analysis.get("improvements", []),
            summary=analysis.get("summary", ""),
            job_match=0,
        )
        add_analysis(db, new_analysis)

        return {
            "filename": destination.name,
            "status": "uploaded successfully",
            "analysis": analysis,
        }

    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    except EmptyResumeTextError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except AnalysisError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    except Exception:
        logger.exception("Unexpected error while processing resume upload")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your resume. Please try again.",
        )


@app.get("/history")
def get_history(user: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "analyses": [analysis.to_dict() for analysis in get_analyses_by_user(db, user.id)]
    }


@app.delete("/history/{analysis_id}")
def delete_history_item(
    analysis_id: str,
    user: object = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not delete_analysis(db, analysis_id, user.id):
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"message": "Deleted successfully"}
