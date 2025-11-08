# Calenote API Test Suite

Comprehensive test suite for the Calenote Calendar & Task Management API.

## Overview

The test suite validates all API endpoints, business logic, and the entry-first architecture principle. It includes:

- **111 test cases** across 5 test files
- Unit tests for individual CRUD operations
- Integration tests for complete workflows
- Entry-first architecture validation
- Authentication and authorization tests
- Database trigger validation (task progress auto-calculation)

## Test Structure

```
tests/
├── conftest.py              # Pytest configuration and fixtures
├── test_auth.py             # Authentication tests (21 tests)
├── test_calendars.py        # Calendar CRUD tests (19 tests)
├── test_entries.py          # Entry CRUD tests (28 tests)
├── test_tasks.py            # Task CRUD tests (24 tests)
├── test_integration.py      # End-to-end workflow tests (19 tests)
└── README.md                # This file
```

## Prerequisites

1. **PostgreSQL running** (via Docker Compose):
   ```bash
   docker-compose up -d postgres
   ```

2. **Test database created**:
   ```bash
   docker-compose exec postgres psql -U calendar_user -d calendar_db \
     -c "CREATE DATABASE calendar_test_db;"
   ```

3. **Virtual environment activated**:
   ```bash
   source venv/bin/activate
   ```

## Running Tests

### Run all tests
```bash
pytest
```

### Run specific test file
```bash
pytest tests/test_auth.py
pytest tests/test_entries.py
```

### Run specific test class
```bash
pytest tests/test_auth.py::TestUserRegistration
```

### Run specific test
```bash
pytest tests/test_auth.py::TestUserRegistration::test_register_user_success -v
```

### Run with coverage report
```bash
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

### Run only integration tests
```bash
pytest -m integration
```

### Run tests in parallel (faster)
```bash
pip install pytest-xdist
pytest -n auto
```

## Test Markers

Tests are marked with custom markers for selective execution:

- `@pytest.mark.unit` - Unit tests for individual components
- `@pytest.mark.integration` - Integration/workflow tests
- `@pytest.mark.auth` - Authentication tests
- `@pytest.mark.slow` - Slow-running tests (if any)
- `@pytest.mark.database` - Tests requiring database

Example:
```bash
pytest -m "auth and not slow"  # Run auth tests except slow ones
pytest -m integration           # Run only integration tests
```

## Test Coverage

Target: **80%+ code coverage**

Current coverage areas:
- Authentication API (7 endpoints)
- Calendar Management (7 endpoints)
- Entry Management (14 endpoints)
- Task Management (11 endpoints)
- Batch Operations
- Permission & Authorization
- Entry-First Architecture
- Database Triggers

## Key Test Scenarios

### Entry-First Architecture
- Entries can exist without tasks ✓
- Entries can have optional timestamps ✓
- Entries can be added/removed from tasks ✓
- Task progress auto-calculates via DB trigger ✓

### Authentication
- User registration with validation
- Login with JWT tokens
- Token refresh
- Password change
- Permission checks

### Calendar Operations
- CRUD operations
- Default calendar management
- Multi-calendar separation
- Permission validation

### Entry Operations
- CRUD with minimal/full fields
- Timestamp filtering (scheduled vs inbox)
- Priority validation (0-3)
- Task relationship management
- Batch operations

### Task Operations
- CRUD operations
- Progress calculation (via DB trigger)
- Entry containment
- Completion workflows
- Task reordering

### Integration Workflows
- User onboarding
- Entry lifecycle without task
- Complete project management
- Calendar view organization
- Batch productivity operations

## Fixtures

The `conftest.py` provides reusable fixtures:

### Database Fixtures
- `test_engine` - Test database engine (session-scoped)
- `db_session` - Fresh DB session per test (function-scoped)
- `async_client` - HTTP client for API testing

### User Fixtures
- `test_user` - Regular active user
- `test_superuser` - Admin user
- `inactive_user` - Inactive user
- `test_user_token` - JWT token for test_user
- `auth_headers` - Authorization headers

### Data Fixtures
- `test_calendar` - Sample calendar
- `test_entry` - Sample entry without task
- `test_entry_with_timestamp` - Scheduled entry
- `completed_entry` - Completed entry
- `test_task` - Sample task
- `test_task_with_entries` - Task with multiple entries

## Troubleshooting

### Tests fail with "database does not exist"
```bash
docker-compose exec postgres psql -U calendar_user -d calendar_db \
  -c "CREATE DATABASE calendar_test_db;"
```

### Tests hang or timeout
- Check PostgreSQL is running: `docker-compose ps postgres`
- Check database connection in `conftest.py`
- Increase timeout in `pytest.ini` if needed

### Import errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Coverage not reaching 80%
The test suite is designed to achieve 80%+ coverage. If coverage is lower:
1. Check that all API endpoints are implemented
2. Ensure CRUD operations in `/app/crud/` exist
3. Verify service layer in `/app/services/` is complete

## Writing New Tests

### Test Template
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestFeature:
    """Test description."""

    async def test_feature_success(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        """Test successful operation."""
        response = await async_client.post(
            "/api/v1/endpoint",
            headers=auth_headers,
            json={"field": "value"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["field"] == "value"
```

### Best Practices
1. **Use descriptive test names**: `test_create_entry_with_invalid_priority`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test one thing per test**: Don't combine multiple assertions
4. **Use appropriate fixtures**: Reuse `test_user`, `test_calendar`, etc.
5. **Clean up**: Tests should be independent (fixtures handle cleanup)
6. **Test edge cases**: Empty data, invalid inputs, permissions
7. **Test the happy path**: Successful operations should work

## CI/CD Integration

For continuous integration, add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    docker-compose up -d postgres
    docker-compose exec -T postgres createdb -U calendar_user calendar_test_db
    pytest --cov=app --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage.xml
```

## Performance

- Test suite runs in ~30-60 seconds (111 tests)
- Each test has isolated database transaction (clean slate)
- Parallel execution with `pytest-xdist` can reduce time to ~15-20 seconds

## Additional Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [httpx testing](https://www.python-httpx.org/)
- [SQLAlchemy testing](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html)
