"""
Entry API Tests

Tests for entry CRUD operations, entry-first architecture validation,
and entry management features.
"""
import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient

from app.models.calendar import Calendar
from app.models.entry import Entry
from app.models.task import Task
from app.models.user import User


@pytest.mark.asyncio
class TestEntryCreate:
    """Test entry creation endpoint."""

    async def test_create_entry_minimal(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating entry with minimal required fields (entry-first principle)."""
        response = await async_client.post(
            "/api/v1/entries/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Simple Entry",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Simple Entry"
        assert data["calendar_id"] == str(test_calendar.id)
        assert data["task_id"] is None  # Entry-first: no task required
        assert data["timestamp"] is None  # Entry-first: timestamp is optional
        assert data["is_completed"] is False

    async def test_create_entry_with_all_fields(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating entry with all fields."""
        timestamp = (datetime.utcnow() + timedelta(days=1)).isoformat()
        response = await async_client.post(
            "/api/v1/entries/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Complete Entry",
                "content": "Detailed content here",
                "entry_type": "event",
                "timestamp": timestamp,
                "is_all_day": False,
                "color": "#FF5733",
                "tags": ["work", "important"],
                "priority": 3,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Complete Entry"
        assert data["content"] == "Detailed content here"
        assert data["entry_type"] == "event"
        assert data["priority"] == 3
        assert data["tags"] == ["work", "important"]

    async def test_create_entry_with_timestamp(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating scheduled entry (with timestamp)."""
        future_time = datetime.utcnow() + timedelta(hours=2)
        response = await async_client.post(
            "/api/v1/entries/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Scheduled Entry",
                "timestamp": future_time.isoformat(),
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["timestamp"] is not None

    async def test_create_entry_invalid_priority(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating entry with invalid priority (must be 0-3)."""
        response = await async_client.post(
            "/api/v1/entries/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Entry",
                "priority": 5,  # Invalid: max is 3
            },
        )
        assert response.status_code == 422

    async def test_create_entry_invalid_type(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating entry with invalid type."""
        response = await async_client.post(
            "/api/v1/entries/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Entry",
                "entry_type": "invalid_type",
            },
        )
        assert response.status_code == 422

    async def test_create_entry_no_auth(
        self, async_client: AsyncClient, test_calendar: Calendar
    ):
        """Test creating entry without authentication."""
        response = await async_client.post(
            "/api/v1/entries/",
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Entry",
            },
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestEntryList:
    """Test entry listing and filtering."""

    async def test_list_entries_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_entry: Entry,
        test_entry_with_timestamp: Entry,
    ):
        """Test listing entries."""
        response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={"calendar_id": str(test_entry.calendar_id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    async def test_list_entries_filter_by_completion(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_entry: Entry,
        completed_entry: Entry,
    ):
        """Test filtering entries by completion status."""
        response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={
                "calendar_id": str(test_entry.calendar_id),
                "is_completed": False,
            },
        )
        assert response.status_code == 200
        data = response.json()
        for entry in data:
            assert entry["is_completed"] is False

    async def test_list_entries_filter_by_timestamp(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
        test_entry: Entry,
        test_entry_with_timestamp: Entry,
    ):
        """Test filtering entries by timestamp presence."""
        # Get entries with timestamp
        response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={
                "calendar_id": str(test_calendar.id),
                "has_timestamp": True,
            },
        )
        assert response.status_code == 200
        data = response.json()
        for entry in data:
            assert entry["timestamp"] is not None

        # Get entries without timestamp (inbox)
        response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={
                "calendar_id": str(test_calendar.id),
                "has_timestamp": False,
            },
        )
        assert response.status_code == 200
        data = response.json()
        for entry in data:
            assert entry["timestamp"] is None

    async def test_list_entries_no_auth(self, async_client: AsyncClient):
        """Test listing entries without authentication."""
        response = await async_client.get("/api/v1/entries/")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestEntryGet:
    """Test get single entry endpoint."""

    async def test_get_entry_success(
        self, async_client: AsyncClient, auth_headers: dict, test_entry: Entry
    ):
        """Test getting a specific entry."""
        response = await async_client.get(
            f"/api/v1/entries/{test_entry.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_entry.id)
        assert data["title"] == test_entry.title

    async def test_get_entry_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test getting non-existent entry."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.get(
            f"/api/v1/entries/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_get_entry_no_auth(
        self, async_client: AsyncClient, test_entry: Entry
    ):
        """Test getting entry without authentication."""
        response = await async_client.get(f"/api/v1/entries/{test_entry.id}")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestEntryUpdate:
    """Test entry update endpoint."""

    async def test_update_entry_success(
        self, async_client: AsyncClient, auth_headers: dict, test_entry: Entry
    ):
        """Test successful entry update."""
        response = await async_client.patch(
            f"/api/v1/entries/{test_entry.id}",
            headers=auth_headers,
            json={
                "title": "Updated Title",
                "content": "Updated content",
                "priority": 2,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated content"
        assert data["priority"] == 2

    async def test_update_entry_partial(
        self, async_client: AsyncClient, auth_headers: dict, test_entry: Entry
    ):
        """Test partial entry update."""
        original_title = test_entry.title
        response = await async_client.patch(
            f"/api/v1/entries/{test_entry.id}",
            headers=auth_headers,
            json={"priority": 3},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["priority"] == 3
        assert data["title"] == original_title

    async def test_update_entry_add_timestamp(
        self, async_client: AsyncClient, auth_headers: dict, test_entry: Entry
    ):
        """Test adding timestamp to entry (moving to calendar)."""
        timestamp = (datetime.utcnow() + timedelta(days=2)).isoformat()
        response = await async_client.patch(
            f"/api/v1/entries/{test_entry.id}",
            headers=auth_headers,
            json={"timestamp": timestamp},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["timestamp"] is not None

    async def test_update_entry_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test updating non-existent entry."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.patch(
            f"/api/v1/entries/{fake_id}",
            headers=auth_headers,
            json={"title": "New Title"},
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestEntryComplete:
    """Test entry completion endpoint."""

    async def test_complete_entry_success(
        self, async_client: AsyncClient, auth_headers: dict, test_entry: Entry
    ):
        """Test marking entry as complete."""
        response = await async_client.post(
            f"/api/v1/entries/{test_entry.id}/complete",
            headers=auth_headers,
            json={"is_completed": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_completed"] is True
        assert data["completed_at"] is not None

    async def test_uncomplete_entry(
        self, async_client: AsyncClient, auth_headers: dict, completed_entry: Entry
    ):
        """Test marking completed entry as incomplete."""
        response = await async_client.post(
            f"/api/v1/entries/{completed_entry.id}/complete",
            headers=auth_headers,
            json={"is_completed": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_completed"] is False
        assert data["completed_at"] is None


@pytest.mark.asyncio
class TestEntryTaskRelationship:
    """Test entry-task relationship operations."""

    async def test_add_entry_to_task(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_entry: Entry,
        test_task: Task,
    ):
        """Test adding entry to task."""
        response = await async_client.post(
            f"/api/v1/entries/{test_entry.id}/add-to-task",
            headers=auth_headers,
            json={"task_id": str(test_task.id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == str(test_task.id)

    async def test_remove_entry_from_task(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_entry: Entry,
        test_task: Task,
    ):
        """Test removing entry from task."""
        # First add to task
        await async_client.post(
            f"/api/v1/entries/{test_entry.id}/add-to-task",
            headers=auth_headers,
            json={"task_id": str(test_task.id)},
        )

        # Then remove from task
        response = await async_client.post(
            f"/api/v1/entries/{test_entry.id}/remove-from-task",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] is None

    async def test_add_entry_to_task_different_calendar(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_entry: Entry,
        test_user: User,
        db_session,
    ):
        """Test that entry and task must be in same calendar."""
        from uuid import uuid4

        # Create task in different calendar
        different_calendar = Calendar(
            id=uuid4(),
            owner_id=test_user.id,
            name="Different Calendar",
        )
        db_session.add(different_calendar)
        await db_session.commit()

        different_task = Task(
            id=uuid4(),
            calendar_id=different_calendar.id,
            created_by=test_user.id,
            title="Task in Different Calendar",
            status="active",
            position=0,
            total_entries=0,
            completed_entries=0,
            completion_percentage=0,
        )
        db_session.add(different_task)
        await db_session.commit()

        response = await async_client.post(
            f"/api/v1/entries/{test_entry.id}/add-to-task",
            headers=auth_headers,
            json={"task_id": str(different_task.id)},
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestEntryBatchOperations:
    """Test batch entry operations."""

    async def test_batch_add_to_task(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_task: Task,
        db_session,
        test_calendar: Calendar,
        test_user: User,
    ):
        """Test adding multiple entries to a task at once."""
        from uuid import uuid4

        # Create multiple entries
        entry_ids = []
        for i in range(3):
            entry = Entry(
                id=uuid4(),
                calendar_id=test_calendar.id,
                created_by=test_user.id,
                title=f"Batch Entry {i}",
                entry_type="task",
                priority=0,
                is_completed=False,
            )
            db_session.add(entry)
            entry_ids.append(str(entry.id))

        await db_session.commit()

        response = await async_client.post(
            "/api/v1/entries/batch/add-to-task",
            headers=auth_headers,
            json={
                "entry_ids": entry_ids,
                "task_id": str(test_task.id),
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["updated_entries"]) == 3

    async def test_batch_update_entries(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        db_session,
        test_calendar: Calendar,
        test_user: User,
    ):
        """Test updating multiple entries at once."""
        from uuid import uuid4

        # Create multiple entries
        entry_ids = []
        for i in range(3):
            entry = Entry(
                id=uuid4(),
                calendar_id=test_calendar.id,
                created_by=test_user.id,
                title=f"Entry {i}",
                entry_type="note",
                priority=0,
                is_completed=False,
            )
            db_session.add(entry)
            entry_ids.append(str(entry.id))

        await db_session.commit()

        response = await async_client.post(
            "/api/v1/entries/batch/update",
            headers=auth_headers,
            json={
                "entry_ids": entry_ids,
                "updates": {"priority": 2, "tags": ["batch-updated"]},
            },
        )
        assert response.status_code == 200

    async def test_batch_delete_entries(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        db_session,
        test_calendar: Calendar,
        test_user: User,
    ):
        """Test deleting multiple entries at once."""
        from uuid import uuid4

        # Create multiple entries
        entry_ids = []
        for i in range(3):
            entry = Entry(
                id=uuid4(),
                calendar_id=test_calendar.id,
                created_by=test_user.id,
                title=f"Entry {i}",
                entry_type="note",
                priority=0,
                is_completed=False,
            )
            db_session.add(entry)
            entry_ids.append(str(entry.id))

        await db_session.commit()

        response = await async_client.post(
            "/api/v1/entries/batch/delete",
            headers=auth_headers,
            json={"entry_ids": entry_ids},
        )
        assert response.status_code == 204


@pytest.mark.asyncio
class TestEntryDelete:
    """Test entry deletion."""

    async def test_delete_entry_success(
        self, async_client: AsyncClient, auth_headers: dict, test_entry: Entry
    ):
        """Test successful entry deletion."""
        response = await async_client.delete(
            f"/api/v1/entries/{test_entry.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify entry is deleted
        get_response = await async_client.get(
            f"/api/v1/entries/{test_entry.id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404

    async def test_delete_entry_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test deleting non-existent entry."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.delete(
            f"/api/v1/entries/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestEntryStats:
    """Test entry statistics endpoint."""

    async def test_get_entry_stats(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
        test_entry: Entry,
        completed_entry: Entry,
        test_entry_with_timestamp: Entry,
    ):
        """Test getting entry statistics for a calendar."""
        response = await async_client.get(
            f"/api/v1/entries/stats/{test_calendar.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_entries" in data
        assert "completed_entries" in data
        assert "scheduled_entries" in data
        assert "unscheduled_entries" in data
        assert data["total_entries"] >= 3
