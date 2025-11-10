#!/bin/bash

# Test script to verify task creation API

API_URL="http://localhost:8000"
CALENDAR_ID="24cb508f-9585-4205-9824-742af56e04ab"

echo "=========================================="
echo "Task Creation API Testing"
echo "=========================================="
echo ""

# First, login to get token
echo "1. Logging in as demo@example.com..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to get auth token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Login successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 1: Minimal task (only required fields)
echo "2. Testing minimal task creation (only title)..."
RESPONSE1=$(curl -s -X POST "$API_URL/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"calendar_id\": \"$CALENDAR_ID\",
    \"title\": \"Test Task - Minimal\"
  }")

echo "Response: $RESPONSE1"
echo ""

# Test 2: Task with empty strings for optional fields
echo "3. Testing task with empty strings..."
RESPONSE2=$(curl -s -X POST "$API_URL/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"calendar_id\": \"$CALENDAR_ID\",
    \"title\": \"Test Task - Empty Strings\",
    \"description\": \"\",
    \"color\": \"\",
    \"icon\": \"\"
  }")

echo "Response: $RESPONSE2"
echo ""

# Test 3: Task with null values
echo "4. Testing task with null values..."
RESPONSE3=$(curl -s -X POST "$API_URL/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"calendar_id\": \"$CALENDAR_ID\",
    \"title\": \"Test Task - Nulls\",
    \"description\": null,
    \"color\": null,
    \"icon\": null
  }")

echo "Response: $RESPONSE3"
echo ""

# Test 4: Task with valid color
echo "5. Testing task with valid color..."
RESPONSE4=$(curl -s -X POST "$API_URL/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"calendar_id\": \"$CALENDAR_ID\",
    \"title\": \"Test Task - Valid Color\",
    \"color\": \"#3b82f6\"
  }")

echo "Response: $RESPONSE4"
echo ""

echo "=========================================="
echo "Testing Complete"
echo "=========================================="
