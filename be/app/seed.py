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
                {"num": i + 1, "date": now + timedelta(days=(i * 2)), "status": MatchStatus.scheduled, "notes": f"Match #{i + 1}" if i > 0 else "Opening Derby Fixture"}
                for i in range(10)
            ]

            for m in matches_data:
                match = Match(
                    league_id=league.id,
                    match_number=m["num"],
                    match_date=m["date"],
                    status=m["status"],
                    notes=m.get("notes"),
                    completed_at=None
                )
                db.add(match)

            db.commit()
            print("Created all 10 league matches scheduled for the new season")

        # Admin user (Default admin login: admin / Admin@123)
        admin = db.query(User).filter(User.username == "admin").first()
        from app.core.security import hash_password
        if not admin:
            create_admin_user(db, username="admin", password="Admin@123", email="admin@lebupara.club")
            print("Created default admin user 'admin' with password 'Admin@123'")
        else:
            admin.hashed_password = hash_password("Admin@123")
            db.commit()
            print("Updated default admin user 'admin' with password 'Admin@123'")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
