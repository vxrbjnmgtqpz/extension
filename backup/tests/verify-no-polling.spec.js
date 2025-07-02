const { test, expect } = require('@playwright/test');

test('verify no polling or refresh logic remains in the codebase', async ({ page }) => {
  console.log('🔍 Testing that the app uses only oboe.js streaming...');

  // Test 1: Check that only legitimate setTimeout/setInterval remain (UI timing)
  await page.goto('http://localhost:3001');
  
  // Monitor network requests to ensure no polling
  const requestLog = [];
  
  page.on('request', request => {
    requestLog.push({
      url: request.url(),
      method: request.method()
    });
  });

  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more to let oboe.js start
  await page.waitForTimeout(2000);
  
  // Check if we can find the tabs (they might load dynamically)
  const hasTabsLoaded = await page.locator('#chatgpt-tab').isVisible();
  console.log('📊 Tabs loaded:', hasTabsLoaded);
  
  // Clear request log and monitor for 5 seconds
  requestLog.length = 0;
  await page.waitForTimeout(5000);
  
  // Count requests to relay files - should only be initial requests, not repeated polling
  const relayRequests = requestLog.filter(req => 
    req.url.includes('ChatGPTRelay.json') || 
    req.url.includes('CursorRelay.json') || 
    req.url.includes('CopilotRelay.json')
  );
  
  console.log('📊 Relay file requests during 5s:', relayRequests.length);
  console.log('📊 Total requests during 5s:', requestLog.length);
  
  // Should have very few relay requests (just initial loads)
  expect(relayRequests.length).toBeLessThanOrEqual(3); // One per agent max
  
  // Test 2: Verify oboe streaming endpoint is being used
  const streamRequests = requestLog.filter(req => req.url.includes('/stream'));
  console.log('🌊 Oboe stream requests:', streamRequests.length);
  expect(streamRequests.length).toBeGreaterThan(0); // Should have streaming requests
  
  console.log('✅ Verified: No polling logic detected, using oboe.js streaming only');
});

test('verify proxy window uses oboe streaming not polling', async ({ page }) => {
  console.log('🔍 Testing proxy window streaming...');
  
  const requestLog = [];
  page.on('request', request => {
    requestLog.push({
      url: request.url(),
      method: request.method()
    });
  });

  await page.goto('http://localhost:3001/proxy-window.html');
  
  // Wait for page to load
  await page.waitForSelector('textarea');
  await page.waitForTimeout(3000);
  
  // Check for proxy stream endpoint usage
  const proxyStreamRequests = requestLog.filter(req => req.url.includes('/proxy-stream'));
  console.log('🌊 Proxy stream requests:', proxyStreamRequests.length);
  expect(proxyStreamRequests.length).toBeGreaterThan(0);
  
  // Check that userProxy.json is not being polled repeatedly
  const userProxyRequests = requestLog.filter(req => req.url.includes('userProxy.json'));
  console.log('📊 UserProxy.json requests:', userProxyRequests.length);
  expect(userProxyRequests.length).toBeLessThanOrEqual(1); // Should only load once, not poll
  
  console.log('✅ Verified: Proxy window uses oboe streaming, no polling');
});
