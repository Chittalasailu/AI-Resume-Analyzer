import os
from typing import Iterator, Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

IS_RENDER = os.getenv("RENDER") is not None

LOCAL_SQLITE_URL = "sqlite:///./resume_analyzer.db"


def resolve_database_url(raw_url: Optional[str], is_render: bool) -> str:
    """Normalize DATABASE_URL, or pick the local SQLite fallback.

    Render (and most managed Postgres providers) hand out `postgres://`
    URLs; SQLAlchemy's psycopg2 dialect requires the `postgresql://` scheme.
    Production (Render) must never silently fall back to SQLite -- it's
    ephemeral there, which is the exact data-loss bug this module fixes.
    """
    if not raw_url:
        if is_render:
            raise RuntimeError(
                "DATABASE_URL environment variable must be set when running on Render."
            )
        return LOCAL_SQLITE_URL

    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql://", 1)

    return raw_url


DATABASE_URL = resolve_database_url(os.getenv("DATABASE_URL"), IS_RENDER)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401 (registers models on Base before create_all)

    Base.metadata.create_all(bind=engine)
