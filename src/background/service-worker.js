// Chrome Extension MV3 Service Worker
importScripts('../config.js');
importScripts('../utils/storage.js');

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

// --- KEYBOARD SHORTCUTS (chrome.commands) ---
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "toggle-whitelist" && command !== "toggle-blacklist") return;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        chrome.tabs.sendMessage(tab.id, { action: "getChannelDetails" }, async (response) => {
            if (chrome.runtime.lastError || !response?.channelName) return;

            const channelName = response.channelName;
            const channelUrl = response.url || "";
            const isWhitelist = command === "toggle-whitelist";
            const targetList = isWhitelist ? "whitelist" : "blacklist";
            const targetLabel = isWhitelist ? "Whitelist" : "Blacklist";

            const data = await StorageUtils.getAllData();
            const currentList = data[targetList] || [];
            const isListed = currentList.some((item) => item.name === channelName);

            if (isListed) {
                await StorageUtils.removeChannel(channelName, targetList);
                chrome.tabs.sendMessage(tab.id, {
                    action: "showToast",
                    text: `Removed from ${targetLabel}: ${channelName}`,
                    isSuccess: false
                });
            } else {
                await StorageUtils.addChannel(channelName, channelUrl, targetList);
                chrome.tabs.sendMessage(tab.id, {
                    action: "showToast",
                    text: `Added to ${targetLabel}: ${channelName}`,
                    isSuccess: true
                });
            }
        });
    } catch (err) {
        console.error('[YIM] Error handling command:', err);
    }
});
