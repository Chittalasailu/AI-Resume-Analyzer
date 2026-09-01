import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import (
    Analysis,
    User,
    add_analysis,
    get_analyses_by_user,
    get_user_by_id,
    save_user,
)


def test_in_memory_store_removed():
    import app.models as models_module

    assert not hasattr(models_module, "users_db")
    assert not hasattr(models_module, "analyses_db")


def test_data_survives_process_restart(tmp_path):
    """Proves persistence doesn't depend on any in-process state: a brand new
    engine/session (standing in for a fresh backend process) reads data
    written and fully disposed of by an earlier, unrelated engine/session."""
    db_path = tmp_path / "restart_test.db"
    db_url = f"sqlite:///{db_path}"

    # --- "process 1": write data, then fully tear down ---
    engine_1 = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine_1)
    db1 = sessionmaker(bind=engine_1)()

    user_id = str(uuid.uuid4())
    save_user(
        db1,
        User(
            id=user_id,
            username="restart_user",
            email="restart@example.com",
            password_hash="hashed-value",
        ),
    )

    analysis_id = str(uuid.uuid4())
    add_analysis(
        db1,
        Analysis(
            id=analysis_id,
            user_id=user_id,
            filename="resume.pdf",
            ats_score=77,
            skills=["Python"],
            strengths=["Clarity"],
            suggestions=["Add metrics"],
            summary="Test summary",
        ),
    )

    db1.close()
    engine_1.dispose()

    # --- "process 2": independent engine/session against the same DB file ---
    engine_2 = create_engine(db_url, connect_args={"check_same_thread": False})
    db2 = sessionmaker(bind=engine_2)()

    restored_user = get_user_by_id(db2, user_id)
    assert restored_user is not None
    assert restored_user.username == "restart_user"
    assert restored_user.email == "restart@example.com"

    restored_analyses = get_analyses_by_user(db2, user_id)
    assert len(restored_analyses) == 1
    assert restored_analyses[0].id == analysis_id
    assert restored_analyses[0].ats_score == 77
    assert restored_analyses[0].skills == ["Python"]

    db2.close()
    engine_2.dispose()
