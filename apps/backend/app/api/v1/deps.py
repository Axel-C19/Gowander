import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User

bearer = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = uuid.UUID(decode_access_token(credentials.credentials))
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[Session, Depends(get_db)]
