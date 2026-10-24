import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text, Enum as SAEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    admin = "admin"
    viewer = "viewer"


class MatchStatus(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    postponed = "postponed"


# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.viewer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    audit_logs = relationship("AuditLog", back_populates="user")


# ─── League ──────────────────────────────────────────────────────────────────

class League(Base):
    __tablename__ = "leagues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    total_matches = Column(Integer, nullable=False, default=10)
    season = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    teams = relationship("Team", back_populates="league")
    matches = relationship("Match", back_populates="league")


# ─── Team ────────────────────────────────────────────────────────────────────

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    name = Column(String(100), nullable=False)
    captain_name = Column(String(100), nullable=False)
    color = Column(String(20), nullable=True, default="#00bcd4")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    league = relationship("League", back_populates="teams")
    players = relationship("Player", back_populates="team")
    home_results = relationship(
        "MatchTeamResult",
        foreign_keys="MatchTeamResult.team_id",
        back_populates="team",
    )

    __table_args__ = (
        UniqueConstraint("league_id", "name", name="uq_team_league_name"),
    )


# ─── Player ──────────────────────────────────────────────────────────────────

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    jersey_number = Column(Integer, nullable=True)
    photo_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    status_note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    team = relationship("Team", back_populates="players")
    goal_records = relationship("GoalRecord", back_populates="player")

    __table_args__ = (
        UniqueConstraint("team_id", "name", name="uq_player_team_name"),
        Index("ix_player_name", "name"),
    )


# ─── Match ───────────────────────────────────────────────────────────────────

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    match_number = Column(Integer, nullable=False)
    match_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(MatchStatus), nullable=False, default=MatchStatus.scheduled)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    league = relationship("League", back_populates="matches")
    team_results = relationship(
        "MatchTeamResult", back_populates="match", cascade="all, delete-orphan"
    )
    goal_records = relationship(
        "GoalRecord", back_populates="match", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("league_id", "match_number", name="uq_match_league_number"),
    )


# ─── MatchTeamResult ─────────────────────────────────────────────────────────

class MatchTeamResult(Base):
    """Stores each team's score for a match."""

    __tablename__ = "match_team_results"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    goals_scored = Column(Integer, nullable=False, default=0)

    match = relationship("Match", back_populates="team_results")
    team = relationship("Team", foreign_keys=[team_id], back_populates="home_results")

    __table_args__ = (
        UniqueConstraint("match_id", "team_id", name="uq_result_match_team"),
    )


# ─── GoalRecord ──────────────────────────────────────────────────────────────

class GoalRecord(Base):
    """Stores goals scored by individual players in a match."""

    __tablename__ = "goal_records"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    goals = Column(Integer, nullable=False, default=1)
    is_own_goal = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    match = relationship("Match", back_populates="goal_records")
    player = relationship("Player", back_populates="goal_records")
    team = relationship("Team", foreign_keys=[team_id])

    __table_args__ = (
        UniqueConstraint("match_id", "player_id", name="uq_goal_match_player"),
        Index("ix_goal_match_id", "match_id"),
        Index("ix_goal_player_id", "player_id"),
    )


# ─── AuditLog ────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(Integer, nullable=True)
    before_value = Column(Text, nullable=True)
    after_value = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="audit_logs")
    Index("ix_audit_created_at", "created_at")
