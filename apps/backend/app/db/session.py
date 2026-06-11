from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,         # Validates connection before use
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """FastAPI dependency: yields a db session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
