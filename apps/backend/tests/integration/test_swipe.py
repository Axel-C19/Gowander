"""Functional tests — R-05/R-06: swipe sessions and accept/reject actions."""


def create_session(client, headers, destination):
    return client.post(
        "/api/v1/swipe/session",
        json={"destination_id": str(destination.id)},
        headers=headers,
    )


class TestSwipeSession:
    def test_create_session(self, client, auth_headers, destination):
        r = create_session(client, auth_headers, destination)
        assert r.status_code == 201
        assert r.json()["completed"] is False

    def test_requires_auth(self, client, destination):
        r = client.post("/api/v1/swipe/session", json={"destination_id": str(destination.id)})
        assert r.status_code in (401, 403)


class TestSwipeActions:
    def test_record_accept_and_reject(self, client, auth_headers, destination, places):
        session_id = create_session(client, auth_headers, destination).json()["id"]
        for place, decision in zip(places[:2], ["accepted", "rejected"]):
            r = client.post(
                f"/api/v1/swipe/session/{session_id}/action",
                json={"place_id": str(place.id), "decision": decision},
                headers=auth_headers,
            )
            assert r.status_code == 204

    def test_action_on_unknown_session_404(self, client, auth_headers, places):
        r = client.post(
            "/api/v1/swipe/session/00000000-0000-0000-0000-000000000000/action",
            json={"place_id": str(places[0].id), "decision": "accepted"},
            headers=auth_headers,
        )
        assert r.status_code == 404

    def test_action_on_completed_session_409(self, client, auth_headers, completed_session, places):
        r = client.post(
            f"/api/v1/swipe/session/{completed_session.id}/action",
            json={"place_id": str(places[0].id), "decision": "accepted"},
            headers=auth_headers,
        )
        assert r.status_code == 409


class TestCompleteSession:
    def test_complete_marks_session(self, client, auth_headers, destination):
        session_id = create_session(client, auth_headers, destination).json()["id"]
        r = client.post(f"/api/v1/swipe/session/{session_id}/complete", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["completed"] is True
