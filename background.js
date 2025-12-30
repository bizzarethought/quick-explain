// Background service worker for QuickExplain
// Handles any extension communication and startup

chrome.runtime.onInstalled.addListener(() => {
  console.log('QuickExplain extension installed');
});

// Listen for any messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Handle different message types here if needed
    sendResponse({ success: true });
  } catch (error) {
    console.error('QuickExplain message error:', error);
    sendResponse({ success: false, error: error.message });
  }
  return false; // Don't keep the channel open
});
