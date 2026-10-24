/**
 * Default Seed & Fallback Data Engine for Lebupara Thunder Club
 *
 * Ensures that if the backend API is unreachable (e.g., initial Vercel deploy
 * before cloud backend is connected, or network error), the website NEVER
 * displays a blank screen or empty tables.
 */

const STORAGE_KEY = 'ltc_league_offline_data_v1';

const INITIAL_DATA = {
  league: {
    id: 1,
    name: '⚡ Lebupara Thunder Club — Premier League ⚡',
    total_matches: 10,
    season: 'Season 1 (2026)',
    created_at: new Date().toISOString(),
  },
  teams: [
    { id: 1, league_id: 1, name: 'Team Suvradip', captain_name: 'Suvradip', color: '#00e5ff' },
    { id: 2, league_id: 1, name: 'Team Arnab', captain_name: 'Arnab', color: '#76ff03' },
  ],
  players: [
    { id: 1, name: 'Suvradip', team_id: 1, jersey_number: 10, is_active: true, status_note: null },
    { id: 2, name: 'Nilay', team_id: 1, jersey_number: 7, is_active: true, status_note: null },
    { id: 3, name: 'Rahul', team_id: 1, jersey_number: 9, is_active: true, status_note: null },
    { id: 4, name: 'Sourav', team_id: 1, jersey_number: 8, is_active: true, status_note: null },
    { id: 5, name: 'Pritam', team_id: 1, jersey_number: 4, is_active: true, status_note: null },
    { id: 6, name: 'Amit', team_id: 1, jersey_number: 1, is_active: true, status_note: null },
    { id: 7, name: 'Mahadev', team_id: 1, jersey_number: 11, is_active: true, status_note: null },
    { id: 8, name: 'Jayanta', team_id: 1, jersey_number: 5, is_active: true, status_note: null },

    { id: 9, name: 'Arnab', team_id: 2, jersey_number: 10, is_active: true, status_note: null },
    { id: 10, name: 'Subhajit', team_id: 2, jersey_number: 9, is_active: true, status_note: null },
    { id: 11, name: 'Dipayan', team_id: 2, jersey_number: 7, is_active: true, status_note: null },
    { id: 12, name: 'Raktim', team_id: 2, jersey_number: 11, is_active: true, status_note: null },
    { id: 13, name: 'Anirban', team_id: 2, jersey_number: 5, is_active: true, status_note: null },
    { id: 14, name: 'Suman', team_id: 2, jersey_number: 1, is_active: true, status_note: null },
    { id: 15, name: 'Bappa', team_id: 2, jersey_number: 6, is_active: true, status_note: null },
    { id: 16, name: 'Raj', team_id: 2, jersey_number: 8, is_active: false, status_note: 'Ankle recovery' },
  ],
  matches: [
    {
      id: 1,
      match_number: 1,
      match_date: '2026-10-18T07:00:00',
      status: 'completed',
      notes: 'Thrilling opening derby! High intensity match.',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 3 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 2 },
      ],
      goal_records: [
        { id: 1, player_id: 1, player_name: 'Suvradip', team_id: 1, goals: 2, is_own_goal: false },
        { id: 2, player_id: 2, player_name: 'Nilay', team_id: 1, goals: 1, is_own_goal: false },
        { id: 3, player_id: 9, player_name: 'Arnab', team_id: 2, goals: 1, is_own_goal: false },
        { id: 4, player_id: 10, player_name: 'Subhajit', team_id: 2, goals: 1, is_own_goal: false },
      ],
    },
    {
      id: 2,
      match_number: 2,
      match_date: '2026-10-20T07:00:00',
      status: 'completed',
      notes: 'Tight tactical battle ending in a 1-1 draw.',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 1 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 1 },
      ],
      goal_records: [
        { id: 5, player_id: 3, player_name: 'Rahul', team_id: 1, goals: 1, is_own_goal: false },
        { id: 6, player_id: 11, player_name: 'Dipayan', team_id: 2, goals: 1, is_own_goal: false },
      ],
    },
    {
      id: 3,
      match_number: 3,
      match_date: '2026-10-22T07:00:00',
      status: 'completed',
      notes: 'Comeback victory for Arnab with late goals.',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 1 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 2 },
      ],
      goal_records: [
        { id: 7, player_id: 1, player_name: 'Suvradip', team_id: 1, goals: 1, is_own_goal: false },
        { id: 8, player_id: 9, player_name: 'Arnab', team_id: 2, goals: 2, is_own_goal: false },
      ],
    },
    {
      id: 4,
      match_number: 4,
      match_date: '2026-10-25T07:30:00',
      status: 'scheduled',
      notes: 'Clash of the Titans Part 4',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 5,
      match_number: 5,
      match_date: '2026-10-27T07:00:00',
      status: 'scheduled',
      notes: 'Mid-season showcase fixture',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 6,
      match_number: 6,
      match_date: '2026-10-29T07:00:00',
      status: 'scheduled',
      notes: 'Second-half opener',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 7,
      match_number: 7,
      match_date: '2026-10-31T07:00:00',
      status: 'scheduled',
      notes: 'Weekend evening showdown',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 8,
      match_number: 8,
      match_date: '2026-11-02T07:00:00',
      status: 'scheduled',
      notes: 'High-stakes title race',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 9,
      match_number: 9,
      match_date: '2026-11-04T07:00:00',
      status: 'scheduled',
      notes: 'Penultimate derby match',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 10,
      match_number: 10,
      match_date: '2026-11-06T07:00:00',
      status: 'scheduled',
      notes: 'Grand League Finale!',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
  ],
};

function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function saveLocalStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function getMockLeague() {
  const store = getLocalStore();
  return { data: store.league };
}

export function getMockTeams() {
  const store = getLocalStore();
  return { data: store.teams };
}

export function getMockPlayers() {
  const store = getLocalStore();
  return { data: store.players };
}

export function getMockMatches() {
  const store = getLocalStore();
  return { data: store.matches };
}

export function getMockStandings() {
  const store = getLocalStore();
  const completed = store.matches.filter((m) => m.status === 'completed');

  const stats = {
    1: { position: 1, team_id: 1, team_name: store.teams[0].name, captain_name: store.teams[0].captain_name, color: store.teams[0].color, mp: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0 },
    2: { position: 2, team_id: 2, team_name: store.teams[1].name, captain_name: store.teams[1].captain_name, color: store.teams[1].color, mp: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0 },
  };

  completed.forEach((m) => {
    const r1 = m.team_results?.[0];
    const r2 = m.team_results?.[1];
    if (!r1 || !r2) return;

    const s1 = r1.goals_scored;
    const s2 = r2.goals_scored;

    stats[1].mp += 1;
    stats[2].mp += 1;
    stats[1].gs += s1;
    stats[1].gc += s2;
    stats[2].gs += s2;
    stats[2].gc += s1;

    if (s1 > s2) {
      stats[1].w += 1;
      stats[1].pts += 3;
      stats[2].l += 1;
    } else if (s2 > s1) {
      stats[2].w += 1;
      stats[2].pts += 3;
      stats[1].l += 1;
    } else {
      stats[1].d += 1;
      stats[1].pts += 1;
      stats[2].d += 1;
      stats[2].pts += 1;
    }
  });

  stats[1].gd = stats[1].gs - stats[1].gc;
  stats[2].gd = stats[2].gs - stats[2].gc;

  const list = Object.values(stats).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gs - a.gs);
  list.forEach((t, i) => { t.position = i + 1; });
  return { data: list };
}

export function getMockTopScorers() {
  const store = getLocalStore();
  const goalsCount = {};

  store.players.forEach((p) => {
    goalsCount[p.id] = {
      player_id: p.id,
      player_name: p.name,
      photo_url: p.photo_url || null,
      team_id: p.team_id,
      team_name: p.team_id === 1 ? store.teams[0].name : store.teams[1].name,
      captain_name: p.team_id === 1 ? store.teams[0].captain_name : store.teams[1].captain_name,
      team_color: p.team_id === 1 ? store.teams[0].color : store.teams[1].color,
      total_goals: 0,
      rank: 1,
      matches_played: 0,
    };
  });

  store.matches
    .filter((m) => m.status === 'completed')
    .forEach((m) => {
      m.goal_records?.forEach((gr) => {
        if (!gr.is_own_goal && goalsCount[gr.player_id]) {
          goalsCount[gr.player_id].total_goals += gr.goals;
        }
      });
    });

  const sorted = Object.values(goalsCount).sort((a, b) => b.total_goals - a.total_goals || a.player_name.localeCompare(b.player_name));

  let currentRank = 1;
  sorted.forEach((sc, i) => {
    if (i > 0 && sc.total_goals === sorted[i - 1].total_goals) {
      sc.rank = sorted[i - 1].rank;
    } else {
      sc.rank = currentRank;
    }
    currentRank++;
  });

  return { data: sorted };
}

export function getMockDashboardStats() {
  const store = getLocalStore();
  const standings = getMockStandings().data;
  const topScorers = getMockTopScorers().data;
  const completed = store.matches.filter((m) => m.status === 'completed').length;
  const scheduled = store.matches.filter((m) => m.status === 'scheduled').length;
  const totalGoals = store.matches
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + (m.team_results?.[0]?.goals_scored || 0) + (m.team_results?.[1]?.goals_scored || 0), 0);

  return {
    data: {
      total_matches: store.league.total_matches,
      completed_matches: completed,
      scheduled_matches: scheduled,
      postponed_matches: store.matches.filter((m) => m.status === 'postponed').length,
      total_goals: totalGoals,
      standings,
      top_scorers: topScorers,
      completion_percentage: (completed / store.league.total_matches) * 100,
      league: store.league,
    },
  };
}

export function mockLogin(username, password) {
  if (username === 'admin' && password === 'Admin@123') {
    return {
      data: {
        access_token: 'demo-admin-token-' + Date.now(),
        refresh_token: 'demo-refresh-token-' + Date.now(),
        token_type: 'bearer',
      },
    };
  }
  throw new Error('Invalid credentials');
}

export function getMockMe() {
  return {
    data: {
      id: 1,
      username: 'admin',
      email: 'admin@lebupara.club',
      role: 'admin',
      is_active: true,
    },
  };
}
