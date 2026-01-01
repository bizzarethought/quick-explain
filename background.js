/**
 * Quick Explain Extension - Background Service Worker
 * Version: 1.0.0
 * Handles extension lifecycle and messaging
 */

// Extension Installation

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('QuickExplain v1.0.0 installed successfully');
    // Set default preferences
    chrome.storage.local.set({
      source: 'auto',
      tone: 'friendly',
      theme: 'auto'
    });
  } else if (details.reason === 'update') {
    console.log('QuickExplain updated to v1.0.0');
  }
});

// Message Handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Handle different message types here
    switch (request.type) {
      case 'ping':
        sendResponse({ success: true, message: 'pong' });
        break;
      default:
        sendResponse({ success: true });
    }
  } catch (error) {
    console.error('QuickExplain message error:', error);
    sendResponse({ success: false, error: error.message });
  }
  return false; // Synchronous response
});
