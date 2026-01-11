# Datastar Integration Test Suite

This directory contains the Datastar integration validation test suite for the vets-dev application.

## Quick Start

### 1. Start Your Server
```bash
bun run dev
```

### 2. Run Quick Validation (Recommended)
```bash
bun run manual-datastar-check.ts
```

This gives you immediate feedback on:
- Server connectivity
- Home page loading
- Datastar script presence
- Authentication redirects
- Health check endpoint

### 3. Run Full Test Suite (With Screenshots)
```bash
chmod +x run-datastar-tests.sh
./run-datastar-tests.sh
```

This provides:
- Visual proof via screenshots
- Network traffic analysis
- Detailed test reports
- DOM inspection results

## Test Files

- **playwright-report-datastar-integration.md** - Complete test documentation
- **tests/datastar-integration.spec.ts** - Full Playwright test suite
- **manual-datastar-check.ts** - Quick CLI validation script
- **run-datastar-tests.sh** - Test runner with setup

## What Gets Tested

1. Home page loads successfully
2. Datastar script tag is present in HTML
3. Datastar CDN is requested over network
4. Dashboard redirects to authentication
5. Verify page redirects to authentication
6. Health check endpoint works

## Results Location

After running the full Playwright suite, results will be saved to:
```
playwright-reports/[timestamp]/
  - 01-home-page.png
  - 02-datastar-script-check.png
  - 03-dashboard-redirect.png
  - 04-verify-redirect.png
  - 05-health-check.png
  - 06-network-analysis.png
```

## Expected Results

All tests should PASS with:
- Home page: 200 OK with Datastar script
- Dashboard: Redirect to /auth/github
- Verify: Redirect to /auth/github
- Health: JSON response {"status": "ok"}
- Network: Datastar CDN request successful

## If Tests Fail

1. Check server is running: `curl http://localhost:3000/health`
2. Manually inspect page: `curl http://localhost:3000`
3. Look for Datastar script: `curl http://localhost:3000 | grep datastar`
4. Review server logs for errors
5. Check browser console for JavaScript errors

## Need Help?

See the full documentation in **playwright-report-datastar-integration.md**
