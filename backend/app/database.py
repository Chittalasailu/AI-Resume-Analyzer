import os
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

IS_RENDER = os.getenv("RENDER") is not None

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if IS_RENDER:
        raise RuntimeError(
            "DATABASE_URL environment variable must be set when running on Render."
        )
    # Local development only: a file-backed SQLite database so the app runs
    # without requiring a local Postgres install. Production always uses
    # Postgres via DATABASE_URL.
    DATABASE_URL = "sqlite:///./resume_analyzer.db"

# Render (and most managed Postgres providers) hand out `postgres://` URLs;
# SQLAlchemy's psycopg2 dialect requires the `postgresql://` scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

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
