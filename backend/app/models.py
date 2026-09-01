from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base

# JSONB on Postgres; plain JSON on any other dialect (the SQLite fallback
# used for local development without a DATABASE_URL).
JSONType = JSONB().with_variant(JSON(), "sqlite")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    analyses: Mapped[List["Analysis"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {"id": self.id, "username": self.username, "email": self.email}


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False)
    skills: Mapped[List[str]] = mapped_column(JSONType, nullable=False, default=list)
    strengths: Mapped[List[str]] = mapped_column(JSONType, nullable=False, default=list)
    suggestions: Mapped[List[str]] = mapped_column(JSONType, nullable=False, default=list)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    job_match: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="analyses")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "ats_score": self.ats_score,
            "skills": self.skills,
            "strengths": self.strengths,
            "suggestions": self.suggestions,
            "summary": self.summary,
            "job_match": self.job_match,
            "created_at": self.created_at.isoformat(),
        }


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(func.lower(User.username) == username.lower()).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(func.lower(User.email) == email.lower()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.get(User, user_id)


def save_user(db: Session, user: User) -> None:
    db.add(user)
    db.commit()
    db.refresh(user)


def add_analysis(db: Session, analysis: Analysis) -> None:
    db.add(analysis)
    db.commit()
    db.refresh(analysis)


def get_analyses_by_user(db: Session, user_id: str) -> List[Analysis]:
    return (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )


def delete_analysis(db: Session, analysis_id: str, user_id: str) -> bool:
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == user_id)
        .first()
    )
    if analysis is None:
        return False
    db.delete(analysis)
    db.commit()
    return True
