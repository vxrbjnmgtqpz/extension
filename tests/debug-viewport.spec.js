const { test, expect } = require('@playwright/test');

test('debug viewport and message visibility', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForSelector('#agent-tabs');
  
  console.log('=== VIEWPORT AND SCROLL DEBUGGING ===');
  
  // Get page dimensions
  const viewport = page.viewportSize();
  console.log('Viewport size:', viewport);
  
  // Click cursor tab
  await page.click('[data-agent="cursor"]');
  await page.waitForTimeout(2000);
  
  // Check if messages are in viewport
  const chatContainer = page.locator('#chat-container');
  const containerBox = await chatContainer.boundingBox();
  console.log('Chat container bounding box:', containerBox);
  
  // Check if there's a scroll issue
  const scrollInfo = await chatContainer.evaluate(el => ({
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    offsetTop: el.offsetTop,
    offsetHeight: el.offsetHeight
  }));
  console.log('Scroll info:', scrollInfo);
  
  // Check if messages are visible in viewport
  const messageElements = page.locator('.mb-4.flex.gap-3');
  const messageCount = await messageElements.count();
  console.log('Total messages:', messageCount);
  
  if (messageCount > 0) {
    // Check first few messages
    for (let i = 0; i < Math.min(3, messageCount); i++) {
      const messageBox = await messageElements.nth(i).boundingBox();
      const isInViewport = messageBox && 
        messageBox.y >= 0 && 
        messageBox.y < viewport.height &&
        messageBox.x >= 0 && 
        messageBox.x < viewport.width;
      
      console.log(`Message ${i + 1}: box=${JSON.stringify(messageBox)}, inViewport=${isInViewport}`);
    }
    
    // Scroll to different positions to test visibility
    console.log('\n=== SCROLL TESTING ===');
    await chatContainer.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(500);
    
    const topMessage = await messageElements.first().boundingBox();
    console.log('After scroll to top - First message box:', topMessage);
    
    await chatContainer.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);
    
    const bottomAfterScroll = await chatContainer.evaluate(el => el.scrollTop);
    console.log('After scroll to bottom - scroll position:', bottomAfterScroll);
  }
  
  // Take a screenshot for manual inspection
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved as debug-screenshot.png');
  
  // Test if clicking in different areas reveals content
  console.log('\n=== INTERACTION TESTING ===');
  await page.click('#chat-container');
  await page.waitForTimeout(500);
  
  const afterClickCount = await messageElements.count();
  console.log('Messages after clicking container:', afterClickCount);
  
  // Check if there are any overlay elements hiding content
  const overlays = await page.locator('div').evaluateAll(divs => {
    return divs
      .filter(div => {
        const style = window.getComputedStyle(div);
        return style.position === 'fixed' || style.position === 'absolute';
      })
      .map(div => ({
        id: div.id,
        className: div.className,
        zIndex: window.getComputedStyle(div).zIndex,
        position: window.getComputedStyle(div).position
      }));
  });
  console.log('Positioned elements that might overlay:', overlays);
});
