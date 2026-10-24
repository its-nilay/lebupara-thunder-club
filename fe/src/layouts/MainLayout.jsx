import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Lock } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-thunder" style={{ background: 'radial-gradient(ellipse at top, #0a1628 0%, #020817 60%)' }}>
      {/* Ambient background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              background: i % 2 === 0 ? 'rgba(0,229,255,0.4)' : 'rgba(118,255,3,0.3)',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: Math.random() * 5 + 's',
            }}
          />
        ))}
      </div>

      <Navbar />
      <main className="relative pt-16" style={{ zIndex: 1 }}>
        <Outlet />
      </main>

      <footer className="mt-20 py-10 text-center border-t border-cyan-500/10 text-xs text-slate-500 space-y-4">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden p-0.5 border border-amber-400/40 bg-slate-950 shadow-md">
            <img src="/logo.png" alt="Lebupara Thunder Club" className="w-full h-full object-contain" />
          </div>
          <span className="font-black text-sm text-white tracking-wider">
            LEBUPARA <span className="text-amber-400">THUNDER CLUB</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            • Estd. 2017
          </span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs font-semibold flex-wrap">
          <Link to="/" className="text-slate-400 hover:text-cyan-400 transition">Dashboard</Link>
          <span>•</span>
          <Link to="/standings" className="text-slate-400 hover:text-cyan-400 transition">Points Table</Link>
          <span>•</span>
          <Link to="/top-scorers" className="text-slate-400 hover:text-cyan-400 transition">Top Scorers</Link>
          <span>•</span>
          <Link to="/matches" className="text-slate-400 hover:text-cyan-400 transition">Match Center</Link>
          <span>•</span>
          <Link to="/players" className="text-slate-400 hover:text-cyan-400 transition">Squad Roster</Link>
          <span>•</span>
          <Link to="/login" className="text-cyan-400 hover:underline font-bold inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> Admin Sign In
          </Link>
        </div>
        <p className="text-slate-500 text-[11px]">⚡ Lebupara Thunder Club League · Built for the beautiful game ⚡</p>
      </footer>
    </div>
  );
}
