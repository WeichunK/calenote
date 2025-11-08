"""
Integration Tests

End-to-end workflow tests that validate complete user journeys
and the entry-first architecture.
"""
import pytest
from datetime import datetime, date, timedelta
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.asyncio
class TestUserOnboardingWorkflow:
    """Test complete user onboarding workflow."""

    async def test_full_user_registration_and_setup(self, async_client: AsyncClient):
        """Test user registration, login, and initial setup."""
        # 1. Register new user
        register_response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "integration@example.com",
                "username": "integrationuser",
                "password": "password123",
                "password_confirm": "password123",
            },
        )
        assert register_response.status_code == 201
        user_data = register_response.json()
        assert user_data["email"] == "integration@example.com"

        # 2. Login with new user
        login_response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "integration@example.com",
                "password": "password123",
            },
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Get user profile
        profile_response = await async_client.get(
            "/api/v1/auth/me",
            headers=headers,
        )
        assert profile_response.status_code == 200

        # 4. Create first calendar
        calendar_response = await async_client.post(
            "/api/v1/calendars/",
            headers=headers,
            json={
                "name": "My First Calendar",
                "description": "Getting started",
                "color": "#4A90E2",
                "is_default": True,
            },
        )
        assert calendar_response.status_code == 201
        calendar_data = calendar_response.json()
        calendar_id = calendar_data["id"]

        # 5. Create first entry (entry-first!)
        entry_response = await async_client.post(
            "/api/v1/entries/",
            headers=headers,
            json={
                "calendar_id": calendar_id,
                "title": "My First Entry",
                "content": "Starting my calendar journey!",
            },
        )
        assert entry_response.status_code == 201
        entry_data = entry_response.json()
        assert entry_data["task_id"] is None  # Entry-first: no task needed


@pytest.mark.integration
@pytest.mark.asyncio
class TestEntryFirstWorkflow:
    """Test entry-first architecture workflows."""

    async def test_entry_lifecycle_without_task(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar
    ):
        """Test complete entry lifecycle without ever assigning to a task."""
        calendar_id = str(test_calendar.id)

        # 1. Create entry without task
        create_response = await async_client.post(
            "/api/v1/entries/",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Independent Entry",
                "content": "This entry lives alone",
                "priority": 2,
            },
        )
        assert create_response.status_code == 201
        entry = create_response.json()
        entry_id = entry["id"]
        assert entry["task_id"] is None

        # 2. Update entry
        update_response = await async_client.patch(
            f"/api/v1/entries/{entry_id}",
            headers=auth_headers,
            json={"priority": 3, "tags": ["important"]},
        )
        assert update_response.status_code == 200

        # 3. Add timestamp (schedule it)
        timestamp = (datetime.utcnow() + timedelta(days=1)).isoformat()
        schedule_response = await async_client.patch(
            f"/api/v1/entries/{entry_id}",
            headers=auth_headers,
            json={"timestamp": timestamp},
        )
        assert schedule_response.status_code == 200

        # 4. Complete entry
        complete_response = await async_client.post(
            f"/api/v1/entries/{entry_id}/complete",
            headers=auth_headers,
            json={"is_completed": True},
        )
        assert complete_response.status_code == 200
        assert complete_response.json()["is_completed"] is True

        # 5. Verify entry still has no task
        get_response = await async_client.get(
            f"/api/v1/entries/{entry_id}",
            headers=auth_headers,
        )
        assert get_response.json()["task_id"] is None


@pytest.mark.integration
@pytest.mark.asyncio
class TestTaskProjectWorkflow:
    """Test task-based project management workflow."""

    async def test_complete_project_workflow(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar
    ):
        """Test creating and managing a complete project with task and entries."""
        calendar_id = str(test_calendar.id)

        # 1. Create a task (project container)
        task_response = await async_client.post(
            "/api/v1/tasks/",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Website Redesign Project",
                "description": "Complete redesign of company website",
                "due_date": str(date.today() + timedelta(days=30)),
                "color": "#FF5733",
            },
        )
        assert task_response.status_code == 201
        task = task_response.json()
        task_id = task["id"]

        # 2. Create multiple entries for the task
        entry_titles = [
            "Design mockups",
            "Review with stakeholders",
            "Implement frontend",
            "Backend integration",
            "Testing and QA",
        ]
        entry_ids = []

        for title in entry_titles:
            entry_response = await async_client.post(
                "/api/v1/entries/",
                headers=auth_headers,
                json={
                    "calendar_id": calendar_id,
                    "title": title,
                    "entry_type": "task",
                    "priority": 1,
                },
            )
            assert entry_response.status_code == 201
            entry_ids.append(entry_response.json()["id"])

        # 3. Add all entries to the task
        for entry_id in entry_ids:
            add_response = await async_client.post(
                f"/api/v1/entries/{entry_id}/add-to-task",
                headers=auth_headers,
                json={"task_id": task_id},
            )
            assert add_response.status_code == 200

        # 4. Get task stats (should show 5 entries, 0% complete)
        stats_response = await async_client.get(
            f"/api/v1/tasks/{task_id}/stats",
            headers=auth_headers,
        )
        stats = stats_response.json()
        assert stats["total_entries"] == 5
        assert stats["completed_entries"] == 0

        # 5. Complete some entries
        for i in range(3):  # Complete first 3 entries
            complete_response = await async_client.post(
                f"/api/v1/entries/{entry_ids[i]}/complete",
                headers=auth_headers,
                json={"is_completed": True},
            )
            assert complete_response.status_code == 200

        # 6. Check updated task progress (should be 60%)
        stats_response = await async_client.get(
            f"/api/v1/tasks/{task_id}/stats",
            headers=auth_headers,
        )
        stats = stats_response.json()
        assert stats["total_entries"] == 5
        assert stats["completed_entries"] == 3
        assert stats["completion_percentage"] == 60

        # 7. Complete remaining entries
        for i in range(3, 5):
            await async_client.post(
                f"/api/v1/entries/{entry_ids[i]}/complete",
                headers=auth_headers,
                json={"is_completed": True},
            )

        # 8. Mark task as complete
        complete_task_response = await async_client.post(
            f"/api/v1/tasks/{task_id}/complete",
            headers=auth_headers,
            json={"mark_all_entries_complete": False},
        )
        assert complete_task_response.status_code == 200
        assert complete_task_response.json()["status"] == "completed"


@pytest.mark.integration
@pytest.mark.asyncio
class TestCalendarViewWorkflow:
    """Test calendar view filtering and organization."""

    async def test_organize_entries_by_timestamp(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar
    ):
        """Test organizing entries on a calendar timeline."""
        calendar_id = str(test_calendar.id)

        # 1. Create entries for different days
        today = datetime.utcnow()
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=7)

        entries = [
            {"title": "Meeting Today", "timestamp": today.isoformat()},
            {"title": "Call Tomorrow", "timestamp": tomorrow.isoformat()},
            {"title": "Review Next Week", "timestamp": next_week.isoformat()},
            {"title": "Unscheduled Note", "timestamp": None},
        ]

        for entry_data in entries:
            create_response = await async_client.post(
                "/api/v1/entries/",
                headers=auth_headers,
                json={
                    "calendar_id": calendar_id,
                    "title": entry_data["title"],
                    "timestamp": entry_data["timestamp"],
                    "entry_type": "event" if entry_data["timestamp"] else "note",
                },
            )
            assert create_response.status_code == 201

        # 2. Get all scheduled entries (has_timestamp=true)
        scheduled_response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={
                "calendar_id": calendar_id,
                "has_timestamp": True,
            },
        )
        assert scheduled_response.status_code == 200
        scheduled_entries = scheduled_response.json()
        assert len(scheduled_entries) >= 3
        for entry in scheduled_entries:
            assert entry["timestamp"] is not None

        # 3. Get inbox entries (has_timestamp=false)
        inbox_response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={
                "calendar_id": calendar_id,
                "has_timestamp": False,
            },
        )
        assert inbox_response.status_code == 200
        inbox_entries = inbox_response.json()
        assert len(inbox_entries) >= 1
        for entry in inbox_entries:
            assert entry["timestamp"] is None


@pytest.mark.integration
@pytest.mark.asyncio
class TestEntryToTaskMigration:
    """Test moving entries between independent and task-based states."""

    async def test_entry_becomes_part_of_task_workflow(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar
    ):
        """Test an entry starting independent then joining a task."""
        calendar_id = str(test_calendar.id)

        # 1. Create independent entry
        entry_response = await async_client.post(
            "/api/v1/entries/",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Research new framework",
                "content": "Look into FastAPI alternatives",
                "priority": 2,
            },
        )
        assert entry_response.status_code == 201
        entry = entry_response.json()
        entry_id = entry["id"]
        assert entry["task_id"] is None

        # 2. Later, create a task for a project
        task_response = await async_client.post(
            "/api/v1/tasks/",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Technology Evaluation",
                "description": "Evaluate new tech stack",
            },
        )
        assert task_response.status_code == 201
        task = task_response.json()
        task_id = task["id"]

        # 3. Realize the entry fits the task, add it
        add_response = await async_client.post(
            f"/api/v1/entries/{entry_id}/add-to-task",
            headers=auth_headers,
            json={"task_id": task_id},
        )
        assert add_response.status_code == 200
        updated_entry = add_response.json()
        assert updated_entry["task_id"] == task_id

        # 4. Later, decide it doesn't fit, remove it
        remove_response = await async_client.post(
            f"/api/v1/entries/{entry_id}/remove-from-task",
            headers=auth_headers,
        )
        assert remove_response.status_code == 200
        independent_entry = remove_response.json()
        assert independent_entry["task_id"] is None


@pytest.mark.integration
@pytest.mark.asyncio
class TestBatchOperationsWorkflow:
    """Test batch operations for productivity."""

    async def test_batch_organize_entries_into_task(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar
    ):
        """Test batch organizing multiple entries into a task."""
        calendar_id = str(test_calendar.id)

        # 1. Create multiple unorganized entries
        entry_ids = []
        for i in range(5):
            entry_response = await async_client.post(
                "/api/v1/entries/",
                headers=auth_headers,
                json={
                    "calendar_id": calendar_id,
                    "title": f"Task Item {i+1}",
                    "entry_type": "task",
                },
            )
            entry_ids.append(entry_response.json()["id"])

        # 2. Create a task to organize them
        task_response = await async_client.post(
            "/api/v1/tasks/",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Sprint Planning",
            },
        )
        task_id = task_response.json()["id"]

        # 3. Batch add entries to task
        batch_response = await async_client.post(
            "/api/v1/entries/batch/add-to-task",
            headers=auth_headers,
            json={
                "entry_ids": entry_ids,
                "task_id": task_id,
            },
        )
        assert batch_response.status_code == 200

        # 4. Verify task has all entries
        stats_response = await async_client.get(
            f"/api/v1/tasks/{task_id}/stats",
            headers=auth_headers,
        )
        stats = stats_response.json()
        assert stats["total_entries"] == 5

    async def test_batch_update_priorities(
        self, async_client: AsyncClient, auth_headers: dict, test_calendar
    ):
        """Test batch updating entry priorities."""
        calendar_id = str(test_calendar.id)

        # 1. Create multiple entries with low priority
        entry_ids = []
        for i in range(3):
            entry_response = await async_client.post(
                "/api/v1/entries/",
                headers=auth_headers,
                json={
                    "calendar_id": calendar_id,
                    "title": f"Entry {i+1}",
                    "priority": 0,
                },
            )
            entry_ids.append(entry_response.json()["id"])

        # 2. Batch update to high priority
        batch_response = await async_client.post(
            "/api/v1/entries/batch/update",
            headers=auth_headers,
            json={
                "entry_ids": entry_ids,
                "updates": {"priority": 3, "tags": ["urgent"]},
            },
        )
        assert batch_response.status_code == 200

        # 3. Verify updates
        for entry_id in entry_ids:
            get_response = await async_client.get(
                f"/api/v1/entries/{entry_id}",
                headers=auth_headers,
            )
            entry = get_response.json()
            assert entry["priority"] == 3
            assert "urgent" in entry["tags"]


@pytest.mark.integration
@pytest.mark.asyncio
class TestMultiCalendarWorkflow:
    """Test working with multiple calendars."""

    async def test_separate_work_and_personal_calendars(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test organizing entries across work and personal calendars."""
        # 1. Create work calendar
        work_calendar_response = await async_client.post(
            "/api/v1/calendars/",
            headers=auth_headers,
            json={
                "name": "Work",
                "color": "#FF5733",
                "is_default": True,
            },
        )
        work_calendar_id = work_calendar_response.json()["id"]

        # 2. Create personal calendar
        personal_calendar_response = await async_client.post(
            "/api/v1/calendars/",
            headers=auth_headers,
            json={
                "name": "Personal",
                "color": "#33C4FF",
                "is_default": False,
            },
        )
        personal_calendar_id = personal_calendar_response.json()["id"]

        # 3. Create work entries
        for i in range(3):
            await async_client.post(
                "/api/v1/entries/",
                headers=auth_headers,
                json={
                    "calendar_id": work_calendar_id,
                    "title": f"Work Task {i+1}",
                    "tags": ["work"],
                },
            )

        # 4. Create personal entries
        for i in range(2):
            await async_client.post(
                "/api/v1/entries/",
                headers=auth_headers,
                json={
                    "calendar_id": personal_calendar_id,
                    "title": f"Personal Todo {i+1}",
                    "tags": ["personal"],
                },
            )

        # 5. Get work entries
        work_entries_response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={"calendar_id": work_calendar_id},
        )
        work_entries = work_entries_response.json()
        assert len(work_entries) >= 3

        # 6. Get personal entries
        personal_entries_response = await async_client.get(
            "/api/v1/entries/",
            headers=auth_headers,
            params={"calendar_id": personal_calendar_id},
        )
        personal_entries = personal_entries_response.json()
        assert len(personal_entries) >= 2

        # 7. Verify separation (work entries only have work tags)
        for entry in work_entries:
            if "tags" in entry and entry["tags"]:
                assert "work" in entry["tags"]
