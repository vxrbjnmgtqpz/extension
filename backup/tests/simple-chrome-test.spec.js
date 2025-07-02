const { test, expect, chromium } = require('@playwright/test');

// Very simple Chrome-only test as requested
test.describe('Simple Tab Jumping Test - Chrome Only', () => {
  test('click cursor tab, type message, hit send - should NOT jump to different page/tab', async () => {
    // Force Chrome browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Navigate to app
      await page.goto('http://localhost:3001');
      await page.waitForLoadState('networkidle');
      
      // Click the Cursor tab
      await page.click('[data-agent="cursor"]');
      
      // Type a message  
      await page.type('#message-input', 'test message for cursor');
      
      // Hit send
      await page.click('#send-button');
      
      // Wait for any potential jumping
      await page.waitForTimeout(1000);
      
      // THE TEST THAT DOESN'T WORK YET: 
      // If it jumps to a different page/tab, this test should FAIL
      const cursorTab = page.locator('[data-agent="cursor"]');
      const isStillSelected = await cursorTab.getAttribute('class');
      
      if (!isStillSelected.includes('bg-blue-600')) {
        throw new Error('❌ TEST FAILED: Tab jumped away from Cursor! Current classes: ' + isStillSelected);
      }
      
      // Also check that we didn't jump to ChatGPT
      const chatgptTab = page.locator('[data-agent="chatgpt"]');
      const chatgptClasses = await chatgptTab.getAttribute('class');
      
      if (chatgptClasses.includes('bg-blue-600')) {
        throw new Error('❌ TEST FAILED: Jumped to ChatGPT tab! ChatGPT classes: ' + chatgptClasses);
      }
      
      console.log('✅ SUCCESS: Tab stayed on Cursor, no jumping detected');
      
    } finally {
      await browser.close();
    }
  });
});
