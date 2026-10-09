from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.config import settings
from app.utils.security import decode_access_token

security = HTTPBearer(auto_error=False)
ACCESS_TOKEN_COOKIE = "access_token"


def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None, alias=ACCESS_TOKEN_COOKIE),
) -> User:
    """Authenticate from a Bearer header or the secure HttpOnly cookie.

    Bearer support is retained for API clients/backward compatibility, while
    the browser uses the HttpOnly cookie so JavaScript cannot read the token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = auth.credentials if auth else access_token
    if not token:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
