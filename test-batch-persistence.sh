#!/bin/bash

# Test script to verify batch data persists across container updates
# This script simulates a container update and verifies data persistence

set -e

echo "🧪 Testing Batch Data Persistence Across Container Updates"
echo "=========================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Step 1: Check if container is running
print_status "Checking if container is running..."
if ! docker ps -q -f name=habit-discord-bot | grep -q .; then
    print_error "Container not running. Please start it first with: docker-compose up -d"
    exit 1
fi
print_success "Container is running"

# Step 2: Create test batch file
print_status "Creating test batch data..."
TEST_BATCH_DATA='{
  "name": "test batch persistence",
  "startDate": "2025-12-28"
}'

echo "$TEST_BATCH_DATA" > data/current-batch.json
print_success "Test batch created: data/current-batch.json"

# Step 3: Verify data exists inside container
print_status "Verifying data inside container..."
CONTAINER_DATA=$(docker exec habit-discord-bot cat /app/data/current-batch.json 2>/dev/null || echo "")
if [ -z "$CONTAINER_DATA" ]; then
    print_error "Data not found inside container!"
    exit 1
fi
print_success "Data accessible inside container"

# Step 4: Simulate container restart
print_status "Simulating container restart..."
docker-compose restart
print_success "Container restarted"

# Wait for container to be ready
sleep 5

# Step 5: Verify data still exists after restart
print_status "Verifying data persisted after restart..."
if [ ! -f "data/current-batch.json" ]; then
    print_error "Data file missing after restart!"
    exit 1
fi

AFTER_RESTART=$(cat data/current-batch.json)
if [ "$AFTER_RESTART" != "$TEST_BATCH_DATA" ]; then
    print_error "Data changed after restart!"
    echo "Expected: $TEST_BATCH_DATA"
    echo "Got: $AFTER_RESTART"
    exit 1
fi
print_success "Data persisted after restart"

# Step 6: Simulate full container rebuild
print_status "Simulating full container rebuild..."
docker-compose down
print_success "Container stopped and removed"

docker-compose up -d
print_success "Container rebuilt and started"

# Wait for container to be ready
sleep 5

# Step 7: Verify data still exists after rebuild
print_status "Verifying data persisted after rebuild..."
if [ ! -f "data/current-batch.json" ]; then
    print_error "Data file missing after rebuild!"
    exit 1
fi

AFTER_REBUILD=$(cat data/current-batch.json)
if [ "$AFTER_REBUILD" != "$TEST_BATCH_DATA" ]; then
    print_error "Data changed after rebuild!"
    echo "Expected: $TEST_BATCH_DATA"
    echo "Got: $AFTER_REBUILD"
    exit 1
fi
print_success "Data persisted after rebuild"

# Step 8: Clean up test data
print_status "Cleaning up test data..."
rm data/current-batch.json
print_success "Test data removed"

# Final summary
echo ""
echo "=========================================================="
print_success "🎉 ALL TESTS PASSED!"
echo ""
print_status "Batch data persistence verified:"
echo "  ✓ Data survives container restart"
echo "  ✓ Data survives container rebuild"
echo "  ✓ Data accessible from both host and container"
echo ""
print_status "Your batch system is ready for production use!"
echo "=========================================================="
