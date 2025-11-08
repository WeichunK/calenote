"""
Calendar API Tests

Tests for calendar CRUD operations and calendar management.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.calendar import Calendar


@pytest.mark.asyncio
class TestCalendarCreate:
    """Test calendar creation endpoint."""

    async def test_create_calendar_success(
        self, async_client: AsyncClient, auth_headers: dict, sample_calendar_data: dict
    ):
        """Test successful calendar creation."""
        response = await async_client.post(
            "/api/v1/calendars/",
            headers=auth_headers,
            json=sample_calendar_data,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_calendar_data["name"]
        assert data["description"] == sample_calendar_data["description"]
        assert data["color"] == sample_calendar_data["color"]
        assert "id" in data
        assert "owner_id" in data

    async def test_create_calendar_minimal_data(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test creating calendar with only required fields."""
        response = await async_client.post(
            "/api/v1/calendars/",
            headers=auth_headers,
            json={"name": "Minimal Calendar"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Calendar"

    async def test_create_calendar_invalid_color(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test creating calendar with invalid color format."""
        response = await async_client.post(
            "/api/v1/calendars/",
            headers=auth_headers,
            json={
                "name": "Test Calendar",
                "color": "not-a-hex-color",
            },
        )
        assert response.status_code == 422

    async def test_create_calendar_no_auth(
        self, async_client: AsyncClient, sample_calendar_data: dict
    ):
        """Test creating calendar without authentication."""
        response = await async_client.post(
            "/api/v1/calendars/",
            json=sample_calendar_data,
        )
        assert response.status_code == 403

    async def test_create_calendar_empty_name(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test creating calendar with empty name."""
        response = await async_client.post(
            "/api/v1/calendars/",
            headers=auth_headers,
            json={"name": ""},
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestCalendarList:
    """Test calendar listing endpoint."""

    async def test_list_calendars_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
        test_calendar_2: Calendar,
    ):
        """Test listing user's calendars."""
        response = await async_client.get(
            "/api/v1/calendars/",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "calendars" in data
        assert len(data["calendars"]) >= 2
        assert data["total"] >= 2

    async def test_list_calendars_no_auth(self, async_client: AsyncClient):
        """Test listing calendars without authentication."""
        response = await async_client.get("/api/v1/calendars/")
        assert response.status_code == 403

    async def test_list_calendars_empty(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test listing calendars when user has none."""
        # Using fresh user with no calendars
        # This test assumes no auto-created default calendar
        response = await async_client.get(
            "/api/v1/calendars/",
            headers=auth_headers,
        )
        assert response.status_code == 200


@pytest.mark.asyncio
class TestCalendarGet:
    """Test get single calendar endpoint."""

    async def test_get_calendar_success(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test getting a specific calendar."""
        response = await async_client.get(
            f"/api/v1/calendars/{test_calendar.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_calendar.id)
        assert data["name"] == test_calendar.name

    async def test_get_calendar_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test getting non-existent calendar."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.get(
            f"/api/v1/calendars/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_get_calendar_no_auth(
        self, async_client: AsyncClient, test_calendar: Calendar
    ):
        """Test getting calendar without authentication."""
        response = await async_client.get(f"/api/v1/calendars/{test_calendar.id}")
        assert response.status_code == 403

    async def test_get_other_user_calendar(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_superuser: User,
        db_session: AsyncSession,
    ):
        """Test that user cannot access another user's calendar."""
        from uuid import uuid4

        # Create calendar owned by different user
        other_calendar = Calendar(
            id=uuid4(),
            owner_id=test_superuser.id,
            name="Other User's Calendar",
        )
        db_session.add(other_calendar)
        await db_session.commit()

        response = await async_client.get(
            f"/api/v1/calendars/{other_calendar.id}",
            headers=auth_headers,
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestCalendarUpdate:
    """Test calendar update endpoint."""

    async def test_update_calendar_success(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test successful calendar update."""
        response = await async_client.patch(
            f"/api/v1/calendars/{test_calendar.id}",
            headers=auth_headers,
            json={
                "name": "Updated Calendar Name",
                "description": "Updated description",
                "color": "#123456",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Calendar Name"
        assert data["description"] == "Updated description"
        assert data["color"] == "#123456"

    async def test_update_calendar_partial(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test partial calendar update."""
        original_name = test_calendar.name
        response = await async_client.patch(
            f"/api/v1/calendars/{test_calendar.id}",
            headers=auth_headers,
            json={"color": "#AABBCC"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["color"] == "#AABBCC"
        # Name should remain unchanged
        assert data["name"] == original_name

    async def test_update_calendar_invalid_color(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test updating calendar with invalid color."""
        response = await async_client.patch(
            f"/api/v1/calendars/{test_calendar.id}",
            headers=auth_headers,
            json={"color": "invalid"},
        )
        assert response.status_code == 422

    async def test_update_calendar_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test updating non-existent calendar."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.patch(
            f"/api/v1/calendars/{fake_id}",
            headers=auth_headers,
            json={"name": "New Name"},
        )
        assert response.status_code == 404

    async def test_update_calendar_no_auth(
        self, async_client: AsyncClient, test_calendar: Calendar
    ):
        """Test updating calendar without authentication."""
        response = await async_client.patch(
            f"/api/v1/calendars/{test_calendar.id}",
            json={"name": "New Name"},
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestCalendarDelete:
    """Test calendar deletion endpoint."""

    async def test_delete_calendar_success(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar_2: Calendar
    ):
        """Test successful calendar deletion."""
        response = await async_client.delete(
            f"/api/v1/calendars/{test_calendar_2.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify calendar is deleted
        get_response = await async_client.get(
            f"/api/v1/calendars/{test_calendar_2.id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404

    async def test_delete_calendar_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test deleting non-existent calendar."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.delete(
            f"/api/v1/calendars/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_delete_calendar_no_auth(
        self, async_client: AsyncClient, test_calendar: Calendar
    ):
        """Test deleting calendar without authentication."""
        response = await async_client.delete(f"/api/v1/calendars/{test_calendar.id}")
        assert response.status_code == 403

    async def test_delete_default_calendar(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test that default calendar cannot be deleted."""
        # test_calendar is set as default in fixture
        response = await async_client.delete(
            f"/api/v1/calendars/{test_calendar.id}",
            headers=auth_headers,
        )
        # Should either fail or succeed based on business logic
        # Assuming default calendars should not be deletable
        assert response.status_code in [400, 403, 404]


@pytest.mark.asyncio
class TestDefaultCalendar:
    """Test default calendar operations."""

    async def test_get_default_calendar(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test getting user's default calendar."""
        response = await async_client.get(
            "/api/v1/calendars/default",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_default"] is True
        assert data["id"] == str(test_calendar.id)

    async def test_set_default_calendar(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
        test_calendar_2: Calendar,
    ):
        """Test setting a calendar as default."""
        response = await async_client.post(
            "/api/v1/calendars/default",
            headers=auth_headers,
            json={"calendar_id": str(test_calendar_2.id)},
        )
        assert response.status_code == 200

        # Verify it's now the default
        get_response = await async_client.get(
            "/api/v1/calendars/default",
            headers=auth_headers,
        )
        assert get_response.json()["id"] == str(test_calendar_2.id)

    async def test_get_default_calendar_none_exists(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test getting default calendar when none exists."""
        # This might auto-create one or return 404
        response = await async_client.get(
            "/api/v1/calendars/default",
            headers=auth_headers,
        )
        # Accept either auto-creation (201/200) or not found (404)
        assert response.status_code in [200, 201, 404]


@pytest.mark.asyncio
class TestCalendarPermissions:
    """Test calendar permission and ownership validation."""

    async def test_cannot_update_other_user_calendar(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_superuser: User,
        db_session: AsyncSession,
    ):
        """Test that user cannot update another user's calendar."""
        from uuid import uuid4

        other_calendar = Calendar(
            id=uuid4(),
            owner_id=test_superuser.id,
            name="Other User's Calendar",
        )
        db_session.add(other_calendar)
        await db_session.commit()

        response = await async_client.patch(
            f"/api/v1/calendars/{other_calendar.id}",
            headers=auth_headers,
            json={"name": "Hacked Name"},
        )
        assert response.status_code == 403

    async def test_cannot_delete_other_user_calendar(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_superuser: User,
        db_session: AsyncSession,
    ):
        """Test that user cannot delete another user's calendar."""
        from uuid import uuid4

        other_calendar = Calendar(
            id=uuid4(),
            owner_id=test_superuser.id,
            name="Other User's Calendar",
        )
        db_session.add(other_calendar)
        await db_session.commit()

        response = await async_client.delete(
            f"/api/v1/calendars/{other_calendar.id}",
            headers=auth_headers,
        )
        assert response.status_code == 403
