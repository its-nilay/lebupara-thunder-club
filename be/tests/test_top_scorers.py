"""Tests for competition ranking (top scorer) logic."""
import pytest
from app.models.models import Match, MatchTeamResult, GoalRecord, MatchStatus, Player
from app.services.league_service import calculate_top_scorers


def make_goal_record(db, match_id, player_id, team_id, goals, is_own_goal=False):
    gr = GoalRecord(
        match_id=match_id,
        player_id=player_id,
        team_id=team_id,
        goals=goals,
        is_own_goal=is_own_goal,
    )
    db.add(gr)
    db.commit()
    return gr


def make_completed_match(db, league, match_number):
    match = Match(
        league_id=league.id,
        match_number=match_number,
        status=MatchStatus.completed,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def make_scheduled_match(db, league, match_number):
    match = Match(
        league_id=league.id,
        match_number=match_number,
        status=MatchStatus.scheduled,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


class TestTopScorers:

    def test_example_a_competition_ranking(self, db, league, teams, players):
        """Rank 1, 2, 2, 2, 5 distribution."""
        t1, t2 = teams
        p = players  # Alice, Bob, Charlie (T1), Dave, Eve, Frank (T2)

        match = make_completed_match(db, league, 1)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=4))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=7))
        db.commit()

        make_goal_record(db, match.id, p[0].id, t1.id, 4)  # Alice: 4
        make_goal_record(db, match.id, p[1].id, t1.id, 2)  # Bob: 2
        make_goal_record(db, match.id, p[3].id, t2.id, 2)  # Dave: 2
        make_goal_record(db, match.id, p[4].id, t2.id, 2)  # Eve: 2
        make_goal_record(db, match.id, p[5].id, t2.id, 1)  # Frank: 1

        scorers = calculate_top_scorers(db, league.id)
        ranked = {s.player_name: s for s in scorers}

        assert ranked["Alice"].rank == 1
        assert ranked["Bob"].rank == 2
        assert ranked["Dave"].rank == 2
        assert ranked["Eve"].rank == 2
        assert ranked["Frank"].rank == 5

    def test_example_b_competition_ranking(self, db, league, teams, players):
        """Rank 1, 2, 2, 4, 5 distribution."""
        t1, t2 = teams
        p = players

        match = make_completed_match(db, league, 1)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=8))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=9))
        db.commit()

        make_goal_record(db, match.id, p[0].id, t1.id, 5)  # Alice: 5 → Rank 1
        make_goal_record(db, match.id, p[1].id, t1.id, 3)  # Bob: 3 → Rank 2
        make_goal_record(db, match.id, p[3].id, t2.id, 3)  # Dave: 3 → Rank 2
        make_goal_record(db, match.id, p[4].id, t2.id, 2)  # Eve: 2 → Rank 4
        make_goal_record(db, match.id, p[5].id, t2.id, 1)  # Frank: 1 → Rank 5

        scorers = calculate_top_scorers(db, league.id)
        ranked = {s.player_name: s for s in scorers}

        assert ranked["Alice"].rank == 1
        assert ranked["Bob"].rank == 2
        assert ranked["Dave"].rank == 2
        assert ranked["Eve"].rank == 4
        assert ranked["Frank"].rank == 5

    def test_example_c_three_way_tie(self, db, league, teams):
        """Three players rank 1, two players rank 4."""
        t1, t2 = teams
        extra_players = []
        for i, (name, team) in enumerate([("P1", t1), ("P2", t1), ("P3", t2), ("P4", t2), ("P5", t2)]):
            p = Player(name=name, team_id=team.id)
            db.add(p)
            extra_players.append(p)
        db.commit()
        for p in extra_players:
            db.refresh(p)

        match = make_completed_match(db, league, 1)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=8))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=14))
        db.commit()

        make_goal_record(db, match.id, extra_players[0].id, t1.id, 4)  # P1: 4 → Rank 1
        make_goal_record(db, match.id, extra_players[1].id, t1.id, 4)  # P2: 4 → Rank 1
        make_goal_record(db, match.id, extra_players[2].id, t2.id, 4)  # P3: 4 → Rank 1
        make_goal_record(db, match.id, extra_players[3].id, t2.id, 3)  # P4: 3 → Rank 4
        make_goal_record(db, match.id, extra_players[4].id, t2.id, 3)  # P5: 3 → Rank 4

        scorers = calculate_top_scorers(db, league.id)
        ranked = {s.player_name: s for s in scorers}

        assert ranked["P1"].rank == 1
        assert ranked["P2"].rank == 1
        assert ranked["P3"].rank == 1
        assert ranked["P4"].rank == 4
        assert ranked["P5"].rank == 4

    def test_zero_goal_players_included(self, db, league, teams, players):
        """All players appear in leaderboard even with 0 goals."""
        scorers = calculate_top_scorers(db, league.id)
        # All 6 players should appear
        assert len(scorers) == 6
        for s in scorers:
            assert s.total_goals == 0

    def test_goals_from_incomplete_match_excluded(self, db, league, teams, players):
        """Goals in scheduled matches don't count."""
        t1, t2 = teams
        p = players

        match = make_scheduled_match(db, league, 1)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=5))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=0))
        db.commit()
        make_goal_record(db, match.id, p[0].id, t1.id, 5)  # Alice: 5 in scheduled

        scorers = calculate_top_scorers(db, league.id)
        ranked = {s.player_name: s for s in scorers}
        assert ranked["Alice"].total_goals == 0

    def test_own_goals_not_credited_to_scorer(self, db, league, teams, players):
        """Own goals don't count in the scorer's total."""
        t1, t2 = teams
        p = players

        match = make_completed_match(db, league, 1)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=0))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=3))
        db.commit()
        make_goal_record(db, match.id, p[0].id, t1.id, 3, is_own_goal=True)  # OG

        scorers = calculate_top_scorers(db, league.id)
        ranked = {s.player_name: s for s in scorers}
        assert ranked["Alice"].total_goals == 0

    def test_alphabetical_does_not_break_ranking_ties(self, db, league, teams, players):
        """Players with same goals share same rank regardless of name order."""
        t1, t2 = teams
        p = players

        match = make_completed_match(db, league, 1)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=2))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=2))
        db.commit()

        make_goal_record(db, match.id, p[0].id, t1.id, 2)  # Alice: 2
        make_goal_record(db, match.id, p[3].id, t2.id, 2)  # Dave: 2

        scorers = calculate_top_scorers(db, league.id)
        ranked = {s.player_name: s for s in scorers}
        # Both should have rank 1 (tied at top)
        assert ranked["Alice"].rank == ranked["Dave"].rank == 1

    def test_goal_changes_recalculate_ranking(self, db, league, teams, players):
        """Verify rankings are recalculated from db state each time."""
        t1, t2 = teams
        p = players

        match = make_completed_match(db, league, 1)
        db.add(MatchTeamResult(match_id=match.id, team_id=t1.id, goals_scored=3))
        db.add(MatchTeamResult(match_id=match.id, team_id=t2.id, goals_scored=1))
        db.commit()

        make_goal_record(db, match.id, p[0].id, t1.id, 3)  # Alice: 3
        make_goal_record(db, match.id, p[3].id, t2.id, 1)  # Dave: 1

        scorers_before = calculate_top_scorers(db, league.id)
        ranked_before = {s.player_name: s for s in scorers_before}
        assert ranked_before["Alice"].rank == 1
        assert ranked_before["Dave"].rank == 2

        # Simulate goal change: update Dave to 4 goals
        gr = db.query(GoalRecord).filter(GoalRecord.player_id == p[3].id).first()
        gr.goals = 4
        db.query(MatchTeamResult).filter(
            MatchTeamResult.match_id == match.id, MatchTeamResult.team_id == t2.id
        ).first().goals_scored = 4
        db.commit()

        scorers_after = calculate_top_scorers(db, league.id)
        ranked_after = {s.player_name: s for s in scorers_after}
        assert ranked_after["Dave"].rank == 1
        assert ranked_after["Alice"].rank == 2
