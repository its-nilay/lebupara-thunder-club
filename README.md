# ⚡︎ Lebupara Thunder Club ⚡︎ — Premier League Management System

A full-stack, production-ready football league and tournament management web application built for **Lebupara Thunder Club**.

The platform provides a modern stadium/cyberpunk dashboard for fans and players to track live league standings, match fixtures, kickoff schedules, squad rosters, and the Golden Boot leaderboard. League administrators have a dedicated, secured control hub to record scores, reschedule fixtures, manage squad availability, and configure dynamic tournaments.

---

## 🌟 Key Features

1. **Public Access with Zero Friction**:
   - All points tables, match results, fixture schedules, squad availability, and top scorer leaderboards are **100% public** and accessible to all players and fans without logging in.
   - Administrative login is strictly required for entering scores, editing team configurations, and managing players.

2. **Dynamic Tournament Length**:
   - League is **not locked to 10 matches** — administrators can configure any tournament format (e.g., 5, 8, 10, 12, 15, 20+ matches) via the Admin Dashboard.
   - Fixtures automatically expand when match count increases, and countdowns/progress bars update dynamically across the entire website.
   - Sequential "+ Add Next Match" and safe deletion of unplayed fixtures.

3. **Official Points Table & Automated Outcome Calculation**:
   - **Win**: 3 points
   - **Draw**: 1 point each
   - **Loss**: 0 points
   - Entering Team 1's score automatically determines Team 2's outcome (Win ➔ Loss, Draw ➔ Draw).
   - Real-time ranking with tiebreaker priority: `Points` ➔ `Goal Difference (GD)` ➔ `Goals Scored (GS)`.

4. **Data Entry Correction, Reopening & Postponements**:
   - Accidental mistakes can be edited and corrected at any time.
   - Completed matches can be reopened back to `Scheduled` to clear scores and restore the points table.
   - Postponed matches can be reopened back to `Scheduled` with a single click.

5. **Own Goal (OG) Reconciliation**:
   - When an own goal is recorded, it is credited to the opposing side's scoreboard while properly tagged as `(OG)` on the scorer list without falsely inflating the player's personal Golden Boot tally.

6. **Match Kickoff Date & Time Scheduling**:
   - Interactive kickoff scheduling for future and concluded matches.
   - Webpage-themed dark/cyan calendar and clock pickers with quick presets (`Today`, `Tomorrow`, `Next Sunday`, `07:00 AM`, `08:00 AM`, `04:30 PM`, `06:00 PM`).
   - Local kickoff times are preserved with zero timezone drift.

7. **Multi-Season & Captains Management**:
   - Captains are selected directly from the club squad roster, highlighting a vibrant `CAPTAIN` badge on player cards and stats.
   - Future season editions can dynamically update team names, captain selections, and brand colors without touching code.

8. **Squad Roster & Injury Tracking**:
   - Club player roster tracking active vs. injured/inactive players.
   - Goal share percentage calculated against total league goals.
   - Competition ranking tiebreaks (players with equal goals share the same rank, e.g., 2nd spot tie).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Framer Motion, Lucide Icons, Axios |
| **Backend** | FastAPI, Python 3.12+, SQLAlchemy ORM, Pydantic v2, Passlib (Argon2), PyJWT, SlowAPI |
| **Database** | SQLite (`lebupara.db`) with Alembic migration support |
| **Testing** | Pytest (39/39 passing automated tests) |
| **Deployment** | Vercel (Frontend), Render / Railway / Fly.io / VPS (Backend) |

---

## 📂 Repository Structure

```text
lebupara-thunder-club/
├── be/                          # Backend FastAPI service
│   ├── app/                     # Application source code
│   │   ├── api/                 # API route controllers (public, admin, auth)
│   │   ├── core/                # Config, security, JWT auth
│   │   ├── db/                  # Database session & models
│   │   ├── models/              # SQLAlchemy database models
│   │   ├── schemas/             # Pydantic v2 validation schemas
│   │   └── services/            # Business logic (league, standings, matches)
│   ├── tests/                   # Pytest test suite (39 tests)
│   ├── pyproject.toml           # Python package definition (uv)
│   ├── requirements.txt         # Pinned pip requirements
│   ├── .env.example             # Backend environment template
│   └── README.md                # Backend technical guide
│
├── fe/                          # Frontend React + Vite application
│   ├── src/                     # React source code
│   │   ├── components/          # Reusable UI components & modals
│   │   ├── context/             # AuthContext (JWT session state)
│   │   ├── pages/               # Dashboard, Matches, Standings, TopScorers, Players, Admin
│   │   └── services/            # API client & date utilities
│   ├── public/                  # Static assets & favicon
│   ├── package.json             # NPM package scripts & dependencies
│   ├── vercel.json              # Vercel SPA routing configuration
│   ├── .env.example             # Frontend environment template
│   └── README.md                # Frontend development guide
│
├── .gitignore                   # Workspace Git exclusions
├── requirements.txt             # Root requirements pointer
└── README.md                    # Main documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.12+ (or [uv](https://github.com/astral-sh/uv))

### 2. Backend Setup
```bash
cd be

# Using uv (recommended):
uv sync
uv run pytest tests/ -v           # Run 39 tests
uv run python -m app.seed         # Seed initial league & admin
uv run uvicorn app.main:app --reload --port 8000

# OR using standard pip:
python -m venv .venv
source .venv/bin/activate         # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest tests/ -v
python -m app.seed
uvicorn app.main:app --reload --port 8000
```
Backend API interactive documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd fe
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Admin Credentials
- **Username**: `admin`
- **Password**: `Admin@123456`
*(A one-click "Demo Admin Credentials" button is also provided on the `/login` page).*

---

## 📤 Step-by-Step Guide: Pushing to GitHub

Follow these steps in your terminal from the project root (`e:\Study\lebupara-thunder-club`):

### Step 1: Verify Git Status
```bash
git status
```
*(Notice that `node_modules/`, `dist/`, `.venv/`, and `.db` files are properly ignored by `.gitignore`).*

### Step 2: Add Files & Make Initial Commit
```bash
git add .
git commit -m "feat: complete Lebupara Thunder Club league management platform"
```

### Step 3: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name the repository (e.g. `lebupara-thunder-club`).
3. Leave **"Initialize this repository with a README"** **UNCHECKED** (we already have a complete one).
4. Click **Create repository**.

### Step 4: Link Remote & Push
Copy your repository URL from GitHub and run:
```bash
git remote add origin https://github.com/its-nilay/lebupara-thunder-club.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step-by-Step Guide: Deploying Frontend to Vercel

### Step 1: Deploy Backend (Required for live data)
Before deploying the frontend, deploy the `be/` folder to a hosting provider that supports Python (such as [Render](https://render.com), [Railway](https://railway.app), or [Fly.io]):
1. Create a new Web Service pointing to your GitHub repo.
2. Set Root Directory to `be`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Note your live backend URL (e.g., `https://lebupara-api.onrender.com`).

### Step 2: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select and import your GitHub repository: `lebupara-thunder-club`.
3. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `fe`.
   - **Build Command**: `npm run build` (detected automatically)
   - **Output Directory**: `dist` (detected automatically)
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your live backend URL (e.g., `https://lebupara-api.onrender.com`).
5. Click **Deploy**.

Vercel will build and publish your site with a custom domain (e.g., `lebupara-thunder-club.vercel.app`) with HTTPS and automatic single-page routing enabled via `fe/vercel.json`.

---

## 🧪 Testing & Code Quality

- **39 Pytest Unit Tests**: Covers points calculations, tiebreak rankings, own goal scoreboard assignment, date updating, dynamic match expansion/deletion, and JWT security.
- **Vite Production Build**: Verified with 0 syntax or bundling warnings.

```bash
cd be && uv run pytest tests/ -v
cd ../fe && npm run build
```

---

## 📄 License
MIT License. Built with ❤️ for Lebupara Thunder Club.
