"""Shared pytest fixtures."""
import pytest
import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db.database import Base, get_db
from app.main import app
from app.models.models import League, Team, Player, User, UserRole
from app.core.security import hash_password


@pytest.fixture(scope="function")
def db_engine(tmp_path):
    """Use a file-based SQLite for tests so all connections share the same DB."""
    db_file = tmp_path / "test.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def db(db_engine):
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def league(db):
    l = League(name="Test League", total_matches=10)
    db.add(l)
    db.commit()
    db.refresh(l)
    return l


@pytest.fixture(scope="function")
def teams(db, league):
    t1 = Team(league_id=league.id, name="Team Suvradip", captain_name="Suvradip", color="#00e5ff")
    t2 = Team(league_id=league.id, name="Team Arnab", captain_name="Arnab", color="#76ff03")
    db.add(t1)
    db.add(t2)
    db.commit()
    db.refresh(t1)
    db.refresh(t2)
    return t1, t2


@pytest.fixture(scope="function")
def players(db, teams):
    t1, t2 = teams
    players_list = []
    for name in ["Alice", "Bob", "Charlie"]:
        p = Player(name=name, team_id=t1.id)
        db.add(p)
        players_list.append(p)
    for name in ["Dave", "Eve", "Frank"]:
        p = Player(name=name, team_id=t2.id)
        db.add(p)
        players_list.append(p)
    db.commit()
    for p in players_list:
        db.refresh(p)
    return players_list


@pytest.fixture(scope="function")
def admin_user(db):
    user = User(
        username="admin",
        hashed_password=hash_password("adminpass123"),
        role=UserRole.admin,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def client(db, db_engine):
    """Create a test client that overrides the DB dependency with the test session."""
    # Patch the app's engine so lifespan create_all targets the test DB
    import app.db.database as db_module
    real_engine = db_module.engine
    db_module.engine = db_engine

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    # Restore the original engine
    db_module.engine = real_engine


@pytest.fixture(scope="function")
def admin_token(client, admin_user):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "adminpass123"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="function")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
