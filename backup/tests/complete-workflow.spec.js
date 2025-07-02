const { test, expect } = require('@playwright/test');

test('complete tab persistence workflow - no jumping ever', async ({ page }) => {
  // Navigate to fresh app
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');
  
  console.log('1. Fresh load - should show no tab selected initially');
  
  // Click Cursor tab
  await page.click('[data-agent="cursor"]');
  const cursorTab = page.locator('[data-agent="cursor"]');
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  console.log('2. ✅ Cursor tab selected');
  
  // Send a message
  await page.fill('#message-input', 'Test message to see if tab jumps');
  await page.click('#send-button');
  await page.waitForTimeout(1000);
  
  // Verify tab STILL selected after sending
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  console.log('3. ✅ Tab stayed on Cursor after sending message');
  
  // Refresh the page (simulate any potential page reload)
  await page.reload();
  await page.waitForSelector('#agent-tabs');
  
  // Verify tab is STILL selected after refresh
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  console.log('4. ✅ Tab persisted after page refresh');
  
  // Switch to a different tab
  await page.click('[data-agent="copilot"]');
  const copilotTab = page.locator('[data-agent="copilot"]');
  await expect(copilotTab).toHaveClass(/bg-blue-600/);
  await expect(cursorTab).not.toHaveClass(/bg-blue-600/);
  console.log('5. ✅ Successfully switched to Copilot tab');
  
  // Send another message
  await page.fill('#message-input', 'Another test message');
  await page.click('#send-button');
  await page.waitForTimeout(1000);
  
  // Verify new tab selection persists
  await expect(copilotTab).toHaveClass(/bg-blue-600/);
  await expect(cursorTab).not.toHaveClass(/bg-blue-600/);
  console.log('6. ✅ Copilot tab stayed selected after sending');
  
  // Final refresh test
  await page.reload();
  await page.waitForSelector('#agent-tabs');
  
  // Verify final state
  await expect(copilotTab).toHaveClass(/bg-blue-600/);
  await expect(cursorTab).not.toHaveClass(/bg-blue-600/);
  console.log('7. ✅ Final state: Copilot tab persisted after refresh');
  
  console.log('🎉 COMPLETE SUCCESS: No tab jumping, full persistence working!');
});
