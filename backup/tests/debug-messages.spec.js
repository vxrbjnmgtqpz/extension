const { test, expect } = require('@playwright/test');

test('debug message loading', async ({ page }) => {
  // Capture all console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate to app
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');

  // Click Cursor tab
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(2000); // Wait for loading

  // Check what's in the chat container
  const chatContainer = await page.locator('#chat-container').innerHTML();
  console.log('Chat container content:', chatContainer);

  // Check console logs
  console.log('Console logs:');
  logs.forEach(log => console.log(log));

  // Check if we can see any message elements
  const messageElements = await page.locator('.message-content').count();
  console.log(`Number of message elements found: ${messageElements}`);

  // Check if there's a "No messages yet" indicator
  const noMessages = await page.locator('text=No messages yet').count();
  console.log(`"No messages yet" indicators: ${noMessages}`);

  // Check if there's a "Select an agent" indicator
  const selectAgent = await page.locator('text=Select an agent tab').count();
  console.log(`"Select agent" indicators: ${selectAgent}`);
});
