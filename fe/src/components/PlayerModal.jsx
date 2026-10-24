import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserCheck, AlertCircle, Activity, Bandage } from 'lucide-react';
import { adminCreatePlayer, adminUpdatePlayer } from '../services/api';

export default function PlayerModal({ player, teams, isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const isEditing = Boolean(player);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [statusNote, setStatusNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (player) {
      setName(player.name || '');
      setIsActive(player.is_active ?? true);
      setStatusNote(player.status_note || '');
    } else {
      setName('');
      setIsActive(true);
      setStatusNote('');
    }
    setError(null);
  }, [player]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Player name is required');
      return;
    }
    setLoading(true);
    setError(null);

    const defaultTeamId = player?.team_id || teams?.[0]?.id || 1;

    const payload = {
      name: name.trim(),
      team_id: defaultTeamId,
      is_active: isActive,
      status_note: statusNote.trim() || null,
    };

    try {
      if (isEditing) {
        await adminUpdatePlayer(player.id, payload);
      } else {
        await adminCreatePlayer(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to save player');
    } finally {
      setLoading(false);
    }
  };

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
              {isEditing ? (
                <UserCheck className="w-5 h-5 text-cyan-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-cyan-400" />
              )}
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Edit Club Player' : 'Add New Club Player'}
              </h2>
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Player Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suvradip, Arnab, Nilay..."
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>


            {/* Active vs Inactive Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Player Match Availability
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsActive(true);
                    setStatusNote('');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Active / Fit
                </button>

                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    !isActive
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 ring-1 ring-rose-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Bandage className="w-4 h-4" />
                  Inactive / Injured
                </button>
              </div>
            </div>

            {/* If Inactive, show Reason input */}
            {!isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-1"
              >
                <label className="block text-xs font-semibold text-rose-300 mb-1">
                  Reason for Inactivity (Injury / Absence)
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Hamstring strain, Ankle injury, Out of station"
                  className="w-full bg-slate-900 border border-rose-500/40 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-400"
                />
              </motion.div>
            )}

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
                {loading ? 'Saving...' : isEditing ? 'Update Player' : 'Add Player'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
