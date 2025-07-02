const { test, expect } = require('@playwright/test');

// Test with network delays to see if server response timing affects jumping
test('test with slow network conditions', async ({ page }) => {
  // Simulate slow network
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 500); // 500ms delay
  });
  
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  console.log('=== Testing with slow network ===');
  
  // Click Cursor tab
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(100);
  
  // Type message
  await page.fill('#message-input', 'Slow network test');
  
  // Send message
  await page.click('#send-button');
  
  // Wait for send to complete with delays
  await page.waitForTimeout(2000);
  
  // Check if still on cursor tab
  const cursorTab = page.locator('[data-agent="cursor"]');
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  
  console.log('✅ No jumping with slow network');
});
