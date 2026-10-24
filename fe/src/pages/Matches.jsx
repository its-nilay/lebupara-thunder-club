import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Edit3,
  RefreshCw,
  Award,
  Lock,
} from 'lucide-react';
import { getMatches, getPlayers, getLeague, adminPostponeMatch, adminReopenMatch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScoreModal from '../components/ScoreModal';
import MatchDateModal from '../components/MatchDateModal';
import { formatMatchDateTime } from '../services/dateUtils';

export default function Matches() {
  const { isAdmin } = useAuth();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Modal state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateModalMatch, setDateModalMatch] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, lRes] = await Promise.all([
        getMatches(),
        getPlayers(),
        getLeague(),
      ]);
      setMatches(mRes.data || []);
      setPlayers(pRes.data || []);
      setLeague(lRes.data || null);

      // Extract unique teams from players
      const teamMap = new Map();
      pRes.data?.forEach((p) => {
        if (p.team && !teamMap.has(p.team.id)) {
          teamMap.set(p.team.id, p.team);
        }
      });
      if (teamMap.size > 0) {
        setTeams(Array.from(teamMap.values()));
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenScoreModal = (match) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  const handlePostpone = async (matchId) => {
    if (!window.confirm('Postpone this match?')) return;
    try {
      await adminPostponeMatch(matchId);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to postpone match');
    }
  };

  const handleReopen = async (matchId) => {
    if (!window.confirm('Reopen this match back to Scheduled?')) return;
    try {
      await adminReopenMatch(matchId);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to reopen match');
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === 'COMPLETED') return m.status === 'completed';
    if (filter === 'SCHEDULED') return m.status === 'scheduled';
    if (filter === 'POSTPONED') return m.status === 'postponed';
    return true;
  });

  const totalMatches = league?.total_matches || matches.length || 10;
  const completedCount = matches.filter((m) => m.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            Tournament Schedule
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            MATCH <span className="text-neon-cyan">CENTER</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalMatches} Official Fixtures • {completedCount} Completed • {Math.max(0, totalMatches - completedCount)} Remaining
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Fixtures
        </button>
      </div>

      {/* Public vs Admin access notice */}
      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Public Match Center:</strong> Everyone can view full match scores, goals, and upcoming dates without logging in.
            {!isAdmin && ' To enter or modify match scores, log in with an administrator account.'}
          </span>
        </div>
        {!isAdmin && (
          <Link
            to="/login"
            className="self-start sm:self-auto font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 flex-shrink-0"
          >
            <Lock className="w-3.5 h-3.5" /> Login to Edit Data →
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'ALL', label: `All Fixtures (${matches.length})` },
          { id: 'COMPLETED', label: `Completed (${completedCount})` },
          { id: 'SCHEDULED', label: `Scheduled (${matches.filter((m) => m.status === 'scheduled').length})` },
          { id: 'POSTPONED', label: `Postponed (${matches.filter((m) => m.status === 'postponed').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filter === tab.id
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="space-y-4">
        {filteredMatches.map((match) => {
          const t1Result = match.team_results?.[0];
          const t2Result = match.team_results?.[1];

          // Identify scorers by team receiving the score (including own goals credited to that side)
          const t1Scorers =
            match.goal_records?.filter((g) => g.team_id === t1Result?.team_id) || [];
          const t2Scorers =
            match.goal_records?.filter((g) => g.team_id === t2Result?.team_id) || [];

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 sm:p-6 rounded-2xl glass-card border transition-all ${
                match.status === 'completed'
                  ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/10 via-slate-900/60 to-transparent'
                  : match.status === 'postponed'
                  ? 'border-amber-500/30 bg-amber-950/10'
                  : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Match Header Info */}
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-cyan-400 text-sm">
                    #{match.match_number}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Match {match.match_number} of {totalMatches}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          match.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : match.status === 'postponed'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      {isAdmin ? (
                        <button
                          onClick={() => setDateModalMatch(match)}
                          title="Click to edit match date & kickoff time"
                          className="hover:text-cyan-300 font-mono text-left cursor-pointer transition flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40"
                        >
                          <span className="text-slate-200">{formatMatchDateTime(match.match_date)}</span>
                          <span className="text-[10px] text-cyan-400 uppercase font-sans font-bold">✎ Date/Time</span>
                        </button>
                      ) : (
                        <span className="font-mono text-slate-300">{formatMatchDateTime(match.match_date)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scoreboard */}
                <div className="flex-1 max-w-xl mx-auto w-full bg-[#030712]/70 p-3 sm:p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 text-center">
                    {/* Team 1 */}
                    <div className="flex-1 text-right min-w-0 pr-1 sm:pr-3">
                      <div className="font-bold text-xs sm:text-base text-white truncate">
                        {t1Result?.team_name || teams[0]?.name || 'Team 1'}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-cyan-400 truncate">
                        Capt: {teams[0]?.captain_name || 'Suvradip'}
                      </div>
                    </div>

                    {/* Score / VS */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                      {match.status === 'completed' ? (
                        <div className="px-2.5 sm:px-3 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-base sm:text-xl font-black text-cyan-300 tracking-wider whitespace-nowrap shadow-sm">
                          {t1Result?.goals_scored ?? 0} - {t2Result?.goals_scored ?? 0}
                        </div>
                      ) : (
                        <span className="text-xs font-black text-slate-500 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 whitespace-nowrap">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex-1 text-left min-w-0 pl-1 sm:pl-3">
                      <div className="font-bold text-xs sm:text-base text-white truncate">
                        {t2Result?.team_name || teams[1]?.name || 'Team 2'}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-lime-400 truncate">
                        Capt: {teams[1]?.captain_name || 'Arnab'}
                      </div>
                    </div>
                  </div>

                  {/* Goal Scorers list if completed */}
                  {match.status === 'completed' && match.goal_records && match.goal_records.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 text-xs text-slate-400">
                      <div className="text-right pr-3 space-y-0.5">
                        {t1Scorers.map((g, i) => (
                          <div key={i} className="flex items-center justify-end gap-1">
                            <span>{g.player_name}</span>
                            <span className="text-yellow-400 font-bold">⚽ {g.goals > 1 ? `x${g.goals}` : ''}</span>
                            {g.is_own_goal && <span className="text-rose-400 text-[10px]">(OG)</span>}
                          </div>
                        ))}
                      </div>
                      <div className="text-left pl-3 space-y-0.5 border-l border-slate-800">
                        {t2Scorers.map((g, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="text-yellow-400 font-bold">⚽ {g.goals > 1 ? `x${g.goals}` : ''}</span>
                            <span>{g.player_name}</span>
                            {g.is_own_goal && <span className="text-rose-400 text-[10px]">(OG)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.notes && (
                    <div className="mt-2 text-center text-xs text-slate-500 italic">
                      "{match.notes}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="w-full lg:w-auto flex items-center gap-2 justify-stretch sm:justify-end flex-wrap">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => setDateModalMatch(match)}
                        title="Set or update match kickoff date and time"
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Date & Time
                      </button>

                      <button
                        onClick={() => handleOpenScoreModal(match)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {match.status === 'completed' ? 'Edit / Correct Score' : 'Enter Result'}
                      </button>

                      {/* Reopen button for wrongly postponed matches */}
                      {match.status === 'postponed' && (
                        <button
                          onClick={() => handleReopen(match.id)}
                          title="Reopen postponed fixture back to scheduled"
                          className="px-3 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reopen Fixture
                        </button>
                      )}

                      {/* Reopen button for completed matches */}
                      {match.status === 'completed' && (
                        <button
                          onClick={() => handleReopen(match.id)}
                          title="Reopen match as unplayed"
                          className="px-3 py-2 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reopen
                        </button>
                      )}

                      {/* Postpone button for scheduled matches */}
                      {match.status === 'scheduled' && (
                        <button
                          onClick={() => handlePostpone(match.id)}
                          title="Postpone match"
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition flex items-center gap-1.5"
                        >
                          Postpone
                        </button>
                      )}
                    </>
                  ) : match.status === 'scheduled' ? (
                    <Link
                      to="/login"
                      className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
                      title="Admin login required to enter match results"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Enter Result (Admin)</span>
                    </Link>
                  ) : match.status === 'postponed' ? (
                    <span className="text-xs text-amber-400/80 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-medium">
                      Postponed
                    </span>
                  ) : (
                    <Link
                      to="/login"
                      className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
                      title="Admin login required to correct scores"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Edit Result (Admin)</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Match Date Modal */}
      {dateModalMatch && (
        <MatchDateModal
          isOpen={Boolean(dateModalMatch)}
          match={dateModalMatch}
          totalMatches={totalMatches}
          onClose={() => setDateModalMatch(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Score Modal */}
      {selectedMatch && (
        <ScoreModal
          isOpen={modalOpen}
          match={selectedMatch}
          teams={teams}
          players={players}
          totalMatches={totalMatches}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
