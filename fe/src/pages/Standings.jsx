import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Shield,
  HelpCircle,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { getStandings, getLeague, getMatches } from '../services/api';
import { Link } from 'react-router-dom';

export default function Standings() {
  const [standings, setStandings] = useState([]);
  const [league, setLeague] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stdRes, lgRes, mtRes] = await Promise.all([
        getStandings(),
        getLeague(),
        getMatches(),
      ]);
      setStandings(stdRes.data || []);
      setLeague(lgRes.data);
      setMatches(mtRes.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load points table. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalMatches = league?.total_matches || 10;
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const matchesPlayed = completedMatches.length;
  const matchesRemaining = Math.max(0, totalMatches - matchesPlayed);
  const maxPointsAvailable = matchesRemaining * 3;

  // Calculate form guides for each team (last 5 completed matches)
  const getTeamForm = (teamId) => {
    return completedMatches
      .map((m) => {
        const tResult = m.team_results?.find((r) => r.team_id === teamId);
        const oppResult = m.team_results?.find((r) => r.team_id !== teamId);
        if (!tResult || !oppResult) return null;
        if (tResult.goals_scored > oppResult.goals_scored) return 'W';
        if (tResult.goals_scored < oppResult.goals_scored) return 'L';
        return 'D';
      })
      .filter(Boolean)
      .slice(-5);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            Official Points Table
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            LEAGUE <span className="text-neon-cyan">STANDINGS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {league?.name || '⚡ Lebupara Thunder Club League ⚡'} • {league?.season || 'Season 1'} ({totalMatches} Fixtures)
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Standings
        </button>
      </div>

      {/* Rules Explanatory Card */}
      <div className="p-5 rounded-2xl glass-card border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-lime-950/30">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Points Allocation & Championship Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-300 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  3
                </span>
                <span>
                  <strong>Win = 3 Points</strong> (Winner takes all)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center font-bold">
                  1
                </span>
                <span>
                  <strong>Draw = 1 Point</strong> (Points shared equally)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                  0
                </span>
                <span>
                  <strong>Loss = 0 Points</strong> (Defeat awards no points)
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-2">
              * Whenever a match score is entered or updated in Admin, outcomes for both teams and points table positions are recalculated automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="glass-card overflow-hidden rounded-2xl border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#050b18] text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
                <th className="py-4 px-4 text-center w-14">POS</th>
                <th className="py-4 px-4 min-w-[200px]">TEAM & CAPTAIN</th>
                <th className="py-4 px-3 text-center" title="Matches Played">
                  MP
                </th>
                <th className="py-4 px-3 text-center text-emerald-400" title="Wins">
                  W
                </th>
                <th className="py-4 px-3 text-center text-yellow-400" title="Draws">
                  D
                </th>
                <th className="py-4 px-3 text-center text-rose-400" title="Losses">
                  L
                </th>
                <th className="py-4 px-3 text-center text-slate-300" title="Goals Scored (For)">
                  GF
                </th>
                <th className="py-4 px-3 text-center text-slate-300" title="Goals Conceded (Against)">
                  GA
                </th>
                <th className="py-4 px-3 text-center font-bold" title="Goal Difference (GF - GA)">
                  GD
                </th>
                <th className="py-4 px-4 text-center min-w-[100px]" title="Form Guide (Last 5)">
                  FORM
                </th>
                <th className="py-4 px-5 text-right font-black text-cyan-400 text-base" title="Points">
                  PTS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {standings.map((team, idx) => {
                const form = getTeamForm(team.team_id);
                const isLeader = team.position === 1;

                return (
                  <tr
                    key={team.team_id}
                    className={`transition-colors ${
                      isLeader ? 'bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Position */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            isLeader
                              ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/30 ring-2 ring-yellow-400/50'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {team.position}
                        </span>
                      </div>
                    </td>

                    {/* Team & Captain */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md"
                          style={{
                            backgroundColor: `${team.color || '#00e5ff'}20`,
                            border: `2px solid ${team.color || '#00e5ff'}`,
                            color: team.color || '#00e5ff',
                          }}
                        >
                          {team.captain_name?.slice(0, 2).toUpperCase() || 'FC'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-base flex items-center gap-2">
                            <span>{team.team_name}</span>
                            {isLeader && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-yellow-400/20 text-yellow-400 border border-yellow-400/40">
                                👑 1st Place
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Captain: <span className="text-slate-200 font-semibold">{team.captain_name}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="py-4 px-3 text-center text-slate-300 font-semibold">{team.mp}</td>
                    <td className="py-4 px-3 text-center text-emerald-400 font-bold">{team.w}</td>
                    <td className="py-4 px-3 text-center text-yellow-400 font-semibold">{team.d}</td>
                    <td className="py-4 px-3 text-center text-rose-400 font-semibold">{team.l}</td>
                    <td className="py-4 px-3 text-center text-slate-300 font-medium">{team.gs}</td>
                    <td className="py-4 px-3 text-center text-slate-400 font-medium">{team.gc}</td>
                    <td
                      className={`py-4 px-3 text-center font-bold ${
                        team.gd > 0 ? 'text-emerald-400' : team.gd < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>

                    {/* Form Guide */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {form.length > 0 ? (
                          form.map((res, fIdx) => (
                            <span
                              key={fIdx}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                res === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : res === 'D'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {res}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-4 px-5 text-right">
                      <span className="text-xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                        {team.pts}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {standings.length === 0 && (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    No league data available. Run seed script or add matches via Admin panel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Championship Projection & Tie-breaker Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title Race Card */}
        <div className="glass-card p-6 border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-white text-base">Championship Equation</h3>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Total League Fixtures:</span>
              <span className="font-bold text-white">{totalMatches} Matches</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Completed Fixtures:</span>
              <span className="font-bold text-white">{matchesPlayed} Played</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Remaining Fixtures:</span>
              <span className="font-bold text-cyan-400">{matchesRemaining} Matches</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Maximum Points Still on Offer:</span>
              <span className="font-bold text-lime-400">{maxPointsAvailable} Points (3 pts/win)</span>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            💡 With {matchesRemaining} derby matches left, the league remains completely open. Every goal scored contributes to the Goal Difference tiebreaker!
          </div>
        </div>

        {/* Tie-breaker Rules Card */}
        <div className="glass-card p-6 border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Official Tie-breaker Order</h3>
          </div>
          <ol className="space-y-2.5 text-xs sm:text-sm text-slate-300 list-decimal list-inside">
            <li className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <strong className="text-white">Total Points:</strong> Win = 3 pts, Draw = 1 pt, Loss = 0 pts.
            </li>
            <li className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <strong className="text-white">Goal Difference (GD):</strong> Higher (Goals Scored minus Goals Conceded).
            </li>
            <li className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <strong className="text-white">Goals Scored (GF):</strong> Team with higher total offensive goals ranks higher.
            </li>
            <li className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <strong className="text-white">Head-to-Head Derby Record:</strong> Direct points in matches between the two teams.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
