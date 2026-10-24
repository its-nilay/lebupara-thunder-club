"""Seed initial data for Lebupara Thunder Club."""
from datetime import datetime, timezone, timedelta
from app.db.database import SessionLocal, engine, Base
from app.models.models import League, Team, Player, Match, MatchTeamResult, GoalRecord, MatchStatus, User, UserRole
from app.services.auth_service import create_admin_user
from app.core.config import get_settings

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        league = db.query(League).first()
        if not league:
            settings = get_settings()
            league = League(
                name="⚡ Lebupara Thunder Club — Premier League ⚡",
                total_matches=10,
                season="Season 1 (2026)"
            )
            db.add(league)
            db.commit()
            db.refresh(league)
            print(f"Created league: {league.name}")

        # Check teams
        teams = db.query(Team).filter(Team.league_id == league.id).all()
        if not teams:
            team1 = Team(
                league_id=league.id,
                name="Team Suvradip",
                captain_name="Suvradip",
                color="#00e5ff"
            )
            team2 = Team(
                league_id=league.id,
                name="Team Arnab",
                captain_name="Arnab",
                color="#76ff03"
            )
            db.add_all([team1, team2])
            db.commit()
            db.refresh(team1)
            db.refresh(team2)
            print("Created teams: Team Suvradip & Team Arnab")
            teams = [team1, team2]
        else:
            team1, team2 = teams[0], teams[1]

        # Check players
        players_t1 = db.query(Player).filter(Player.team_id == team1.id).all()
        if not players_t1:
            p1_list = [
                Player(name="Suvradip", team_id=team1.id, jersey_number=10),
                Player(name="Nilay", team_id=team1.id, jersey_number=7),
                Player(name="Rahul", team_id=team1.id, jersey_number=9),
                Player(name="Sourav", team_id=team1.id, jersey_number=8),
                Player(name="Pritam", team_id=team1.id, jersey_number=4),
                Player(name="Amit", team_id=team1.id, jersey_number=1),
            ]
            db.add_all(p1_list)
            db.commit()
            print("Added Team Suvradip players")

        players_t2 = db.query(Player).filter(Player.team_id == team2.id).all()
        if not players_t2:
            p2_list = [
                Player(name="Arnab", team_id=team2.id, jersey_number=10),
                Player(name="Subhajit", team_id=team2.id, jersey_number=9),
                Player(name="Dipayan", team_id=team2.id, jersey_number=7),
                Player(name="Raktim", team_id=team2.id, jersey_number=11),
                Player(name="Anirban", team_id=team2.id, jersey_number=5),
                Player(name="Suman", team_id=team2.id, jersey_number=1),
            ]
            db.add_all(p2_list)
            db.commit()
            print("Added Team Arnab players")

        # Map player names for goal records
        all_players = {p.name: p for p in db.query(Player).filter(Player.team_id.in_([team1.id, team2.id])).all()}

        # Check matches
        matches_count = db.query(Match).filter(Match.league_id == league.id).count()
        if matches_count == 0:
            now = datetime.now(timezone.utc)
            matches_data = [
                # Match 1: Suvradip 3 - 2 Arnab (Completed)
                {
                    "num": 1,
                    "date": now - timedelta(days=6),
                    "status": MatchStatus.completed,
                    "notes": "Thrilling opening derby! Suvradip scored a brace.",
                    "t1_score": 3,
                    "t2_score": 2,
                    "goals": [
                        (all_players["Suvradip"].id, team1.id, 2, False),
                        (all_players["Nilay"].id, team1.id, 1, False),
                        (all_players["Arnab"].id, team2.id, 1, False),
                        (all_players["Subhajit"].id, team2.id, 1, False),
                    ]
                },
                # Match 2: Suvradip 1 - 1 Arnab (Completed Draw - 1 pt each)
                {
                    "num": 2,
                    "date": now - timedelta(days=4),
                    "status": MatchStatus.completed,
                    "notes": "Tight tactical battle ending in a 1-1 draw.",
                    "t1_score": 1,
                    "t2_score": 1,
                    "goals": [
                        (all_players["Rahul"].id, team1.id, 1, False),
                        (all_players["Dipayan"].id, team2.id, 1, False),
                    ]
                },
                # Match 3: Suvradip 1 - 2 Arnab (Completed - Arnab win)
                {
                    "num": 3,
                    "date": now - timedelta(days=2),
                    "status": MatchStatus.completed,
                    "notes": "Comeback victory for Arnab with 2 late goals.",
                    "t1_score": 1,
                    "t2_score": 2,
                    "goals": [
                        (all_players["Suvradip"].id, team1.id, 1, False),
                        (all_players["Arnab"].id, team2.id, 2, False),
                    ]
                },
                # Matches 4 to 10 scheduled
                {"num": 4, "date": now + timedelta(days=1), "status": MatchStatus.scheduled, "notes": "Clash of the Titans Part 4"},
                {"num": 5, "date": now + timedelta(days=3), "status": MatchStatus.scheduled, "notes": "Mid-season showcase fixture"},
                {"num": 6, "date": now + timedelta(days=5), "status": MatchStatus.scheduled, "notes": "Second-half opener"},
                {"num": 7, "date": now + timedelta(days=7), "status": MatchStatus.scheduled, "notes": "Weekend evening showdown"},
                {"num": 8, "date": now + timedelta(days=9), "status": MatchStatus.scheduled, "notes": "High-stakes title race"},
                {"num": 9, "date": now + timedelta(days=11), "status": MatchStatus.scheduled, "notes": "Penultimate derby match"},
                {"num": 10, "date": now + timedelta(days=13), "status": MatchStatus.scheduled, "notes": "Grand League Finale!"},
            ]

            for m in matches_data:
                match = Match(
                    league_id=league.id,
                    match_number=m["num"],
                    match_date=m["date"],
                    status=m["status"],
                    notes=m.get("notes"),
                    completed_at=m["date"] if m["status"] == MatchStatus.completed else None
                )
                db.add(match)
                db.flush()

                if m["status"] == MatchStatus.completed:
                    db.add(MatchTeamResult(match_id=match.id, team_id=team1.id, goals_scored=m["t1_score"]))
                    db.add(MatchTeamResult(match_id=match.id, team_id=team2.id, goals_scored=m["t2_score"]))
                    for pid, tid, goals, own in m.get("goals", []):
                        db.add(GoalRecord(match_id=match.id, player_id=pid, team_id=tid, goals=goals, is_own_goal=own))

            db.commit()
            print("Created all 10 league matches (3 completed, 7 scheduled)")

        # Admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            create_admin_user(db, username="admin", password="Admin@123456", email="admin@lebupara.club")
            print("Created admin user 'admin' with password 'Admin@123456'")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
