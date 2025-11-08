"""
CRUD Operations
"""
from app.crud.entry import entry_crud
from app.crud.calendar import calendar_crud
from app.crud.task import task_crud
from app.crud.user import user_crud

__all__ = [
    "entry_crud",
    "calendar_crud",
    "task_crud",
    "user_crud",
]
