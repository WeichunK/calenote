#!/bin/bash

# Test script to verify that the backend ACCEPTS the corrected payload
# This simulates what the FIXED frontend will send (undefined/null instead of empty strings)

API_URL="http://localhost:8000/api/v1"
CALENDAR_ID="24cb508f-9585-4205-9824-742af56e04ab"

echo "======================================"
echo "Task Creation Fix Verification Test"
echo "======================================"
echo ""

# Step 1: Login to get access token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123456"
  }')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Test 1: Task with only required fields (omit optional fields entirely)
echo "Test 1: Creating task with only required fields..."
echo "Payload: title='task1' (optional fields omitted)"
echo ""

CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${API_URL}/tasks/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{
    \"calendar_id\": \"${CALENDAR_ID}\",
    \"title\": \"task1\",
    \"icon\": \"🎯\"
  }")

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "$CREATE_RESPONSE" | sed 's/HTTP_STATUS:.*//')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ TEST 1 PASSED: Task created successfully with minimal fields!"
  echo ""

  # Clean up
  TASK_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$TASK_ID" ]; then
    curl -s -X DELETE "${API_URL}/tasks/${TASK_ID}" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" > /dev/null
  fi
else
  echo "❌ TEST 1 FAILED: HTTP $HTTP_STATUS"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi

# Test 2: Task with null values explicitly (JSON null)
echo ""
echo "Test 2: Creating task with explicit null values..."
echo "Payload: title='task2', description=null, color=null"
echo ""

CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${API_URL}/tasks/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{
    \"calendar_id\": \"${CALENDAR_ID}\",
    \"title\": \"task2\",
    \"description\": null,
    \"due_date\": null,
    \"color\": null,
    \"icon\": null
  }")

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "$CREATE_RESPONSE" | sed 's/HTTP_STATUS:.*//')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ TEST 2 PASSED: Task created successfully with null values!"
  echo ""

  # Clean up
  TASK_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$TASK_ID" ]; then
    curl -s -X DELETE "${API_URL}/tasks/${TASK_ID}" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" > /dev/null
  fi
else
  echo "❌ TEST 2 FAILED: HTTP $HTTP_STATUS"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi

# Test 3: Task with valid optional fields
echo ""
echo "Test 3: Creating task with valid optional fields..."
echo "Payload: title='task3', description='test', color='#3b82f6', icon='🎯'"
echo ""

CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${API_URL}/tasks/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{
    \"calendar_id\": \"${CALENDAR_ID}\",
    \"title\": \"task3\",
    \"description\": \"test description\",
    \"color\": \"#3b82f6\",
    \"icon\": \"🎯\"
  }")

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "$CREATE_RESPONSE" | sed 's/HTTP_STATUS:.*//')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ TEST 3 PASSED: Task created successfully with valid optional fields!"
  echo ""
  echo "Created task:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

  # Clean up
  TASK_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$TASK_ID" ]; then
    echo ""
    echo "Cleaning up..."
    curl -s -X DELETE "${API_URL}/tasks/${TASK_ID}" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" > /dev/null
  fi
else
  echo "❌ TEST 3 FAILED: HTTP $HTTP_STATUS"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi

echo ""
echo "======================================"
echo "✅ ALL TESTS PASSED!"
echo "======================================"
echo ""
echo "The backend correctly accepts:"
echo "  • Omitted optional fields"
echo "  • Null values for optional fields"
echo "  • Valid values for optional fields"
echo ""
echo "The frontend fix (sanitizeValue) will convert empty strings to undefined,"
echo "which means they will be omitted from the JSON payload."
