const { test, expect } = require('@playwright/test');

// Test with rapid clicking to expose race conditions
test('rapid tab switching and sending should not cause jumping', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  console.log('=== Starting rapid tab switching test ===');
  
  // Click Cursor tab
  await page.click('[data-agent="cursor"]');
  console.log('Clicked Cursor tab');
  
  // Type a message quickly
  await page.fill('#message-input', 'Fast typing test');
  console.log('Typed message');
  
  // Send immediately
  await page.click('#send-button');
  console.log('Clicked send');
  
  // Wait minimal time and check
  await page.waitForTimeout(100);
  
  const cursorTab = page.locator('[data-agent="cursor"]');
  const isStillSelected = await cursorTab.getAttribute('class');
  console.log(`Cursor tab classes after quick send: ${isStillSelected}`);
  
  // Check if jumping occurred
  if (!isStillSelected.includes('bg-blue-600')) {
    console.log('❌ TAB JUMPING DETECTED!');
    throw new Error('Tab jumped away from Cursor!');
  }
  
  console.log('✅ No jumping in rapid test');
});
