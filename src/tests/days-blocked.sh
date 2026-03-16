#!/bin/bash

BASE_URL="http://localhost:3000/api"
TOKEN=""

# Active spaces for happy path tests
ACTIVE_SPACE="cmmdtrfio001jqo01cm0trqbj"        # Nayi Space 2 - ACTIVE
ACTIVE_SPACE_2="cmlntv5ad00020w1cd485og40"       # Noida darbar - ACTIVE

# Non-active spaces for status tests
SUSPENDED_SPACE="cmlwb7xq600000wrv5xkhkatc"      # SUSPENDED
PAUSED_SPACE="cmlnt8drm00000wbyqfqjmfem"         # PAUSED
UNDER_REVIEW_SPACE="cmlnqyb0p000o0wf2bmeiz374"   # UNDER_REVIEW
REJECTED_SPACE="cmlnqy8a7000c0wf2pnrkbinh"       # REJECTED

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC} - $1"; }
fail() { echo -e "${RED}❌ FAIL${NC} - $1"; }
section() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${YELLOW}🧪 $1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

run_test() {
  local test_name=$1
  local space_id=$2
  local body=$3
  local expected_contains=$4

  response=$(curl -s -X POST "$BASE_URL/spaces/$space_id/block-days" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body")

  echo "Response: $response" | jq . 2>/dev/null || echo "Response: $response"

  if echo "$response" | grep -q "$expected_contains"; then
    pass "$test_name"
  else
    fail "$test_name (expected: '$expected_contains')"
  fi
}

# ============================================================
section "HAPPY PATHS"
# ============================================================

echo -e "\n📌 Test 1: Block single valid date range"
run_test "Single valid range" "$ACTIVE_SPACE" '{
  "dates": [
    {
      "startingDate": "2026-08-01",
      "endingDate": "2026-08-05",
      "reason": "Maintenance"
    }
  ]
}' '"success":true'

echo -e "\n📌 Test 2: Block multiple valid date ranges"
run_test "Multiple valid ranges" "$ACTIVE_SPACE_2" '{
  "dates": [
    { "startingDate": "2026-09-01", "endingDate": "2026-09-05", "reason": "Wedding" },
    { "startingDate": "2026-10-10", "endingDate": "2026-10-15", "reason": "Out of country" }
  ]
}' '"success":true'

echo -e "\n📌 Test 3: Block without reason (optional)"
run_test "Block without reason" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-11-01", "endingDate": "2026-11-03" }
  ]
}' '"success":true'

echo -e "\n📌 Test 4: Mix valid and invalid in same request"
run_test "Mixed valid/invalid array" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-12-01", "endingDate": "2026-12-05", "reason": "Holiday" },
    { "startingDate": "2026-03-01", "endingDate": "2026-02-01" }
  ]
}' '"success":true'

# ============================================================
section "VALIDATION ERRORS"
# ============================================================

echo -e "\n📌 Test 5: End date before start date"
run_test "End before start" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-15", "endingDate": "2026-08-10" }
  ]
}' '"success":false'

echo -e "\n📌 Test 6: Start date in the past"
run_test "Start date in past" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2025-01-01", "endingDate": "2026-01-10" }
  ]
}' '"success":false'

run_test "Single day block" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-20", "endingDate": "2026-08-20" }
  ]
}' '"success":true'

echo -e "\n📌 Test 8: Date range exceeds 365 days"
run_test "Range > 365 days" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2028-08-02", "reason": "Very long block" }
  ]
}' '"success":false'

echo -e "\n📌 Test 9: Invalid date format"
run_test "Invalid date format" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "not-a-date", "endingDate": "2026-08-10" }
  ]
}' 'message'

echo -e "\n📌 Test 10: Empty dates array"
run_test "Empty dates array" "$ACTIVE_SPACE" '{
  "dates": []
}' 'message'

# ============================================================
section "OWNERSHIP & STATUS ERRORS"
# ============================================================

echo -e "\n📌 Test 11: Space does not exist"
run_test "Non-existent space" "nonexistent_space_id" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2026-08-05" }
  ]
}' 'Space not found'

echo -e "\n📌 Test 12: Space is SUSPENDED"
run_test "Suspended space" "$SUSPENDED_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2026-08-05" }
  ]
}' 'ACTIVE'

echo -e "\n📌 Test 13: Space is PAUSED"
run_test "Paused space" "$PAUSED_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2026-08-05" }
  ]
}' 'ACTIVE'

echo -e "\n📌 Test 14: Space is UNDER_REVIEW"
run_test "Under review space" "$UNDER_REVIEW_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2026-08-05" }
  ]
}' 'ACTIVE'

echo -e "\n📌 Test 15: Space is REJECTED"
run_test "Rejected space" "$REJECTED_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2026-08-05" }
  ]
}' 'ACTIVE'

# ============================================================
section "OVERLAP ERRORS"
# ============================================================

echo -e "\n📌 Test 16: Exact overlap with existing block (run Test 1 first)"
run_test "Exact overlap" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2026-08-05", "reason": "Duplicate" }
  ]
}' '"success":false'

echo -e "\n📌 Test 17: Partial overlap with existing block"
run_test "Partial overlap" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-03", "endingDate": "2026-08-08" }
  ]
}' '"success":false'

echo -e "\n📌 Test 18: Multiple ranges, some overlap some dont"
run_test "Mixed overlap array" "$ACTIVE_SPACE" '{
  "dates": [
    { "startingDate": "2026-08-01", "endingDate": "2026-08-05" },
    { "startingDate": "2026-12-20", "endingDate": "2026-12-25", "reason": "Christmas" }
  ]
}' '"success":false'

# ============================================================
section "AUTH ERRORS"
# ============================================================

echo -e "\n📌 Test 19: No auth token"
response=$(curl -s -X POST "$BASE_URL/spaces/$ACTIVE_SPACE/block-days" \
  -H "Content-Type: application/json" \
  -d '{"dates":[{"startingDate":"2026-09-01","endingDate":"2026-09-05"}]}')
echo "Response: $response" | jq . 2>/dev/null
if echo "$response" | grep -qE '"statusCode":401|Unauthorized'; then
  pass "No auth token → 401"
else
  fail "No auth token (expected 401)"
fi

echo -e "\n📌 Test 20: Invalid token"
response=$(curl -s -X POST "$BASE_URL/spaces/$ACTIVE_SPACE/block-days" \
  -H "Authorization: Bearer invalid.token.here" \
  -H "Content-Type: application/json" \
  -d '{"dates":[{"startingDate":"2026-09-01","endingDate":"2026-09-05"}]}')
echo "Response: $response" | jq . 2>/dev/null
if echo "$response" | grep -qE '"statusCode":401|Unauthorized'; then
  pass "Invalid token → 401"
else
  fail "Invalid token (expected 401)"
fi

# ============================================================
section "SUMMARY"
# ============================================================
echo -e "\n${YELLOW}All cases covered! 🚀${NC}"
echo -e "Active space used: ${ACTIVE_SPACE}"
echo -e "Run cleanup SQL to reset blocked dates between test runs:\n"
echo -e "${BLUE}DELETE FROM days_blocked WHERE space_id IN ('$ACTIVE_SPACE', '$ACTIVE_SPACE_2');${NC}\n"
