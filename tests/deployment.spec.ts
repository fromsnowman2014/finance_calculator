import { test, expect } from '@playwright/test';

// Run against any deployment: BASE_URL=https://... npx playwright test
const baseURL = process.env.BASE_URL ?? 'https://finance-calculator-sein-ohs-projects.vercel.app';

test.describe('Stock return calculator', () => {
  test('loads the homepage', async ({ page }) => {
    const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Stock investment return calculator');
    await expect(page.getByRole('tab')).toHaveCount(5);
  });

  test('growth simulator reacts to inputs and draws charts', async ({ page }) => {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    const finalValue = page.getByTestId('final-value');
    const before = await finalValue.textContent();

    const monthly = page.getByLabel('Monthly investment', { exact: true }).first();
    await monthly.fill('1500');
    await monthly.blur();
    await expect(finalValue).not.toHaveText(before ?? '');

    await expect(page.locator('.recharts-surface').first()).toBeVisible();
    await page.getByRole('radio', { name: 'Market risk' }).click();
    await expect(page.getByText('Chance of profit')).toBeVisible();
  });

  test('every calculator tab renders its result', async ({ page }) => {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'Trade return' }).click();
    await expect(page.getByTestId('net-profit')).toContainText('$');
    await page.getByRole('tab', { name: 'Average cost' }).click();
    await expect(page.getByTestId('average-price')).toHaveText('$99.29');
    await expect(page.getByTestId('planner-result')).toContainText('15 shares');
    await page.getByRole('tab', { name: 'Goal planner' }).click();
    await expect(page.getByTestId('required-monthly')).toContainText('/mo');
  });

  test('market check shows live indicators and feeds the simulator', async ({ page }) => {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('market-strip')).toBeVisible();
    await page.getByRole('tab', { name: 'Market check' }).click();
    await expect(page.getByTestId('market-stance')).toBeVisible({ timeout: 30_000 });
    for (const key of ['buffett', 'yieldCurve', 'creditSpread', 'vix']) {
      await expect(page.getByTestId(`indicator-${key}`)).toBeVisible();
    }
    await page.getByRole('radio', { name: 'Max', exact: true }).click();
    await expect(page.getByText('Higher than', { exact: false }).first()).toBeVisible();

    const apply = page.getByRole('button', { name: 'Apply to simulator' });
    if (await apply.isVisible()) {
      await apply.click();
      await expect(page.getByRole('tab', { name: 'Growth simulator' })).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('switches to Korean', async ({ page }) => {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.getByRole('radio', { name: '한국어' }).click();
    await expect(page.locator('h1')).toHaveText('주식 투자 수익률 계산기');
  });

  test('opens links shared from the old compound interest calculator', async ({ page }) => {
    await page.goto(`${baseURL}/?p=5000&c=200&y=30&r=7`, { waitUntil: 'networkidle' });
    await expect(page.getByLabel('Monthly investment', { exact: true }).first()).toHaveValue('200');
    await expect(page.getByText('Portfolio value in 30 years')).toBeVisible();
  });
});
