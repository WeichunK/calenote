#!/usr/bin/env python3
"""
Test script to verify task creation API behavior with different inputs
"""
import requests
import json

API_URL = "http://localhost:8000"
CALENDAR_ID = "24cb508f-9585-4205-9824-742af56e04ab"

def login():
    """Login and get access token"""
    response = requests.post(
        f"{API_URL}/api/v1/auth/login",
        json={"email": "demo@example.com", "password": "demo123456"}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✓ Login successful. Token: {token[:20]}...")
        return token
    else:
        print(f"✗ Login failed: {response.status_code} {response.text}")
        exit(1)

def create_task(token, data, test_name):
    """Create a task and print response"""
    print(f"\n{'='*60}")
    print(f"Test: {test_name}")
    print(f"{'='*60}")
    print(f"Request payload: {json.dumps(data, indent=2)}")

    response = requests.post(
        f"{API_URL}/api/v1/tasks",
        json=data,
        headers={"Authorization": f"Bearer {token}"}
    )

    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json() if response.text else {}, indent=2)}")

    return response

def main():
    print("="*60)
    print("Task Creation API Testing")
    print("="*60)

    token = login()

    # Test 1: Minimal task (only required fields)
    create_task(token, {
        "calendar_id": CALENDAR_ID,
        "title": "Test Task - Minimal"
    }, "Minimal task (only required fields)")

    # Test 2: Task with empty strings for optional fields
    create_task(token, {
        "calendar_id": CALENDAR_ID,
        "title": "Test Task - Empty Strings",
        "description": "",
        "color": "",
        "icon": ""
    }, "Task with empty strings")

    # Test 3: Task with null values (omitted fields)
    create_task(token, {
        "calendar_id": CALENDAR_ID,
        "title": "Test Task - Null Values",
        "description": None,
        "color": None,
        "icon": None
    }, "Task with null values")

    # Test 4: Task with valid color
    create_task(token, {
        "calendar_id": CALENDAR_ID,
        "title": "Test Task - Valid Color",
        "color": "#3b82f6"
    }, "Task with valid color")

    # Test 5: Task with invalid color (too short)
    create_task(token, {
        "calendar_id": CALENDAR_ID,
        "title": "Test Task - Invalid Color",
        "color": "#fff"
    }, "Task with invalid color (too short)")

    print(f"\n{'='*60}")
    print("Testing Complete")
    print("="*60)

if __name__ == "__main__":
    main()
