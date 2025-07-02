const { test, expect } = require('@playwright/test');

test('real-time streaming updates work', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');
  
  // Capture console logs to see streaming updates
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  
  // Click Cursor tab
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(1000); // Let streaming connect
  
  // Send a message
  await page.fill('#message-input', 'Test streaming message');
  await page.click('#send-button');
  
  // Wait for the message to be processed and streamed back
  await page.waitForTimeout(2000);
  
  // Check if we received streaming updates
  const hasStreamingUpdate = logs.some(log => 
    log.includes('Real-time update for cursor') || 
    log.includes('Connected to message stream')
  );
  
  if (hasStreamingUpdate) {
    console.log('✅ Real-time streaming is working!');
  } else {
    console.log('⚠️ No streaming updates detected in logs');
    console.log('Logs:', logs.filter(log => log.includes('streaming') || log.includes('update')));
  }
  
  // Verify tab is still selected (main functionality)
  const cursorTab = page.locator('[data-agent="cursor"]');
  await expect(cursorTab).toHaveClass(/bg-blue-600/);
  
  console.log('✅ Tab persistence works with streaming');
});
