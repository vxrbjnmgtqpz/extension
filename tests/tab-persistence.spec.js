const { test, expect } = require('@playwright/test');

test('last selected tab should persist after page refresh', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  
  // Click Cursor tab
  await page.click('[data-agent="cursor"]');
  
  // Verify it's selected
  const cursorTab = page.locator('[data-agent="cursor"]');
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  
  // Refresh the page
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Check that Cursor tab is STILL selected after refresh
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  
  console.log('✅ Last selected tab persisted after page refresh');
});

test('should remember different tab selections', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  
  // Click Copilot tab
  await page.click('[data-agent="copilot"]');
  
  // Verify it's selected
  const copilotTab = page.locator('[data-agent="copilot"]');
  await expect(copilotTab).toHaveClass(/bg-blue-600/);
  
  // Refresh the page
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Check that Copilot tab is STILL selected after refresh
  await expect(copilotTab).toHaveClass(/bg-blue-600/);
  
  // Verify Cursor tab is NOT selected
  const cursorTab = page.locator('[data-agent="cursor"]');
  await expect(cursorTab).not.toHaveClass(/bg-blue-600/);
  
  console.log('✅ Tab selection correctly switched and persisted');
});
