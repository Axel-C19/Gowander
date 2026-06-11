import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import or_, and_

from app.api.v1.deps import CurrentUser, DB
from app.models.user import User
from app.models.social import Friendship, Message
from app.schemas.social import (
    UserPublic,
    FriendRequestIn,
    FriendRequestOut,
    FriendOut,
    MessageIn,
    MessageOut,
)

router = APIRouter(prefix="/social", tags=["social"])


def _friendship_between(db, a: uuid.UUID, b: uuid.UUID) -> Friendship | None:
    return (
        db.query(Friendship)
        .filter(
            or_(
                and_(Friendship.requester_id == a, Friendship.addressee_id == b),
                and_(Friendship.requester_id == b, Friendship.addressee_id == a),
            )
        )
        .first()
    )


def _are_friends(db, a: uuid.UUID, b: uuid.UUID) -> bool:
    f = _friendship_between(db, a, b)
    return bool(f and f.status == "accepted")


# ── Users ──────────────────────────────────────────────────────────────────

@router.get("/users/search", response_model=list[UserPublic])
def search_users(current_user: CurrentUser, db: DB, q: str = Query(min_length=2)):
    pattern = f"%{q.lower()}%"
    return (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.is_active.is_(True),
            or_(User.email.ilike(pattern), User.full_name.ilike(pattern)),
        )
        .limit(20)
        .all()
    )


# ── Friends ────────────────────────────────────────────────────────────────

@router.post("/friends/request", status_code=201, response_model=FriendRequestOut)
def send_friend_request(body: FriendRequestIn, current_user: CurrentUser, db: DB):
    if body.user_id == current_user.id:
        raise HTTPException(status_code=422, detail="You can't add yourself")
    if not db.get(User, body.user_id):
        raise HTTPException(status_code=404, detail="User not found")
    if _friendship_between(db, current_user.id, body.user_id):
        raise HTTPException(status_code=409, detail="Friend request already exists")

    friendship = Friendship(requester_id=current_user.id, addressee_id=body.user_id)
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friendship


@router.get("/friends/requests", response_model=list[FriendRequestOut])
def incoming_requests(current_user: CurrentUser, db: DB):
    return (
        db.query(Friendship)
        .filter(Friendship.addressee_id == current_user.id, Friendship.status == "pending")
        .order_by(Friendship.created_at.desc())
        .all()
    )


@router.post("/friends/requests/{friendship_id}/accept", response_model=FriendRequestOut)
def accept_request(friendship_id: uuid.UUID, current_user: CurrentUser, db: DB):
    friendship = db.get(Friendship, friendship_id)
    if not friendship or friendship.addressee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
    friendship.status = "accepted"
    db.commit()
    db.refresh(friendship)
    return friendship


@router.delete("/friends/requests/{friendship_id}", status_code=204)
def decline_request(friendship_id: uuid.UUID, current_user: CurrentUser, db: DB):
    friendship = db.get(Friendship, friendship_id)
    if not friendship or current_user.id not in (friendship.addressee_id, friendship.requester_id):
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(friendship)
    db.commit()


@router.get("/friends", response_model=list[FriendOut])
def list_friends(current_user: CurrentUser, db: DB):
    friendships = (
        db.query(Friendship)
        .filter(
            Friendship.status == "accepted",
            or_(
                Friendship.requester_id == current_user.id,
                Friendship.addressee_id == current_user.id,
            ),
        )
        .all()
    )
    out = []
    for f in friendships:
        other = f.addressee if f.requester_id == current_user.id else f.requester
        out.append(FriendOut(friendship_id=f.id, user=UserPublic.model_validate(other)))
    return out


# ── Messages ───────────────────────────────────────────────────────────────

@router.post("/messages", status_code=201, response_model=MessageOut)
def send_message(body: MessageIn, current_user: CurrentUser, db: DB):
    if not _are_friends(db, current_user.id, body.recipient_id):
        raise HTTPException(status_code=403, detail="You can only message friends")

    if body.itinerary_id:
        from app.models.itinerary import Itinerary

        trip = db.get(Itinerary, body.itinerary_id)
        if not trip or trip.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Itinerary not found")

    message = Message(
        sender_id=current_user.id,
        recipient_id=body.recipient_id,
        text=body.text,
        itinerary_id=body.itinerary_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/messages/{user_id}", response_model=list[MessageOut])
def conversation(user_id: uuid.UUID, current_user: CurrentUser, db: DB):
    if not _are_friends(db, current_user.id, user_id):
        raise HTTPException(status_code=403, detail="You can only message friends")
    return (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == user_id),
                and_(Message.sender_id == user_id, Message.recipient_id == current_user.id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )
