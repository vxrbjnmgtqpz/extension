const { test, expect } = require('@playwright/test');

// Simple Chrome-only test for Cursor tab jumping bug
test('cursor tab should not jump after sending message', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3001');
  
  // Wait for basic elements instead of networkidle (due to SSE connection)
  await page.waitForSelector('#agent-tabs');
  await page.waitForSelector('#message-input');
  
  // Click the Cursor tab
  await page.click('[data-agent="cursor"]');
  
  // Type a test message
  await page.fill('#message-input', 'Test message for cursor');
  
  // Click send button
  await page.click('#send-button');
  
  // Wait a moment for any potential jumping to occur
  await page.waitForTimeout(1000);
  
  // CRITICAL TEST: Check if it jumped to a different page/tab
  // If the cursor tab is no longer selected (blue background), the test fails
  const cursorTab = page.locator('[data-agent="cursor"]');
  await expect(cursorTab).toHaveClass(/bg-blue-600/, {
    timeout: 2000
  });
  
  // Also verify that ChatGPT tab is NOT selected (would indicate jumping)
  const chatgptTab = page.locator('[data-agent="chatgpt"]');
  await expect(chatgptTab).not.toHaveClass(/bg-blue-600/);
  
  console.log('✅ Success: Tab stayed on Cursor after sending message');
});
