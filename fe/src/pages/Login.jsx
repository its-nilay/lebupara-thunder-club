import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { testBackendConnection } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverOnline, setServerOnline] = useState(null); // true | false | null

  useEffect(() => {
    let active = true;
    testBackendConnection()
      .then((ok) => { if (active) setServerOnline(ok); })
      .catch(() => { if (active) setServerOnline(false); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(cleanUser, password);
      navigate('/admin');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let msg = 'Invalid username or password';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        msg = detail[0].msg;
      } else if (
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error' ||
        err?.code === 'ECONNABORTED'
      ) {
        msg = 'Cloud server is waking up or deploying (Render takes 15-20s on wakeup). Please retry in a few moments.';
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-3xl glass-card border border-cyan-500/30 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-950 border-2 border-amber-400/50 shadow-xl shadow-amber-500/10 mb-2">
            <img src="/logo.png" alt="Lebupara Thunder Club" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white">LEAGUE ADMIN PORTAL</h1>
          <p className="text-xs text-slate-400">
            Lebupara Thunder Club • Authorized Management Access
          </p>

          <div className="pt-2 flex items-center justify-center">
            {serverOnline === true && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Render Cloud Database Active
              </span>
            )}
            {serverOnline === false && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Cloud server waking up...
              </span>
            )}
            {serverOnline === null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-500">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Checking server...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                Connecting & Authenticating...
              </>
            ) : (
              'Sign In to Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
