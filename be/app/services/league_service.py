"""
League calculation service.
All statistics derived from completed match results.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    Match, MatchTeamResult, GoalRecord, Team, Player, MatchStatus
)
from app.schemas.schemas import TeamStanding, PlayerStats


def calculate_standings(db: Session, league_id: int) -> List[TeamStanding]:
    """
    Calculate standings from completed matches only.
    Ranking: Points > Goal Difference > Goals Scored.
    """
    teams = db.query(Team).filter(Team.league_id == league_id).all()
    if not teams:
        return []

    completed_matches = (
        db.query(Match)
        .filter(Match.league_id == league_id, Match.status == MatchStatus.completed)
        .all()
    )

    # Initialize stats
    stats: dict[int, dict] = {
        team.id: {
            "team_id": team.id,
            "team_name": team.name,
            "captain_name": team.captain_name,
            "color": team.color,
            "mp": 0, "w": 0, "d": 0, "l": 0,
            "gs": 0, "gc": 0, "gd": 0, "pts": 0,
        }
        for team in teams
    }

    for match in completed_matches:
        if len(match.team_results) < 2:
            continue

        results = {r.team_id: r.goals_scored for r in match.team_results}
        team_ids = list(results.keys())
        if len(team_ids) != 2:
            continue

        t1_id, t2_id = team_ids[0], team_ids[1]
        t1_goals = results[t1_id]
        t2_goals = results[t2_id]

        # Update matches played
        if t1_id in stats:
            stats[t1_id]["mp"] += 1
            stats[t1_id]["gs"] += t1_goals
            stats[t1_id]["gc"] += t2_goals
        if t2_id in stats:
            stats[t2_id]["mp"] += 1
            stats[t2_id]["gs"] += t2_goals
            stats[t2_id]["gc"] += t1_goals

        # Determine outcome
        if t1_goals > t2_goals:
            if t1_id in stats:
                stats[t1_id]["w"] += 1
                stats[t1_id]["pts"] += 3
            if t2_id in stats:
                stats[t2_id]["l"] += 1
        elif t2_goals > t1_goals:
            if t2_id in stats:
                stats[t2_id]["w"] += 1
                stats[t2_id]["pts"] += 3
            if t1_id in stats:
                stats[t1_id]["l"] += 1
        else:
            if t1_id in stats:
                stats[t1_id]["d"] += 1
                stats[t1_id]["pts"] += 1
            if t2_id in stats:
                stats[t2_id]["d"] += 1
                stats[t2_id]["pts"] += 1

    # Compute goal difference
    for s in stats.values():
        s["gd"] = s["gs"] - s["gc"]

    # Sort: pts DESC, gd DESC, gs DESC, team_name ASC (stable)
    sorted_stats = sorted(
        stats.values(),
        key=lambda s: (-s["pts"], -s["gd"], -s["gs"], s["team_name"]),
    )

    standings = []
    for pos, s in enumerate(sorted_stats, start=1):
        standings.append(
            TeamStanding(
                position=pos,
                team_id=s["team_id"],
                team_name=s["team_name"],
                captain_name=s["captain_name"],
                color=s["color"],
                mp=s["mp"],
                w=s["w"],
                d=s["d"],
                l=s["l"],
                gs=s["gs"],
                gc=s["gc"],
                gd=s["gd"],
                pts=s["pts"],
            )
        )

    return standings


def calculate_top_scorers(db: Session, league_id: int) -> List[PlayerStats]:
    """
    Calculate top scorer leaderboard using competition ranking.
    rank = 1 + number_of_players_with_more_goals

    Only goals from completed matches are counted.
    Own goals are not credited to the goal scorer.
    All registered players are included (including zero-goal players).
    """
    # Get completed match IDs for this league
    from sqlalchemy import select as sa_select
    completed_match_ids_stmt = (
        sa_select(Match.id)
        .where(Match.league_id == league_id, Match.status == MatchStatus.completed)
    )
    completed_match_ids = completed_match_ids_stmt

    # Aggregate non-own-goal records per player from completed matches
    goal_agg = (
        db.query(
            GoalRecord.player_id,
            func.sum(GoalRecord.goals).label("total_goals"),
        )
        .filter(
            GoalRecord.match_id.in_(completed_match_ids),
            GoalRecord.is_own_goal.is_(False),
        )
        .group_by(GoalRecord.player_id)
        .all()
    )

    goals_map = {row.player_id: int(row.total_goals) for row in goal_agg}

    # Count distinct matches per player
    matches_played_agg = (
        db.query(
            GoalRecord.player_id,
            func.count(func.distinct(GoalRecord.match_id)).label("matches_played"),
        )
        .filter(GoalRecord.match_id.in_(completed_match_ids))
        .group_by(GoalRecord.player_id)
        .all()
    )
    matches_map = {row.player_id: int(row.matches_played) for row in matches_played_agg}

    # All players in this league
    players = (
        db.query(Player)
        .join(Team, Player.team_id == Team.id)
        .filter(Team.league_id == league_id, Player.is_active == True)
        .all()
    )

    player_data = []
    for player in players:
        total_goals = goals_map.get(player.id, 0)
        mp = matches_map.get(player.id, 0)
        player_data.append({
            "player_id": player.id,
            "player_name": player.name,
            "team_id": player.team_id,
            "team_name": player.team.name,
            "captain_name": player.team.captain_name,
            "team_color": player.team.color,
            "total_goals": total_goals,
            "matches_played": mp,
        })

    # Sort: goals DESC, name ASC (deterministic secondary sort)
    player_data.sort(key=lambda x: (-x["total_goals"], x["player_name"]))

    # Competition ranking: rank = 1 + count of players with more goals
    result = []
    for entry in player_data:
        rank = 1 + sum(
            1 for other in player_data
            if other["total_goals"] > entry["total_goals"]
        )
        result.append(
            PlayerStats(
                player_id=entry["player_id"],
                player_name=entry["player_name"],
                team_id=entry["team_id"],
                team_name=entry["team_name"],
                captain_name=entry["captain_name"],
                team_color=entry["team_color"],
                total_goals=entry["total_goals"],
                rank=rank,
                matches_played=entry["matches_played"],
            )
        )

    return result
