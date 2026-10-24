import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Shield,
  Award,
  Edit2,
  RefreshCw,
  Activity,
  Bandage,
  Lock,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { getPlayers, getTopScorers, getStandings, getLeague } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PlayerModal from '../components/PlayerModal';
import PlayerAvatar from '../components/PlayerAvatar';
import { Link } from 'react-router-dom';

export default function Players() {
  const { isAdmin } = useAuth();
  const [players, setPlayers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [league, setLeague] = useState(null);
  const [scorersMap, setScorersMap] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, stdRes, lgRes] = await Promise.all([
        getPlayers(),
        getTopScorers(),
        getStandings(),
        getLeague(),
      ]);
      setPlayers(pRes.data || []);
      if (lgRes?.data) setLeague(lgRes.data);

      // Build scorers map: player_id -> stats
      const sMap = {};
      sRes.data?.forEach((sc) => {
        sMap[sc.player_id] = sc;
      });
      setScorersMap(sMap);
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

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setModalOpen(true);
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setModalOpen(true);
  };

  const isCaptain = (name) =>
    standings.some(
      (s) => s.captain_name?.toLowerCase() === name?.toLowerCase()
    );

  const activePlayers = players.filter((p) => p.is_active);
  const inactivePlayers = players.filter((p) => !p.is_active);

  const filtered = players.filter((p) => {
    if (statusFilter === 'ACTIVE') return p.is_active;
    if (statusFilter === 'INACTIVE') return !p.is_active;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Club Player Pool
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            LEAGUE <span className="text-neon-cyan">PLAYERS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Club roster for the {league?.total_matches || 10}-match league • Players shuffled daily for each match • Status & injury tracker
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <button
              onClick={handleAddPlayer}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              Add Club Player
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-bold transition"
            >
              <Lock className="w-3.5 h-3.5" />
              Login to Edit Players (Admin)
            </Link>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (No team tabs!) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            statusFilter === 'ALL'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Players ({players.length})
        </button>

        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-emerald-400 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Active / Available ({activePlayers.length})
        </button>

        <button
          onClick={() => setStatusFilter('INACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            statusFilter === 'INACTIVE'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-slate-900 text-rose-400 hover:bg-slate-800'
          }`}
        >
          <Bandage className="w-3.5 h-3.5" />
          Inactive / Injured ({inactivePlayers.length})
        </button>
      </div>

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((player) => {
          const stats = scorersMap[player.id];
          const goals = stats?.total_goals ?? 0;
          const capt = isCaptain(player.name);
          const active = player.is_active;

          const totalLeagueGoals = Math.max(
            Object.values(scorersMap).reduce((acc, s) => acc + (s.total_goals || 0), 0),
            standings.reduce((acc, s) => acc + (s.gs || 0), 0),
            1
          );
          const goalSharePct = (((goals || 0) / totalLeagueGoals) * 100).toFixed(1);

          return (
            <motion.div
              key={player.id}
              whileHover={{ y: -3 }}
              className={`p-5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                active
                  ? 'glass-card border-slate-800 hover:border-cyan-500/40'
                  : 'bg-slate-950/80 border-rose-500/30 opacity-85 hover:border-rose-400/60'
              }`}
            >
              {/* Badges on Top Right */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {capt && (
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-yellow-500/20">
                    <Shield className="w-3 h-3 text-yellow-400" /> CAPTAIN
                  </span>
                )}
                {!active && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Bandage className="w-3 h-3" /> Injured
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3.5">
                  <div
                    onClick={() => isAdmin && handleEditPlayer(player)}
                    className={`relative flex-shrink-0 ${isAdmin ? 'cursor-pointer group' : ''}`}
                    title={isAdmin ? 'Click to edit player or update photo' : ''}
                  >
                    <PlayerAvatar
                      name={player.name}
                      photoUrl={player.photo_url}
                      size="lg"
                      shape="rounded-full"
                      teamColor={active ? '#00e5ff' : '#ff3d71'}
                    />
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Camera className="w-4 h-4 text-cyan-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-base leading-snug truncate">{player.name}</h3>
                    {/* Status note (injury or active) */}
                    {active ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Available for match selection
                      </span>
                    ) : (
                      <span className="text-[11px] text-rose-400 font-semibold mt-0.5 block truncate max-w-[160px]">
                        {player.status_note ? player.status_note : 'Inactive / Injured'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    Goals in League: <strong className="text-yellow-400 font-bold">{goals}</strong>
                  </div>
                  <div className="text-slate-400">
                    Goal Share: <strong className="text-yellow-400 font-semibold">{goalSharePct}%</strong>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-4 pt-2 border-t border-slate-800/60 flex justify-end">
                  <button
                    onClick={() => handleEditPlayer(player)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Details & Photo
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-400 glass-card rounded-2xl">
          No players found for the selected filter.
        </div>
      )}

      {/* Player Modal */}
      <PlayerModal
        isOpen={modalOpen}
        player={editingPlayer}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
