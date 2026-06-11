from fastapi import APIRouter, HTTPException
import uuid
from app.api.v1.deps import CurrentUser, DB
from app.schemas.swipe import SwipeSessionOut, SwipeActionIn
from app.models.swipe_session import SwipeSession, SwipeAction

router = APIRouter(prefix="/swipe", tags=["swipe"])


@router.post("/session", response_model=SwipeSessionOut, status_code=201)
def create_session(body: dict, current_user: CurrentUser, db: DB):
    destination_id = body.get("destination_id")
    session = SwipeSession(user_id=current_user.id, destination_id=destination_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/session/{session_id}/action", status_code=204)
def record_action(session_id: uuid.UUID, body: SwipeActionIn, current_user: CurrentUser, db: DB):
    session = db.get(SwipeSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.completed:
        raise HTTPException(status_code=409, detail="Session already completed")

    action = SwipeAction(
        session_id=session_id,
        place_id=body.place_id,
        decision=body.decision,
    )
    db.add(action)
    db.commit()


@router.post("/session/{session_id}/complete", response_model=SwipeSessionOut)
def complete_session(session_id: uuid.UUID, current_user: CurrentUser, db: DB):
    session = db.get(SwipeSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    session.completed = True
    db.commit()
    db.refresh(session)
    return session
