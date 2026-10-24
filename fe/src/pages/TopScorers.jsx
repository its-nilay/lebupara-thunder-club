import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, Search, Trophy, Shield, RefreshCw } from 'lucide-react';
import { getTopScorers, getLeague, getStandings } from '../services/api';
import PlayerAvatar from '../components/PlayerAvatar';

export default function TopScorers() {
  const [scorers, setScorers] = useState([]);
  const [league, setLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scRes, lgRes, stdRes] = await Promise.all([
        getTopScorers(),
        getLeague(),
        getStandings(),
      ]);
      setScorers(scRes.data || []);
      setLeague(lgRes.data);
      setStandings(stdRes.data || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered scorers by name search
  const filtered = scorers.filter((s) =>
    s.player_name.toLowerCase().includes(search.toLowerCase())
  );

  const top3 = scorers.slice(0, 3);
  
  // Total league goals across all matches
  const totalLeagueGoals = Math.max(
    scorers.reduce((acc, s) => acc + (s.total_goals || 0), 0),
    standings.reduce((acc, s) => acc + (s.gs || 0), 0),
    1
  );

  const getGoalSharePct = (goals) => {
    if (!totalLeagueGoals || totalLeagueGoals <= 0) return '0.0';
    return (((goals || 0) / totalLeagueGoals) * 100).toFixed(1);
  };

  const getRankBadgeProps = (rank) => {
    if (rank === 1) {
      return {
        bg: 'bg-yellow-400/20',
        border: 'border-yellow-400',
        text: 'text-yellow-300',
        label: '👑',
        cardBorder: 'border-yellow-500/40 ring-1 ring-yellow-400/30 bg-gradient-to-b from-yellow-500/10 via-slate-900/80 to-slate-950',
        btnBg: 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400',
      };
    }
    if (rank === 2) {
      return {
        bg: 'bg-slate-300/20',
        border: 'border-slate-300',
        text: 'text-slate-200',
        label: '2',
        cardBorder: 'border-slate-600 bg-gradient-to-b from-slate-400/10 via-slate-900/80 to-slate-950',
        btnBg: 'bg-slate-300/10 border-slate-400/30 text-slate-200',
      };
    }
    return {
      bg: 'bg-amber-700/20',
      border: 'border-amber-600',
      text: 'text-amber-500',
      label: `${rank}`,
      cardBorder: 'border-amber-800/40 bg-gradient-to-b from-amber-900/10 via-slate-900/80 to-slate-950',
      btnBg: 'bg-amber-700/10 border-amber-600/30 text-amber-500',
    };
  };

  const isCaptain = (playerName) =>
    standings.some(
      (s) => s.captain_name?.toLowerCase() === playerName?.toLowerCase()
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            Golden Boot Leaderboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            TOP <span className="text-neon-gold">GOAL SCORERS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Individual goal scoring leaderboard across the {league?.total_matches ? `${league.total_matches}-match` : 'league'} series • Players shuffled daily
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Leaders
        </button>
      </div>

      {/* Podium for Top 3 (Dynamic ranks with proper tie-handling) */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Card 2 (Silver / Rank 2) */}
          {top3[1] && (() => {
            const props = getRankBadgeProps(top3[1].rank);
            const share = getGoalSharePct(top3[1].total_goals);
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`sm:order-1 glass-card p-6 flex flex-col items-center text-center relative overflow-hidden ${props.cardBorder}`}
              >
                <div className="relative mb-3">
                  <PlayerAvatar
                    name={top3[1].player_name}
                    photoUrl={top3[1].photo_url}
                    size="lg"
                    shape="rounded-2xl"
                    teamColor="#cbd5e1"
                  />
                  <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg ${props.bg} border ${props.border} flex items-center justify-center font-black ${props.text} text-xs shadow-md`}>
                    {props.label}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <span>{top3[1].player_name}</span>
                  {isCaptain(top3[1].player_name) && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                      Captain
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{share}% of total league goals</p>
                <div className={`mt-4 px-4 py-2 rounded-xl bg-slate-900/80 border ${props.btnBg}`}>
                  <span className="text-2xl font-black">{top3[1].total_goals}</span>
                  <span className="text-xs ml-1.5 font-semibold opacity-80">Goals</span>
                </div>
              </motion.div>
            );
          })()}

          {/* Card 1 (Gold / Rank 1) */}
          {top3[0] && (() => {
            const props = getRankBadgeProps(top3[0].rank);
            const share = getGoalSharePct(top3[0].total_goals);
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`sm:order-2 glass-card p-6 flex flex-col items-center text-center relative overflow-hidden ${props.cardBorder}`}
              >
                <div className="absolute top-3 right-3 text-yellow-400">
                  <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                </div>
                <div className="relative mb-3">
                  <PlayerAvatar
                    name={top3[0].player_name}
                    photoUrl={top3[0].photo_url}
                    size="xl"
                    shape="rounded-2xl"
                    teamColor="#ffd700"
                  />
                  <div className="absolute -top-3.5 -right-2 text-2xl filter drop-shadow">
                    👑
                  </div>
                </div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{top3[0].player_name}</span>
                  {isCaptain(top3[0].player_name) && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-yellow-400/30 text-yellow-300 border border-yellow-400/50">
                      Captain
                    </span>
                  )}
                </h3>
                <p className="text-xs text-yellow-300/90 mt-1 font-semibold">
                  Golden Boot Leader • {share}% of league goals
                </p>
                <div className="mt-4 px-6 py-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/40">
                  <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
                    {top3[0].total_goals}
                  </span>
                  <span className="text-xs text-yellow-200/80 ml-2 font-bold uppercase">Goals</span>
                </div>
              </motion.div>
            );
          })()}

          {/* Card 3 (Rank 2 or 3 depending on ties) */}
          {top3[2] && (() => {
            const props = getRankBadgeProps(top3[2].rank);
            const share = getGoalSharePct(top3[2].total_goals);
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`sm:order-3 glass-card p-6 flex flex-col items-center text-center relative overflow-hidden ${props.cardBorder}`}
              >
                <div className="relative mb-3">
                  <PlayerAvatar
                    name={top3[2].player_name}
                    photoUrl={top3[2].photo_url}
                    size="lg"
                    shape="rounded-2xl"
                    teamColor="#b45309"
                  />
                  <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg ${props.bg} border ${props.border} flex items-center justify-center font-black ${props.text} text-xs shadow-md`}>
                    {props.label}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <span>{top3[2].player_name}</span>
                  {isCaptain(top3[2].player_name) && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                      Captain
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{share}% of total league goals</p>
                <div className={`mt-4 px-4 py-2 rounded-xl bg-slate-900/80 border ${props.btnBg}`}>
                  <span className="text-2xl font-black">{top3[2].total_goals}</span>
                  <span className="text-xs ml-1.5 font-semibold opacity-80">Goals</span>
                </div>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-yellow-400/50"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {scorers.length} players • {totalLeagueGoals} total league goals scored
        </span>
      </div>

      {/* Full Leaderboard Table (No Matches Played Column) */}
      <div className="glass-card overflow-hidden rounded-2xl border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#050b18] text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
                <th className="py-4 px-4 text-center w-14">RANK</th>
                <th className="py-4 px-4 min-w-[200px]">PLAYER</th>
                <th className="py-4 px-4 min-w-[180px]">GOAL SHARE (% OF LEAGUE)</th>
                <th className="py-4 px-5 text-right font-black text-yellow-400 text-base">TOTAL GOALS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {filtered.map((player) => {
                const sharePct = getGoalSharePct(player.total_goals);
                const isCapt = isCaptain(player.player_name);

                return (
                  <tr key={player.player_id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-black ${
                          player.rank === 1
                            ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20'
                            : player.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : player.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {player.rank}
                      </span>
                    </td>

                    {/* Player */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          name={player.player_name}
                          photoUrl={player.photo_url}
                          size="sm"
                          shape="rounded-lg"
                          teamColor={player.team_color || '#00e5ff'}
                        />
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{player.player_name}</span>
                          {isCapt && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                              Captain
                            </span>
                          )}
                          {player.rank === 1 && (
                            <span className="text-yellow-400 text-xs font-semibold">⚡ Golden Boot</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Goal Share Progress Bar with Exact Percentage */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                            style={{ width: `${Math.min(parseFloat(sharePct), 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-yellow-300 min-w-[46px] text-right font-mono">
                          {sharePct}%
                        </span>
                      </div>
                    </td>

                    {/* Total Goals */}
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-lg font-black text-yellow-400">{player.total_goals}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400">
                    No players found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
