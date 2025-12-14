// Chrome Extension MV3 Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateIcon") {
        if (request.status === "active") {
            // Green Badge
            chrome.action.setBadgeText({ text: "ON", tabId: sender.tab.id });
            chrome.action.setBadgeBackgroundColor({ color: "#00E676", tabId: sender.tab.id });
        } else {
            // Clear Badge
            chrome.action.setBadgeText({ text: "", tabId: sender.tab.id });
        }
    }
});