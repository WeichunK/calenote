"""
Pytest Configuration and Fixtures

Provides shared fixtures for testing the Calenote API.
"""
import asyncio
from typing import AsyncGenerator, Generator
from uuid import uuid4
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
# Import all models to ensure they're registered with Base
from app.models import User, Calendar, Entry, Task


# Test database URL (using separate test database)
TEST_DATABASE_URL = "postgresql+asyncpg://calendar_user:calendar_password@localhost:5432/calendar_test_db"


# ============================================
# Database Fixtures
# ============================================

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    # Create connection
    connection = await test_engine.connect()

    # Begin a transaction
    transaction = await connection.begin()

    # Create session bound to connection
    async_session = async_sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )

    session = async_session()

    try:
        yield session
    finally:
        await session.close()
        # Rollback transaction to clean up
        await transaction.rollback()
        await connection.close()


@pytest.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for API testing."""

    # Override the get_db dependency
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    # Clear overrides
    app.dependency_overrides.clear()


# ============================================
# User Fixtures
# ============================================

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        id=uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_superuser(db_session: AsyncSession) -> User:
    """Create a test superuser."""
    user = User(
        id=uuid4(),
        email="admin@example.com",
        username="adminuser",
        hashed_password=get_password_hash("adminpassword123"),
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def inactive_user(db_session: AsyncSession) -> User:
    """Create an inactive test user."""
    user = User(
        id=uuid4(),
        email="inactive@example.com",
        username="inactiveuser",
        hashed_password=get_password_hash("testpassword123"),
        is_active=False,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def test_user_token(test_user: User) -> str:
    """Generate JWT token for test user."""
    return create_access_token(
        data={"sub": str(test_user.id), "email": test_user.email}
    )


@pytest.fixture
def test_superuser_token(test_superuser: User) -> str:
    """Generate JWT token for test superuser."""
    return create_access_token(
        data={"sub": str(test_superuser.id), "email": test_superuser.email}
    )


@pytest.fixture
def auth_headers(test_user_token: str) -> dict:
    """Generate authorization headers with test user token."""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def superuser_auth_headers(test_superuser_token: str) -> dict:
    """Generate authorization headers with superuser token."""
    return {"Authorization": f"Bearer {test_superuser_token}"}


# ============================================
# Calendar Fixtures
# ============================================

@pytest.fixture
async def test_calendar(db_session: AsyncSession, test_user: User) -> Calendar:
    """Create a test calendar."""
    calendar = Calendar(
        id=uuid4(),
        owner_id=test_user.id,
        name="Test Calendar",
        description="A test calendar",
        color="#FF5733",
        is_default=True,
    )
    db_session.add(calendar)
    await db_session.commit()
    await db_session.refresh(calendar)
    return calendar


@pytest.fixture
async def test_calendar_2(db_session: AsyncSession, test_user: User) -> Calendar:
    """Create a second test calendar."""
    calendar = Calendar(
        id=uuid4(),
        owner_id=test_user.id,
        name="Second Calendar",
        description="Another test calendar",
        color="#33C4FF",
        is_default=False,
    )
    db_session.add(calendar)
    await db_session.commit()
    await db_session.refresh(calendar)
    return calendar


# ============================================
# Entry Fixtures
# ============================================

@pytest.fixture
async def test_entry(
    db_session: AsyncSession,
    test_calendar: Calendar,
    test_user: User
) -> Entry:
    """Create a test entry without a task."""
    entry = Entry(
        id=uuid4(),
        calendar_id=test_calendar.id,
        created_by=test_user.id,
        title="Test Entry",
        content="This is a test entry",
        entry_type="note",
        priority=1,
        is_completed=False,
    )
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)
    return entry


@pytest.fixture
async def test_entry_with_timestamp(
    db_session: AsyncSession,
    test_calendar: Calendar,
    test_user: User
) -> Entry:
    """Create a test entry with timestamp (scheduled)."""
    from datetime import datetime, timedelta

    entry = Entry(
        id=uuid4(),
        calendar_id=test_calendar.id,
        created_by=test_user.id,
        title="Scheduled Entry",
        content="Entry with timestamp",
        entry_type="event",
        priority=2,
        timestamp=datetime.utcnow() + timedelta(days=1),
        is_completed=False,
    )
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)
    return entry


@pytest.fixture
async def completed_entry(
    db_session: AsyncSession,
    test_calendar: Calendar,
    test_user: User
) -> Entry:
    """Create a completed entry."""
    from datetime import datetime

    entry = Entry(
        id=uuid4(),
        calendar_id=test_calendar.id,
        created_by=test_user.id,
        title="Completed Entry",
        content="This entry is done",
        entry_type="task",
        priority=0,
        is_completed=True,
        completed_at=datetime.utcnow(),
        completed_by=test_user.id,
    )
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)
    return entry


# ============================================
# Task Fixtures
# ============================================

@pytest.fixture
async def test_task(
    db_session: AsyncSession,
    test_calendar: Calendar,
    test_user: User
) -> Task:
    """Create a test task."""
    from datetime import date, timedelta

    task = Task(
        id=uuid4(),
        calendar_id=test_calendar.id,
        created_by=test_user.id,
        title="Test Task",
        description="A test task",
        status="active",
        due_date=date.today() + timedelta(days=7),
        position=0,
        total_entries=0,
        completed_entries=0,
        completion_percentage=0,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def test_task_with_entries(
    db_session: AsyncSession,
    test_calendar: Calendar,
    test_user: User,
    test_task: Task
) -> Task:
    """Create a task with multiple entries."""
    # Create 3 entries for this task
    for i in range(3):
        entry = Entry(
            id=uuid4(),
            calendar_id=test_calendar.id,
            created_by=test_user.id,
            task_id=test_task.id,
            title=f"Task Entry {i+1}",
            content=f"Entry {i+1} for the task",
            entry_type="task",
            priority=i % 4,
            is_completed=(i == 0),  # First entry is completed
            position_in_task=i,
        )
        db_session.add(entry)

    await db_session.commit()
    await db_session.refresh(test_task)
    return test_task


@pytest.fixture
async def completed_task(
    db_session: AsyncSession,
    test_calendar: Calendar,
    test_user: User
) -> Task:
    """Create a completed task."""
    from datetime import datetime, date

    task = Task(
        id=uuid4(),
        calendar_id=test_calendar.id,
        created_by=test_user.id,
        title="Completed Task",
        description="This task is done",
        status="completed",
        due_date=date.today(),
        position=1,
        total_entries=0,
        completed_entries=0,
        completion_percentage=100,
        completed_at=datetime.utcnow(),
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


# ============================================
# Utility Fixtures
# ============================================

@pytest.fixture
def sample_entry_data(test_calendar: Calendar) -> dict:
    """Sample data for creating an entry."""
    return {
        "calendar_id": str(test_calendar.id),
        "title": "New Entry",
        "content": "Entry content",
        "entry_type": "note",
        "priority": 1,
    }


@pytest.fixture
def sample_task_data(test_calendar: Calendar) -> dict:
    """Sample data for creating a task."""
    from datetime import date, timedelta

    return {
        "calendar_id": str(test_calendar.id),
        "title": "New Task",
        "description": "Task description",
        "due_date": str(date.today() + timedelta(days=7)),
        "position": 0,
    }


@pytest.fixture
def sample_calendar_data() -> dict:
    """Sample data for creating a calendar."""
    return {
        "name": "New Calendar",
        "description": "New calendar description",
        "color": "#00FF00",
        "is_default": False,
    }
