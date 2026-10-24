# ⚡ Lebupara Thunder Club — Frontend Web App

Modern, mobile-responsive football league web application built with **React 19**, **Vite 8**, and **Tailwind CSS**.

---

## 🎨 Design & User Experience

- **Aesthetic**: Stadium/Cyberpunk dark theme with vibrant neon cyan (`#00e5ff`), lime green (`#76ff03`), and gold accents.
- **Micro-Animations**: Smooth page and modal transitions powered by Framer Motion.
- **Mobile First**: Optimized for smartphones, tablets, and desktop displays.
- **Public by Default**: Fans and players can view standings, fixtures, results, and player rosters without logging in.
- **Admin Control**: Secure administration interface for entering match results, correcting scores, managing captain assignments, and modifying tournament format.

---

## 📂 Frontend File Structure

```text
fe/
├── src/
│   ├── components/
│   │   ├── MatchDateModal.jsx   # Kickoff date/time picker with presets & dark theme
│   │   ├── ScoreModal.jsx       # Score entry modal with player goal tagging
│   │   ├── TeamConfigModal.jsx  # Team name, color, and captain selector
│   │   ├── PlayerModal.jsx      # Add/edit player and availability status
│   │   ├── Navbar.jsx           # Responsive navigation bar with mobile drawer
│   │   └── Footer.jsx           # Club footer with quick links
│   ├── context/
│   │   └── AuthContext.jsx      # Admin session & JWT token management
│   ├── pages/
│   │   ├── Dashboard.jsx        # Hero showdown, progress, standings & top scorers mini
│   │   ├── Matches.jsx          # Official fixture list with scores & kickoff dates
│   │   ├── Standings.jsx        # Complete points table with form guide & tiebreaks
│   │   ├── TopScorers.jsx       # Golden Boot leaderboard with 3D podium
│   │   ├── Players.jsx          # Squad roster & active/injury tracker
│   │   ├── Admin.jsx            # Multi-tab admin control hub
│   │   └── Login.jsx            # Admin login screen with demo auto-fill
│   ├── services/
│   │   ├── api.js               # Axios HTTP client with interceptors
│   │   └── dateUtils.js         # Exact fixture date formatting without timezone drift
│   ├── App.jsx                  # Route definitions
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Tailwind styling & custom neon calendar rules
├── public/                      # Static assets & favicon
├── vercel.json                  # Single Page Application rewrites for Vercel
├── vite.config.js               # Vite build configuration
├── package.json                 # Dependencies & build scripts
└── .env.example                 # Environment variable template
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default setting:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```
Compiled production files will be output to `dist/`.

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and select your repository.
3. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `fe`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: URL of your deployed backend (e.g. `https://your-api.onrender.com`)
5. Click **Deploy**.

Single-page routing is pre-configured via `vercel.json` so direct page refreshes (e.g., `/standings`, `/admin`) resolve seamlessly.
