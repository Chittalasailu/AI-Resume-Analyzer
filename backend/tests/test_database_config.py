import pytest
from sqlalchemy import create_engine

from app.database import resolve_database_url


def test_local_fallback_used_when_unset_and_not_render():
    assert resolve_database_url(None, is_render=False) == "sqlite:///./resume_analyzer.db"


def test_render_without_database_url_fails_loudly():
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        resolve_database_url(None, is_render=True)


def test_postgres_scheme_rewritten_to_postgresql():
    resolved = resolve_database_url(
        "postgres://user:pass@dpg-example.render.com/dbname", is_render=True
    )
    assert resolved == "postgresql://user:pass@dpg-example.render.com/dbname"


def test_postgresql_scheme_passed_through_unchanged():
    url = "postgresql://user:pass@dpg-example.render.com/dbname"
    assert resolve_database_url(url, is_render=True) == url


def test_psycopg2_driver_loads_for_postgres_url():
    """create_engine() imports the DBAPI driver eagerly, before any
    connection attempt, so this proves psycopg2 is installed and wired up
    correctly without needing a reachable Postgres server."""
    resolved = resolve_database_url(
        "postgres://user:pass@localhost:5432/nonexistent_db", is_render=True
    )
    engine = create_engine(resolved)
    try:
        assert engine.url.drivername in ("postgresql", "postgresql+psycopg2")
        assert engine.dialect.driver == "psycopg2"
    finally:
        engine.dispose()
