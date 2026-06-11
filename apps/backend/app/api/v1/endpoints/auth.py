import secrets
import time
from urllib.parse import urlencode, urlparse, quote

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, status
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from app.api.v1.deps import CurrentUser, DB
from app.core.config import get_settings
from app.schemas.auth import (
    LoginRequest,
    AuthResponse,
    UserOut,
    UpdatePreferencesRequest,
    UpdateProfileRequest,
    GoogleLoginRequest,
)
from app.models.user import User
from app.core.security import verify_password, hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
AVATAR_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
AVATAR_MAX_BYTES = 5 * 1024 * 1024


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


@router.put("/me/profile", response_model=UserOut)
def update_profile(body: UpdateProfileRequest, current_user: CurrentUser, db: DB):
    """Update display name and/or bio. Omitted fields are left unchanged."""
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.bio is not None:
        current_user.bio = body.bio or None   # Empty string clears the bio
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(current_user: CurrentUser, db: DB, file: UploadFile = File(...)):
    ext = AVATAR_CONTENT_TYPES.get(file.content_type or "")
    if not ext:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Avatar must be a JPEG, PNG or WebP image",
        )
    data = await file.read()
    if len(data) > AVATAR_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Avatar must be smaller than 5 MB",
        )

    avatars_dir = get_settings().uploads_dir / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    # Timestamped filename: new URL each upload, so image caches never go stale
    filename = f"{current_user.id}-{int(time.time())}.{ext}"
    (avatars_dir / filename).write_bytes(data)

    # Drop the previous upload, if any
    if current_user.avatar_url and current_user.avatar_url.startswith("/static/avatars/"):
        old = avatars_dir / current_user.avatar_url.rsplit("/", 1)[-1]
        old.unlink(missing_ok=True)

    current_user.avatar_url = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


def _verify_google_id_token(id_token: str) -> dict:
    """Verify an ID token against Google's tokeninfo endpoint; return claims."""
    settings = get_settings()
    try:
        resp = httpx.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token}, timeout=10)
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Google to verify the token",
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    claims = resp.json()

    if claims.get("aud") not in settings.google_client_ids:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token was not issued for this app",
        )
    if claims.get("email_verified") not in (True, "true"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email is not verified",
        )
    return claims


def _google_sign_in(db, claims: dict) -> AuthResponse:
    """Find-or-create the user for verified Google claims; return our JWT."""
    email = claims["email"].lower()
    google_id = claims["sub"]

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        # Link to an existing email/password account, or create a new one
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
        else:
            user = User(
                email=email,
                full_name=(claims.get("name") or email.split("@")[0]).strip(),
                # Google-only accounts get an unguessable placeholder password
                hashed_password=hash_password(secrets.token_urlsafe(32)),
                google_id=google_id,
            )
            db.add(user)
    if not user.avatar_url and claims.get("picture"):
        user.avatar_url = claims["picture"]

    db.commit()
    db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/google", response_model=AuthResponse)
def google_login(body: GoogleLoginRequest, db: DB):
    """
    Sign in (or sign up) with a Google ID token obtained on the device.
    The token's audience must match one of our configured OAuth client IDs.
    """
    if not get_settings().google_client_ids:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on this server",
        )
    claims = _verify_google_id_token(body.id_token)
    return _google_sign_in(db, claims)


# ─── Server-side OAuth flow (works inside Expo Go) ─────────────────────────
# Google forbids Expo Go's exp:// redirect, so the browser flow runs against
# this API instead: /google/start sends the user to Google with our public
# https callback; /google/callback exchanges the code and deep-links back
# into the app with a GoWander JWT.

ALLOWED_RETURN_SCHEMES = {"exp", "exps", "gowander", "exp+gowander"}
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
OAUTH_STATE_TTL_SECONDS = 600


def _oauth_redirect_uri(settings) -> str:
    return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/api/v1/auth/google/callback"


def _require_web_flow_config():
    settings = get_settings()
    if not (
        settings.google_web_client_id
        and settings.GOOGLE_OAUTH_CLIENT_SECRET
        and settings.PUBLIC_BASE_URL
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Google sign-in is not configured: set GOOGLE_OAUTH_CLIENT_IDS, "
                "GOOGLE_OAUTH_CLIENT_SECRET and PUBLIC_BASE_URL"
            ),
        )
    return settings


@router.get("/google/start")
def google_start(return_url: str):
    """Entry point opened in the device browser. Redirects to Google."""
    settings = _require_web_flow_config()

    scheme = urlparse(return_url).scheme
    if scheme not in ALLOWED_RETURN_SCHEMES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="return_url must deep-link back into the GoWander app",
        )

    # The signed state both prevents CSRF and carries the deep link home
    state = jwt.encode(
        {
            "ru": return_url,
            "purpose": "google_oauth",
            "exp": int(time.time()) + OAUTH_STATE_TTL_SECONDS,
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    params = urlencode(
        {
            "client_id": settings.google_web_client_id,
            "redirect_uri": _oauth_redirect_uri(settings),
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account",
        }
    )
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}", status_code=302)


@router.get("/google/callback")
def google_callback(
    db: DB,
    state: str,
    code: str | None = None,
    error: str | None = None,
):
    """Google redirects here; we finish sign-in and deep-link into the app."""
    settings = _require_web_flow_config()

    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload.get("purpose") == "google_oauth"
        return_url = payload["ru"]
    except (JWTError, AssertionError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired sign-in state — try again",
        )

    sep = "&" if "?" in return_url else "?"
    if error or not code:
        return RedirectResponse(f"{return_url}{sep}error={quote(error or 'cancelled')}")

    try:
        resp = httpx.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_web_client_id,
                "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
                "redirect_uri": _oauth_redirect_uri(settings),
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
    except httpx.HTTPError:
        return RedirectResponse(f"{return_url}{sep}error=google_unreachable")
    if resp.status_code != 200 or "id_token" not in resp.json():
        return RedirectResponse(f"{return_url}{sep}error=token_exchange_failed")

    try:
        claims = _verify_google_id_token(resp.json()["id_token"])
        auth = _google_sign_in(db, claims)
    except HTTPException as exc:
        return RedirectResponse(f"{return_url}{sep}error={quote(str(exc.detail))}")

    return RedirectResponse(f"{return_url}{sep}token={auth.access_token}")