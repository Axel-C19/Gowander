from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.api.v1.deps import CurrentUser, DB
from app.schemas.auth import LoginRequest, AuthResponse, UserOut, UpdatePreferencesRequest
from app.models.user import User
from app.core.security import verify_password, hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: DB):
    # Check if email already taken
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters",
        )

    user = User(
        email=body.email.lower(),
        full_name=body.full_name.strip(),
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: DB):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )
    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser):
    return current_user


@router.put("/me/preferences", response_model=UserOut)
def update_preferences(body: UpdatePreferencesRequest, current_user: CurrentUser, db: DB):
    current_user.preferences = body.preferences
    db.commit()
    db.refresh(current_user)
    return current_user