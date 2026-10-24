from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.models import UserRole, MatchStatus


# ─── Common ──────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateAdminRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    email: Optional[str] = None


# ─── League Schemas ───────────────────────────────────────────────────────────

class LeagueOut(BaseModel):
    id: int
    name: str
    total_matches: int
    season: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class LeagueUpdate(BaseModel):
    name: Optional[str] = None
    total_matches: Optional[int] = Field(None, ge=1, le=200)
    season: Optional[str] = None


# ─── Team Schemas ─────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    captain_name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = "#00bcd4"


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    captain_name: Optional[str] = None
    color: Optional[str] = None


class TeamOut(BaseModel):
    id: int
    name: str
    captain_name: str
    color: Optional[str]

    model_config = {"from_attributes": True}


class TeamStanding(BaseModel):
    position: int
    team_id: int
    team_name: str
    captain_name: str
    color: Optional[str]
    mp: int  # matches played
    w: int   # wins
    d: int   # draws
    l: int   # losses
    gs: int  # goals scored
    gc: int  # goals conceded
    gd: int  # goal difference
    pts: int # points


# ─── Player Schemas ───────────────────────────────────────────────────────────

class PlayerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    team_id: Optional[int] = None
    jersey_number: Optional[int] = None
    is_active: bool = True
    status_note: Optional[str] = None

    @field_validator("jersey_number")
    @classmethod
    def jersey_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Jersey number must be non-negative")
        return v


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    team_id: Optional[int] = None
    jersey_number: Optional[int] = None
    is_active: Optional[bool] = None
    status_note: Optional[str] = None


class PlayerOut(BaseModel):
    id: int
    name: str
    team_id: int
    jersey_number: Optional[int]
    is_active: bool
    status_note: Optional[str] = None
    team: Optional[TeamOut] = None

    model_config = {"from_attributes": True}


class PlayerStats(BaseModel):
    player_id: int
    player_name: str
    team_id: int
    team_name: str
    captain_name: str
    team_color: Optional[str]
    total_goals: int
    rank: int
    matches_played: int


# ─── Goal Record Schemas ──────────────────────────────────────────────────────

class GoalRecordCreate(BaseModel):
    player_id: int
    goals: int = Field(..., ge=0)
    team_id: Optional[int] = None
    is_own_goal: bool = False


class GoalRecordOut(BaseModel):
    id: int
    player_id: int
    player_name: str
    team_id: int
    goals: int
    is_own_goal: bool

    model_config = {"from_attributes": True}


# ─── Match Schemas ────────────────────────────────────────────────────────────

class MatchCreate(BaseModel):
    match_number: int = Field(..., ge=1, le=200)
    match_date: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("match_date", mode="before")
    @classmethod
    def clean_match_date(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v


class MatchUpdate(BaseModel):
    match_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[MatchStatus] = None

    @field_validator("match_date", mode="before")
    @classmethod
    def clean_match_date(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v


class MatchResultInput(BaseModel):
    team1_id: int
    team1_goals: int = Field(..., ge=0)
    team2_id: int
    team2_goals: int = Field(..., ge=0)
    goal_records: List[GoalRecordCreate] = Field(default_factory=list)
    match_date: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("match_date", mode="before")
    @classmethod
    def clean_match_date(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v


class MatchTeamResultOut(BaseModel):
    team_id: int
    team_name: str
    goals_scored: int

    model_config = {"from_attributes": True}


class MatchOut(BaseModel):
    id: int
    match_number: int
    match_date: Optional[datetime]
    status: MatchStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    team_results: List[MatchTeamResultOut] = []
    goal_records: List[GoalRecordOut] = []

    model_config = {"from_attributes": True}


# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_matches: int
    completed_matches: int
    scheduled_matches: int
    postponed_matches: int
    total_goals: int
    standings: List[TeamStanding]
    top_scorers: List[PlayerStats]
    completion_percentage: float
    league: Optional[LeagueOut]


# ─── Audit Log Schemas ────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    username: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[int]
    before_value: Optional[str]
    after_value: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
