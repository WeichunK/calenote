"""
認證 (Authentication) Pydantic Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator


class UserBase(BaseModel):
    """User 基礎 schema"""
    email: EmailStr = Field(..., description="使用者 Email")
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$', description="使用者名稱（僅字母、數字、底線）")


class UserRegister(UserBase):
    """使用者註冊 schema"""
    password: str = Field(..., min_length=8, max_length=128, description="密碼（至少 8 個字元）")
    password_confirm: str = Field(..., description="確認密碼")

    @field_validator('password_confirm')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v


class UserLogin(BaseModel):
    """使用者登入 schema"""
    email: EmailStr = Field(..., description="使用者 Email")
    password: str = Field(..., description="密碼")


class UserResponse(UserBase):
    """使用者資訊回應 schema"""
    id: UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Token 回應 schema"""
    access_token: str = Field(..., description="Access Token（用於 API 請求）")
    refresh_token: str = Field(..., description="Refresh Token（用於刷新 Access Token）")
    token_type: str = Field("bearer", description="Token 類型")
    expires_in: int = Field(..., description="Access Token 過期時間（秒）")


class TokenRefreshRequest(BaseModel):
    """刷新 Token 請求"""
    refresh_token: str = Field(..., description="Refresh Token")


class TokenRefreshResponse(BaseModel):
    """刷新 Token 回應"""
    access_token: str = Field(..., description="新的 Access Token")
    token_type: str = Field("bearer", description="Token 類型")
    expires_in: int = Field(..., description="Access Token 過期時間（秒）")


class LoginResponse(BaseModel):
    """登入回應 schema"""
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class PasswordChangeRequest(BaseModel):
    """修改密碼請求"""
    current_password: str = Field(..., description="當前密碼")
    new_password: str = Field(..., min_length=8, max_length=128, description="新密碼")
    new_password_confirm: str = Field(..., description="確認新密碼")

    @field_validator('new_password_confirm')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


class PasswordResetRequest(BaseModel):
    """重設密碼請求（忘記密碼）"""
    email: EmailStr = Field(..., description="使用者 Email")


class PasswordResetConfirm(BaseModel):
    """確認重設密碼"""
    token: str = Field(..., description="重設密碼 Token")
    new_password: str = Field(..., min_length=8, max_length=128, description="新密碼")
    new_password_confirm: str = Field(..., description="確認新密碼")

    @field_validator('new_password_confirm')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v
