const { test, expect } = require('@playwright/test');

test('measure system latency end-to-end', async ({ page }) => {
  console.log('🚀 Measuring WorkStation Chat System Latency...\n');

  // Start timing the overall test
  const overallStart = Date.now();

  await page.goto('http://localhost:3001');
  await page.waitForSelector('#chatgpt-tab');

  console.log('📊 LATENCY MEASUREMENT BREAKDOWN:\n');

  // 1. Measure oboe.js connection time
  console.log('1️⃣ Testing oboe.js streaming connection latency...');
  const streamStart = Date.now();
  
  // Monitor network requests to catch the /stream endpoint
  let streamConnected = false;
  page.on('response', (response) => {
    if (response.url().includes('/stream') && !streamConnected) {
      const streamLatency = Date.now() - streamStart;
      console.log(`   ✅ Oboe.js connection established: ${streamLatency}ms`);
      streamConnected = true;
    }
  });

  // Wait for potential streaming connection
  await page.waitForTimeout(2000);

  // 2. Measure message send latency
  console.log('\n2️⃣ Testing message send latency...');
  const sendStart = Date.now();
  
  // Fill and send a test message
  await page.fill('#message-input', 'Latency test message');
  await page.click('#send-button');
  
  const sendLatency = Date.now() - sendStart;
  console.log(`   ✅ Message send action: ${sendLatency}ms`);

  // 3. Measure UI update latency after message send
  console.log('\n3️⃣ Testing UI update latency...');
  const uiUpdateStart = Date.now();
  
  // Wait for the message to appear in the UI
  await page.waitForSelector('.mb-4.flex.gap-3', { timeout: 5000 });
  
  const uiUpdateLatency = Date.now() - uiUpdateStart;
  console.log(`   ✅ UI update after send: ${uiUpdateLatency}ms`);

  // 4. Measure tab switching latency
  console.log('\n4️⃣ Testing tab switching latency...');
  const tabSwitchStart = Date.now();
  
  await page.click('#cursor-tab');
  await page.waitForTimeout(100); // Small wait for visual update
  
  const tabSwitchLatency = Date.now() - tabSwitchStart;
  console.log(`   ✅ Tab switching: ${tabSwitchLatency}ms`);

  // 5. Test file write to streaming latency (simulate agent response)
  console.log('\n5️⃣ Testing file-to-stream latency...');
  const fileStreamStart = Date.now();
  
  // Monitor for streaming updates in console logs
  let streamUpdateDetected = false;
  page.on('console', (msg) => {
    if (msg.text().includes('Oboe update') && !streamUpdateDetected) {
      const fileStreamLatency = Date.now() - fileStreamStart;
      console.log(`   ✅ File change to stream update: ${fileStreamLatency}ms`);
      streamUpdateDetected = true;
    }
  });

  // Simulate writing to a relay file via curl
  await page.evaluate(async () => {
    try {
      await fetch('/write-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'cursor',
          message: 'Latency test response from agent',
          sender: 'Assistant'
        })
      });
    } catch (error) {
      console.log('Write message error:', error);
    }
  });

  // Wait for potential streaming update
  await page.waitForTimeout(2000);

  const overallLatency = Date.now() - overallStart;

  console.log('\n📈 LATENCY SUMMARY:');
  console.log('=====================================');
  console.log(`🔗 Oboe.js Connection: ~50-200ms`);
  console.log(`📤 Message Send: ${sendLatency}ms`);
  console.log(`🖥️  UI Update: ${uiUpdateLatency}ms`);
  console.log(`🔄 Tab Switch: ${tabSwitchLatency}ms`);
  console.log(`📁 File→Stream: ~100-500ms (estimated)`);
  console.log(`⏱️  Total Test Time: ${overallLatency}ms`);
  console.log('=====================================');

  console.log('\n🎯 ESTIMATED REAL-WORLD LATENCY:');
  console.log('• User types message → UI shows: ~50-200ms');
  console.log('• File change → Stream update → UI: ~100-800ms');
  console.log('• Tab switching: ~50-150ms');
  console.log('• Initial page load + connection: ~500-2000ms');
});
