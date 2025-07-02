const { test, expect } = require('@playwright/test');

test.describe('Tab Jumping Bug Test', () => {
  test('should stay on cursor tab after sending message - CURRENTLY FAILS', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click the Cursor tab
    await page.click('[data-agent="cursor"]');
    
    // Verify Cursor tab is selected (has blue background)
    const cursorTab = page.locator('[data-agent="cursor"]');
    await expect(cursorTab).toHaveClass(/bg-blue-600/);
    
    // Type a test message
    await page.fill('#message-input', 'Test message for cursor tab');
    
    // Click send button
    await page.click('#send-button');
    
    // Wait a moment for any potential jumping to occur
    await page.waitForTimeout(1000);
    
    // CRITICAL TEST: Verify Cursor tab is STILL selected after sending
    // This should pass but currently FAILS due to the jumping bug
    await expect(cursorTab).toHaveClass(/bg-blue-600/, {
      timeout: 2000
    });
    
    // Additional verification: Check that ChatGPT tab is NOT selected
    const chatgptTab = page.locator('[data-agent="chatgpt"]');
    await expect(chatgptTab).not.toHaveClass(/bg-blue-600/);
    
    // Verify the message input was cleared (this should work)
    await expect(page.locator('#message-input')).toHaveValue('');
    
    console.log('✅ Test passed - tab stayed on Cursor after sending message');
  });
  
  test('should stay on copilot tab after sending message - CURRENTLY FAILS', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click the Copilot tab
    await page.click('[data-agent="copilot"]');
    
    // Verify Copilot tab is selected
    const copilotTab = page.locator('[data-agent="copilot"]');
    await expect(copilotTab).toHaveClass(/bg-blue-600/);
    
    // Type a test message
    await page.fill('#message-input', 'Test message for copilot tab');
    
    // Click send button
    await page.click('#send-button');
    
    // Wait a moment for any potential jumping to occur
    await page.waitForTimeout(1000);
    
    // CRITICAL TEST: Verify Copilot tab is STILL selected after sending
    await expect(copilotTab).toHaveClass(/bg-blue-600/, {
      timeout: 2000
    });
    
    // Additional verification: Check that ChatGPT tab is NOT selected
    const chatgptTab = page.locator('[data-agent="chatgpt"]');
    await expect(chatgptTab).not.toHaveClass(/bg-blue-600/);
    
    console.log('✅ Test passed - tab stayed on Copilot after sending message');
  });
  
  test('chatgpt tab should work normally (control test)', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click the ChatGPT tab (this might already be selected)
    await page.click('[data-agent="chatgpt"]');
    
    // Verify ChatGPT tab is selected
    const chatgptTab = page.locator('[data-agent="chatgpt"]');
    await expect(chatgptTab).toHaveClass(/bg-blue-600/);
    
    // Type a test message
    await page.fill('#message-input', 'Test message for chatgpt tab');
    
    // Click send button
    await page.click('#send-button');
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Verify ChatGPT tab is STILL selected after sending
    await expect(chatgptTab).toHaveClass(/bg-blue-600/, {
      timeout: 2000
    });
    
    console.log('✅ Control test passed - ChatGPT tab stayed selected');
  });
});
