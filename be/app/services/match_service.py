"""Match service: CRUD + score management with transactions."""
import json
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import (
    Match, MatchTeamResult, GoalRecord, Team, Player,
    MatchStatus, League, AuditLog
)
from app.schemas.schemas import (
    MatchCreate, MatchUpdate, MatchResultInput, LeagueUpdate
)
from app.core.config import get_settings

settings = get_settings()


def get_or_create_league(db: Session) -> League:
    league = db.query(League).first()
    if not league:
        league = League(
            name=settings.LEAGUE_NAME,
            total_matches=settings.TOTAL_MATCHES,
        )
        db.add(league)
        db.commit()
        db.refresh(league)
    return league


def create_match(db: Session, data: MatchCreate, user_id: Optional[int] = None) -> Match:
    league = get_or_create_league(db)

    # If match_number exceeds current league.total_matches, auto-expand league format
    if data.match_number > league.total_matches:
        league.total_matches = data.match_number
        db.commit()
        db.refresh(league)

    # Check for duplicate match number
    dup = db.query(Match).filter(
        Match.league_id == league.id,
        Match.match_number == data.match_number,
    ).first()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Match number {data.match_number} already exists",
        )

    match = Match(
        league_id=league.id,
        match_number=data.match_number,
        match_date=data.match_date,
        notes=data.notes,
        status=MatchStatus.scheduled,
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    _log_audit(db, user_id, "CREATE", "match", match.id, None, json.dumps({"match_number": match.match_number}))
    return match


def save_match_result(
    db: Session,
    match_id: int,
    data: MatchResultInput,
    user_id: Optional[int] = None,
    reopen: bool = False,
) -> Match:
    """Save or update match scores and goal records atomically."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    league = db.query(League).filter(League.id == match.league_id).first()

    if match.status == MatchStatus.completed and not reopen:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Match already completed. Use reopen endpoint first.",
        )

    # Validate team IDs belong to this league
    teams = {t.id: t for t in db.query(Team).filter(Team.league_id == league.id).all()}
    if data.team1_id not in teams or data.team2_id not in teams:
        raise HTTPException(status_code=400, detail="Invalid team IDs for this league")
    if data.team1_id == data.team2_id:
        raise HTTPException(status_code=400, detail="Teams must be different")

    # Validate goal records
    player_team_map: dict[int, int] = {}
    total_team1_from_records = 0
    total_team2_from_records = 0

    for gr in data.goal_records:
        player = db.query(Player).filter(Player.id == gr.player_id).first()
        if not player:
            raise HTTPException(status_code=400, detail=f"Player {gr.player_id} not found")
        if player.team_id not in teams:
            raise HTTPException(status_code=400, detail=f"Player {player.name} not in this league")
        if gr.goals < 0:
            raise HTTPException(status_code=400, detail="Goals cannot be negative")

        scored_for_team_id = (
            gr.team_id
            if gr.team_id in [data.team1_id, data.team2_id]
            else player.team_id
        )
        if scored_for_team_id not in [data.team1_id, data.team2_id]:
            scored_for_team_id = data.team1_id

        player_team_map[gr.player_id] = scored_for_team_id

        # The side specified receives the goal on the scoreboard
        if scored_for_team_id == data.team1_id:
            total_team1_from_records += gr.goals
        else:
            total_team2_from_records += gr.goals

    # Validate score reconciliation
    if data.goal_records:
        if total_team1_from_records != data.team1_goals:
            raise HTTPException(
                status_code=400,
                detail=f"Team 1 goal records sum ({total_team1_from_records}) doesn't match score ({data.team1_goals})",
            )
        if total_team2_from_records != data.team2_goals:
            raise HTTPException(
                status_code=400,
                detail=f"Team 2 goal records sum ({total_team2_from_records}) doesn't match score ({data.team2_goals})",
            )

    # Save before state for audit
    before = {
        "status": match.status.value,
        "results": [
            {"team_id": r.team_id, "goals": r.goals_scored}
            for r in match.team_results
        ],
    }

    # Clear existing results and goals
    db.query(MatchTeamResult).filter(MatchTeamResult.match_id == match_id).delete()
    db.query(GoalRecord).filter(GoalRecord.match_id == match_id).delete()

    # Insert new results
    db.add(MatchTeamResult(match_id=match_id, team_id=data.team1_id, goals_scored=data.team1_goals))
    db.add(MatchTeamResult(match_id=match_id, team_id=data.team2_id, goals_scored=data.team2_goals))

    # Insert goal records
    for gr in data.goal_records:
        team_id = (
            gr.team_id
            if gr.team_id in [data.team1_id, data.team2_id]
            else data.team1_id
        )
        db.add(GoalRecord(
            match_id=match_id,
            player_id=gr.player_id,
            team_id=team_id,
            goals=gr.goals,
            is_own_goal=gr.is_own_goal,
        ))

    # Mark completed
    match.status = MatchStatus.completed
    if data.match_date is not None:
        match.match_date = data.match_date
    if data.notes is not None:
        match.notes = data.notes
    match.completed_at = datetime.now(timezone.utc)
    match.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(match)

    after = {
        "status": match.status.value,
        "team1_goals": data.team1_goals,
        "team2_goals": data.team2_goals,
    }
    _log_audit(db, user_id, "COMPLETE", "match", match.id, json.dumps(before), json.dumps(after))
    return match


def reopen_match(db: Session, match_id: int, user_id: Optional[int] = None) -> Match:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status not in [MatchStatus.completed, MatchStatus.postponed]:
        raise HTTPException(status_code=400, detail="Match is already scheduled")

    before = {"status": match.status.value}
    match.status = MatchStatus.scheduled
    match.completed_at = None
    match.updated_at = datetime.now(timezone.utc)

    # Clear results
    db.query(MatchTeamResult).filter(MatchTeamResult.match_id == match_id).delete()
    db.query(GoalRecord).filter(GoalRecord.match_id == match_id).delete()

    db.commit()
    db.refresh(match)

    _log_audit(db, user_id, "REOPEN", "match", match.id, json.dumps(before), json.dumps({"status": "scheduled"}))
    return match


def postpone_match(db: Session, match_id: int, user_id: Optional[int] = None) -> Match:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status == MatchStatus.completed:
        raise HTTPException(status_code=400, detail="Cannot postpone a completed match")

    before = {"status": match.status.value}
    match.status = MatchStatus.postponed
    match.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(match)

    _log_audit(db, user_id, "POSTPONE", "match", match.id, json.dumps(before), json.dumps({"status": "postponed"}))
    return match


def reset_season(db: Session, user_id: Optional[int] = None) -> League:
    league = get_or_create_league(db)
    matches = db.query(Match).filter(Match.league_id == league.id).all()
    for m in matches:
        m.status = MatchStatus.scheduled
        m.completed_at = None
        m.updated_at = datetime.now(timezone.utc)
        db.query(MatchTeamResult).filter(MatchTeamResult.match_id == m.id).delete()
        db.query(GoalRecord).filter(GoalRecord.match_id == m.id).delete()

    db.commit()
    _log_audit(db, user_id, "RESET_SEASON", "league", league.id, None, json.dumps({"status": "reset_to_scheduled", "matches_count": len(matches)}))
    return league


def update_league(db: Session, data: LeagueUpdate, user_id: Optional[int] = None) -> League:
    league = get_or_create_league(db)
    before = {
        "name": league.name,
        "total_matches": league.total_matches,
        "season": league.season,
    }

    if data.name is not None:
        league.name = data.name.strip()
    if data.season is not None:
        league.season = data.season.strip() or None

    if data.total_matches is not None and data.total_matches != league.total_matches:
        new_total = data.total_matches
        existing_matches = (
            db.query(Match)
            .filter(Match.league_id == league.id)
            .order_by(Match.match_number)
            .all()
        )
        existing_count = len(existing_matches)

        if new_total > existing_count:
            # Auto-generate additional scheduled fixtures up to new_total
            for num in range(existing_count + 1, new_total + 1):
                new_m = Match(
                    league_id=league.id,
                    match_number=num,
                    status=MatchStatus.scheduled,
                    notes=f"Match #{num}",
                )
                db.add(new_m)
        elif new_total < existing_count:
            # Check if any match beyond new_total has results or is completed
            excess_matches = [m for m in existing_matches if m.match_number > new_total]
            completed_excess = [m for m in excess_matches if m.status == MatchStatus.completed]
            if completed_excess:
                nums = [str(m.match_number) for m in completed_excess]
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reduce total matches to {new_total}: Match #{', #'.join(nums)} already completed. Reopen or delete results first.",
                )
            # Delete excess unplayed matches
            for m in excess_matches:
                db.query(MatchTeamResult).filter(MatchTeamResult.match_id == m.id).delete()
                db.query(GoalRecord).filter(GoalRecord.match_id == m.id).delete()
                db.delete(m)

        league.total_matches = new_total

    league.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(league)
    after = {
        "name": league.name,
        "total_matches": league.total_matches,
        "season": league.season,
    }
    _log_audit(db, user_id, "UPDATE", "league", league.id, json.dumps(before), json.dumps(after))
    return league


def add_next_match(db: Session, user_id: Optional[int] = None) -> Match:
    league = get_or_create_league(db)
    last_match = (
        db.query(Match)
        .filter(Match.league_id == league.id)
        .order_by(Match.match_number.desc())
        .first()
    )
    next_num = (last_match.match_number + 1) if last_match else 1
    new_match = Match(
        league_id=league.id,
        match_number=next_num,
        status=MatchStatus.scheduled,
        notes=f"Match #{next_num}",
    )
    db.add(new_match)
    if next_num > league.total_matches:
        league.total_matches = next_num

    db.commit()
    db.refresh(new_match)
    _log_audit(db, user_id, "ADD_MATCH", "match", new_match.id, None, json.dumps({"match_number": next_num}))
    return new_match


def delete_single_match(db: Session, match_id: int, user_id: Optional[int] = None) -> None:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status == MatchStatus.completed:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a completed match. Reopen it back to scheduled first.",
        )
    league = match.league
    match_num = match.match_number
    db.query(MatchTeamResult).filter(MatchTeamResult.match_id == match.id).delete()
    db.query(GoalRecord).filter(GoalRecord.match_id == match.id).delete()
    db.delete(match)
    db.commit()

    # Sync league total_matches if needed
    remaining_count = db.query(Match).filter(Match.league_id == league.id).count()
    if league.total_matches > remaining_count:
        league.total_matches = max(1, remaining_count)
        db.commit()

    _log_audit(db, user_id, "DELETE_MATCH", "match", match_id, json.dumps({"match_number": match_num}), None)


def _log_audit(
    db: Session,
    user_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[int],
    before: Optional[str],
    after: Optional[str],
    ip: Optional[str] = None,
):
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        before_value=before,
        after_value=after,
        ip_address=ip,
    )
    db.add(log)
    db.commit()
