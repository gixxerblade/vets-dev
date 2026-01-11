#!/bin/bash

# Datastar Integration Test Script
# This script runs Playwright tests to validate Datastar integration

echo "=========================================="
echo "Datastar Integration Test Suite"
echo "=========================================="
echo ""

# Check if server is running
echo "Checking if server is running on localhost:3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo "Server is running at http://localhost:3000"
else
    echo "WARNING: Server may not be running at http://localhost:3000"
    echo "Please ensure the server is running with: bun run dev"
    exit 1
fi

# Install Playwright if not already installed
echo "Checking Playwright installation..."
if ! command -v playwright &> /dev/null; then
    echo "Installing Playwright..."
    bun add -d @playwright/test
    bunx playwright install
fi

# Run the Datastar integration tests
echo "Running Datastar integration tests..."
bunx playwright test tests/datastar-integration.spec.ts --reporter=list

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "All tests passed!"
else
    echo "Some tests failed. Check the report for details."
fi
