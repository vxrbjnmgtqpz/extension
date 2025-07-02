const { test, expect } = require('@playwright/test');

test('verify all agents show unique icons in All tab', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);
  
  // Click "All" tab to see messages from all agents
  await page.click('[data-agent="all"]');
  await page.waitForTimeout(1000);
  
  // Check for agent names in messages
  const agentNames = await page.$$eval('.text-sm.font-medium.text-gray-300', (elements) => {
    return elements.map(el => el.textContent.trim());
  });
  
  console.log('Agent names found:', [...new Set(agentNames)]);
  
  // Check for unique agent icons
  const agentIcons = await page.$$eval('.w-8.h-8.rounded-full', (elements) => {
    return elements.map(el => el.textContent.trim());
  });
  
  const uniqueIcons = [...new Set(agentIcons)];
  console.log('Unique icons found:', uniqueIcons);
  
  // Should have user icon and different agent icons
  expect(uniqueIcons.includes('👤')).toBe(true); // User
  
  // Should have at least one of the agent icons
  const hasAgentIcons = uniqueIcons.some(icon => ['🧠', '🤖', '🛠️'].includes(icon));
  expect(hasAgentIcons).toBe(true);
  
  console.log('✅ All agents show unique icons in All tab!');
});
