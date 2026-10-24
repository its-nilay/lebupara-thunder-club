"""Public API routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Match, Team, Player, League, GoalRecord, MatchStatus
from app.schemas.schemas import (
    MatchOut, TeamOut, PlayerOut, LeagueOut,
    TeamStanding, PlayerStats, DashboardStats, GoalRecordOut
)
from app.services.league_service import calculate_standings, calculate_top_scorers
from app.services.match_service import get_or_create_league

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "service": "Lebupara Thunder Club API"}


@router.get("/league", response_model=LeagueOut)
def get_league(db: Session = Depends(get_db)):
    league = get_or_create_league(db)
    return league


@router.get("/standings", response_model=List[TeamStanding])
def get_standings(db: Session = Depends(get_db)):
    league = get_or_create_league(db)
    return calculate_standings(db, league.id)


@router.get("/top-scorers", response_model=List[PlayerStats])
def get_top_scorers(db: Session = Depends(get_db)):
    league = get_or_create_league(db)
    return calculate_top_scorers(db, league.id)


@router.get("/matches", response_model=List[MatchOut])
def get_matches(db: Session = Depends(get_db)):
    league = get_or_create_league(db)
    matches = (
        db.query(Match)
        .filter(Match.league_id == league.id)
        .order_by(Match.match_number)
        .all()
    )
    result = []
    for match in matches:
        match_out = _build_match_out(match, db)
        result.append(match_out)
    return result


@router.get("/matches/{match_id}", response_model=MatchOut)
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Match not found")
    return _build_match_out(match, db)


@router.get("/players", response_model=List[PlayerOut])
def get_players(
    team_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Player)
    if is_active is not None:
        q = q.filter(Player.is_active == is_active)
    if team_id:
        q = q.filter(Player.team_id == team_id)
    return q.order_by(Player.is_active.desc(), Player.name).all()


@router.get("/players/{player_id}", response_model=PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    league = get_or_create_league(db)

    total = db.query(Match).filter(Match.league_id == league.id).count()
    completed = db.query(Match).filter(
        Match.league_id == league.id, Match.status == MatchStatus.completed
    ).count()
    scheduled = db.query(Match).filter(
        Match.league_id == league.id, Match.status == MatchStatus.scheduled
    ).count()
    postponed = db.query(Match).filter(
        Match.league_id == league.id, Match.status == MatchStatus.postponed
    ).count()

    # Total goals from completed matches
    from sqlalchemy import func
    total_goals = (
        db.query(func.sum(GoalRecord.goals))
        .join(Match, GoalRecord.match_id == Match.id)
        .filter(Match.league_id == league.id, Match.status == MatchStatus.completed, GoalRecord.is_own_goal == False)
        .scalar()
    ) or 0

    standings = calculate_standings(db, league.id)
    top_scorers = calculate_top_scorers(db, league.id)
    completion_pct = (completed / league.total_matches * 100) if league.total_matches > 0 else 0.0

    return DashboardStats(
        total_matches=total,
        completed_matches=completed,
        scheduled_matches=scheduled,
        postponed_matches=postponed,
        total_goals=int(total_goals),
        standings=standings,
        top_scorers=top_scorers[:10],
        completion_percentage=round(completion_pct, 1),
        league=LeagueOut.model_validate(league),
    )


def _build_match_out(match: Match, db: Session) -> MatchOut:
    """Build a MatchOut with team name lookups."""
    team_results = []
    for r in match.team_results:
        team = db.query(Team).filter(Team.id == r.team_id).first()
        team_results.append({
            "team_id": r.team_id,
            "team_name": team.name if team else "Unknown",
            "goals_scored": r.goals_scored,
        })

    goal_records = []
    for gr in match.goal_records:
        player = db.query(Player).filter(Player.id == gr.player_id).first()
        goal_records.append({
            "id": gr.id,
            "player_id": gr.player_id,
            "player_name": player.name if player else "Unknown",
            "player_photo_url": player.photo_url if player else None,
            "team_id": gr.team_id,
            "goals": gr.goals,
            "is_own_goal": gr.is_own_goal,
        })

    return MatchOut(
        id=match.id,
        match_number=match.match_number,
        match_date=match.match_date,
        status=match.status,
        notes=match.notes,
        created_at=match.created_at,
        updated_at=match.updated_at,
        completed_at=match.completed_at,
        team_results=team_results,
        goal_records=goal_records,
    )
