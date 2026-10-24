# ⚡ Lebupara Thunder Club — Backend API

FastAPI service powering the Lebupara Thunder Club League Management System.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: FastAPI (Asynchronous Python 3.12+)
- **ORM & Database**: SQLAlchemy with SQLite (`lebupara.db`)
- **Validation**: Pydantic v2 schemas (`app/schemas/schemas.py`)
- **Authentication**: JWT access and refresh tokens, Argon2 / Bcrypt password hashing (`app/core/security.py`)
- **Rate Limiting & Security**: SlowAPI limiter, CORS middleware
- **Migrations**: Alembic support
- **Testing**: Pytest & pytest-asyncio (39 automated test cases)

---

## 📂 Backend File Structure

```text
be/
├── app/
│   ├── api/                 # API Endpoints
│   │   ├── auth.py          # /api/auth (login, refresh, me)
│   │   ├── league.py        # /api/standings, /api/matches, /api/players, /api/top-scorers
│   │   └── admin.py         # /api/admin/* (score entry, schedule, reopen, teams)
│   ├── core/                # Configuration & Security
│   │   ├── config.py        # App settings & environment resolution
│   │   └── security.py      # Token generation, hashing, admin dependencies
│   ├── db/                  # Database session provider
│   │   └── database.py      # Engine, Base, and session lifecycle
│   ├── models/              # SQLAlchemy Database Models
│   │   └── models.py        # League, Team, Player, Match, GoalRecord, AuditLog, User
│   ├── schemas/             # Pydantic v2 Validation Schemas
│   │   └── schemas.py       # Request & response contracts
│   ├── services/            # Core business logic
│   │   ├── league_service.py # Points table calculation & top scorers ranking
│   │   └── match_service.py  # Match outcome logic, reopen, date scheduling
│   ├── main.py              # FastAPI application factory & router mounting
│   └── seed.py              # Database seeder (admin, teams, fixtures, players)
├── tests/                   # 39 Pytest test cases
├── requirements.txt         # Pinned production requirements
├── pyproject.toml           # Project package config (uv)
└── .env.example             # Environment configuration template
```

---

## 🚀 Quick Start

### 1. Installation
Using `uv` (recommended):
```bash
uv sync
```

Or using standard `pip`:
```bash
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Seed Database
Seeds default admin user, initial teams (Team Suvradip & Team Arnab), scheduled fixtures, and player roster:
```bash
uv run python -m app.seed
```

### 4. Run Development Server
```bash
uv run uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

---

## 🧪 Testing

Run all 39 backend test cases:
```bash
uv run pytest tests/ -v
```

Tests verify:
- Points table calculation (Win=3, Draw=1, Loss=0)
- Goal difference (GD) and tiebreak rankings
- Own goals credited to opposing scoreboard
- Reopen & postpone match workflows
- Dynamic match count expansion and deletion
- Public endpoints vs admin-protected routes
- JWT authentication and token expiration

---

## 🚀 Production Deployment (Render, Railway, Fly.io)

### Build Command:
```bash
pip install -r requirements.txt
```

### Start Command:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Required Environment Variables:
- `SECRET_KEY`: A secure random secret string
- `CORS_ORIGINS`: Comma-separated allowed frontend origins (e.g. `https://lebupara-thunder-club.vercel.app`)
