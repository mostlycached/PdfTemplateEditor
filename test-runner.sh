#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== PDF Enhancement App Integration Test Runner ===${NC}"
echo "Running tests..."

# Default to running all tests if no specific test is provided
if [ $# -eq 0 ]; then
  echo -e "${BLUE}Running all integration tests${NC}"
  npx vitest run client/src/test
else
  echo -e "${BLUE}Running specific test: $1${NC}"
  npx vitest run "$1"
fi

# Get the exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed successfully!${NC}"
else
  echo -e "${RED}✗ Some tests failed. See above for details.${NC}"
fi

exit $EXIT_CODE