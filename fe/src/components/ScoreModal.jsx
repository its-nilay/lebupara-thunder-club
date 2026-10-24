import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Plus, Trash2, Zap, RotateCcw, Calendar, Clock } from 'lucide-react';
import { adminCompleteMatch, adminReopenMatch, adminUpdateMatch } from '../services/api';

import { formatMatchDateTime, toDateTimeLocal, fromDateTimeLocal } from '../services/dateUtils';

export default function ScoreModal({ match, teams, players, totalMatches, isOpen, onClose, onSuccess }) {
  if (!isOpen || !match) return null;

  const team1 = teams?.[0] || { id: 1, name: 'Team Suvradip', captain_name: 'Suvradip' };
  const team2 = teams?.[1] || { id: 2, name: 'Team Arnab', captain_name: 'Arnab' };

  // Existing results if available
  const existingT1Result = match.team_results?.find((r) => r.team_id === team1.id);
  const existingT2Result = match.team_results?.find((r) => r.team_id === team2.id);

  const [t1Score, setT1Score] = useState(existingT1Result ? existingT1Result.goals_scored : 0);
  const [t2Score, setT2Score] = useState(existingT2Result ? existingT2Result.goals_scored : 0);
  const [matchDate, setMatchDate] = useState(toDateTimeLocal(match.match_date));
  const [notes, setNotes] = useState(match.notes || '');
  const [goalScorers, setGoalScorers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize existing goal records
  useEffect(() => {
    if (match.goal_records && match.goal_records.length > 0) {
      setGoalScorers(
        match.goal_records.map((gr) => ({
          player_id: gr.player_id,
          team_id: gr.team_id || team1.id,
          goals: gr.goals,
          is_own_goal: gr.is_own_goal || false,
        }))
      );
    } else {
      setGoalScorers([]);
    }
    if (existingT1Result) setT1Score(existingT1Result.goals_scored);
    if (existingT2Result) setT2Score(existingT2Result.goals_scored);
    setMatchDate(toDateTimeLocal(match.match_date));
    setNotes(match.notes || '');
    setError(null);
  }, [match]);

  // Derived match outcome preview
  const getOutcomePreview = () => {
    const s1 = parseInt(t1Score, 10) || 0;
    const s2 = parseInt(t2Score, 10) || 0;
    if (s1 > s2) {
      return {
        winner: team1.name,
        badge: 'WIN / LOSS',
        t1Text: `${team1.name} (Capt: ${team1.captain_name}): WIN (+3 pts)`,
        t2Text: `${team2.name} (Capt: ${team2.captain_name}): LOSS (0 pts)`,
        color: '#00e5ff',
      };
    } else if (s2 > s1) {
      return {
        winner: team2.name,
        badge: 'WIN / LOSS',
        t1Text: `${team1.name} (Capt: ${team1.captain_name}): LOSS (0 pts)`,
        t2Text: `${team2.name} (Capt: ${team2.captain_name}): WIN (+3 pts)`,
        color: '#76ff03',
      };
    } else {
      return {
        winner: 'Draw',
        badge: 'DRAW',
        t1Text: `${team1.name}: DRAW (+1 pt)`,
        t2Text: `${team2.name}: DRAW (+1 pt)`,
        color: '#ffd700',
      };
    }
  };

  const outcome = getOutcomePreview();

  // Sort club players for easy selection
  const sortedPlayers = [...(players || [])].sort((a, b) => a.name.localeCompare(b.name));

  const addScorerRow = (teamId) => {
    if (sortedPlayers.length === 0) return;
    setGoalScorers([
      ...goalScorers,
      {
        player_id: sortedPlayers[0].id,
        team_id: teamId,
        goals: 1,
        is_own_goal: false,
      },
    ]);
  };

  const removeScorerRow = (index) => {
    setGoalScorers(goalScorers.filter((_, i) => i !== index));
  };

  const updateScorerRow = (index, field, value) => {
    const updated = [...goalScorers];
    updated[index] = { ...updated[index], [field]: value };
    setGoalScorers(updated);
  };

  // Check goal totals reconciliation
  const s1 = parseInt(t1Score, 10) || 0;
  const s2 = parseInt(t2Score, 10) || 0;

  const t1GoalsRecorded = goalScorers.reduce((sum, g) => {
    const gid = parseInt(g.team_id, 10);
    if (gid === team1.id) return sum + (parseInt(g.goals, 10) || 0);
    return sum;
  }, 0);

  const t2GoalsRecorded = goalScorers.reduce((sum, g) => {
    const gid = parseInt(g.team_id, 10);
    if (gid === team2.id) return sum + (parseInt(g.goals, 10) || 0);
    return sum;
  }, 0);

  const hasScorerMismatch =
    goalScorers.length > 0 && (t1GoalsRecorded !== s1 || t2GoalsRecorded !== s2);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // If match is already completed, reopen it first to allow editing
      if (match.status === 'completed') {
        try {
          await adminReopenMatch(match.id);
        } catch {
          // If reopen endpoint fails because it wasn't completed, ignore
        }
      }

      // Complete match with scores, goal records, date & time, and notes
      const payload = {
        team1_id: team1.id,
        team1_goals: s1,
        team2_id: team2.id,
        team2_goals: s2,
        match_date: fromDateTimeLocal(matchDate),
        notes: notes.trim() || null,
        goal_records: goalScorers.map((g) => ({
          player_id: parseInt(g.player_id, 10),
          team_id: parseInt(g.team_id, 10),
          goals: parseInt(g.goals, 10),
          is_own_goal: Boolean(g.is_own_goal),
        })),
      };

      await adminCompleteMatch(match.id, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let msg = 'Failed to save match result';
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

  const handleSaveDateOnly = async () => {
    setLoading(true);
    setError(null);
    try {
      await adminUpdateMatch(match.id, {
        match_date: fromDateTimeLocal(matchDate),
        notes: notes.trim() || null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let msg = 'Failed to update date & time';
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

  const handleReopenOnly = async () => {
    if (!window.confirm('Reopen this match? This will change status back to scheduled and allow modifications.')) return;
    setLoading(true);
    setError(null);
    try {
      await adminReopenMatch(match.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to reopen match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a1428] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Match {match.match_number} of {totalMatches || 10}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    match.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {match.status}
                </span>
              </div>
              <h2 className="text-xl font-black mt-1 text-white">
                {match.status === 'completed' ? 'Edit / Correct Match Result' : 'Enter Match Result'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Scoreboard Inputs */}
          <div className="mt-6 bg-[#040914] p-5 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-4 text-center">
              {/* Team 1 */}
              <div className="sm:col-span-2 flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-lg"
                  style={{
                    backgroundColor: `${team1.color || '#00e5ff'}20`,
                    border: `2px solid ${team1.color || '#00e5ff'}`,
                    color: team1.color || '#00e5ff',
                  }}
                >
                  {team1.captain_name?.slice(0, 2).toUpperCase() || 'T1'}
                </div>
                <span className="font-bold text-base text-white">{team1.name}</span>
                <span className="text-xs text-cyan-400 font-semibold">Capt: {team1.captain_name}</span>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setT1Score(Math.max(0, s1 - 1))}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={t1Score}
                    onChange={(e) => setT1Score(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 h-12 text-center text-2xl font-black rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-400 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setT1Score(s1 + 1)}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* VS Divider */}
              <div className="sm:col-span-1 flex flex-col items-center justify-center py-2">
                <span className="text-xl font-black text-slate-500">VS</span>
                <span className="text-xs text-slate-500 uppercase mt-1 font-semibold">Matchday</span>
              </div>

              {/* Team 2 */}
              <div className="sm:col-span-2 flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-lg"
                  style={{
                    backgroundColor: `${team2.color || '#76ff03'}20`,
                    border: `2px solid ${team2.color || '#76ff03'}`,
                    color: team2.color || '#76ff03',
                  }}
                >
                  {team2.captain_name?.slice(0, 2).toUpperCase() || 'T2'}
                </div>
                <span className="font-bold text-base text-white">{team2.name}</span>
                <span className="text-xs text-lime-400 font-semibold">Capt: {team2.captain_name}</span>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setT2Score(Math.max(0, s2 - 1))}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={t2Score}
                    onChange={(e) => setT2Score(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 h-12 text-center text-2xl font-black rounded-lg bg-slate-900 border border-lime-500/40 text-lime-400 focus:outline-none focus:border-lime-400"
                  />
                  <button
                    type="button"
                    onClick={() => setT2Score(s2 + 1)}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Live outcome banner */}
            <div
              className="mt-5 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm font-semibold border"
              style={{
                backgroundColor: `${outcome.color}10`,
                borderColor: `${outcome.color}40`,
                color: outcome.color,
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Auto Outcome:</span>
              </div>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <span>{outcome.t1Text}</span>
                <span>•</span>
                <span>{outcome.t2Text}</span>
              </div>
            </div>
          </div>

          {/* Goal Scorers Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Goal Scorers (Golden Boot Tracking)</h3>
                <p className="text-xs text-slate-400">
                  Select which club member scored for Captain {team1.captain_name} or Captain {team2.captain_name} today.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addScorerRow(team1.id)}
                  className="text-xs px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" /> +{team1.captain_name} Goal
                </button>
                <button
                  type="button"
                  onClick={() => addScorerRow(team2.id)}
                  className="text-xs px-2.5 py-1 rounded bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/30 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" /> +{team2.captain_name} Goal
                </button>
              </div>
            </div>

            {goalScorers.length === 0 ? (
              <div className="p-3 text-center rounded-lg bg-slate-900/50 border border-dashed border-slate-800 text-xs text-slate-500">
                No goal records added yet. Click above to attribute goals to players for the Golden Boot table.
              </div>
            ) : (
              <div className="space-y-2 mt-3">
                {goalScorers.map((scorer, idx) => {
                  const isForT1 = parseInt(scorer.team_id, 10) === team1.id;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex-wrap sm:flex-nowrap"
                    >
                      {/* Team side toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          updateScorerRow(idx, 'team_id', isForT1 ? team2.id : team1.id)
                        }
                        className={`px-2 py-1 rounded font-bold text-[10px] uppercase border transition ${
                          isForT1
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'bg-lime-500/10 text-lime-400 border-lime-500/30'
                        }`}
                        title="Click to toggle which team this player scored for today"
                      >
                        {isForT1 ? `Side: ${team1.captain_name}` : `Side: ${team2.captain_name}`}
                      </button>

                      {/* Player Select */}
                      <select
                        value={scorer.player_id}
                        onChange={(e) => updateScorerRow(idx, 'player_id', parseInt(e.target.value, 10))}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 min-w-[140px]"
                      >
                        {sortedPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {!p.is_active ? '(Inactive)' : ''}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Goals:</span>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={scorer.goals}
                          onChange={(e) => updateScorerRow(idx, 'goals', parseInt(e.target.value, 10) || 1)}
                          className="w-12 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-center text-slate-200"
                        />
                      </div>

                      <label className="flex items-center gap-1 text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scorer.is_own_goal}
                          onChange={(e) => updateScorerRow(idx, 'is_own_goal', e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                        />
                        <span>Own Goal</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeScorerRow(idx)}
                        className="p-1 rounded text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {hasScorerMismatch && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
                    <span>
                      ⚠️ Notice: Goals assigned ({t1GoalsRecorded} - {t2GoalsRecorded}) must equal match score (
                      {s1} - {s2}) if individual scorers are added.
                    </span>
                    <button
                      type="button"
                      onClick={() => setGoalScorers([])}
                      className="underline font-bold text-amber-300 ml-2"
                    >
                      Clear Scorers
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kickoff Date & Time + Notes Section */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#050c18] p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Calendar className="w-3.5 h-3.5" /> Kickoff Date & Time
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {match.status} match
                </span>
              </label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="text-[11px] text-cyan-300 mt-1 font-mono">
                {matchDate ? formatMatchDateTime(fromDateTimeLocal(matchDate)) : 'Date to be scheduled'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Match Notes / Subtitle
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 7 AM Derby • Exciting clash"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Optional note displayed in match cards and admin logs.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {match.status === 'completed' && (
                <button
                  type="button"
                  onClick={handleReopenOnly}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reopen As Unplayed
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveDateOnly}
                disabled={loading}
                title="Save updated kickoff date, time, and notes without re-saving scores"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-700 hover:border-cyan-500/40 flex items-center gap-1.5 transition"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Save Date & Time Only
              </button>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || (goalScorers.length > 0 && hasScorerMismatch)}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? 'Saving...' : match.status === 'completed' ? 'Update & Recalculate' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
