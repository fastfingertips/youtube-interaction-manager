// --- CONFIG ---
const SELECTORS = {
    channelName: [
        '#owner #channel-name a',
        '.ytd-channel-name a',
        '#upload-info #channel-name a',
        'ytd-video-owner-renderer #channel-name a',
        '#text.ytd-channel-name',
        'ytd-channel-name a'
    ],
    videoTitle: [
        '#title > h1 > yt-formatted-string',
        'h1.ytd-watch-metadata',
        'h1.title.style-scope.ytd-video-primary-info-renderer'
    ],
    likeBtn: [
        'like-button-view-model button',
        '#top-level-buttons-computed > ytd-toggle-button-renderer:first-child a',
        '#segmented-like-button button'
    ],
    dislikeBtn: [
        'dislike-button-view-model button',
        '#top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(2) a',
        '#segmented-dislike-button button'
    ]
};

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
    const styles = "background: #000; color: #00ff00; font-family: monospace; font-size: 10px; padding: 2px 4px; border-radius: 2px;";

    if (data) console.log(prefix, styles, message, data);
    else console.log(prefix, styles, message);
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
    state.checkInterval = setInterval(checkVideoStatus, 1000);
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
                scheduleVerification(action, data.channelName, [2000, 5000]);
            }
        } else {
            debugLog(`[SKIP] No action taken. Reason: ${reason} - Channel: ${data.channelName}`);
            state.processedVideoId = videoId;
        }
    });
}

function attemptAction(action, channelName) {
    const btnSelectors = action === 'like' ? SELECTORS.likeBtn : SELECTORS.dislikeBtn;
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

    for (let sel of SELECTORS.channelName) {
        const el = document.querySelector(sel);
        if (el) {
            channelName = el.textContent.trim();
            channelUrl = el.href || el.closest('a')?.href || null;
            break;
        }
    }

    let videoTitle = null;
    for (let sel of SELECTORS.videoTitle) {
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
    chrome.storage.sync.get(['activityLogs'], (res) => {
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
        if (logs.length > 10) logs = logs.slice(10);
        chrome.storage.sync.set({ activityLogs: logs });
    });
}

function showNotification(text, isSuccess) {
    const id = 'autolike-notification-toast';
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = id;

    Object.assign(div.style, {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        backgroundColor: isSuccess ? '#0f9d58' : '#db4437',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '9999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    div.innerText = text;
    document.body.appendChild(div);

    requestAnimationFrame(() => {
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(10px)';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}