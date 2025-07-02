const { test, expect } = require('@playwright/test');

test('verify auto-scroll to bottom functionality', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');
  
  console.log('=== TESTING AUTO-SCROLL FUNCTIONALITY ===');
  
  // Wait for messages to load
  await page.waitForTimeout(2000);
  
  // Click cursor tab to load messages
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(1000);
  
  // Check initial scroll position
  const chatContainer = page.locator('#chat-container');
  const initialScrollInfo = await chatContainer.evaluate(el => ({
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    isAtBottom: Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 10
  }));
  
  console.log('Initial scroll info:', initialScrollInfo);
  console.log('Is at bottom initially:', initialScrollInfo.isAtBottom);
  
  // Test manual scroll to top
  await chatContainer.evaluate(el => el.scrollTop = 0);
  await page.waitForTimeout(500);
  
  const afterScrollTopInfo = await chatContainer.evaluate(el => ({
    scrollTop: el.scrollTop,
    isAtBottom: Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 10
  }));
  
  console.log('After scroll to top:', afterScrollTopInfo);
  
  // Test the manual scroll bottom button
  await page.click('#scroll-bottom');
  await page.waitForTimeout(1000);
  
  const afterManualScrollInfo = await chatContainer.evaluate(el => ({
    scrollTop: el.scrollTop,
    isAtBottom: Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 10
  }));
  
  console.log('After manual scroll button:', afterManualScrollInfo);
  console.log('Successfully scrolled to bottom:', afterManualScrollInfo.isAtBottom);
  
  // Test tab switching auto-scroll
  await page.click('[data-agent="chatgpt"]');
  await page.waitForTimeout(1000);
  
  const chatgptScrollInfo = await chatContainer.evaluate(el => ({
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    isAtBottom: Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 10
  }));
  
  console.log('ChatGPT tab scroll info:', chatgptScrollInfo);
  console.log('Auto-scrolled to bottom on tab switch:', chatgptScrollInfo.isAtBottom);
  
  // Test sending message auto-scroll
  await page.fill('#message-input', 'Test auto-scroll after sending');
  await page.click('#send-button');
  await page.waitForTimeout(2000);
  
  const afterSendScrollInfo = await chatContainer.evaluate(el => ({
    scrollTop: el.scrollTop,
    isAtBottom: Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 10
  }));
  
  console.log('After sending message:', afterSendScrollInfo);
  console.log('Auto-scrolled after sending:', afterSendScrollInfo.isAtBottom);
  
  console.log('🎉 Auto-scroll test complete!');
});
