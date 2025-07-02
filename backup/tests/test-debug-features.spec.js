const { test, expect } = require('@playwright/test');

test('test debug features and manual interaction', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');
  
  console.log('=== TESTING DEBUG FEATURES ===');
  
  // Wait for app to initialize and check console logs
  await page.waitForTimeout(3000);
  
  // Check if debug buttons are present
  const debugReload = page.locator('#debug-reload');
  const debugInfo = page.locator('#debug-info');
  const clearStorage = page.locator('#clear-storage');
  
  await expect(debugReload).toBeVisible();
  await expect(debugInfo).toBeVisible();
  await expect(clearStorage).toBeVisible();
  
  console.log('✅ Debug buttons are visible');
  
  // Click debug info button
  await debugInfo.click();
  await page.waitForTimeout(500);
  
  // Click cursor tab
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(1000);
  
  // Count messages
  const messageCount = await page.locator('.mb-4.flex.gap-3').count();
  console.log('Messages displayed after clicking Cursor tab:', messageCount);
  
  // Click debug reload
  await debugReload.click();
  await page.waitForTimeout(2000);
  
  const messageCountAfterReload = await page.locator('.mb-4.flex.gap-3').count();
  console.log('Messages after debug reload:', messageCountAfterReload);
  
  // Test tab switching with debug info
  for (const agent of ['chatgpt', 'copilot', 'all']) {
    await page.click(`[data-agent="${agent}"]`);
    await page.waitForTimeout(500);
    
    const count = await page.locator('.mb-4.flex.gap-3').count();
    console.log(`${agent.toUpperCase()} tab: ${count} messages`);
  }
  
  // Switch back to cursor and verify persistence
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(500);
  
  const finalCount = await page.locator('.mb-4.flex.gap-3').count();
  console.log('Final cursor count:', finalCount);
  
  console.log('🎉 Debug features test complete!');
});
