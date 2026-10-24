import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Trophy, Users, Calendar, BarChart2,
  LogIn, LogOut, Shield, Menu, X, Zap, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/standings', label: 'Points Table', icon: Trophy },
  { to: '/top-scorers', label: 'Top Scorers', icon: BarChart2 },
  { to: '/matches', label: 'Match Center', icon: Calendar },
  { to: '/players', label: 'Players', icon: Users },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(2, 8, 23, 0.90)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,229,255,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              >
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" fill="currentColor" />
              </motion.div>
              <div className="flex flex-col">
                <span
                  className="font-black text-sm sm:text-base tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #00e5ff, #76ff03)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  LEBUPARA FC
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">
                  Thunder League
                </span>
              </div>
            </Link>

            {/* Desktop Navigation (Public for everyone) */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to}>
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all"
                      style={{
                        color: active ? '#00e5ff' : '#94a3b8',
                        background: active ? 'rgba(0,229,255,0.1)' : 'transparent',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right side: Login / Admin controls */}
            <div className="hidden md:flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Link to="/admin">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Control Hub
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout ({user?.username})
                  </motion.button>
                </>
              ) : (
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition"
                    title="Sign in with admin credentials to enter scores or modify league data"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Admin Login
                  </motion.button>
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden bg-[#020817]/98 border-b border-cyan-500/20 backdrop-blur-xl"
          >
            <div className="p-4 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
                Public League Stats
              </div>
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition"
                      style={{
                        color: active ? '#00e5ff' : '#94a3b8',
                        background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-800">
                {isAdmin ? (
                  <>
                    <Link to="/admin" onClick={() => setMobileOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-amber-400 bg-amber-500/10 mb-2">
                        <Shield className="w-4 h-4" />
                        <span>Admin Control Hub</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout ({user?.username})</span>
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-cyan-400 bg-cyan-500/10">
                      <Lock className="w-4 h-4" />
                      <span>Admin Login (To Edit Scores & Data)</span>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
