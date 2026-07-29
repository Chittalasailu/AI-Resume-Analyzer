from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional


@dataclass
class User:
    id: str
    username: str
    email: str
    password_hash: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
        }


@dataclass
class Analysis:
    id: str
    user_id: str
    filename: str
    ats_score: int
    skills: List[str]
    strengths: List[str]
    suggestions: List[str]
    summary: str
    job_match: Optional[int] = 0
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

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
            "created_at": self.created_at,
        }


users_db: Dict[str, User] = {}
analyses_db: List[Analysis] = []


def get_user_by_username(username: str) -> Optional[User]:
    for user in users_db.values():
        if user.username.lower() == username.lower():
            return user
    return None


def get_user_by_email(email: str) -> Optional[User]:
    for user in users_db.values():
        if user.email.lower() == email.lower():
            return user
    return None


def get_user_by_id(user_id: str) -> Optional[User]:
    return users_db.get(user_id)


def save_user(user: User) -> None:
    users_db[user.id] = user


def add_analysis(analysis: Analysis) -> None:
    analyses_db.append(analysis)
