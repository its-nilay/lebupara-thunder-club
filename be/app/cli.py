"""CLI for admin management."""
import sys
import click
from sqlalchemy import inspect


def init_app_db():
    from app.db.database import engine, Base
    from app.models import models  # noqa: ensure models are imported
    Base.metadata.create_all(bind=engine)


@click.group()
def cli():
    """Lebupara Thunder Club management CLI."""
    pass


@cli.command("create-admin")
@click.option("--username", prompt="Admin username", help="Username for the admin account")
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True, help="Password for the admin account")
@click.option("--email", default=None, help="Email address (optional)")
def create_admin(username: str, password: str, email: str):
    """Create an administrator account."""
    if len(password) < 8:
        click.echo("❌ Password must be at least 8 characters", err=True)
        sys.exit(1)

    try:
        init_app_db()
        from app.db.database import SessionLocal
        from app.services.auth_service import create_admin_user
        db = SessionLocal()
        try:
            user = create_admin_user(db, username, password, email)
            click.echo(f"✅ Admin user '{user.username}' created successfully (ID: {user.id})")
        finally:
            db.close()
    except ValueError as e:
        click.echo(f"❌ {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cli.command("init-league")
@click.option("--team1-name", default="Team Suvradip", help="First team name")
@click.option("--team1-captain", default="Suvradip", help="First captain")
@click.option("--team1-color", default="#00e5ff", help="First team color")
@click.option("--team2-name", default="Team Arnab", help="Second team name")
@click.option("--team2-captain", default="Arnab", help="Second captain")
@click.option("--team2-color", default="#76ff03", help="Second team color")
def init_league(team1_name, team1_captain, team1_color, team2_name, team2_captain, team2_color):
    """Initialize the league with two teams."""
    try:
        init_app_db()
        from app.db.database import SessionLocal
        from app.models.models import League, Team
        from app.core.config import get_settings
        settings = get_settings()

        db = SessionLocal()
        try:
            league = db.query(League).first()
            if not league:
                league = League(name=settings.LEAGUE_NAME, total_matches=settings.TOTAL_MATCHES)
                db.add(league)
                db.commit()
                db.refresh(league)
                click.echo(f"✅ League '{league.name}' created")
            else:
                click.echo(f"ℹ  League already exists: '{league.name}'")

            existing_teams = db.query(Team).filter(Team.league_id == league.id).count()
            if existing_teams >= 2:
                click.echo("ℹ  Teams already configured, skipping.")
                return

            t1 = Team(league_id=league.id, name=team1_name, captain_name=team1_captain, color=team1_color)
            t2 = Team(league_id=league.id, name=team2_name, captain_name=team2_captain, color=team2_color)
            db.add(t1)
            db.add(t2)
            db.commit()
            click.echo(f"✅ Teams created: '{team1_name}' and '{team2_name}'")
        finally:
            db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


if __name__ == "__main__":
    cli()
