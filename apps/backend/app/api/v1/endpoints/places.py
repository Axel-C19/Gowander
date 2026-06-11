from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session
import uuid
from app.api.v1.deps import CurrentUser, DB
from app.schemas.place import PlaceOut
from app.models.place import Place
from app.models.destination import Destination

router = APIRouter(prefix="/destinations/{destination_id}/places", tags=["places"])


@router.get("", response_model=dict)
def get_places_by_destination(
    destination_id: uuid.UUID,
    _: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")

    total = db.query(Place).filter(Place.destination_id == destination_id).count()
    items = (
        db.query(Place)
        .filter(Place.destination_id == destination_id)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "items": [PlaceOut.model_validate(p) for p in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
    }
