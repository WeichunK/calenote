#!/usr/bin/env python3
"""
Test script to verify the entry update fix for 422 error.
Tests creating and updating entries with all three entry_type values.
"""

import requests
import json

API_URL = "http://localhost:8000/api/v1"
CALENDAR_ID = "24cb508f-9585-4205-9824-742af56e04ab"

def get_token():
    """Get authentication token"""
    response = requests.post(
        f"{API_URL}/auth/login",
        json={"email": "demo@example.com", "password": "demo123456"}
    )
    response.raise_for_status()
    return response.json()["access_token"]

def test_entry_type(token, entry_type, emoji):
    """Test creating and updating an entry with a specific type"""
    print(f"\n{emoji} Testing entry_type: {entry_type}")
    headers = {"Authorization": f"Bearer {token}"}

    # Create entry
    print(f"  Creating {entry_type} entry...")
    create_data = {
        "calendar_id": CALENDAR_ID,
        "title": f"Test {entry_type} Entry",
        "content": f"Testing {entry_type} creation and update",
        "entry_type": entry_type,
        "priority": 1
    }

    response = requests.post(
        f"{API_URL}/entries",
        headers=headers,
        json=create_data
    )

    if response.status_code != 201:
        print(f"  ✗ Failed to create {entry_type} entry (HTTP {response.status_code})")
        print(f"  Response: {response.text}")
        return False

    entry_id = response.json()["id"]
    print(f"  ✓ Created entry: {entry_id}")

    # Update entry
    print(f"  Updating {entry_type} entry...")
    update_data = {
        "title": f"Updated {entry_type} Entry",
        "content": "This entry has been updated successfully",
        "priority": 2
    }

    response = requests.patch(
        f"{API_URL}/entries/{entry_id}",
        headers=headers,
        json=update_data
    )

    if response.status_code != 200:
        print(f"  ✗ Failed to update {entry_type} entry (HTTP {response.status_code})")
        print(f"  Response: {response.text}")
        # Clean up
        requests.delete(f"{API_URL}/entries/{entry_id}", headers=headers)
        return False

    print(f"  ✓ Successfully updated {entry_type} entry")

    # Test updating with entry_type field
    print(f"  Testing update with entry_type field...")
    update_with_type = {
        "title": f"Updated {entry_type} Entry v2",
        "entry_type": entry_type  # This was causing 422 if type didn't match backend
    }

    response = requests.patch(
        f"{API_URL}/entries/{entry_id}",
        headers=headers,
        json=update_with_type
    )

    if response.status_code != 200:
        print(f"  ✗ Failed to update with entry_type field (HTTP {response.status_code})")
        print(f"  Response: {response.text}")
        # Clean up
        requests.delete(f"{API_URL}/entries/{entry_id}", headers=headers)
        return False

    print(f"  ✓ Successfully updated with entry_type field")

    # Clean up
    print(f"  Cleaning up...")
    requests.delete(f"{API_URL}/entries/{entry_id}", headers=headers)
    print(f"  ✓ Test entry deleted")

    return True

def main():
    print("=== Entry Update Fix Test ===\n")

    # Get authentication token
    print("Getting authentication token...")
    try:
        token = get_token()
        print("✓ Authentication successful")
    except Exception as e:
        print(f"✗ Failed to authenticate: {e}")
        return 1

    # Test all three entry types
    entry_types = [
        ("note", "📝"),
        ("task", "✅"),
        ("event", "📅")
    ]

    failed = 0
    for entry_type, emoji in entry_types:
        try:
            if not test_entry_type(token, entry_type, emoji):
                failed += 1
        except Exception as e:
            print(f"  ✗ Test failed with exception: {e}")
            failed += 1

    # Summary
    print("\n=== Test Summary ===")
    if failed == 0:
        print("✓ All tests passed!")
        print("✓ Entry update fix is working correctly")
        return 0
    else:
        print(f"✗ {failed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit(main())
