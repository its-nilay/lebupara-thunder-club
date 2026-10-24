import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Calendar,
  Users,
  Trophy,
  History,
  Edit3,
  RotateCcw,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  Trash2,
  Settings,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getLeague,
  getMatches,
  getPlayers,
  getStandings,
  getAuditLogs,
  adminReopenMatch,
  adminPostponeMatch,
  adminUpdateTeam,
  adminResetSeason,
  adminUpdateLeague,
  adminAddNextMatch,
  adminDeleteMatch,
} from '../services/api';
import ScoreModal from '../components/ScoreModal';
import TeamConfigModal from '../components/TeamConfigModal';
import PlayerModal from '../components/PlayerModal';
import MatchDateModal from '../components/MatchDateModal';
import PlayerAvatar from '../components/PlayerAvatar';
import { formatMatchDateTime } from '../services/dateUtils';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');

  const [league, setLeague] = useState(null);
  const [leagueTotalMatches, setLeagueTotalMatches] = useState(10);
  const [leagueName, setLeagueName] = useState('');
  const [leagueSeason, setLeagueSeason] = useState('');

  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Modals state
  const [scoreModalMatch, setScoreModalMatch] = useState(null);
  const [dateModalMatch, setDateModalMatch] = useState(null);
  const [teamModalTeam, setTeamModalTeam] = useState(null);
  const [playerModalPlayer, setPlayerModalPlayer] = useState(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, stdRes, lgRes] = await Promise.all([
        getMatches(),
        getPlayers(),
        getStandings(),
        getLeague(),
      ]);
      setMatches(mRes.data || []);
      setPlayers(pRes.data || []);

      if (lgRes.data) {
        setLeague(lgRes.data);
        setLeagueTotalMatches(lgRes.data.total_matches || 10);
        setLeagueName(lgRes.data.name || '');
        setLeagueSeason(lgRes.data.season || '');
      }

      if (stdRes.data && stdRes.data.length > 0) {
        const teamList = stdRes.data.map((t) => ({
          id: t.team_id,
          name: t.team_name,
          captain_name: t.captain_name,
          color: t.color,
        }));
        setTeams(teamList);
      }

      // Load audit logs if on that tab
      try {
        const auditRes = await getAuditLogs({ page: 1, page_size: 50 });
        setAuditLogs(auditRes.data || []);
      } catch {
        // Log loading error is non-fatal
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const showNotification = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleReopen = async (matchId) => {
    if (!window.confirm('Reopen match? This will restore the match back to Scheduled so you can enter scores or reschedule.')) return;
    try {
      await adminReopenMatch(matchId);
      showNotification('Match successfully reopened back to Scheduled!');
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to reopen match');
    }
  };

  const handlePostpone = async (matchId) => {
    if (!window.confirm('Mark this match as postponed?')) return;
    try {
      await adminPostponeMatch(matchId);
      showNotification('Match marked as postponed.');
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to postpone match');
    }
  };

  const totalMatches = league?.total_matches || matches.length || 10;

  const handleUpdateLeagueSettings = async (e) => {
    e?.preventDefault();
    const parsed = parseInt(leagueTotalMatches, 10);
    if (!parsed || parsed < 1 || parsed > 100) {
      alert('Total matches must be a valid number between 1 and 100.');
      return;
    }
    try {
      await adminUpdateLeague({
        total_matches: parsed,
        name: leagueName.trim() || undefined,
        season: leagueSeason.trim() || undefined,
      });
      showNotification(`Tournament format updated! League is now set to ${parsed} matches.`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to update tournament settings');
    }
  };

  const handleAddNextMatch = async () => {
    try {
      const res = await adminAddNextMatch();
      showNotification(`Match #${res.data?.match_number || matches.length + 1} added to schedule!`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to add match');
    }
  };

  const handleDeleteMatch = async (matchId, matchNumber) => {
    if (!window.confirm(`Delete Match #${matchNumber}? This will remove this unplayed fixture from the tournament.`)) return;
    try {
      await adminDeleteMatch(matchId);
      showNotification(`Match #${matchNumber} removed from tournament.`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to delete match');
    }
  };

  const handleResetSeason = async () => {
    const confirmPrompt = window.confirm(
      `Are you sure you want to end this league series and reset for the new ${totalMatches}-match season?\n\n` +
      `• All ${totalMatches} matches will be reset back to Scheduled.\n` +
      '• Scores and goal tallies will be cleared for the fresh season.\n' +
      '• Selected captains will lead the new showdown.'
    );
    if (!confirmPrompt) return;
    try {
      await adminResetSeason();
      showNotification(`Season reset! All ${totalMatches} matches are now scheduled for the new season.`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to reset season');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center max-w-lg mx-auto">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white">Admin Login Required to Modify Data</h2>
        <p className="text-slate-300 text-sm mt-3 leading-relaxed">
          All league stats, points tables, top scorers, match scores, and squad rosters are <strong className="text-cyan-400">completely public</strong> and accessible to everyone without logging in.
        </p>
        <p className="text-slate-400 text-xs mt-2 mb-6">
          Administrator login is only required when you want to enter live match scores, correct data entry mistakes, or edit team & captain details.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition text-sm shadow-lg shadow-cyan-500/20"
          >
            Sign In as Admin
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition text-sm"
          >
            Browse Public Stats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            Control Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            ADMIN <span className="text-neon-cyan">DASHBOARD</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Signed in as <strong className="text-cyan-400">{user?.username}</strong> • Full administrative privileges
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'matches', label: 'Match Scores & Results', icon: Calendar },
          { id: 'format', label: 'Tournament Format & Matches', icon: Sliders },
          { id: 'teams', label: 'Teams & Captains Config', icon: Trophy },
          { id: 'players', label: 'Squad Players', icon: Users },
          { id: 'audit', label: 'Audit Log History', icon: History },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: MATCH SCORES & RESULTS */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
            <span>
              ⚡ <strong>Dynamic League Format:</strong> This tournament is currently configured for <strong>{totalMatches} matches</strong> ({matches.filter((m) => m.status === 'completed').length} completed). You can add more fixtures anytime or adjust total matches in the League Format tab!
            </span>
            <button
              onClick={handleAddNextMatch}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Match #{matches.length + 1}
            </button>
          </div>

          {/* MOBILE CARDS VIEW (< md screen sizes) */}
          <div className="block md:hidden space-y-3">
            {matches.map((m) => {
              const r1 = m.team_results?.[0];
              const r2 = m.team_results?.[1];
              const t1Name = r1?.team_name || teams[0]?.name || 'Team 1';
              const t2Name = r2?.team_name || teams[1]?.name || 'Team 2';

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl glass-card border transition-all ${
                    m.status === 'completed'
                      ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-slate-900/60 to-slate-950'
                      : m.status === 'postponed'
                      ? 'border-amber-500/30 bg-amber-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Top Bar: Match #, Status, Date */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg text-xs">
                        #{m.match_number}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Match {m.match_number} of {totalMatches}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        m.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : m.status === 'postponed'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  {/* Perfectly Centered Scoreboard Scoreline on Mobile */}
                  <div className="my-3 py-3 px-3 rounded-xl bg-[#030712]/80 border border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      {/* Team 1 */}
                      <div className="flex-1 text-right min-w-0 pr-1">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          {t1Name}
                        </div>
                        <div className="text-[10px] text-cyan-400 truncate">
                          Capt: {teams[0]?.captain_name || 'Suvradip'}
                        </div>
                      </div>

                      {/* Scoreline Center */}
                      <div className="flex-shrink-0 flex items-center justify-center">
                        {m.status === 'completed' ? (
                          <div className="px-3 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-base font-black text-cyan-300 tracking-wider shadow-md whitespace-nowrap">
                            {r1?.goals_scored ?? 0} - {r2?.goals_scored ?? 0}
                          </div>
                        ) : m.status === 'postponed' ? (
                          <span className="text-[10px] font-black text-amber-400 px-2 py-1 rounded bg-slate-900 border border-amber-500/30 whitespace-nowrap">
                            POSTPONED
                          </span>
                        ) : (
                          <span className="text-xs font-black text-slate-500 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 whitespace-nowrap">
                            VS
                          </span>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex-1 text-left min-w-0 pl-1">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          {t2Name}
                        </div>
                        <div className="text-[10px] text-lime-400 truncate">
                          Capt: {teams[1]?.captain_name || 'Arnab'}
                        </div>
                      </div>
                    </div>

                    {/* Date / Kickoff & Notes */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
                      <span className="font-mono text-cyan-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {formatMatchDateTime(m.match_date)}
                      </span>
                      {m.notes && <span className="italic text-slate-500 text-[10px] truncate max-w-[140px]">"{m.notes}"</span>}
                    </div>
                  </div>

                  {/* Actions on Mobile */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setScoreModalMatch(m)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.99]"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      {m.status === 'completed' ? 'Edit / Correct Score & Scorers' : 'Enter Match Result & Score'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDateModalMatch(m)}
                        title="Set or update match kickoff date and time"
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-center gap-1.5 transition"
                      >
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Date & Time
                      </button>

                      {m.status === 'completed' && (
                        <button
                          onClick={() => handleReopen(m.id)}
                          title="Reopen match as unplayed"
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-1.5 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reopen
                        </button>
                      )}

                      {m.status === 'postponed' && (
                        <button
                          onClick={() => handleReopen(m.id)}
                          title="Reopen postponed fixture back to scheduled"
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-1.5 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reopen Fixture
                        </button>
                      )}

                      {m.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handlePostpone(m.id)}
                            title="Postpone match"
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 transition"
                          >
                            Postpone
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(m.id, m.match_number)}
                            title={`Delete Match #${m.match_number}`}
                            className="p-2 rounded-xl text-rose-400 bg-rose-500/10 border border-rose-500/30 transition flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (>= md screen sizes) */}
          <div className="hidden md:block glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#050b18] text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
                    <th className="py-3 px-4 text-center">Match #</th>
                    <th className="py-3 px-4">Fixture</th>
                    <th className="py-3 px-3 text-center">Score</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                  {matches.map((m) => {
                    const r1 = m.team_results?.[0];
                    const r2 = m.team_results?.[1];

                    return (
                      <tr key={m.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3.5 px-4 text-center font-bold text-cyan-400">
                          #{m.match_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{r1?.team_name || teams[0]?.name || 'Team 1'}</span>
                            <span className="text-xs text-slate-500 font-black">vs</span>
                            <span>{r2?.team_name || teams[1]?.name || 'Team 2'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                            <span className="font-mono text-cyan-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              {formatMatchDateTime(m.match_date)}
                            </span>
                            {m.notes && <span className="italic font-normal">"{m.notes}"</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-black">
                          {m.status === 'completed' ? (
                            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-500/40 text-cyan-300">
                              {r1?.goals_scored ?? 0} - {r2?.goals_scored ?? 0}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              m.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : m.status === 'postponed'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => setDateModalMatch(m)}
                              title="Set or update match kickoff date and time"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition flex items-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              Date & Time
                            </button>

                            <button
                              onClick={() => setScoreModalMatch(m)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              {m.status === 'completed' ? 'Edit / Correct Score' : 'Enter Score'}
                            </button>

                            {/* Reopen button for completed matches */}
                            {m.status === 'completed' && (
                              <button
                                onClick={() => handleReopen(m.id)}
                                title="Reopen match as unplayed"
                                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Reopen button for wrongly postponed matches */}
                            {m.status === 'postponed' && (
                              <button
                                onClick={() => handleReopen(m.id)}
                                title="Reopen postponed fixture back to scheduled"
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reopen Fixture
                              </button>
                            )}

                            {m.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => handlePostpone(m.id)}
                                  title="Postpone match"
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
                                >
                                  Postpone
                                </button>
                                <button
                                  onClick={() => handleDeleteMatch(m.id, m.match_number)}
                                  title={`Delete Match #${m.match_number}`}
                                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TOURNAMENT FORMAT & MATCHES */}
      {activeTab === 'format' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
            ⚡ <strong>Customizable Tournament Length:</strong> Set your league to any number of matches you want (5, 8, 10, 12, 15, 20, etc.). All progress bars, hero showdown banners, points tables, and match centers across the entire website will update automatically!
          </div>

          <div className="glass-card p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-slate-900/60 to-slate-950">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black text-white">Configure Tournament Format</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Adjust the tournament length or update the league title and season identifier. When you increase the number of matches, new fixtures are automatically generated for you.
            </p>

            <form onSubmit={handleUpdateLeagueSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Total Matches Input */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    Total Matches in League
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLeagueTotalMatches((prev) => Math.max(1, Number(prev || 10) - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-cyan-400 font-black text-base flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={leagueTotalMatches}
                      onChange={(e) => setLeagueTotalMatches(e.target.value)}
                      className="w-full text-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-lg font-black text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setLeagueTotalMatches((prev) => Math.min(100, Number(prev || 10) + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-cyan-400 font-black text-base flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                    {[5, 8, 10, 12, 15, 20].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLeagueTotalMatches(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          Number(leagueTotalMatches) === preset
                            ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* League Name */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    League Name
                  </label>
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="e.g. Lebupara Thunder Club League"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Display name for the league across website banners.
                  </p>
                </div>

                {/* Season Name */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Season Identifier
                  </label>
                  <input
                    type="text"
                    value={leagueSeason}
                    onChange={(e) => setLeagueSeason(e.target.value)}
                    placeholder="e.g. Season 1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    e.g., Season 1, Winter Edition, Monsoon Cup.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Currently: <strong className="text-cyan-400">{matches.length} fixtures in database</strong> ({matches.filter((m) => m.status === 'completed').length} completed, {matches.filter((m) => m.status === 'scheduled').length} scheduled)
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddNextMatch}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-cyan-400 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    Add Next Match (#{matches.length + 1})
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Sliders className="w-4 h-4" />
                    Save Tournament Format
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Tournament Matches</div>
              <div className="text-3xl font-black text-cyan-400">{totalMatches}</div>
              <p className="text-[11px] text-slate-400 mt-1">Configured length for this showdown.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Matches Completed</div>
              <div className="text-3xl font-black text-emerald-400">
                {matches.filter((m) => m.status === 'completed').length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Official results logged in table.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Remaining Fixtures</div>
              <div className="text-3xl font-black text-amber-400">
                {Math.max(0, totalMatches - matches.filter((m) => m.status === 'completed').length)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">To be played until champion crowned.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS & CAPTAINS CONFIG (Dynamic for Next Season) */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-lime-500/10 border border-lime-500/20 text-xs text-lime-300">
            🌱 <strong>Teams & Captains Management:</strong> Manage team names, colours, and assign captains directly from your registered club squad roster. All points tables, scorer leaderboards, and match cards adapt automatically!
          </div>

          {/* Team Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, idx) => (
              <div
                key={team.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Team #{idx + 1}
                    </span>
                    <button
                      onClick={() => setTeamModalTeam(team)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Team Details
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl"
                      style={{
                        backgroundColor: `${team.color || '#00e5ff'}20`,
                        border: `2px solid ${team.color || '#00e5ff'}`,
                        color: team.color || '#00e5ff',
                      }}
                    >
                      {team.captain_name?.slice(0, 2).toUpperCase() || 'FC'}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{team.name}</h3>
                      <div className="text-sm text-cyan-400 font-semibold mt-0.5">
                        Captain: {team.captain_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Color: {team.color || '#00e5ff'}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setTeamModalTeam(team)}
                    className="text-xs text-cyan-400 font-bold hover:underline"
                  >
                    Change Name / Captain for Next Season →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Season End / Manual Reset Card */}
          <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/20 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <RotateCcw className="w-4 h-4" />
                End Season / Start Next {totalMatches}-Match Edition
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                When all {totalMatches} matches are completed or if you want to manually start a new season, click here. This resets all {totalMatches} fixtures back to Scheduled and clears previous scores for the selected captains.
              </p>
            </div>
            <button
              onClick={handleResetSeason}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 whitespace-nowrap transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All {totalMatches} Fixtures for New Season
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SQUAD PLAYERS */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Club Player Pool: {players.length} total (
              <span className="text-emerald-400 font-bold">
                {players.filter((p) => p.is_active).length} Active
              </span>
              ,{' '}
              <span className="text-rose-400 font-bold">
                {players.filter((p) => !p.is_active).length} Inactive/Injured
              </span>
              )
            </span>
            <button
              onClick={() => {
                setPlayerModalPlayer(null);
                setPlayerModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Club Player
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#050b18] text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
                    <th className="py-3 px-4">Player Name</th>
                    <th className="py-3 px-4">Availability / Injury Reason</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                  {players.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar
                            photoUrl={p.photo_url}
                            name={p.name}
                            size="sm"
                            shape="rounded-xl"
                            className="flex-shrink-0"
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {p.is_active ? (
                          <span className="text-emerald-400">● Available for selection</span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            🩹 {p.status_note || 'Inactive / Injured'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Injured/Out'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setPlayerModalPlayer(p);
                            setPlayerModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/10 font-bold border border-cyan-500/30 transition flex items-center gap-1.5 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit / Photo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#050b18] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Resource</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-white">{log.username || 'System'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-semibold">{log.resource_type} #{log.resource_id}</td>
                      <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs font-mono text-[11px]">
                        {log.after_value || '—'}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {dateModalMatch && (
        <MatchDateModal
          isOpen={Boolean(dateModalMatch)}
          match={dateModalMatch}
          totalMatches={totalMatches}
          onClose={() => setDateModalMatch(null)}
          onSuccess={() => {
            showNotification('Match date & time updated successfully!');
            fetchData();
          }}
        />
      )}

      {scoreModalMatch && (
        <ScoreModal
          isOpen={Boolean(scoreModalMatch)}
          match={scoreModalMatch}
          totalMatches={totalMatches}
          teams={teams}
          players={players}
          onClose={() => setScoreModalMatch(null)}
          onSuccess={() => {
            showNotification('Match result saved and points table recalculated!');
            fetchData();
          }}
        />
      )}

      {teamModalTeam && (
        <TeamConfigModal
          isOpen={Boolean(teamModalTeam)}
          team={teamModalTeam}
          players={players}
          onClose={() => setTeamModalTeam(null)}
          onSuccess={() => {
            showNotification('Team configuration updated successfully!');
            fetchData();
          }}
        />
      )}

      {playerModalOpen && (
        <PlayerModal
          isOpen={playerModalOpen}
          player={playerModalPlayer}
          teams={teams}
          onClose={() => setPlayerModalOpen(false)}
          onSuccess={() => {
            showNotification('Player saved successfully!');
            fetchData();
          }}
        />
      )}
    </div>
  );
}
