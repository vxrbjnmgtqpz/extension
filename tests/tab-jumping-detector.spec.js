const { test, expect } = require('@playwright/test');

// Chrome-only test that will FAIL if tab jumping bug is present
test('cursor tab jumping detection - FAILS if bug exists', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3001');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Click the Cursor tab
  await page.click('[data-agent="cursor"]');
  console.log('✓ Clicked Cursor tab');
  
  // Verify Cursor tab is selected before sending
  const cursorTab = page.locator('[data-agent="cursor"]');
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  console.log('✓ Cursor tab confirmed selected before sending');
  
  // Type a test message
  await page.fill('#message-input', 'Test message that might cause jumping');
  console.log('✓ Typed test message');
  
  // Click send button
  await page.click('#send-button');
  console.log('✓ Clicked send button');
  
  // Wait briefly for any immediate UI changes
  await page.waitForTimeout(500);
  
  // Check if cursor tab is STILL selected - this will FAIL if jumping occurs
  const cursorStillSelected = await cursorTab.getAttribute('class');
  console.log(`Cursor tab classes after send: ${cursorStillSelected}`);
  
  // Check all tabs to see which one is selected
  const allTabs = await page.locator('.agent-tab').all();
  for (let i = 0; i < allTabs.length; i++) {
    const tab = allTabs[i];
    const agent = await tab.getAttribute('data-agent');
    const classes = await tab.getAttribute('class');
    const isSelected = classes.includes('bg-blue-600');
    console.log(`${agent} tab: ${isSelected ? 'SELECTED' : 'not selected'}`);
  }
  
  // CRITICAL TEST: If tab jumps, this assertion WILL FAIL
  await expect(cursorTab).toHaveClass(/bg-blue-600/, {
    timeout: 1000
  });
  
  // Additional verification: ChatGPT should NOT be selected
  const chatgptTab = page.locator('[data-agent="chatgpt"]');
  await expect(chatgptTab).not.toHaveClass(/bg-blue-600/);
  
  console.log('🎉 SUCCESS: No tab jumping detected!');
});
