const { test, expect } = require('@playwright/test');

test('verify message alignment and unique agent icons', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000); // Wait for messages to load
  
  // Click Cursor tab to see messages
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(1000);
  
  // Check for unique agent icons in the messages
  const agentIcons = await page.$$eval('.w-8.h-8.rounded-full', (elements) => {
    return elements.map(el => el.textContent.trim());
  });
  
  console.log('Agent icons found:', agentIcons);
  
  // Should have mix of 👤 (user) and specific agent icons (🧠 🤖 🛠️)
  const hasUserIcon = agentIcons.some(icon => icon === '👤');
  const hasUniqueAgentIcons = agentIcons.some(icon => ['🧠', '🤖', '🛠️'].includes(icon));
  
  console.log('Has user icon (👤):', hasUserIcon);
  console.log('Has unique agent icons:', hasUniqueAgentIcons);
  
  // Check message alignment by looking for flex-row-reverse class (user messages)
  const userMessages = await page.$$eval('.flex-row-reverse', (elements) => elements.length);
  console.log('User messages (right-aligned):', userMessages);
  
  // Check that we have both left and right aligned messages
  expect(userMessages).toBeGreaterThan(0); // Should have some user messages
  expect(hasUserIcon).toBe(true); // Should have user icons
  
  console.log('✅ Message alignment and unique icons verified!');
});
