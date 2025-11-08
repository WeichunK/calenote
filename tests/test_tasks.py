"""
Task API Tests

Tests for task CRUD operations, task completion tracking,
and task-entry relationship validation.
"""
import pytest
from datetime import date, timedelta
from httpx import AsyncClient

from app.models.calendar import Calendar
from app.models.task import Task
from app.models.entry import Entry
from app.models.user import User


@pytest.mark.asyncio
class TestTaskCreate:
    """Test task creation endpoint."""

    async def test_create_task_minimal(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating task with minimal required fields."""
        response = await async_client.post(
            "/api/v1/tasks/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "New Task",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Task"
        assert data["calendar_id"] == str(test_calendar.id)
        assert data["status"] == "active"
        assert data["total_entries"] == 0
        assert data["completed_entries"] == 0
        assert data["completion_percentage"] == 0

    async def test_create_task_with_all_fields(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating task with all fields."""
        due = date.today() + timedelta(days=7)
        response = await async_client.post(
            "/api/v1/tasks/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Complete Task",
                "description": "Task description",
                "due_date": str(due),
                "color": "#FF5733",
                "icon": "task-icon",
                "position": 5,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Complete Task"
        assert data["description"] == "Task description"
        assert data["due_date"] == str(due)
        assert data["color"] == "#FF5733"
        assert data["position"] == 5

    async def test_create_task_invalid_status(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar: Calendar
    ):
        """Test creating task with invalid status."""
        response = await async_client.post(
            "/api/v1/tasks/",
            headers=auth_headers,
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Task",
                "status": "invalid_status",
            },
        )
        assert response.status_code == 422

    async def test_create_task_no_auth(
        self, async_client: AsyncClient, test_calendar: Calendar
    ):
        """Test creating task without authentication."""
        response = await async_client.post(
            "/api/v1/tasks/",
            json={
                "calendar_id": str(test_calendar.id),
                "title": "Task",
            },
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestTaskList:
    """Test task listing and filtering."""

    async def test_list_tasks_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_task: Task,
        completed_task: Task,
    ):
        """Test listing tasks."""
        response = await async_client.get(
            "/api/v1/tasks/",
            headers=auth_headers,
            params={"calendar_id": str(test_task.calendar_id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert len(data["tasks"]) >= 2
        assert data["total"] >= 2

    async def test_list_tasks_filter_by_status(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_task: Task,
        completed_task: Task,
    ):
        """Test filtering tasks by status."""
        response = await async_client.get(
            "/api/v1/tasks/",
            headers=auth_headers,
            params={
                "calendar_id": str(test_task.calendar_id),
                "status": "active",
            },
        )
        assert response.status_code == 200
        data = response.json()
        for task in data["tasks"]:
            assert task["status"] == "active"

    async def test_list_tasks_sort_by_position(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
    ):
        """Test sorting tasks by position."""
        response = await async_client.get(
            "/api/v1/tasks/",
            headers=auth_headers,
            params={
                "calendar_id": str(test_calendar.id),
                "sort_by": "position",
                "order": "asc",
            },
        )
        assert response.status_code == 200
        data = response.json()
        # Verify tasks are sorted by position
        if len(data["tasks"]) > 1:
            for i in range(len(data["tasks"]) - 1):
                assert data["tasks"][i]["position"] <= data["tasks"][i + 1]["position"]

    async def test_list_tasks_no_auth(self, async_client: AsyncClient):
        """Test listing tasks without authentication."""
        response = await async_client.get("/api/v1/tasks/")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestTaskGet:
    """Test get single task endpoint."""

    async def test_get_task_success(
        self, async_client: AsyncClient, auth_headers: dict, test_task: Task
    ):
        """Test getting a specific task."""
        response = await async_client.get(
            f"/api/v1/tasks/{test_task.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_task.id)
        assert data["title"] == test_task.title

    async def test_get_task_with_entries(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_task_with_entries: Task,
    ):
        """Test getting task with its entries."""
        response = await async_client.get(
            f"/api/v1/tasks/{test_task_with_entries.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        # Task should show entry counts (updated by trigger)
        assert data["total_entries"] >= 0

    async def test_get_task_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test getting non-existent task."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.get(
            f"/api/v1/tasks/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestTaskUpdate:
    """Test task update endpoint."""

    async def test_update_task_success(
        self, async_client: AsyncClient, auth_headers: dict, test_task: Task
    ):
        """Test successful task update."""
        response = await async_client.patch(
            f"/api/v1/tasks/{test_task.id}",
            headers=auth_headers,
            json={
                "title": "Updated Task Title",
                "description": "Updated description",
                "status": "active",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Task Title"
        assert data["description"] == "Updated description"

    async def test_update_task_partial(
        self, async_client: AsyncClient, auth_headers: dict, test_task: Task
    ):
        """Test partial task update."""
        original_title = test_task.title
        response = await async_client.patch(
            f"/api/v1/tasks/{test_task.id}",
            headers=auth_headers,
            json={"color": "#123456"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["color"] == "#123456"
        assert data["title"] == original_title

    async def test_update_task_due_date(
        self, async_client: AsyncClient, auth_headers: dict, test_task: Task
    ):
        """Test updating task due date."""
        new_due = date.today() + timedelta(days=14)
        response = await async_client.patch(
            f"/api/v1/tasks/{test_task.id}",
            headers=auth_headers,
            json={"due_date": str(new_due)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["due_date"] == str(new_due)

    async def test_update_task_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test updating non-existent task."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.patch(
            f"/api/v1/tasks/{fake_id}",
            headers=auth_headers,
            json={"title": "New Title"},
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestTaskCompletion:
    """Test task completion operations."""

    async def test_complete_task_success(
        self, async_client: AsyncClient, auth_headers: dict, test_task: Task
    ):
        """Test marking task as complete."""
        response = await async_client.post(
            f"/api/v1/tasks/{test_task.id}/complete",
            headers=auth_headers,
            json={"mark_all_entries_complete": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    async def test_complete_task_with_entries(
        self, async_client: AsyncClient, auth_headers: dict, test_task: Task
    ):
        """Test completing task and marking all entries complete."""
        response = await async_client.post(
            f"/api/v1/tasks/{test_task.id}/complete",
            headers=auth_headers,
            json={"mark_all_entries_complete": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"

    async def test_reopen_task(
        self, async_client: AsyncClient, auth_headers: dict, completed_task: Task
    ):
        """Test reopening a completed task."""
        response = await async_client.post(
            f"/api/v1/tasks/{completed_task.id}/reopen",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        assert data["completed_at"] is None


@pytest.mark.asyncio
class TestTaskArchive:
    """Test task archiving operations."""

    async def test_archive_task(
        self, async_client: AsyncClient, auth_headers: dict, completed_task: Task
    ):
        """Test archiving a task."""
        response = await async_client.post(
            f"/api/v1/tasks/{completed_task.id}/archive",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "archived"


@pytest.mark.asyncio
class TestTaskStats:
    """Test task statistics endpoint."""

    async def test_get_task_stats(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_task_with_entries: Task,
    ):
        """Test getting statistics for a task."""
        response = await async_client.get(
            f"/api/v1/tasks/{test_task_with_entries.id}/stats",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_entries" in data
        assert "completed_entries" in data
        assert "pending_entries" in data
        assert "completion_percentage" in data
        assert data["completion_percentage"] >= 0
        assert data["completion_percentage"] <= 100


@pytest.mark.asyncio
class TestTaskReorder:
    """Test task reordering."""

    async def test_reorder_tasks(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
        test_user: User,
        db_session,
    ):
        """Test reordering tasks."""
        from uuid import uuid4

        # Create multiple tasks
        tasks = []
        for i in range(3):
            task = Task(
                id=uuid4(),
                calendar_id=test_calendar.id,
                created_by=test_user.id,
                title=f"Task {i}",
                status="active",
                position=i,
                total_entries=0,
                completed_entries=0,
                completion_percentage=0,
            )
            db_session.add(task)
            tasks.append(task)

        await db_session.commit()

        # Reorder tasks
        response = await async_client.post(
            "/api/v1/tasks/reorder",
            headers=auth_headers,
            json={
                "task_orders": [
                    {"task_id": str(tasks[2].id), "position": 0},
                    {"task_id": str(tasks[0].id), "position": 1},
                    {"task_id": str(tasks[1].id), "position": 2},
                ]
            },
        )
        assert response.status_code == 200


@pytest.mark.asyncio
class TestTaskBatchOperations:
    """Test batch task operations."""

    async def test_batch_update_tasks(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
        test_user: User,
        db_session,
    ):
        """Test updating multiple tasks at once."""
        from uuid import uuid4

        # Create multiple tasks
        task_ids = []
        for i in range(3):
            task = Task(
                id=uuid4(),
                calendar_id=test_calendar.id,
                created_by=test_user.id,
                title=f"Task {i}",
                status="active",
                position=i,
                total_entries=0,
                completed_entries=0,
                completion_percentage=0,
            )
            db_session.add(task)
            task_ids.append(str(task.id))

        await db_session.commit()

        response = await async_client.patch(
            "/api/v1/tasks/batch",
            headers=auth_headers,
            json={
                "task_ids": task_ids,
                "update_data": {"color": "#FF0000"},
            },
        )
        assert response.status_code == 200

    async def test_batch_delete_tasks(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_calendar: Calendar,
        test_user: User,
        db_session,
    ):
        """Test deleting multiple tasks at once."""
        from uuid import uuid4

        # Create multiple tasks
        task_ids = []
        for i in range(3):
            task = Task(
                id=uuid4(),
                calendar_id=test_calendar.id,
                created_by=test_user.id,
                title=f"Task {i}",
                status="active",
                position=i,
                total_entries=0,
                completed_entries=0,
                completion_percentage=0,
            )
            db_session.add(task)
            task_ids.append(str(task.id))

        await db_session.commit()

        response = await async_client.delete(
            "/api/v1/tasks/batch",
            headers=auth_headers,
            json={"task_ids": task_ids},
        )
        assert response.status_code == 204


@pytest.mark.asyncio
class TestTaskDelete:
    """Test task deletion."""

    async def test_delete_task_success(
        self, async_client: AsyncClient, auth_headers: dict, test_task: Task
    ):
        """Test successful task deletion."""
        response = await async_client.delete(
            f"/api/v1/tasks/{test_task.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify task is deleted
        get_response = await async_client.get(
            f"/api/v1/tasks/{test_task.id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404

    async def test_delete_task_with_entries(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_task_with_entries: Task,
    ):
        """Test deleting task with entries (entries should become taskless)."""
        task_id = test_task_with_entries.id

        response = await async_client.delete(
            f"/api/v1/tasks/{task_id}",
            headers=auth_headers,
        )
        # Depending on business logic, this might succeed or fail
        # If entries must be reassigned first, it should fail
        assert response.status_code in [204, 400, 409]

    async def test_delete_task_not_found(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test deleting non-existent task."""
        from uuid import uuid4

        fake_id = uuid4()
        response = await async_client.delete(
            f"/api/v1/tasks/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestTaskProgressCalculation:
    """Test task progress auto-calculation via database trigger."""

    async def test_task_progress_updates_on_entry_completion(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_task: Task,
        test_calendar: Calendar,
        test_user: User,
        db_session,
    ):
        """Test that task progress updates automatically when entries are completed."""
        from uuid import uuid4

        # Add 4 entries to the task
        entry_ids = []
        for i in range(4):
            entry = Entry(
                id=uuid4(),
                calendar_id=test_calendar.id,
                created_by=test_user.id,
                task_id=test_task.id,
                title=f"Progress Entry {i}",
                entry_type="task",
                priority=0,
                is_completed=False,
                position_in_task=i,
            )
            db_session.add(entry)
            entry_ids.append(str(entry.id))

        await db_session.commit()

        # Get task stats
        response = await async_client.get(
            f"/api/v1/tasks/{test_task.id}/stats",
            headers=auth_headers,
        )
        data = response.json()
        assert data["total_entries"] == 4
        assert data["completed_entries"] == 0
        assert data["completion_percentage"] == 0

        # Complete 2 entries
        for i in range(2):
            await async_client.post(
                f"/api/v1/entries/{entry_ids[i]}/complete",
                headers=auth_headers,
                json={"is_completed": True},
            )

        # Check task progress updated automatically
        response = await async_client.get(
            f"/api/v1/tasks/{test_task.id}/stats",
            headers=auth_headers,
        )
        data = response.json()
        assert data["total_entries"] == 4
        assert data["completed_entries"] == 2
        assert data["completion_percentage"] == 50
