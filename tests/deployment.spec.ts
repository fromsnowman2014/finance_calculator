import { test, expect } from '@playwright/test';

test.describe('Vercel Deployment Test', () => {
  const deploymentUrl = 'https://finance-calculator-git-main-sein-ohs-projects.vercel.app';

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

  test('should not show 404 error page', async ({ page }) => {
    await page.goto(deploymentUrl);

    // Check that 404 error is NOT present
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('NOT_FOUND');

    console.log('✓ No 404 error detected');
  });
});
