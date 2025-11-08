"""
安全功能：JWT Token、密碼雜湊
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# 密碼加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證密碼

    Args:
        plain_password: 明文密碼
        hashed_password: 雜湊密碼

    Returns:
        bool: 密碼是否正確
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    產生密碼雜湊

    Args:
        password: 明文密碼

    Returns:
        str: 雜湊後的密碼
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    建立 JWT Access Token

    Args:
        data: 要編碼的資料（通常包含 user_id, email 等）
        expires_delta: 過期時間增量（可選）

    Returns:
        str: JWT token

    使用範例:
    ```python
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    ```
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    建立 JWT Refresh Token

    Args:
        data: 要編碼的資料

    Returns:
        str: Refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "refresh"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    解碼 JWT Token

    Args:
        token: JWT token

    Returns:
        dict | None: 解碼後的資料，失敗則返回 None
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    驗證密碼強度

    Args:
        password: 密碼

    Returns:
        tuple[bool, str]: (是否有效, 錯誤訊息)
    """
    if len(password) < settings.MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters"

    # 可選：要求包含數字、大小寫字母等
    # has_digit = any(c.isdigit() for c in password)
    # has_upper = any(c.isupper() for c in password)
    # has_lower = any(c.islower() for c in password)

    return True, ""
