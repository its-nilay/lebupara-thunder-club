import pytest
from app.models.models import Match, MatchStatus, Player
from app.services.match_service import (
    postpone_match,
    reopen_match,
    save_match_result,
    update_league,
    add_next_match,
    delete_single_match,
)
from app.services.league_service import calculate_standings, calculate_top_scorers
from app.schemas.schemas import MatchResultInput, GoalRecordCreate, LeagueUpdate
from fastapi import HTTPException


class TestMatchManagement:
    def test_postpone_and_reopen_match(self, db, league, teams):
        t1, t2 = teams
        match = Match(
            league_id=league.id,
            match_number=4,
            status=MatchStatus.scheduled,
        )
        db.add(match)
        db.commit()
        db.refresh(match)

        # Admin mistakenly postpones match
        postponed = postpone_match(db, match.id)
        assert postponed.status == MatchStatus.postponed

        # Standings should show 0 matches played
        standings = calculate_standings(db, league.id)
        for s in standings:
            assert s.mp == 0

        # Admin clicks "Reopen Fixture" to fix the mistake
        reopened = reopen_match(db, match.id)
        assert reopened.status == MatchStatus.scheduled

        # Standings still unaffected
        standings = calculate_standings(db, league.id)
        for s in standings:
            assert s.mp == 0

        # Attempting to reopen already scheduled match raises 400
        with pytest.raises(HTTPException) as exc:
            reopen_match(db, match.id)
        assert exc.value.status_code == 400

    def test_reopen_completed_match_clears_standings(self, db, league, teams):
        t1, t2 = teams
        match = Match(
            league_id=league.id,
            match_number=5,
            status=MatchStatus.scheduled,
        )
        db.add(match)
        db.commit()
        db.refresh(match)

        # Complete match
        sub = MatchResultInput(
            team1_id=t1.id,
            team1_goals=2,
            team2_id=t2.id,
            team2_goals=1,
            goal_records=[],
        )
        save_match_result(db, match.id, sub)

        s_before = calculate_standings(db, league.id)
        assert any(s.pts == 3 for s in s_before)

        # Admin reopens completed match to correct data entry
        reopened = reopen_match(db, match.id)
        assert reopened.status == MatchStatus.scheduled

        s_after = calculate_standings(db, league.id)
        for s in s_after:
            assert s.mp == 0
            assert s.pts == 0

    def test_own_goal_credited_to_opposing_side(self, db, league, teams):
        t1, t2 = teams
        # Create player
        p_suvradip_side = Player(name="Anirban", is_active=True, team_id=t1.id)
        db.add(p_suvradip_side)
        db.commit()
        db.refresh(p_suvradip_side)

        match = Match(
            league_id=league.id,
            match_number=6,
            status=MatchStatus.scheduled,
        )
        db.add(match)
        db.commit()
        db.refresh(match)

        # Score: Suvradip (t1) 0 - 1 Arnab (t2)
        # Goal scored by Anirban as OWN GOAL attributed to Side ARNAB (t2)
        sub = MatchResultInput(
            team1_id=t1.id,
            team1_goals=0,
            team2_id=t2.id,
            team2_goals=1,
            goal_records=[
                GoalRecordCreate(
                    player_id=p_suvradip_side.id,
                    team_id=t2.id,  # Side: ARNAB receiving the goal
                    goals=1,
                    is_own_goal=True,
                )
            ],
        )
        save_match_result(db, match.id, sub)

        # Check standings: t2 (Arnab) should have 1 Win (3 pts), t1 (Suvradip) should have 0 pts
        standings = calculate_standings(db, league.id)
        arnab_st = next(s for s in standings if s.team_id == t2.id)
        suvradip_st = next(s for s in standings if s.team_id == t1.id)
        assert arnab_st.w == 1
        assert arnab_st.pts == 3
        assert arnab_st.gs == 1
        assert arnab_st.gc == 0
        assert arnab_st.gd == 1
        assert suvradip_st.l == 1
        assert suvradip_st.pts == 0
        assert suvradip_st.gs == 0
        assert suvradip_st.gc == 1
        assert suvradip_st.gd == -1

        # Check Golden Boot: Anirban must NOT receive credit for the own goal
        top_scorers = calculate_top_scorers(db, league.id)
        anirban_stat = next((ts for ts in top_scorers if ts.player_name == "Anirban"), None)
        assert anirban_stat is not None
        assert anirban_stat.total_goals == 0

    def test_reset_season_resets_fixtures_and_clears_results(self, db, league, teams):
        from app.services.match_service import reset_season
        t1, t2 = teams

        # Create 2 completed matches
        for num in [1, 2]:
            m = Match(league_id=league.id, match_number=num, status=MatchStatus.scheduled)
            db.add(m)
            db.commit()
            db.refresh(m)
            save_match_result(
                db,
                m.id,
                MatchResultInput(
                    team1_id=t1.id,
                    team1_goals=2,
                    team2_id=t2.id,
                    team2_goals=1,
                    goal_records=[],
                ),
            )

        # Standings should show matches played
        st_before = calculate_standings(db, league.id)
        assert any(s.mp > 0 for s in st_before)

        # Admin resets season for new edition
        reset_season(db)

        # All matches are back to scheduled
        matches = db.query(Match).filter(Match.league_id == league.id).all()
        assert len(matches) >= 2
        for m in matches:
            assert m.status == MatchStatus.scheduled
            assert m.completed_at is None

        # Standings are clean
        st_after = calculate_standings(db, league.id)
        for s in st_after:
            assert s.mp == 0
            assert s.pts == 0

    def test_update_match_date_on_scheduled_and_completed_matches(self, db, league, teams):
        from datetime import datetime, timezone
        t1, t2 = teams

        # 1. Scheduled match date update
        m1 = Match(league_id=league.id, match_number=8, status=MatchStatus.scheduled)
        db.add(m1)
        db.commit()
        db.refresh(m1)

        sched_dt = datetime(2026, 10, 25, 7, 0, 0, tzinfo=timezone.utc)
        m1.match_date = sched_dt
        db.commit()
        db.refresh(m1)
        # SQLite stores datetimes without timezone offset
        assert m1.match_date.replace(tzinfo=timezone.utc) == sched_dt

        # 2. Complete match with date provided in MatchResultInput
        comp_dt = datetime(2026, 10, 18, 7, 0, 0, tzinfo=timezone.utc)
        save_match_result(
            db,
            m1.id,
            MatchResultInput(
                team1_id=t1.id,
                team1_goals=3,
                team2_id=t2.id,
                team2_goals=1,
                match_date=comp_dt,
                notes="Morning 7 AM derby fixture",
                goal_records=[],
            ),
        )
        db.refresh(m1)
        assert m1.status == MatchStatus.completed
        assert m1.match_date.replace(tzinfo=timezone.utc) == comp_dt
        assert m1.notes == "Morning 7 AM derby fixture"

        # 3. Edit date on already completed match without reopening
        updated_comp_dt = datetime(2026, 10, 18, 7, 30, 0, tzinfo=timezone.utc)
        m1.match_date = updated_comp_dt
        db.commit()
        db.refresh(m1)
        assert m1.status == MatchStatus.completed
        assert m1.match_date.replace(tzinfo=timezone.utc) == updated_comp_dt

        # 4. Verify MatchUpdate accepts empty string without 422 error
        from app.schemas.schemas import MatchUpdate
        mu = MatchUpdate.model_validate({"match_date": "", "notes": "Fixture postponed"})
        assert mu.match_date is None
        assert mu.notes == "Fixture postponed"

    def test_dynamic_tournament_length_updates(self, db, league, teams):
        assert league.total_matches == 10
        # Seed initial 10 matches
        for num in range(1, 11):
            db.add(Match(league_id=league.id, match_number=num, status=MatchStatus.scheduled))
        db.commit()

        existing_matches = db.query(Match).filter(Match.league_id == league.id).all()
        assert len(existing_matches) == 10

        # 1. Expand tournament to 14 matches
        upd = update_league(db, LeagueUpdate(total_matches=14, name="Expanded Super League"))
        assert upd.total_matches == 14
        assert upd.name == "Expanded Super League"
        all_matches = db.query(Match).filter(Match.league_id == league.id).order_by(Match.match_number).all()
        assert len(all_matches) == 14
        assert [m.match_number for m in all_matches] == list(range(1, 15))

        # 2. Add single next match (Match #15)
        m15 = add_next_match(db, league.id)
        assert m15.match_number == 15
        assert m15.status == MatchStatus.scheduled
        db.refresh(league)
        assert league.total_matches == 15

        # 3. Delete unplayed Match #15
        delete_single_match(db, m15.id)
        db.refresh(league)
        assert league.total_matches == 14
        remaining = db.query(Match).filter(Match.league_id == league.id).all()
        assert len(remaining) == 14
        assert not any(m.match_number == 15 for m in remaining)

        # 4. Cannot delete completed match
        m1 = db.query(Match).filter(Match.league_id == league.id, Match.match_number == 1).first()
        m1.status = MatchStatus.completed
        db.commit()
        with pytest.raises(HTTPException) as exc:
            delete_single_match(db, m1.id)
        assert exc.value.status_code == 400

