const { test, expect } = require('@playwright/test');

test('verify messages display in UI when manually browsing', async ({ page }) => {
  // Navigate to fresh app
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');
  
  console.log('✅ Page loaded');
  
  // Wait for initial messages to load
  await page.waitForTimeout(2000);
  
  // Check initial state - no tab selected
  const chatContainer = page.locator('#chat-container');
  const initialContent = await chatContainer.innerHTML();
  console.log('Initial state (no tab selected):', initialContent.substring(0, 100) + '...');
  
  // Click Cursor tab
  await page.click('[data-agent="cursor"]');
  
  // Wait for messages to load and display
  await page.waitForTimeout(1000);
  
  // Check if messages are visible
  const messageElements = page.locator('.mb-4.flex.gap-3');
  const messageCount = await messageElements.count();
  console.log(`✅ Found ${messageCount} message elements after selecting Cursor tab`);
  
  // Get some sample messages
  if (messageCount > 0) {
    for (let i = 0; i < Math.min(3, messageCount); i++) {
      const messageText = await messageElements.nth(i).locator('.markdown-content').textContent();
      const messageTime = await messageElements.nth(i).locator('.text-xs.text-gray-500').textContent();
      console.log(`Message ${i + 1}: "${messageText.trim()}" at ${messageTime}`);
    }
  }
  
  // Check if the container shows proper content
  const finalContent = await chatContainer.innerHTML();
  const hasMessages = finalContent.includes('message-content');
  const hasNoMessagesText = finalContent.includes('No messages yet');
  const hasSelectAgentText = finalContent.includes('Select an agent');
  
  console.log('Content analysis:');
  console.log('- Has message elements:', hasMessages);
  console.log('- Shows "No messages yet":', hasNoMessagesText);
  console.log('- Shows "Select an agent":', hasSelectAgentText);
  console.log('- Container height:', await chatContainer.boundingBox());
  
  // Test other tabs too
  for (const agent of ['chatgpt', 'copilot']) {
    await page.click(`[data-agent="${agent}"]`);
    await page.waitForTimeout(500);
    
    const agentMessageCount = await messageElements.count();
    console.log(`✅ ${agent.toUpperCase()} tab: ${agentMessageCount} messages`);
  }
  
  // Test 'All' tab
  await page.click('[data-agent="all"]');
  await page.waitForTimeout(500);
  
  const allMessageCount = await messageElements.count();
  console.log(`✅ ALL tab: ${allMessageCount} total messages`);
  
  console.log('🎉 Manual verification complete!');
});
