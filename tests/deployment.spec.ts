import { test, expect } from '@playwright/test';

test.describe('Vercel Deployment Test', () => {
  const deploymentUrl = 'https://finance-calculator-pmecgj5qn-sein-ohs-projects.vercel.app';

  test('should load the homepage without 404 error', async ({ page }) => {
    console.log(`Testing deployment at: ${deploymentUrl}`);

    // Navigate to the deployment URL
    const response = await page.goto(deploymentUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check response status
    console.log(`Response status: ${response?.status()}`);
    expect(response?.status()).toBe(200);

    // Take screenshot for debugging
    await page.screenshot({ path: 'deployment-test.png', fullPage: true });

    // Check if the page contains the expected content
    await expect(page.locator('h1')).toContainText('Compound Interest Calculator');

    console.log('✓ Homepage loaded successfully');
  });

  test('should render calculator components', async ({ page }) => {
    await page.goto(deploymentUrl, { waitUntil: 'networkidle' });

    // Check for calculator elements
    const hasInputs = await page.locator('input[type="number"]').count();
    console.log(`Found ${hasInputs} number inputs`);
    expect(hasInputs).toBeGreaterThan(0);

    const hasSliders = await page.locator('input[type="range"]').count();
    console.log(`Found ${hasSliders} range sliders`);
    expect(hasSliders).toBeGreaterThan(0);

    console.log('✓ Calculator components rendered');
  });

  test('should show calculator title instead of 404 page', async ({ page }) => {
    await page.goto(deploymentUrl, { waitUntil: 'networkidle' });

    // Check that the calculator page is showing, not a 404 page
    const title = await page.locator('h1').first().textContent();
    expect(title).toContain('Compound Interest Calculator');

    // Check that we're NOT on a 404 error page
    const has404Title = await page.locator('title:has-text("404")').count();
    expect(has404Title).toBe(0);

    console.log('✓ Calculator page loaded, not 404 error page');
  });
});
