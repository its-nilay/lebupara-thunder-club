import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Check, AlertCircle } from 'lucide-react';
import { adminUpdateTeam } from '../services/api';

export default function TeamConfigModal({ team, players = [], isOpen, onClose, onSuccess }) {
  if (!isOpen || !team) return null;

  const [name, setName] = useState(team.name || '');
  const [captainName, setCaptainName] = useState(team.captain_name || '');
  const [color, setColor] = useState(team.color || '#00e5ff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !captainName.trim()) {
      setError('Team name and captain name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminUpdateTeam(team.id, {
        name: name.trim(),
        captain_name: captainName.trim(),
        color,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to update team details');
    } finally {
      setLoading(false);
    }
  };

  const presetColors = ['#00e5ff', '#76ff03', '#ffd700', '#ff3d71', '#a855f7', '#ff9100', '#00b0ff'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-[#0a1428] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-slate-100"
        >
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Edit Team & Captain</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Team Name (e.g. For New Season)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team Name"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Captain Selection</span>
                <span className="text-[10px] text-cyan-400 font-bold uppercase">From Squad Roster</span>
              </label>

              <select
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="">-- Choose Captain from Player Roster --</option>
                {captainName && !players.some((p) => p.name.trim().toLowerCase() === captainName.trim().toLowerCase()) && (
                  <option value={captainName}>{captainName} (Current)</option>
                )}
                {players.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} {p.is_active ? '⚡ (Active)' : '🤕 (Injured/Inactive)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Team Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    >
                      {color.toLowerCase() === c.toLowerCase() && <Check className="w-3.5 h-3.5 text-black" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: `${color}20`,
                  border: `2px solid ${color}`,
                  color: color,
                }}
              >
                {captainName?.slice(0, 2).toUpperCase() || 'FC'}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{name || 'Unnamed Team'}</div>
                <div className="text-xs text-slate-400">Captain: {captainName || 'None'}</div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
