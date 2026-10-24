"""Admin API routes — require admin role for all operations."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import (
    Match, Team, Player, AuditLog, User, League, MatchStatus
)
from app.schemas.schemas import (
    MatchCreate, MatchUpdate, MatchResultInput, MatchOut,
    TeamCreate, TeamUpdate, TeamOut,
    PlayerCreate, PlayerUpdate, PlayerOut,
    AuditLogOut, MessageResponse, LeagueUpdate, LeagueOut,
)
from app.services.match_service import (
    create_match, save_match_result, reopen_match, postpone_match,
    get_or_create_league, reset_season, update_league, add_next_match, delete_single_match
)
from app.services.auth_service import require_admin, get_user_id_from_payload
from app.core.security import get_current_user_payload
from app.api.public import _build_match_out

router = APIRouter(prefix="/admin")


def _admin_user_id(payload: dict = Depends(get_current_user_payload)) -> int:
    require_admin(payload)
    return get_user_id_from_payload(payload)


# ─── Matches ─────────────────────────────────────────────────────────────────

@router.post("/matches", response_model=MatchOut)
def admin_create_match(
    data: MatchCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    match = create_match(db, data, user_id)
    return _build_match_out(match, db)


@router.patch("/matches/{match_id}", response_model=MatchOut)
def admin_update_match(
    match_id: int,
    data: MatchUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status == MatchStatus.completed and data.status is not None and data.status != match.status:
        raise HTTPException(status_code=400, detail="Reopen match before editing status")

    if "match_date" in data.model_fields_set:
        match.match_date = data.match_date
    if "notes" in data.model_fields_set:
        match.notes = data.notes
    if data.status is not None and data.status != match.status:
        if data.status == MatchStatus.completed:
            raise HTTPException(status_code=400, detail="Use /complete endpoint to enter results")
        match.status = data.status

    db.commit()
    db.refresh(match)
    return _build_match_out(match, db)


@router.put("/matches/{match_id}/result", response_model=MatchOut)
def admin_save_result(
    match_id: int,
    data: MatchResultInput,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    match = save_match_result(db, match_id, data, user_id)
    return _build_match_out(match, db)


@router.post("/matches/{match_id}/complete", response_model=MatchOut)
def admin_complete_match(
    match_id: int,
    data: MatchResultInput,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    match = save_match_result(db, match_id, data, user_id)
    return _build_match_out(match, db)


@router.post("/matches/{match_id}/reopen", response_model=MatchOut)
def admin_reopen_match(
    match_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    match = reopen_match(db, match_id, user_id)
    return _build_match_out(match, db)


@router.post("/matches/{match_id}/postpone", response_model=MatchOut)
def admin_postpone_match(
    match_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    match = postpone_match(db, match_id, user_id)
    return _build_match_out(match, db)


# ─── Players ─────────────────────────────────────────────────────────────────

@router.post("/players", response_model=PlayerOut)
def admin_create_player(
    data: PlayerCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    team_id = data.team_id
    if not team_id:
        team = db.query(Team).first()
        if not team:
            raise HTTPException(status_code=400, detail="No teams exist yet to register player")
        team_id = team.id
    else:
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=400, detail="Team not found")

    # Check duplicate
    dup = db.query(Player).filter(
        Player.name.ilike(data.name.strip()),
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail=f"Player '{data.name}' already registered in club")

    player = Player(
        name=data.name.strip(),
        team_id=team_id,
        jersey_number=data.jersey_number,
        photo_url=data.photo_url,
        is_active=data.is_active,
        status_note=data.status_note,
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.patch("/players/{player_id}", response_model=PlayerOut)
def admin_update_player(
    player_id: int,
    data: PlayerUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    if data.name is not None:
        player.name = data.name.strip()
    if data.team_id is not None:
        team = db.query(Team).filter(Team.id == data.team_id).first()
        if not team:
            raise HTTPException(status_code=400, detail="Team not found")
        player.team_id = data.team_id
    if data.jersey_number is not None:
        player.jersey_number = data.jersey_number
    if data.photo_url is not None:
        player.photo_url = data.photo_url.strip() if data.photo_url and data.photo_url.strip() else None
    if data.is_active is not None:
        player.is_active = data.is_active
    if data.status_note is not None:
        player.status_note = data.status_note

    db.commit()
    db.refresh(player)
    return player


# ─── Teams ───────────────────────────────────────────────────────────────────

@router.post("/teams", response_model=TeamOut)
def admin_create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    league = get_or_create_league(db)
    team_count = db.query(Team).filter(Team.league_id == league.id).count()
    if team_count >= 2:
        raise HTTPException(status_code=400, detail="League already has 2 teams")

    team = Team(
        league_id=league.id,
        name=data.name,
        captain_name=data.captain_name,
        color=data.color,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.patch("/teams/{team_id}", response_model=TeamOut)
def admin_update_team(
    team_id: int,
    data: TeamUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if data.name is not None:
        team.name = data.name
    if data.captain_name is not None:
        team.captain_name = data.captain_name
    if data.color is not None:
        team.color = data.color

    db.commit()
    db.refresh(team)
    return team


@router.post("/matches/add-next", response_model=MatchOut)
def admin_add_next_match(
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    match = add_next_match(db, user_id)
    return _build_match_out(match, db)


@router.delete("/matches/{match_id}", response_model=MessageResponse)
def admin_delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    delete_single_match(db, match_id, user_id)
    return MessageResponse(message=f"Match #{match_id} deleted successfully.")


@router.patch("/league", response_model=LeagueOut)
def admin_update_league_settings(
    data: LeagueUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    league = update_league(db, data, user_id)
    return league


@router.post("/league/reset-season", response_model=MessageResponse)
def admin_reset_season(
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    league = reset_season(db, user_id)
    return MessageResponse(
        message=f"League season reset successfully. All {league.total_matches} fixtures are now scheduled for the new season!"
    )


# ─── Audit Logs ──────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=List[AuditLogOut])
def admin_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user_id: int = Depends(_admin_user_id),
):
    offset = (page - 1) * page_size
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    result = []
    user_cache: dict[int, str] = {}
    for log in logs:
        username = None
        if log.user_id:
            if log.user_id not in user_cache:
                u = db.query(User).filter(User.id == log.user_id).first()
                user_cache[log.user_id] = u.username if u else "unknown"
            username = user_cache[log.user_id]

        result.append(AuditLogOut(
            id=log.id,
            user_id=log.user_id,
            username=username,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            before_value=log.before_value,
            after_value=log.after_value,
            ip_address=log.ip_address,
            created_at=log.created_at,
        ))
    return result
