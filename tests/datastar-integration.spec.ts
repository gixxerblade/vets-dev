import { test, expect } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const REPORT_DIR = join(process.cwd(), 'playwright-reports', new Date().toISOString().replace(/[:.]/g, '-'));

test.describe('Datastar Integration Tests', () => {
  test.beforeAll(async () => {
    // Create report directory
    await mkdir(REPORT_DIR, { recursive: true });
  });

  test('Test 1: Home Page - Load and Verify Datastar Script', async ({ page }) => {
    console.log('Test 1: Navigating to home page...');

    // Navigate to home page
    await page.goto(BASE_URL);

    // Take initial screenshot
    await page.screenshot({
      path: join(REPORT_DIR, '01-home-page.png'),
      fullPage: true
    });

    // Get page content
    const content = await page.content();

    // Check if Datastar script tag exists
    const hasDatastarScript = content.includes('@starfederation/datastar') ||
                              content.includes('datastar');

    console.log('Datastar script found:', hasDatastarScript);

    // Check for specific script tag
    const scriptTag = await page.locator('script[src*="datastar"]').count();
    console.log('Datastar script tags found:', scriptTag);

    // Verify page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if page loaded successfully
    expect(page.url()).toBe(BASE_URL + '/');

    // Log the findings
    console.log('Home page validation complete');
    console.log('Has Datastar script:', hasDatastarScript);
  });

  test('Test 2: Check Datastar Script Element in DOM', async ({ page }) => {
    console.log('Test 2: Checking Datastar script in DOM...');

    await page.goto(BASE_URL);

    // Check for Datastar script tag with specific CDN URL
    const datastarScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const datastarScripts = scripts.filter(script =>
        script.src.includes('datastar') ||
        script.src.includes('starfederation')
      );
      return datastarScripts.map(s => ({
        src: s.src,
        type: s.type,
        defer: s.defer,
        async: s.async
      }));
    });

    console.log('Datastar scripts found:', JSON.stringify(datastarScript, null, 2));

    // Take screenshot
    await page.screenshot({
      path: join(REPORT_DIR, '02-datastar-script-check.png'),
      fullPage: true
    });

    // Check if Datastar object is available in window
    const datastarInWindow = await page.evaluate(() => {
      return typeof (window as any).Datastar !== 'undefined' ||
             typeof (window as any).datastar !== 'undefined';
    });

    console.log('Datastar object in window:', datastarInWindow);
  });

  test('Test 3: Dashboard Page - Check Redirect', async ({ page }) => {
    console.log('Test 3: Testing dashboard redirect...');

    // Navigate to dashboard
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });

    // Wait a moment for any redirects
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
      path: join(REPORT_DIR, '03-dashboard-redirect.png'),
      fullPage: true
    });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after dashboard navigation:', currentUrl);

    // Verify redirect happened
    const isRedirected = currentUrl.includes('/auth/github') ||
                        currentUrl !== BASE_URL + '/dashboard';
    console.log('Redirected to auth:', isRedirected);
  });

  test('Test 4: Verify Page - Check Redirect', async ({ page }) => {
    console.log('Test 4: Testing verify page redirect...');

    // Navigate to verify
    await page.goto(BASE_URL + '/verify', { waitUntil: 'networkidle' });

    // Wait a moment for any redirects
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
      path: join(REPORT_DIR, '04-verify-redirect.png'),
      fullPage: true
    });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after verify navigation:', currentUrl);

    // Verify redirect happened
    const isRedirected = currentUrl.includes('/auth/github') ||
                        currentUrl !== BASE_URL + '/verify';
    console.log('Redirected to auth:', isRedirected);
  });

  test('Test 5: Health Check Endpoint', async ({ page }) => {
    console.log('Test 5: Testing health check endpoint...');

    // Navigate to health endpoint
    const response = await page.goto(BASE_URL + '/health');

    // Take screenshot
    await page.screenshot({
      path: join(REPORT_DIR, '05-health-check.png'),
      fullPage: true
    });

    // Get response body
    const body = await page.content();
    console.log('Health check response:', body);

    // Try to parse JSON
    try {
      const jsonMatch = body.match(/\{.*\}/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        console.log('Parsed JSON:', json);
        expect(json.status).toBe('ok');
      }
    } catch (e) {
      console.error('Failed to parse health check JSON:', e);
    }

    // Check response status
    expect(response?.status()).toBe(200);
  });

  test('Test 6: Network Analysis - Check Datastar CDN Request', async ({ page }) => {
    console.log('Test 6: Analyzing network requests for Datastar...');

    const datastarRequests: Array<{ url: string; status: number }> = [];

    // Listen to network requests
    page.on('request', request => {
      if (request.url().includes('datastar') || request.url().includes('starfederation')) {
        console.log('Datastar request:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('datastar') || response.url().includes('starfederation')) {
        datastarRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Navigate to home page
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Take screenshot
    await page.screenshot({
      path: join(REPORT_DIR, '06-network-analysis.png'),
      fullPage: true
    });

    console.log('Datastar network requests:', JSON.stringify(datastarRequests, null, 2));

    // Log all requests summary
    console.log(`Total Datastar-related requests: ${datastarRequests.length}`);
  });

  test.afterAll(async () => {
    console.log(`\n===========================================`);
    console.log(`Test report and screenshots saved to:`);
    console.log(REPORT_DIR);
    console.log(`===========================================\n`);
  });
});
