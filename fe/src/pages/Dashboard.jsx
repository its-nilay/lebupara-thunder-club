import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Zap,
  Flame,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award,
  Shield,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { getDashboardStats, getMatches } from '../services/api';
import { formatMatchDateTime } from '../services/dateUtils';
import PlayerAvatar from '../components/PlayerAvatar';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, matchesRes] = await Promise.all([
        getDashboardStats(),
        getMatches(),
      ]);
      setStats(statsRes.data);
      setMatches(matchesRes.data || []);
      setError(null);
    } catch (err) {
      setError('Could not connect to backend server. Make sure FastAPI is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-slate-400 text-sm tracking-wide">Loading League Data...</span>
      </div>
    );
  }

  const standings = stats?.standings || [];
  const topScorers = stats?.top_scorers || [];
  const leader = standings[0];
  const goldenBoot = topScorers[0];

  const completedMatches = matches.filter((m) => m.status === 'completed');
  const upcomingMatches = matches.filter((m) => m.status === 'scheduled');
  const nextMatch = upcomingMatches[0];
  const lastMatch = completedMatches[completedMatches.length - 1];

  const totalMatches = stats?.league?.total_matches || stats?.total_matches || matches.length || 10;
  const completedCount = stats?.completed_matches || 0;
  const progressPct = Math.round((completedCount / totalMatches) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-cyan-500/30 bg-gradient-to-br from-[#071328] via-[#040c1d] to-[#020817] shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-lime-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-1 border-2 border-amber-400/50 bg-slate-950/80 shadow-xl shadow-amber-500/20 flex-shrink-0">
              <img src="/logo.png" alt="Lebupara Thunder Club Crest" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                ⚡︎ Official League Center • Estd. 2017 ⚡︎
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                LEBUPARA <span className="text-neon-cyan">THUNDER</span> CLUB
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {totalMatches}-Match Showdown between Captain{' '}
                <strong className="text-cyan-400">
                  {standings[0]?.captain_name || 'Suvradip'}
                </strong>{' '}
                and Captain{' '}
                <strong className="text-lime-400">
                  {standings[1]?.captain_name || 'Arnab'}
                </strong>
                . Every goal counts, every point matters.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <Link
              to="/standings"
              className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition"
            >
              <Trophy className="w-4 h-4" />
              View Points Table
            </Link>
            <Link
              to="/matches"
              className="px-5 py-3 rounded-xl font-bold text-sm bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Calendar className="w-4 h-4" />
              Match Center
            </Link>
          </div>
        </div>

        {/* League Progress Bar */}
        <div className="relative z-10 mt-8 pt-6 border-t border-cyan-500/20">
          <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <TrendingUp className="w-3.5 h-3.5" />
              Tournament Progress: {completedCount} / {totalMatches} Matches Completed
            </span>
            <span className="font-bold text-cyan-400">{progressPct}%</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-lime-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leader Card */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Table Leader</span>
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-white truncate">
              {leader ? leader.team_name : 'TBD'}
            </div>
            <div className="text-xs text-cyan-400 font-medium">
              Capt: {leader ? leader.captain_name : '—'} • {leader ? `${leader.pts} Pts` : ''}
            </div>
          </div>
        </div>

        {/* Total Goals */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Goals</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white">{stats?.total_goals ?? 0}</div>
            <div className="text-xs text-slate-400">
              {completedCount > 0 ? (stats.total_goals / completedCount).toFixed(1) : 0} goals / match
            </div>
          </div>
        </div>

        {/* Top Scorer */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Golden Boot Leader</span>
            <Award className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-white truncate">
              {goldenBoot ? goldenBoot.player_name : 'None yet'}
            </div>
            <div className="text-xs text-yellow-400 font-semibold">
              {goldenBoot ? `${goldenBoot.total_goals} Goals • Golden Boot Leader` : '—'}
            </div>
          </div>
        </div>

        {/* Matches Left */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Matches Remaining</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white">{totalMatches - completedCount}</div>
            <div className="text-xs text-slate-400">out of {totalMatches} fixtures</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Standings Preview + Match Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Points Table (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white">Live Points Table</h2>
              </div>
              <Link
                to="/standings"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                Full Table <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Pos</th>
                    <th className="py-2.5 px-3">Team & Captain</th>
                    <th className="py-2.5 px-2 text-center">MP</th>
                    <th className="py-2.5 px-2 text-center">W</th>
                    <th className="py-2.5 px-2 text-center">D</th>
                    <th className="py-2.5 px-2 text-center">L</th>
                    <th className="py-2.5 px-2 text-center">GD</th>
                    <th className="py-2.5 px-3 text-right text-cyan-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {standings.map((s) => (
                    <tr
                      key={s.team_id}
                      className="hover:bg-slate-800/30 transition-colors"
                      style={{
                        background:
                          s.position === 1 ? 'linear-gradient(90deg, rgba(255,215,0,0.06), transparent)' : 'transparent',
                      }}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                            s.position === 1
                              ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.position}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color || '#00e5ff' }}
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{s.team_name}</div>
                            <div className="text-xs text-slate-400">Capt: {s.captain_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300 font-medium">{s.mp}</td>
                      <td className="py-3 px-2 text-center text-emerald-400 font-bold">{s.w}</td>
                      <td className="py-3 px-2 text-center text-yellow-400 font-medium">{s.d}</td>
                      <td className="py-3 px-2 text-center text-rose-400 font-medium">{s.l}</td>
                      <td
                        className={`py-3 px-2 text-center font-bold text-xs ${
                          s.gd > 0 ? 'text-emerald-400' : s.gd < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {s.gd > 0 ? `+${s.gd}` : s.gd}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-base font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                          {s.pts}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-6 text-center text-slate-500 text-sm">
                        No matches completed yet. Enter match results to see live points.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Ranking criteria: Points ➔ Goal Diff ➔ Goals Scored</span>
            <Link to="/standings" className="text-cyan-400 hover:underline">
              Detailed breakdown →
            </Link>
          </div>
        </div>

        {/* Right Column: Fixtures & Top Scorers Spotlight (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Next Match Card */}
          <div className="glass-card p-6 border-cyan-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Next Fixture
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                {nextMatch ? `Match ${nextMatch.match_number} of ${totalMatches}` : 'All Completed!'}
              </span>
            </div>

            {nextMatch ? (
              <div>
                <div className="my-4 py-3 px-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="font-bold text-sm text-cyan-400 truncate">
                      {standings[0]?.team_name || 'Team 1'}
                    </div>
                    <div className="text-xs text-slate-400">Capt: {standings[0]?.captain_name || 'Suvradip'}</div>
                  </div>
                  <div className="px-3 text-xs font-black text-slate-500">VS</div>
                  <div className="text-center flex-1">
                    <div className="font-bold text-sm text-lime-400 truncate">
                      {standings[1]?.team_name || 'Team 2'}
                    </div>
                    <div className="text-xs text-slate-400">Capt: {standings[1]?.captain_name || 'Arnab'}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{formatMatchDateTime(nextMatch.match_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {nextMatch.notes && <span className="italic text-slate-500 truncate max-w-[150px]">"{nextMatch.notes}"</span>}
                    <Link to="/matches" className="text-cyan-400 font-semibold hover:underline whitespace-nowrap">
                      Match Details →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-sm">
                🎉 All {totalMatches} league matches have been completed!
              </div>
            )}
          </div>

          {/* Golden Boot Top 3 Spotlight */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white text-base">Golden Boot Race</h3>
              </div>
              <Link to="/top-scorers" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {topScorers.slice(0, 5).map((p) => {
                const isCapt = standings.some(
                  (s) => s.captain_name?.toLowerCase() === p.player_name?.toLowerCase()
                );
                const totalLeagueGoals = Math.max(stats?.total_goals || 0, 1);
                const goalSharePct = (((p.total_goals || 0) / totalLeagueGoals) * 100).toFixed(1);

                return (
                  <div
                    key={p.player_id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          p.rank === 1
                            ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 shadow-sm shadow-yellow-500/20'
                            : p.rank === 2
                            ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40'
                            : p.rank === 3
                            ? 'bg-amber-700/20 text-amber-500 border border-amber-600/40'
                            : 'text-slate-500 bg-slate-800/40 border border-slate-800'
                        }`}
                      >
                        {p.rank}
                      </span>
                      <PlayerAvatar
                        name={p.player_name}
                        photoUrl={p.photo_url}
                        size="sm"
                        shape="rounded-lg"
                        teamColor={p.team_color || '#00e5ff'}
                      />
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{p.player_name}</span>
                          {isCapt && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                              Captain
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-yellow-400/80 font-medium">
                          {goalSharePct}% of league goals
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-yellow-400">{p.total_goals}</span>
                      <span className="text-xs text-slate-400 ml-1">goals</span>
                    </div>
                  </div>
                );
              })}
              {topScorers.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  Goals recorded in completed matches will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
