// Chrome Extension MV3 Service Worker
importScripts('../config.js');

// --- MIGRATION: sync -> local (v1.3.27+) ---
// One-time migration for existing users who had data in chrome.storage.sync
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update' || details.reason === 'install') {
        chrome.storage.local.get('_migrated', (localData) => {
            if (localData._migrated) return; // Already migrated

            chrome.storage.sync.get(null, (syncData) => {
                if (syncData && Object.keys(syncData).length > 0) {
                    syncData._migrated = true;
                    chrome.storage.local.set(syncData, () => {
                        console.log('[YIM] Migration complete: sync -> local', Object.keys(syncData).length, 'keys');
                    });
                } else {
                    // No sync data, just mark as migrated
                    chrome.storage.local.set({ _migrated: true });
                }
            });
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateIcon") {
        const tabId = sender.tab.id;

        switch (request.status) {
            case "like":
                // Green Badge for LIKE
                chrome.action.setBadgeText({ text: "LIKE", tabId: tabId });
                chrome.action.setBadgeBackgroundColor({ color: CONFIG.COLORS.badgeLike, tabId: tabId });
                break;

            case "dislike":
                // Red Badge for DISLIKE
                chrome.action.setBadgeText({ text: "DIS", tabId: tabId });
                chrome.action.setBadgeBackgroundColor({ color: CONFIG.COLORS.badgeDislike, tabId: tabId });
                break;

            case "neutral":
                // Gray Badge for NEUTRAL (only if enabled)
                chrome.action.setBadgeText({ text: "...", tabId: tabId });
                chrome.action.setBadgeBackgroundColor({ color: CONFIG.COLORS.badgeNeutral, tabId: tabId });
                break;

            case "disabled":
                // Explicitly disabled
                chrome.action.setBadgeText({ text: "OFF", tabId: tabId });
                chrome.action.setBadgeBackgroundColor({ color: CONFIG.COLORS.badgeNeutral, tabId: tabId });
                break;

            case "none":
            default:
                // Clear Badge
                chrome.action.setBadgeText({ text: "", tabId: tabId });
                break;
        }
    }
});