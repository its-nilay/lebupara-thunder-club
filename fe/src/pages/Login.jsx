import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getActiveApiUrl } from '../services/api';

const RENDER_URL = 'https://lebupara-thunder-club.onrender.com';
const WAKEUP_TIMEOUT_MS = 90000; // 90 seconds max wakeup wait

async function pingServer(url) {
  try {
    const res = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      return json?.status === 'ok' || json?.status === 'healthy';
    }
    return false;
  } catch {
    return false;
  }
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Server status: 'checking' | 'waking' | 'online' | 'offline'
  const [serverStatus, setServerStatus] = useState('checking');
  const [wakeupSeconds, setWakeupSeconds] = useState(0);
  const wakeupRef = useRef(null);
  const timerRef = useRef(null);

  // Poll the server until it's alive
  useEffect(() => {
    let cancelled = false;
    const apiUrl = getActiveApiUrl();

    const startTime = Date.now();

    const checkServer = async () => {
      const ok = await pingServer(apiUrl);
      if (cancelled) return;

      if (ok) {
        setServerStatus('online');
        if (timerRef.current) clearInterval(timerRef.current);
        if (wakeupRef.current) clearTimeout(wakeupRef.current);
        return;
      }

      // Not online yet — start countdown display and keep polling
      setServerStatus((prev) => (prev === 'checking' ? 'waking' : prev));

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setWakeupSeconds(elapsed);

      if (Date.now() - startTime > WAKEUP_TIMEOUT_MS) {
        setServerStatus('offline');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      // Poll again in 4 seconds
      wakeupRef.current = setTimeout(checkServer, 4000);
    };

    // Start elapsed timer display
    timerRef.current = setInterval(() => {
      setWakeupSeconds((s) => s + 1);
    }, 1000);

    checkServer();

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      clearTimeout(wakeupRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError('Please enter both username and password');
      return;
    }

    // If server is still waking up, give it a few more seconds first
    if (serverStatus === 'waking' || serverStatus === 'checking') {
      setError('Please wait — the cloud server is still waking up. Try again in a moment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(cleanUser, password);
      navigate('/admin');
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 401 || status === 403) {
        setError('Invalid username or password. Please check your credentials.');
      } else if (status === 422) {
        const msg = Array.isArray(detail)
          ? detail.map((d) => d.msg).join(', ')
          : (typeof detail === 'string' ? detail : 'Invalid input');
        setError(msg);
      } else if (
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error' ||
        err?.code === 'ECONNABORTED'
      ) {
        setError('Connection failed. The server may be waking up — please wait 15-20 seconds and try again.');
        // Re-trigger server check
        setServerStatus('waking');
      } else {
        setError(err?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isServerReady = serverStatus === 'online';
  const isServerWaking = serverStatus === 'waking' || serverStatus === 'checking';

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

          {/* Server Status Badge */}
          <div className="pt-2 flex items-center justify-center">
            {serverStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Cloud Server Active — Ready to Login
              </span>
            )}
            {(serverStatus === 'waking' || serverStatus === 'checking') && (
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Waking cloud server... ({wakeupSeconds}s)
                </span>
                <span className="text-[10px] text-slate-500">
                  Render free tier spins down when idle — takes ~20s to wake
                </span>
                {/* Progress bar */}
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-amber-400/60 rounded-full"
                    animate={{ width: `${Math.min((wakeupSeconds / 30) * 100, 95)}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </div>
            )}
            {serverStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                <WifiOff className="w-3 h-3" />
                Server unreachable — check connection
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
            disabled={loading || isServerWaking}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                Authenticating...
              </>
            ) : isServerWaking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                Waiting for server...
              </>
            ) : (
              'Sign In to Admin Panel'
            )}
          </button>

          {isServerWaking && (
            <p className="text-center text-[10px] text-slate-500">
              Login will be enabled once the cloud server finishes waking up
            </p>
          )}
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
