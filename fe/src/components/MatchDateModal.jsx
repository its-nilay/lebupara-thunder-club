import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle, Sparkles, RotateCcw } from 'lucide-react';
import { adminUpdateMatch } from '../services/api';
import { formatMatchDateTime, toDateTimeLocal, fromDateTimeLocal } from '../services/dateUtils';

export default function MatchDateModal({ match, totalMatches, isOpen, onClose, onSuccess }) {
  if (!isOpen || !match) return null;

  const [dateValue, setDateValue] = useState(toDateTimeLocal(match.match_date));
  const [notes, setNotes] = useState(match.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDateValue(toDateTimeLocal(match.match_date));
    setNotes(match.notes || '');
    setError(null);
  }, [match]);

  const handleSave = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cleanDate = fromDateTimeLocal(dateValue);
      await adminUpdateMatch(match.id, {
        match_date: cleanDate,
        notes: notes ? notes.trim() : null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let msg = 'Failed to update match schedule';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date YYYY-MM-DD
  const pad = (n) => String(n).padStart(2, '0');
  const formatDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Quick Date Presets
  const applyDatePreset = (daysFromToday, forceSunday = false) => {
    const d = new Date();
    if (forceSunday) {
      const day = d.getDay();
      const diff = day === 0 ? 7 : (7 - day); // next Sunday
      d.setDate(d.getDate() + diff);
    } else {
      d.setDate(d.getDate() + daysFromToday);
    }
    const datePart = formatDateStr(d);
    const existingTime = dateValue && dateValue.includes('T') ? dateValue.split('T')[1] : '07:00';
    setDateValue(`${datePart}T${existingTime}`);
  };

  // Quick Time Presets
  const applyTimePreset = (timeStr) => {
    let datePart;
    if (dateValue && dateValue.includes('T')) {
      datePart = dateValue.split('T')[0];
    } else {
      datePart = formatDateStr(new Date());
    }
    setDateValue(`${datePart}T${timeStr}`);
  };

  const t1 = match.team_results?.[0]?.team_name || 'Team 1';
  const t2 = match.team_results?.[1]?.team_name || 'Team 2';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[#0a1428] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/10">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Match #{match.match_number} {totalMatches ? `of ${totalMatches}` : ''} Kickoff</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {match.status}
                  </span>
                </h2>
                <div className="text-xs text-slate-400">{t1} vs {t2}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {/* Input with Webpage Theme */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Clock className="w-3.5 h-3.5" />
                  Kickoff Date & Time
                </span>
                {dateValue && (
                  <button
                    type="button"
                    onClick={() => setDateValue('')}
                    className="text-[11px] text-rose-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear / Unschedule
                  </button>
                )}
              </label>

              <div className="relative">
                <input
                  type="datetime-local"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="w-full bg-[#050b18] border border-cyan-500/40 rounded-xl px-4 py-3 text-base text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono transition shadow-inner"
                />
              </div>
            </div>

            {/* Quick Webpage-Themed Date Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                Quick Date Selection
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyDatePreset(0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(1)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(0, true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Next Sunday
                </button>
              </div>
            </div>

            {/* Quick Webpage-Themed Time Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Quick Match Kickoff Times
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '07:00 AM', time: '07:00', icon: '☀️' },
                  { label: '08:00 AM', time: '08:00', icon: '🌅' },
                  { label: '04:30 PM', time: '16:30', icon: '🌇' },
                  { label: '06:00 PM', time: '18:00', icon: '🌙' },
                ].map(({ label, time, icon }) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => applyTimePreset(time)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#050b18] border border-slate-800 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition flex items-center justify-center gap-1"
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Match Notes / Subtitle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Match Notes / Subtitle (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning 7 AM derby fixture"
                className="w-full bg-[#050b18] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Live Webpage Themed Display Preview */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 via-slate-950 to-slate-950 border border-cyan-500/20 text-xs flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Website Display Format:
              </span>
              <span className="font-bold text-cyan-300 font-mono tracking-wide">
                {dateValue ? formatMatchDateTime(fromDateTimeLocal(dateValue)) : 'Date to be scheduled'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-black bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                <Clock className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Date & Time'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
