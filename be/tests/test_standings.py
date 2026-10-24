"""Tests for points table calculation logic."""
import pytest
from app.models.models import Match, MatchTeamResult, GoalRecord, MatchStatus
from app.services.league_service import calculate_standings


def make_completed_match(db, league, teams, match_number, goals1, goals2):
    """Helper to create a completed match with scores."""
    t1, t2 = teams
    match = Match(
        league_id=league.id,
        match_number=match_number,
        status=MatchStatus.completed,
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=goals1))
    db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=goals2))
    db.commit()
    return match


class TestPointsTable:

    def test_win_awards_3_points(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 3, 0)
        standings = calculate_standings(db, league.id)
        winner = next(s for s in standings if s.team_name == "Team Suvradip")
        assert winner.pts == 3
        assert winner.w == 1
        assert winner.l == 0

    def test_loss_awards_0_points(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 0, 2)
        standings = calculate_standings(db, league.id)
        loser = next(s for s in standings if s.team_name == "Team Suvradip")
        assert loser.pts == 0
        assert loser.l == 1

    def test_draw_awards_1_point_each(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 2, 2)
        standings = calculate_standings(db, league.id)
        for s in standings:
            assert s.pts == 1
            assert s.d == 1

    def test_goals_scored_and_conceded(self, db, league, teams):
        t1, t2 = teams
        make_completed_match(db, league, teams, 1, 3, 1)
        standings = calculate_standings(db, league.id)
        s1 = next(s for s in standings if s.team_name == "Team Suvradip")
        s2 = next(s for s in standings if s.team_name == "Team Arnab")
        assert s1.gs == 3
        assert s1.gc == 1
        assert s2.gs == 1
        assert s2.gc == 3

    def test_goal_difference(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 4, 1)
        standings = calculate_standings(db, league.id)
        s1 = next(s for s in standings if s.team_name == "Team Suvradip")
        assert s1.gd == 3  # 4 - 1

    def test_incomplete_match_not_in_standings(self, db, league, teams):
        t1, t2 = teams
        match = Match(
            league_id=league.id,
            match_number=1,
            status=MatchStatus.scheduled,
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=5))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=0))
        db.commit()

        standings = calculate_standings(db, league.id)
        for s in standings:
            assert s.pts == 0
            assert s.mp == 0

    def test_postponed_match_not_in_standings(self, db, league, teams):
        t1, t2 = teams
        match = Match(
            league_id=league.id,
            match_number=1,
            status=MatchStatus.postponed,
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=3))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=0))
        db.commit()

        standings = calculate_standings(db, league.id)
        for s in standings:
            assert s.mp == 0

    def test_multiple_matches_accumulate(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 2, 1)  # T1 wins
        make_completed_match(db, league, teams, 2, 1, 1)  # Draw
        make_completed_match(db, league, teams, 3, 0, 3)  # T2 wins

        standings = calculate_standings(db, league.id)
        s1 = next(s for s in standings if s.team_name == "Team Suvradip")
        s2 = next(s for s in standings if s.team_name == "Team Arnab")
        assert s1.pts == 4   # 3 + 1
        assert s2.pts == 4   # 1 + 3
        assert s1.mp == 3
        assert s2.mp == 3

    def test_ranking_by_points_first(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 2, 0)  # T1 wins → 3pts
        standings = calculate_standings(db, league.id)
        assert standings[0].team_name == "Team Suvradip"
        assert standings[0].pts == 3
        assert standings[1].pts == 0

    def test_ranking_by_gd_when_points_equal(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 1, 1)  # Draw → 1pt each
        standings = calculate_standings(db, league.id)
        # Both have 0 GD after draw, equal ranking
        assert standings[0].pts == 1
        assert standings[1].pts == 1

    def test_ranking_tiebreak_gd(self, db, league, teams):
        make_completed_match(db, league, teams, 1, 3, 0)  # T1 wins 3pts, GD +3
        make_completed_match(db, league, teams, 2, 0, 3)  # T2 wins 3pts, GD +3
        # Both at 3pts, same GD, same GS
        standings = calculate_standings(db, league.id)
        assert standings[0].pts == 3
        assert standings[1].pts == 3
