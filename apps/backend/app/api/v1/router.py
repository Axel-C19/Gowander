from fastapi import APIRouter
from app.api.v1.endpoints import auth, destinations, places, swipe, itinerary, social, explore, flights

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(destinations.router)
api_router.include_router(places.router)
api_router.include_router(swipe.router)
api_router.include_router(itinerary.router)
api_router.include_router(social.router)
api_router.include_router(explore.router)
api_router.include_router(flights.router)
