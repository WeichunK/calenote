"""
Authentication API Tests

Tests for user registration, login, token refresh, and password management.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


@pytest.mark.auth
@pytest.mark.asyncio
class TestUserRegistration:
    """Test user registration endpoint."""

    async def test_register_user_success(self, async_client: AsyncClient):
        """Test successful user registration."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "newpassword123",
                "password_confirm": "newpassword123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert "id" in data
        assert "hashed_password" not in data  # Password should not be returned

    async def test_register_duplicate_email(
        self, async_client: AsyncClient, test_user: User
    ):
        """Test registration with duplicate email."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user.email,
                "username": "differentuser",
                "password": "password123",
                "password_confirm": "password123",
            },
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    async def test_register_duplicate_username(
        self, async_client: AsyncClient, test_user: User
    ):
        """Test registration with duplicate username."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "different@example.com",
                "username": test_user.username,
                "password": "password123",
                "password_confirm": "password123",
            },
        )
        assert response.status_code == 400
        assert "already taken" in response.json()["detail"].lower()

    async def test_register_password_mismatch(self, async_client: AsyncClient):
        """Test registration with mismatched passwords."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "username": "username",
                "password": "password123",
                "password_confirm": "differentpassword",
            },
        )
        assert response.status_code == 422  # Validation error

    async def test_register_weak_password(self, async_client: AsyncClient):
        """Test registration with weak password."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "username": "username",
                "password": "weak",
                "password_confirm": "weak",
            },
        )
        assert response.status_code == 422  # Validation error

    async def test_register_invalid_email(self, async_client: AsyncClient):
        """Test registration with invalid email format."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "notanemail",
                "username": "username",
                "password": "password123",
                "password_confirm": "password123",
            },
        )
        assert response.status_code == 422

    async def test_register_invalid_username(self, async_client: AsyncClient):
        """Test registration with invalid username (contains special characters)."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "username": "user@name!",
                "password": "password123",
                "password_confirm": "password123",
            },
        )
        assert response.status_code == 422


@pytest.mark.auth
@pytest.mark.asyncio
class TestUserLogin:
    """Test user login endpoint."""

    async def test_login_success(self, async_client: AsyncClient, test_user: User):
        """Test successful login."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert data["user"]["email"] == test_user.email

    async def test_login_wrong_password(
        self, async_client: AsyncClient, test_user: User
    ):
        """Test login with incorrect password."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        """Test login with non-existent email."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 401

    async def test_login_inactive_user(
        self, async_client: AsyncClient, inactive_user: User
    ):
        """Test login with inactive user account."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": inactive_user.email,
                "password": "testpassword123",
            },
        )
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()


@pytest.mark.auth
@pytest.mark.asyncio
class TestTokenRefresh:
    """Test token refresh endpoint."""

    async def test_refresh_token_success(
        self, async_client: AsyncClient, test_user: User
    ):
        """Test successful token refresh."""
        # First login to get refresh token
        login_response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Use refresh token to get new access token
        response = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data

    async def test_refresh_token_invalid(self, async_client: AsyncClient):
        """Test refresh with invalid token."""
        response = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"},
        )
        assert response.status_code == 401


@pytest.mark.auth
@pytest.mark.asyncio
class TestCurrentUser:
    """Test get current user endpoint."""

    async def test_get_current_user_success(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test getting current user information."""
        response = await async_client.get(
            "/api/v1/auth/me",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username
        assert data["id"] == str(test_user.id)

    async def test_get_current_user_no_token(self, async_client: AsyncClient):
        """Test getting current user without token."""
        response = await async_client.get("/api/v1/auth/me")
        assert response.status_code == 403  # No authorization header

    async def test_get_current_user_invalid_token(self, async_client: AsyncClient):
        """Test getting current user with invalid token."""
        response = await async_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401


@pytest.mark.auth
@pytest.mark.asyncio
class TestPasswordChange:
    """Test password change endpoint."""

    async def test_change_password_success(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test successful password change."""
        response = await async_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "testpassword123",
                "new_password": "newpassword456",
                "new_password_confirm": "newpassword456",
            },
        )
        assert response.status_code == 200

        # Verify can login with new password
        login_response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "newpassword456",
            },
        )
        assert login_response.status_code == 200

    async def test_change_password_wrong_current(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test password change with wrong current password."""
        response = await async_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword456",
                "new_password_confirm": "newpassword456",
            },
        )
        assert response.status_code == 400

    async def test_change_password_mismatch(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test password change with mismatched new passwords."""
        response = await async_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "testpassword123",
                "new_password": "newpassword456",
                "new_password_confirm": "differentpassword",
            },
        )
        assert response.status_code == 422

    async def test_change_password_no_auth(self, async_client: AsyncClient):
        """Test password change without authentication."""
        response = await async_client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "testpassword123",
                "new_password": "newpassword456",
                "new_password_confirm": "newpassword456",
            },
        )
        assert response.status_code == 403


@pytest.mark.auth
@pytest.mark.asyncio
class TestLogout:
    """Test logout endpoint."""

    async def test_logout_success(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test successful logout."""
        response = await async_client.post(
            "/api/v1/auth/logout",
            headers=auth_headers,
        )
        assert response.status_code == 200

    async def test_logout_no_auth(self, async_client: AsyncClient):
        """Test logout without authentication."""
        response = await async_client.post("/api/v1/auth/logout")
        assert response.status_code == 403
