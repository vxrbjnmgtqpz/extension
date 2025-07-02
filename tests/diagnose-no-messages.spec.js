const { test, expect } = require('@playwright/test');

test('diagnose no messages issue - comprehensive check', async ({ page }) => {
  // Navigate to fresh app
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');
  
  console.log('=== COMPREHENSIVE DIAGNOSTIC ===');
  
  // Check if JavaScript is loading properly
  const jsErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
      console.log('❌ JS Error:', msg.text());
    } else if (msg.type() === 'log') {
      console.log('📝 Console:', msg.text());
    }
  });
  
  // Wait for app initialization
  await page.waitForTimeout(3000);
  
  console.log('\n=== INITIAL STATE CHECK ===');
  const chatContainer = page.locator('#chat-container');
  const initialHTML = await chatContainer.innerHTML();
  console.log('Initial container content:', initialHTML);
  
  // Check if the tabs are present and clickable
  console.log('\n=== TAB AVAILABILITY ===');
  const tabs = ['chatgpt', 'cursor', 'copilot', 'all'];
  for (const tab of tabs) {
    const tabElement = page.locator(`[data-agent="${tab}"]`);
    const isVisible = await tabElement.isVisible();
    const isEnabled = await tabElement.isEnabled();
    console.log(`Tab ${tab}: visible=${isVisible}, enabled=${isEnabled}`);
  }
  
  console.log('\n=== CLICKING CURSOR TAB ===');
  await page.click('[data-agent="cursor"]');
  
  // Wait and check multiple times to see if content changes
  for (let i = 1; i <= 5; i++) {
    await page.waitForTimeout(1000);
    const content = await chatContainer.innerHTML();
    const messageElements = await page.locator('.mb-4.flex.gap-3').count();
    console.log(`After ${i}s - Message elements: ${messageElements}`);
    console.log(`Content preview: ${content.substring(0, 200)}...`);
  }
  
  console.log('\n=== NETWORK REQUESTS ===');
  // Check if fetch requests are being made
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('Relay.json') || request.url().includes('/stream')) {
      networkRequests.push(request.url());
      console.log('🌐 Network request:', request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('Relay.json') || response.url().includes('/stream')) {
      console.log('📡 Network response:', response.url(), response.status());
    }
  });
  
  // Trigger a refresh to see network activity
  await page.reload();
  await page.waitForSelector('#agent-tabs');
  await page.waitForTimeout(2000);
  
  console.log('\n=== AFTER RELOAD ===');
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(2000);
  
  const finalContent = await chatContainer.innerHTML();
  const finalMessageCount = await page.locator('.mb-4.flex.gap-3').count();
  
  console.log('Final message count:', finalMessageCount);
  console.log('Final container height:', await chatContainer.boundingBox());
  console.log('Network requests made:', networkRequests);
  console.log('JavaScript errors:', jsErrors);
  
  // Check CSS and visibility
  console.log('\n=== CSS & VISIBILITY CHECK ===');
  if (finalMessageCount > 0) {
    const firstMessage = page.locator('.mb-4.flex.gap-3').first();
    const messageStyles = await firstMessage.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        height: styles.height,
        overflow: styles.overflow
      };
    });
    console.log('First message styles:', messageStyles);
  }
  
  // Check if the chat container is scrollable and has proper styles
  const containerStyles = await chatContainer.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      display: styles.display,
      height: styles.height,
      overflow: styles.overflow,
      maxHeight: styles.maxHeight,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight
    };
  });
  console.log('Container styles:', containerStyles);
  
  console.log('\n=== FINAL DIAGNOSIS ===');
  if (finalMessageCount === 0) {
    console.log('❌ NO MESSAGES FOUND - This confirms the issue');
  } else {
    console.log('✅ MESSAGES FOUND - Issue might be visual/CSS related');
  }
});
