"""
Regression — Defect GW-001: a fast double-gesture on the swipe deck sent the
same (session, place) action twice. The second insert hit the DB unique
constraint and surfaced as a 500; the mobile error path then advanced the
card index twice, silently skipping a card.
Fix: client-side re-entry guard + the API now answers a clean 409.
"""


def test_duplicate_action_returns_409_not_500(client, auth_headers, db, test_user, destination, places):
    from app.models.swipe_session import SwipeSession

    session = SwipeSession(user_id=test_user.id, destination_id=destination.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    body = {"place_id": str(places[0].id), "decision": "accepted"}
    first = client.post(
        f"/api/v1/swipe/session/{session.id}/action", json=body, headers=auth_headers,
    )
    assert first.status_code == 204

    second = client.post(
        f"/api/v1/swipe/session/{session.id}/action", json=body, headers=auth_headers,
    )
    assert second.status_code == 409
    assert "already swiped" in second.json()["detail"].lower()
