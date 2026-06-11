from fastapi import APIRouter, Query
from app.api.v1.deps import CurrentUser, DB
from app.schemas.destination import DestinationOut
from app.models.destination import Destination

router = APIRouter(prefix="/destinations", tags=["destinations"])


@router.get("", response_model=list[DestinationOut])
def list_destinations(_: CurrentUser, db: DB):
    return db.query(Destination).order_by(Destination.city).all()


@router.get("/search", response_model=list[DestinationOut])
def search_destinations(q: str = Query(min_length=1), _: CurrentUser = None, db: DB = None):
    pattern = f"%{q.lower()}%"
    return (
        db.query(Destination)
        .filter(
            Destination.city.ilike(pattern)
            | Destination.country.ilike(pattern)
            | Destination.name.ilike(pattern)
        )
        .limit(20)
        .all()
    )
