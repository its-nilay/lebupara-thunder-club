"""Security and authorization tests."""
import pytest


class TestPublicAccess:

    def test_health_public(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_standings_public(self, client, league, teams):
        resp = client.get("/api/standings")
        assert resp.status_code == 200

    def test_top_scorers_public(self, client, league, teams):
        resp = client.get("/api/top-scorers")
        assert resp.status_code == 200

    def test_matches_public(self, client, league):
        resp = client.get("/api/matches")
        assert resp.status_code == 200

    def test_players_public(self, client, league):
        resp = client.get("/api/players")
        assert resp.status_code == 200


class TestAdminProtection:

    def test_create_match_requires_auth(self, client, league):
        resp = client.post("/api/admin/matches", json={"match_number": 1})
        assert resp.status_code == 401

    def test_create_player_requires_auth(self, client, league, teams):
        t1, t2 = teams
        resp = client.post("/api/admin/players", json={"name": "Hacker", "team_id": t1.id})
        assert resp.status_code == 401

    def test_admin_with_valid_token(self, client, league, teams, admin_user, auth_headers):
        resp = client.post(
            "/api/admin/matches",
            json={"match_number": 1},
            headers=auth_headers,
        )
        assert resp.status_code == 200

    def test_invalid_token_rejected(self, client, league):
        resp = client.post(
            "/api/admin/matches",
            json={"match_number": 1},
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401

    def test_expired_token_rejected(self, client, league):
        import time
        from app.core.security import create_access_token
        from datetime import timedelta
        # Create a token that expires immediately (negative delta simulates expired)
        token = create_access_token(
            data={"sub": "1", "username": "admin", "role": "admin"},
            expires_delta=timedelta(seconds=-1),
        )
        resp = client.post(
            "/api/admin/matches",
            json={"match_number": 1},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

    def test_login_error_does_not_reveal_details(self, client, admin_user):
        resp = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpass"})
        assert resp.status_code == 401
        body = resp.json()
        # Must not reveal whether username or password was wrong
        assert "password" not in body.get("detail", "").lower()
        assert "username" not in body.get("detail", "").lower()

    def test_me_endpoint_requires_auth(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_audit_logs_requires_auth(self, client):
        resp = client.get("/api/admin/audit-logs")
        assert resp.status_code == 401

    def test_viewer_role_cannot_access_admin(self, client, db, league):
        """A viewer role token cannot access admin endpoints."""
        from app.models.models import User, UserRole
        from app.core.security import hash_password, create_access_token
        viewer = User(
            username="viewer_test",
            hashed_password=hash_password("viewerpass123"),
            role=UserRole.viewer,
        )
        db.add(viewer)
        db.commit()
        db.refresh(viewer)

        token = create_access_token(
            data={"sub": str(viewer.id), "username": "viewer_test", "role": "viewer"}
        )
        resp = client.post(
            "/api/admin/matches",
            json={"match_number": 1},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403
