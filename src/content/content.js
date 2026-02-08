// Uses CONFIG from src/config.js (injected by manifest)
// CONFIG.SELECTORS, CONFIG.DEFAULTS, CONFIG.TIMING, etc.

// --- STATE ---
let state = {
    currentVideoId: null,
    processedVideoId: null,
    checkInterval: null,
    randomDelay: 0,
    delayCalculated: false,
    verificationTimers: [],
    enableDebug: false,
    lastLogMsg: "",
    isPageActive: true
};

// --- LOGGING SYSTEM ---
function debugLog(message, data = null, allowSpam = false) {
    if (!state.enableDebug) return;
    if (!allowSpam && state.lastLogMsg === message) return;

    state.lastLogMsg = message;
    const prefix = "%c[AutoLike TRACE]";

    if (data) console.log(prefix, CONFIG.LOG_STYLE, message, data);
    else console.log(prefix, CONFIG.LOG_STYLE, message);
}

// --- INIT ---
chrome.storage.sync.get(null, (res) => {
    if (res.enableDebug) state.enableDebug = true;
    debugLog("[SYSTEM] Extension Loaded. Hooking events...");

    document.addEventListener('yt-navigate-finish', handleNavigation);

    document.addEventListener('visibilitychange', () => {
        state.isPageActive = !document.hidden;
    });

    startObserver();
});

// --- LISTENER ---
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.enableDebug) {
            state.enableDebug = changes.enableDebug.newValue;
        }

        // Settings changed -> reset state
        const relevantKeys = [
            'triggerType', 'triggerSeconds', 'triggerPercent',
            'whitelist', 'blacklist', 'enableExtension',
            'actionWhitelist', 'actionBlacklist', 'actionUnlisted',
            'showNeutralBadge'
        ];
        if (relevantKeys.some(key => changes[key])) {
            debugLog("[SETTINGS] Config changed. Resetting state for current video.");
            state.processedVideoId = null;
            state.delayCalculated = false;
            updateIconState(); // Update icon immediately on settings change
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getChannelDetails") {
        const details = getVideoData();
        sendResponse(details);
        return true;
    }
});

// --- EVENT HANDLERS ---
function handleNavigation() {
    debugLog("[EVENT] YouTube Navigation Detected (yt-navigate-finish).");
    checkVideoStatus();
}

// --- CORE LOOPS ---
function startObserver() {
    if (state.checkInterval) clearInterval(state.checkInterval);
    state.checkInterval = setInterval(checkVideoStatus, CONFIG.TIMING.checkInterval);
}

function checkVideoStatus() {
    if (!state.isPageActive && state.processedVideoId === state.currentVideoId) return;

    chrome.storage.sync.get(['enableExtension', 'enableDebug'], (res) => {
        state.enableDebug = res.enableDebug ?? false;

        if (res.enableExtension === false) {
            chrome.runtime.sendMessage({ action: "updateIcon", status: "disabled" });
            return;
        }

        const urlParams = new URLSearchParams(globalThis.location.search);
        const currentVideoId = urlParams.get('v');

        if (!currentVideoId) return;

        if (state.currentVideoId !== currentVideoId) {
            debugLog(`[CHANGE] Video Switch Detected: ${state.currentVideoId} -> ${currentVideoId}`, null, true);
            state.currentVideoId = currentVideoId;
            state.processedVideoId = null;
            state.delayCalculated = false;
            state.randomDelay = 0;
            clearVerificationTimers();
        }

        updateIconState();

        if (state.processedVideoId === currentVideoId) return;

        const video = document.querySelector('video');
        if (!video || video.readyState < 1) return;

        // --- TETİKLEME MANTIĞI ---
        chrome.storage.sync.get(['triggerType', 'triggerSeconds', 'triggerPercent', 'enableHumanize'], (settings) => {
            const triggerType = settings.triggerType || 'instant';
            const triggerSeconds = settings.triggerSeconds || 10;
            const triggerPercent = settings.triggerPercent || 50;
            const enableHumanize = settings.enableHumanize || false;

            if (enableHumanize && !state.delayCalculated) {
                state.randomDelay = Math.floor(Math.random() * 12) + 3;
                state.delayCalculated = true;
                debugLog(`[HUMANIZE] Calculated delay: +${state.randomDelay}s`);
            }
            if (!enableHumanize) {
                state.randomDelay = 0;
                state.delayCalculated = true;
            }

            let shouldTrigger = false;
            const currentTime = video.currentTime;
            const duration = video.duration;

            if (triggerType === 'instant' && currentTime > 0.5) {
                shouldTrigger = true;
            } else if (triggerType === 'percent' && Number.isFinite(duration) && duration > 0) {
                const targetTime = (duration * (triggerPercent / 100)) + state.randomDelay;
                shouldTrigger = currentTime > targetTime;
            } else if (triggerType === 'time') {
                const targetTime = triggerSeconds + state.randomDelay;
                shouldTrigger = currentTime > targetTime;
            }

            if (shouldTrigger) {
                processVideo(currentVideoId);
            }
        });
    });
}

// --- DECISION LOGIC HELPERS ---
function getActionSetting(primary, legacy, defaultValue) {
    if (primary !== undefined) return primary;
    if (legacy !== undefined) return legacy;
    return defaultValue;
}

function getUnlistedAction(settings) {
    if (settings.actionUnlisted !== undefined) return settings.actionUnlisted;
    if (settings.enableDislike === true) return 'dislike';
    return 'none';
}

function resolveActionForChannel(channelName, settings) {
    const whitelist = settings.whitelist || [];
    const blacklist = settings.blacklist || [];

    const doLikeWhitelist = getActionSetting(settings.actionWhitelist, settings.enableLike, true);
    const doDislikeBlacklist = getActionSetting(settings.actionBlacklist, undefined, true);
    const doUnlisted = getUnlistedAction(settings);

    const isWhitelisted = checkIsListed(whitelist, channelName);
    const isBlacklisted = checkIsListed(blacklist, channelName);

    if (isWhitelisted) {
        return doLikeWhitelist
            ? { action: 'like', reason: "Channel is Whitelisted & Action is ON" }
            : { action: 'none', reason: "Channel is Whitelisted but Action is OFF" };
    }

    if (isBlacklisted) {
        return doDislikeBlacklist
            ? { action: 'dislike', reason: "Channel is Blacklisted & Action is ON" }
            : { action: 'none', reason: "Channel is Blacklisted but Action is OFF" };
    }

    const unlistedActions = {
        'like': { action: 'like', reason: "Unlisted Channel -> Action: LIKE ALL" },
        'dislike': { action: 'dislike', reason: "Unlisted Channel -> Action: DISLIKE ALL" }
    };
    return unlistedActions[doUnlisted] || { action: 'none', reason: "Unlisted Channel -> Action: NONE" };
}

// --- ACTIONS ---
function processVideo(videoId) {
    const data = getVideoData();

    if (!data?.channelName) return;

    const keys = [
        'whitelist', 'blacklist',
        'actionWhitelist',
        'actionBlacklist',
        'actionUnlisted',
        'enableLike', 'enableDislike'
    ];

    chrome.storage.sync.get(keys, (settings) => {
        const result = resolveActionForChannel(data.channelName, settings);
        const action = result.action;
        const reason = result.reason;

        if (action && action !== 'none') {
            debugLog(`[ACTION] Decided to ${action.toUpperCase()} (${reason}) - Channel: ${data.channelName}`);
            const success = attemptAction(action, data.channelName);

            if (success) {
                logActivity(action.toUpperCase(), data, videoId, reason);
                state.processedVideoId = videoId;
                scheduleVerification(action, data.channelName, CONFIG.TIMING.verificationDelays);
            }
        } else {
            debugLog(`[SKIP] No action taken. Reason: ${reason} - Channel: ${data.channelName}`);
            state.processedVideoId = videoId;
        }
    });
}

function attemptAction(action, channelName) {
    const btnSelectors = action === 'like' ? CONFIG.SELECTORS.likeBtn : CONFIG.SELECTORS.dislikeBtn;
    let btn = null;

    for (let sel of btnSelectors) {
        btn = document.querySelector(sel);
        if (btn) break;
    }

    if (!btn) {
        debugLog(`[FAIL] ${action} button not found.`);
        return false;
    }

    const isPressed = btn.getAttribute('aria-pressed') === 'true';

    if (isPressed) {
        debugLog(`[INFO] Button already pressed.`);
        return true;
    }

    btn.click();
    debugLog(`[CLICK] ${action} button clicked.`);
    if (!state.verificationTimers.length) {
        showNotification(`${action.toUpperCase()}: ${channelName}`, action === 'like');
    }
    return true;
}

function scheduleVerification(action, channelName, delays) {
    clearVerificationTimers();
    delays.forEach(delay => {
        const id = setTimeout(() => {
            attemptAction(action, channelName);
        }, delay);
        state.verificationTimers.push(id);
    });
}

function clearVerificationTimers() {
    state.verificationTimers.forEach(id => clearTimeout(id));
    state.verificationTimers = [];
}

// --- UTILS & UI ---
function updateIconState() {
    const data = getVideoData();
    if (!data.channelName) return;

    const keys = [
        'whitelist', 'blacklist',
        'actionWhitelist',
        'actionBlacklist',
        'actionUnlisted',
        'enableLike', 'enableDislike',
        'showNeutralBadge',
        'enableExtension'
    ];

    chrome.storage.sync.get(keys, (settings) => {
        // Eğer eklenti kapalıysa
        if (settings.enableExtension === false) {
            chrome.runtime.sendMessage({ action: "updateIcon", status: "disabled" });
            return;
        }

        const result = resolveActionForChannel(data.channelName, settings);

        // Icon durumunu belirle
        let status = "none";
        if (result.action === 'like') {
            status = 'like';
        } else if (result.action === 'dislike') {
            status = 'dislike';
        } else if (result.action === 'none') {
            // Neutral mode kontrolü
            if (settings.showNeutralBadge) {
                status = 'neutral';
            } else {
                status = 'none'; // Badge temizlenir
            }
        }

        chrome.runtime.sendMessage({ action: "updateIcon", status: status });
    });
}

function getVideoData() {
    let channelName = null;
    let channelUrl = null;

    for (let sel of CONFIG.SELECTORS.channelName) {
        const el = document.querySelector(sel);
        if (el) {
            channelName = el.textContent.trim();
            channelUrl = el.href || el.closest('a')?.href || null;
            break;
        }
    }

    let videoTitle = null;
    for (let sel of CONFIG.SELECTORS.videoTitle) {
        const el = document.querySelector(sel);
        if (el) {
            videoTitle = el.textContent.trim();
            break;
        }
    }

    return { channelName, videoTitle, url: channelUrl };
}

function checkIsListed(list, name) {
    if (!list) return false;
    return list.some(item => item.name === name);
}

function logActivity(action, data, videoId, reason) {
    chrome.storage.sync.get(['activityLogs', 'enableHistory'], (res) => {
        if (res.enableHistory === false) return;

        let logs = res.activityLogs || [];
        const newLog = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: action,
            title: data.videoTitle || data.channelName || "Video",
            channel: data.channelName,
            videoId: videoId,
            reason: reason
        };
        logs.unshift(newLog);
        if (logs.length > 50) logs = logs.slice(0, 50); // Increased log limit a bit
        chrome.storage.sync.set({ activityLogs: logs });
    });
}

function showNotification(text, isSuccess) {
    const id = 'autolike-notification-toast';
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = id;

    // Glassmorphism Style
    Object.assign(div.style, {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        backgroundColor: isSuccess ? 'rgba(0, 50, 0, 0.7)' : 'rgba(50, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
        webkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '12px',
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '9999',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        opacity: '0',
        transform: 'translateY(20px) scale(0.95)',
        transition: `all ${CONFIG.TIMING.notificationFadeOut}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
    });

    div.innerText = text;
    document.body.appendChild(div);

    requestAnimationFrame(() => {
        div.style.opacity = '1';
        div.style.transform = 'translateY(0) scale(1)';
    });

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(() => div.remove(), CONFIG.TIMING.notificationFadeOut);
    }, CONFIG.TIMING.notificationDuration);
}