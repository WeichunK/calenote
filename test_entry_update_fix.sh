#!/bin/bash

# Test script to verify entry update fix for 422 error
# This script tests creating and updating entries with all three entry_type values

set -e

API_URL="http://localhost:8000/api/v1"
CALENDAR_ID="24cb508f-9585-4205-9824-742af56e04ab"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Entry Update Fix Test ===${NC}"
echo ""

# Get fresh token
echo "Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@example.com", "password": "demo123456"}')

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}Failed to get access token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""

# Function to test entry creation and update
test_entry_type() {
  local ENTRY_TYPE=$1
  local EMOJI=$2

  echo -e "${YELLOW}Testing entry_type: $EMOJI $ENTRY_TYPE${NC}"

  # Create entry
  echo "  Creating $ENTRY_TYPE entry..."
  CREATE_RESPONSE=$(curl -s -X POST "$API_URL/entries" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"calendar_id\": \"$CALENDAR_ID\",
      \"title\": \"Test $ENTRY_TYPE Entry\",
      \"content\": \"Testing $ENTRY_TYPE creation and update\",
      \"entry_type\": \"$ENTRY_TYPE\",
      \"priority\": 1
    }")

  ENTRY_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

  if [ -z "$ENTRY_ID" ]; then
    echo -e "${RED}  ✗ Failed to create $ENTRY_TYPE entry${NC}"
    echo "  Response: $CREATE_RESPONSE"
    return 1
  fi

  echo -e "${GREEN}  ✓ Created entry: $ENTRY_ID${NC}"

  # Update entry
  echo "  Updating $ENTRY_TYPE entry..."
  UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/entries/$ENTRY_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Updated $ENTRY_TYPE Entry\",
      \"content\": \"This entry has been updated successfully\",
      \"priority\": 2
    }")

  HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n 1)
  RESPONSE_BODY=$(echo "$UPDATE_RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}  ✓ Successfully updated $ENTRY_TYPE entry (HTTP $HTTP_CODE)${NC}"
  else
    echo -e "${RED}  ✗ Failed to update $ENTRY_TYPE entry (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $RESPONSE_BODY"
    return 1
  fi

  # Delete test entry
  echo "  Cleaning up..."
  curl -s -X DELETE "$API_URL/entries/$ENTRY_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null

  echo -e "${GREEN}  ✓ Test entry deleted${NC}"
  echo ""

  return 0
}

# Test all three entry types
FAILED=0

test_entry_type "note" "📝" || FAILED=$((FAILED+1))
test_entry_type "task" "✅" || FAILED=$((FAILED+1))
test_entry_type "event" "📅" || FAILED=$((FAILED+1))

# Summary
echo -e "${YELLOW}=== Test Summary ===${NC}"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo -e "${GREEN}✓ Entry update fix is working correctly${NC}"
  exit 0
else
  echo -e "${RED}✗ $FAILED test(s) failed${NC}"
  exit 1
fi
