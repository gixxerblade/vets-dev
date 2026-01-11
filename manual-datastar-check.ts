#!/usr/bin/env bun

/**
 * Manual Datastar Integration Check
 * Quick script to verify Datastar is properly integrated
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: TestResult[] = [];

async function checkEndpoint(path: string): Promise<Response> {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch ${path}: ${error}`);
  }
}

async function test1_HomePageLoads() {
  console.log('\nTest 1: Home Page Loads...');
  try {
    const response = await checkEndpoint('/');
    const html = await response.text();

    if (response.ok) {
      results.push({
        test: 'Home Page Loads',
        status: 'PASS',
        details: `Status: ${response.status}`
      });

      // Check for Datastar script
      const hasDatastarScript = html.includes('datastar') || html.includes('starfederation');
      if (hasDatastarScript) {
        results.push({
          test: 'Datastar Script Present',
          status: 'PASS',
          details: 'Found Datastar reference in HTML'
        });
      } else {
        results.push({
          test: 'Datastar Script Present',
          status: 'FAIL',
          details: 'No Datastar script found in HTML'
        });
      }

      // Look for specific script tag
      const scriptMatch = html.match(/<script[^>]*datastar[^>]*>/i);
      if (scriptMatch) {
        console.log('Found script tag:', scriptMatch[0]);
      }
    } else {
      results.push({
        test: 'Home Page Loads',
        status: 'FAIL',
        details: `Status: ${response.status}`
      });
    }
  } catch (error) {
    results.push({
      test: 'Home Page Loads',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }
}

async function test2_DashboardRedirect() {
  console.log('\nTest 2: Dashboard Redirect...');
  try {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual'
    });

    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('Location');
      results.push({
        test: 'Dashboard Redirect',
        status: 'PASS',
        details: `Redirects to: ${location}`
      });
    } else if (response.status === 200) {
      results.push({
        test: 'Dashboard Redirect',
        status: 'WARN',
        details: 'No redirect occurred - may be authenticated or redirect handled client-side'
      });
    } else {
      results.push({
        test: 'Dashboard Redirect',
        status: 'FAIL',
        details: `Unexpected status: ${response.status}`
      });
    }
  } catch (error) {
    results.push({
      test: 'Dashboard Redirect',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }
}

async function test3_VerifyRedirect() {
  console.log('\nTest 3: Verify Page Redirect...');
  try {
    const response = await fetch(`${BASE_URL}/verify`, {
      redirect: 'manual'
    });

    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('Location');
      results.push({
        test: 'Verify Page Redirect',
        status: 'PASS',
        details: `Redirects to: ${location}`
      });
    } else if (response.status === 200) {
      results.push({
        test: 'Verify Page Redirect',
        status: 'WARN',
        details: 'No redirect occurred - may be authenticated or redirect handled client-side'
      });
    } else {
      results.push({
        test: 'Verify Page Redirect',
        status: 'FAIL',
        details: `Unexpected status: ${response.status}`
      });
    }
  } catch (error) {
    results.push({
      test: 'Verify Page Redirect',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }
}

async function test4_HealthCheck() {
  console.log('\nTest 4: Health Check Endpoint...');
  try {
    const response = await checkEndpoint('/health');
    const json = await response.json();

    if (json.status === 'ok') {
      results.push({
        test: 'Health Check',
        status: 'PASS',
        details: `Response: ${JSON.stringify(json)}`
      });
    } else {
      results.push({
        test: 'Health Check',
        status: 'FAIL',
        details: `Unexpected response: ${JSON.stringify(json)}`
      });
    }
  } catch (error) {
    results.push({
      test: 'Health Check',
      status: 'FAIL',
      details: `Error: ${error}`
    });
  }
}

async function runAllTests() {
  console.log('==========================================');
  console.log('Datastar Integration Check');
  console.log('==========================================');

  // Check if server is running
  console.log('\nChecking if server is running...');
  try {
    await fetch(BASE_URL);
    console.log('Server is accessible at', BASE_URL);
  } catch (error) {
    console.error('ERROR: Cannot connect to server at', BASE_URL);
    console.error('Please ensure the server is running with: bun run dev');
    process.exit(1);
  }

  // Run all tests
  await test1_HomePageLoads();
  await test2_DashboardRedirect();
  await test3_VerifyRedirect();
  await test4_HealthCheck();

  // Print results
  console.log('\n==========================================');
  console.log('Test Results Summary');
  console.log('==========================================\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠';
    console.log(`${icon} ${result.test}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Details: ${result.details}\n`);

    if (result.status === 'PASS') passed++;
    else if (result.status === 'FAIL') failed++;
    else warnings++;
  }

  console.log('==========================================');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Warnings: ${warnings}`);
  console.log('==========================================\n');

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
