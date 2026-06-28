document.addEventListener('DOMContentLoaded', initApp);

let UI = {};

function initApp() {
    UI = {
        masterSwitch: document.getElementById('masterSwitch'),
        versionBadge: document.getElementById('appVersion'),
        tabs: {
            settings: document.getElementById('btn-settings'),
            whitelist: document.getElementById('btn-whitelist'),
            blacklist: document.getElementById('btn-blacklist'),
            activity: document.getElementById('btn-activity'),
            about: document.getElementById('btn-about'),
            whitelistTabCount: document.getElementById('whitelistTabCount'),
            blacklistTabCount: document.getElementById('blacklistTabCount'),
            activityTabCount: document.getElementById('activityTabCount'),

            contentSettings: document.getElementById('content-settings'),
            contentWhitelist: document.getElementById('content-whitelist'),
            contentBlacklist: document.getElementById('content-blacklist'),
            contentActivity: document.getElementById('content-activity'),
            contentAbout: document.getElementById('content-about')
        },
        settings: {
            checkLikeWhitelist: document.getElementById('checkLikeWhitelist'),
            checkDislikeBlacklist: document.getElementById('checkDislikeBlacklist'),
            selectUnlisted: document.getElementById('selectUnlisted'),

            selectTriggerType: document.getElementById('selectTriggerType'),
            inputPercent: document.getElementById('triggerPercent'),
            inputSeconds: document.getElementById('triggerSeconds'),
            checkHumanize: document.getElementById('checkHumanize'),
            checkShowNeutral: document.getElementById('checkShowNeutral'),
            checkDebug: document.getElementById('checkDebug'),
            checkHistory: document.getElementById('checkHistory'),
            checkHighlightChannels: document.getElementById('checkHighlightChannels')
        },
        lists: {
            addWhitelistBtn: document.getElementById('addWhitelistBtn'),
            addBlacklistBtn: document.getElementById('addBlacklistBtn'),
            whitelistUl: document.getElementById('whitelistUl'),
            blacklistUl: document.getElementById('blacklistUl'),
            scrollToTopBtn: document.getElementById('scrollToTopBtn'),
            whitelistCount: document.getElementById('whitelistCount'),
            blacklistCount: document.getElementById('blacklistCount'),
            whitelistDisabledBanner: document.getElementById('whitelistDisabledBanner'),
            blacklistDisabledBanner: document.getElementById('blacklistDisabledBanner'),
            btnExport: document.getElementById('btnExport'),
            btnImport: document.getElementById('btnImport'),
            btnOpenSettings: document.getElementById('btnOpenSettings'),
            fileInput: document.getElementById('fileInput')
        },
        logs: {
            ul: document.getElementById('activityLogs'),
            btnClear: document.getElementById('btnClearLogs'),
            historyDisabledBanner: document.getElementById('historyDisabledBanner')
        },
        status: document.getElementById('statusMsg'),
        masterHint: document.getElementById('masterHint')
    };

    if (UI.versionBadge && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        UI.versionBadge.textContent = `v${manifest.version}`;
    }

    setupEventListeners();

    if (globalThis.chrome?.storage?.sync) {
        loadAllData();
    } else {
        console.warn("Chrome Storage API not found.");
    }
}

function setupEventListeners() {
    if (UI.masterSwitch) {
        UI.masterSwitch.addEventListener('change', () => {
            const isEnabled = UI.masterSwitch.checked;
            StorageUtils.toggleSetting('enableExtension', isEnabled);
            updateMasterUI(isEnabled);
            showStatus(isEnabled ? "Extension Enabled" : "Extension Disabled");
        });
    }

    const tabs = ['settings', 'whitelist', 'blacklist', 'activity', 'about'];
    tabs.forEach(t => {
        if (UI.tabs[t]) UI.tabs[t].addEventListener('click', () => switchTab(t));
    });

    const settingInputs = [
        UI.settings.checkLikeWhitelist,
        UI.settings.checkDislikeBlacklist,
        UI.settings.selectUnlisted,
        UI.settings.selectTriggerType,
        UI.settings.checkHumanize,
        UI.settings.checkShowNeutral,
        UI.settings.checkDebug,
        UI.settings.checkHistory,
        UI.settings.checkHighlightChannels
    ];
    settingInputs.forEach(el => {
        if (el) el.addEventListener('change', saveSettings);
    });

    if (UI.settings.selectTriggerType) {
        UI.settings.selectTriggerType.addEventListener('change', updateTriggerUI);
    }

    // Update status banners when whitelist/blacklist settings change
    if (UI.settings.checkLikeWhitelist) {
        UI.settings.checkLikeWhitelist.addEventListener('change', updateStatusBanners);
    }
    if (UI.settings.checkDislikeBlacklist) {
        UI.settings.checkDislikeBlacklist.addEventListener('change', updateStatusBanners);
    }

    if (UI.settings.inputSeconds) UI.settings.inputSeconds.addEventListener('input', saveSettings);
    if (UI.settings.inputPercent) UI.settings.inputPercent.addEventListener('input', saveSettings);

    if (UI.lists.addWhitelistBtn) UI.lists.addWhitelistBtn.addEventListener('click', () => handleAutoAdd('whitelist'));
    if (UI.lists.addBlacklistBtn) UI.lists.addBlacklistBtn.addEventListener('click', () => handleAutoAdd('blacklist'));

    // Initialize Scroll to Top logic
    initScrollToTop();

    if (UI.lists.btnExport) UI.lists.btnExport.addEventListener('click', handleExport);

    // Browser detection: Firefox has 'browser' global, Chrome doesn't
    const isFirefox = typeof browser !== 'undefined' && browser.runtime?.id;

    if (isFirefox) {
        // Firefox: Show Settings button (popup closes when file dialog opens)
        if (UI.lists.btnOpenSettings) {
            UI.lists.btnOpenSettings.style.display = 'inline-flex';
            UI.lists.btnOpenSettings.addEventListener('click', () => {
                chrome.runtime.openOptionsPage();
            });
        }
    } else {
        // Chrome: Show direct Import button
        if (UI.lists.btnImport) {
            UI.lists.btnImport.style.display = 'inline-flex';
        }
        if (UI.lists.fileInput) {
            UI.lists.fileInput.addEventListener('change', handleImportFile);
        }
    }

    if (UI.logs.btnClear) {
        UI.logs.btnClear.addEventListener('click', handleClearLogs);
    }

    setupMarqueeListeners();
}

// Enable humanize option only when Specific Second trigger is selected
function updateHumanizeState() {
    const humanizeRow = UI.settings.checkHumanize?.closest('.option-row');
    if (!humanizeRow || !UI.settings.checkHumanize) return;

    const isTimeMode = UI.settings.selectTriggerType?.value === 'time';

    if (isTimeMode) {
        UI.settings.checkHumanize.disabled = false;
        humanizeRow.style.opacity = '1';
        humanizeRow.style.pointerEvents = 'auto';
        humanizeRow.title = 'Adds random delays to make actions appear more natural';
    } else {
        UI.settings.checkHumanize.disabled = true;
        UI.settings.checkHumanize.checked = false;
        humanizeRow.style.opacity = '0.5';
        humanizeRow.style.pointerEvents = 'none';
        humanizeRow.title = 'Humanize requires Specific Second trigger mode';
    }
}

function updateTriggerUI() {
    const triggerType = UI.settings.selectTriggerType ? UI.settings.selectTriggerType.value : 'instant';
    
    const percentContainer = document.getElementById('triggerPercentContainer');
    const timeContainer = document.getElementById('triggerTimeContainer');
    
    if (percentContainer) {
        percentContainer.style.display = (triggerType === 'percent') ? 'flex' : 'none';
    }
    if (timeContainer) {
        timeContainer.style.display = (triggerType === 'time') ? 'flex' : 'none';
    }
    
    updateHumanizeState();
}

// Update status banners in whitelist/blacklist/activity tabs
function updateStatusBanners() {
    const whitelistEnabled = UI.settings.checkLikeWhitelist?.checked;
    const blacklistEnabled = UI.settings.checkDislikeBlacklist?.checked;
    const historyEnabled = UI.settings.checkHistory?.checked;

    if (UI.lists.whitelistDisabledBanner) {
        UI.lists.whitelistDisabledBanner.style.display = whitelistEnabled ? 'none' : 'flex';
    }

    if (UI.lists.blacklistDisabledBanner) {
        UI.lists.blacklistDisabledBanner.style.display = blacklistEnabled ? 'none' : 'flex';
    }

    if (UI.logs.historyDisabledBanner) {
        UI.logs.historyDisabledBanner.style.display = historyEnabled ? 'none' : 'flex';
    }
}

function switchTab(tabName) {
    Object.values(UI.tabs).forEach(el => {
        el?.classList?.remove('active');
    });

    if (UI.tabs[tabName]) UI.tabs[tabName].classList.add('active');

    const contentKey = 'content' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    if (UI.tabs[contentKey]) UI.tabs[contentKey].classList.add('active');
}

function loadAllData() {
    StorageUtils.getAllData().then(res => {
        // Master switch
        const isEnabled = res.enableExtension ?? CONFIG.DEFAULTS.enableExtension;
        UI.masterSwitch.checked = isEnabled;
        updateMasterUI(isEnabled);

        // Map settings
        const settings = mapStorageToSettings(res);
        applySettingsToUI(settings);

        // Lists and Logs
        renderList(res.whitelist || [], 'whitelist');
        renderList(res.blacklist || [], 'blacklist');
        renderLogs(res.activityLogs || [], res.enableHistory ?? CONFIG.DEFAULTS.enableHistory);

        updateHumanizeState();
        updateStatusBanners();
    });
}

function mapStorageToSettings(res) {
    return {
        whitelist: res.actionWhitelist ?? res.enableLike ?? true,
        blacklist: res.actionBlacklist ?? true,
        unlisted: res.actionUnlisted ?? (res.enableDislike === true ? 'dislike' : 'none'),
        humanize: res.enableHumanize ?? false,
        neutral: res.showNeutralBadge ?? false,
        debug: res.enableDebug ?? false,
        history: res.enableHistory ?? true,
        highlightChannels: res.highlightChannels ?? true,
        trigger: {
            type: res.triggerType || 'instant',
            seconds: res.triggerSeconds || 10,
            percent: res.triggerPercent || 50
        }
    };
}

function applySettingsToUI(s) {
    if (UI.settings.checkLikeWhitelist) UI.settings.checkLikeWhitelist.checked = s.whitelist;
    if (UI.settings.checkDislikeBlacklist) UI.settings.checkDislikeBlacklist.checked = s.blacklist;
    if (UI.settings.selectUnlisted) UI.settings.selectUnlisted.value = s.unlisted;

    if (UI.settings.checkHumanize) UI.settings.checkHumanize.checked = s.humanize;
    if (UI.settings.checkShowNeutral) UI.settings.checkShowNeutral.checked = s.neutral;
    if (UI.settings.checkDebug) UI.settings.checkDebug.checked = s.debug;
    if (UI.settings.checkHistory) UI.settings.checkHistory.checked = s.history;
    if (UI.settings.checkHighlightChannels) UI.settings.checkHighlightChannels.checked = s.highlightChannels;

    if (UI.settings.selectTriggerType) {
        UI.settings.selectTriggerType.value = s.trigger.type;
        updateTriggerUI();
    }

    if (UI.settings.inputSeconds) UI.settings.inputSeconds.value = s.trigger.seconds;
    if (UI.settings.inputPercent) UI.settings.inputPercent.value = s.trigger.percent;
}

function updateMasterUI(isEnabled) {
    const mainContent = document.querySelectorAll('.tab-content, .tabs');
    mainContent.forEach(el => {
        el.style.opacity = isEnabled ? '1' : '0.4';
        el.style.pointerEvents = isEnabled ? 'auto' : 'none';
        el.style.filter = isEnabled ? 'none' : 'grayscale(100%)';
    });

    if (UI.masterHint) {
        UI.masterHint.style.display = isEnabled ? 'none' : 'flex';
    }
}

function saveSettings() {
    const triggerType = UI.settings.selectTriggerType ? UI.settings.selectTriggerType.value : 'instant';

    const settings = {
        actionWhitelist: UI.settings.checkLikeWhitelist ? UI.settings.checkLikeWhitelist.checked : true,
        actionBlacklist: UI.settings.checkDislikeBlacklist ? UI.settings.checkDislikeBlacklist.checked : true,
        actionUnlisted: UI.settings.selectUnlisted ? UI.settings.selectUnlisted.value : 'none',

        enableHumanize: UI.settings.checkHumanize ? UI.settings.checkHumanize.checked : false,
        showNeutralBadge: UI.settings.checkShowNeutral ? UI.settings.checkShowNeutral.checked : false,
        enableDebug: UI.settings.checkDebug ? UI.settings.checkDebug.checked : false,
        enableHistory: UI.settings.checkHistory ? UI.settings.checkHistory.checked : true,
        highlightChannels: UI.settings.checkHighlightChannels ? UI.settings.checkHighlightChannels.checked : true,
        triggerType: triggerType,
        triggerSeconds: UI.settings.inputSeconds ? (Number.parseInt(UI.settings.inputSeconds.value, 10) || CONFIG.DEFAULTS.triggerSeconds) : CONFIG.DEFAULTS.triggerSeconds,
        triggerPercent: UI.settings.inputPercent ? (Number.parseInt(UI.settings.inputPercent.value, 10) || CONFIG.DEFAULTS.triggerPercent) : CONFIG.DEFAULTS.triggerPercent
    };

    StorageUtils.saveSettings(settings)
        .then(() => {
            showStatus("Saved.");
            updateStatusBanners();
            // Re-render logs with current setting
            chrome.storage.local.get(['activityLogs'], res => {
                renderLogs(res.activityLogs || [], settings.enableHistory);
            });
        })
        .catch(err => showStatus("Error saving.", true));
}

function handleAutoAdd(targetList) {
    if (!chrome?.tabs) {
        showStatus("API Error.", true);
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab?.url?.includes("youtube.com")) {
            showStatus("YouTube only.", true);
            return;
        }

        chrome.tabs.sendMessage(activeTab.id, { action: "getChannelDetails" }, (response) => {
            if (chrome.runtime.lastError || !response?.channelName) {
                showStatus("Channel not found. Refresh?", true);
            } else {
                addChannel(response.channelName, response.url, targetList);
            }
        });
    });
}

async function addChannel(name, url, targetListKey) {
    const result = await StorageUtils.addChannel(name, url, targetListKey);

    if (result.success) {
        // Refresh UI
        const res = await StorageUtils.getAllData();
        renderList(res.whitelist || [], 'whitelist');
        renderList(res.blacklist || [], 'blacklist');
        showStatus(result.message);
    } else {
        showStatus(result.message, true);
    }
}

async function removeChannel(nameToDelete, listKey) {
    const updatedList = await StorageUtils.removeChannel(nameToDelete, listKey);
    renderList(updatedList, listKey);
    showStatus(`${listKey === 'whitelist' ? 'Whitelisted' : 'Blacklisted'} channel removed.`);
}

function renderList(list, listKey) {
    const ul = listKey === 'whitelist' ? UI.lists.whitelistUl : UI.lists.blacklistUl;
    const countEl = listKey === 'whitelist' ? UI.lists.whitelistCount : UI.lists.blacklistCount;

    // Update count badges
    if (countEl) {
        countEl.textContent = list?.length || 0;
    }

    // Update tab counts
    const tabCountEl = listKey === 'whitelist' ? UI.tabs.whitelistTabCount : UI.tabs.blacklistTabCount;
    if (tabCountEl) {
        tabCountEl.textContent = list?.length || 0;
    }

    if (!ul) return;

    ul.innerHTML = '';
    if (!list || list.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.style.cssText = 'justify-content:center; opacity:0.5; border:none; padding:20px;';
        emptyLi.textContent = 'List Empty';
        ul.appendChild(emptyLi);
        return;
    }

    list.forEach(item => {
        const name = item.name || "Unknown";
        const url = item.url;

        const li = document.createElement('li');
        const contentDiv = document.createElement('div');
        contentDiv.className = 'channel-info';

        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.textContent = name;
            a.target = "_blank";
            a.className = 'channel-link';
            contentDiv.appendChild(a);
        } else {
            const span = document.createElement('span');
            span.className = 'channel-name-static';
            span.textContent = name;
            contentDiv.appendChild(span);
        }

        // Add date if available
        if (item.date) {
            try {
                const date = new Date(item.date);
                if (!isNaN(date.getTime())) {
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'channel-date';
                    const dateFormatted = date.toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const calendarSvg = createSvgIcon('M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18', 10, 1.8);
                    calendarSvg.style.opacity = '0.6';
                    dateSpan.appendChild(calendarSvg);

                    const textNode = document.createTextNode(dateFormatted);
                    dateSpan.appendChild(textNode);
                    contentDiv.appendChild(dateSpan);
                }
            } catch (e) {
                console.error("Error formatting channel date:", e);
            }
        }

        const btn = createDeleteButton(() => removeChannel(name, listKey), 'Remove');

        li.appendChild(contentDiv);
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

async function handleClearLogs() {
    if (confirm("Clear all activity history?")) {
        await StorageUtils.clearLogs();
        const isHistoryEnabled = UI.settings.checkHistory ? UI.settings.checkHistory.checked : true;
        renderLogs([], isHistoryEnabled);
        showStatus("Activity cleared.");
    }
}

async function handleRemoveLog(index) {
    const updatedLogs = await StorageUtils.removeLog(index);
    const isHistoryEnabled = UI.settings.checkHistory ? UI.settings.checkHistory.checked : true;
    renderLogs(updatedLogs, isHistoryEnabled);
    showStatus("Entry removed.");
}

function renderLogs(logs, isHistoryEnabled = true) {
    if (!UI.logs.ul) return;
    UI.logs.ul.innerHTML = '';

    // Update activity tab count
    if (UI.tabs.activityTabCount) {
        UI.tabs.activityTabCount.textContent = logs?.length || 0;
    }

    if (!isHistoryEnabled) {
        return; // Banner handles this now
    }

    if (!logs || logs.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'log-empty';

        const svg = createSvgIcon('M22 12 L18 12 L15 21 L9 3 L6 12 L2 12', 24, 1.5);
        const span = document.createElement('span');
        span.textContent = 'No activity recorded yet';

        emptyLi.appendChild(svg);
        emptyLi.appendChild(span);
        UI.logs.ul.appendChild(emptyLi);
        return;
    }

    logs.slice(0, 50).forEach((log, index) => {
        const li = document.createElement('li');
        li.className = 'log-item';

        // Action icon
        const actionSpan = document.createElement('span');
        actionSpan.className = `log-action ${log.action}`;
        const iconPath = log.action === 'LIKE'
            ? 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3'
            : 'M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17';
        actionSpan.appendChild(createSvgIcon(iconPath, 12, 2));

        // Content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'log-content';

        // Main (video link or title)
        const mainDiv = document.createElement('div');
        mainDiv.className = 'log-main';
        const displayText = log.title || log.channel || 'Unknown';

        if (log.videoId) {
            const a = document.createElement('a');
            a.href = `https://www.youtube.com/watch?v=${encodeURIComponent(log.videoId)}`;
            a.target = '_blank';
            a.className = 'log-link';
            a.textContent = displayText;
            mainDiv.appendChild(a);
        } else {
            const titleSpan = document.createElement('span');
            titleSpan.className = 'log-title';
            titleSpan.textContent = displayText;
            mainDiv.appendChild(titleSpan);
        }

        // Meta (channel + time)
        const metaDiv = document.createElement('div');
        metaDiv.className = 'log-meta';

        const channelSpan = document.createElement('span');
        channelSpan.className = 'log-channel';
        channelSpan.textContent = log.channel || '';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        
        let displayTime = log.time || '';
        if (log.timestamp) {
            try {
                const date = new Date(log.timestamp);
                if (!isNaN(date.getTime())) {
                    displayTime = date.toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (e) {
                console.error("Error formatting timestamp:", e);
            }
        }
        timeSpan.textContent = displayTime;

        metaDiv.appendChild(channelSpan);
        metaDiv.appendChild(timeSpan);

        contentDiv.appendChild(mainDiv);
        contentDiv.appendChild(metaDiv);

        li.appendChild(actionSpan);
        li.appendChild(contentDiv);

        if (log.reason) {
            li.title = `Reason: ${log.reason}`;
        }

        // Delete button (×)
        const btn = createDeleteButton((e) => handleRemoveLog(index), 'Remove this entry');
        li.appendChild(btn);

        UI.logs.ul.appendChild(li);
    });
}

// Helper function to create SVG icons safely
function createSvgIcon(pathD, size = 12, strokeWidth = 2) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', strokeWidth);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    svg.appendChild(path);

    return svg;
}

function createDeleteButton(onClick, title = 'Remove') {
    const btn = document.createElement('span');
    btn.className = 'del-btn';
    btn.textContent = '×';
    btn.title = title;
    btn.onclick = (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        onClick(e);
    };
    return btn;
}

function initScrollToTop() {
    const btn = UI.lists.scrollToTopBtn;
    if (!btn) return;

    const scrollableLists = [UI.lists.whitelistUl, UI.lists.blacklistUl, UI.logs.ul];

    const updateBtnVisibility = (e) => {
        if (e.target.scrollTop > 80) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    };

    scrollableLists.forEach(ul => {
        if (ul) ul.addEventListener('scroll', updateBtnVisibility);
    });

    btn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-content.active');
        const activeUl = activeTab ? activeTab.querySelector('ul') : null;
        if (activeUl) {
            activeUl.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Hide button when switching tabs
    document.querySelectorAll('.tab-btn').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            btn.classList.remove('visible');
        });
    });
}

async function handleExport() {
    try {
        await BackupUtils.exportBackup();
        showStatus("Backup exported.");
    } catch {
        showStatus("Export failed.", true);
    }
}

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        await BackupUtils.importBackup(file);
        loadAllData();
        showStatus("Imported successfully!");
    } catch {
        showStatus("Import failed.", true);
    }
    event.target.value = '';
}

function showStatus(msg, isError = false) {
    if (!UI.status) return;
    UI.status.textContent = msg;
    UI.status.style.color = isError ? CONFIG.COLORS.statusError : 'var(--success-color)';
    setTimeout(() => {
        if (UI.status) UI.status.textContent = '';
    }, CONFIG.TIMING.statusMessage);
}

function setupMarqueeListeners() {
    function startMarquee(target, scrollDist, duration) {
        target.style.textOverflow = 'clip';
        target.style.transition = `transform ${duration}s linear`;
        target.style.transform = `translateX(-${scrollDist + 8}px)`;

        const onTransitionEnd = () => {
            target.removeEventListener('transitionend', onTransitionEnd);
            if (target.dataset.isHovered !== 'true') return;

            target.dataset.timeoutId = setTimeout(() => {
                if (target.dataset.isHovered !== 'true') return;

                // Animate back to start using ease-in-out
                target.style.transition = `transform ${duration * 0.8}s ease-in-out`;
                target.style.transform = 'translateX(0)';

                const onReturnEnd = () => {
                    target.removeEventListener('transitionend', onReturnEnd);
                    if (target.dataset.isHovered !== 'true') return;

                    target.dataset.timeoutId = setTimeout(() => {
                        if (target.dataset.isHovered !== 'true') return;
                        startMarquee(target, scrollDist, duration);
                    }, 1500);
                };

                target.onMarqueeEnd = onReturnEnd;
                target.addEventListener('transitionend', onReturnEnd);
            }, 1500);
        };

        target.onMarqueeEnd = onTransitionEnd;
        target.addEventListener('transitionend', onTransitionEnd);
    }

    // Listen to mouseenter on rows using capture phase
    document.addEventListener('mouseenter', (e) => {
        const row = e.target.closest('.log-item, #whitelistUl li, #blacklistUl li');
        if (!row) return;

        // Find scrollable targets inside this row
        const targets = row.querySelectorAll('.log-link, .log-title, .channel-link, .channel-name-static, .log-channel');
        
        targets.forEach(target => {
            const container = target.parentElement;
            if (!container) return;

            // Temporarily allow the target to expand to its full width to calculate scrollWidth
            const originalStyle = {
                maxWidth: target.style.maxWidth,
                display: target.style.display,
                whiteSpace: target.style.whiteSpace,
                textOverflow: target.style.textOverflow
            };

            // Store original styles on target dataset
            target.dataset.originalMaxWidth = originalStyle.maxWidth || '';
            target.dataset.originalDisplay = originalStyle.display || '';
            target.dataset.originalWhiteSpace = originalStyle.whiteSpace || '';
            target.dataset.originalTextOverflow = originalStyle.textOverflow || '';

            target.style.maxWidth = 'none';
            target.style.display = 'inline-block';
            target.style.whiteSpace = 'nowrap';

            const scrollWidth = target.scrollWidth;
            const containerWidth = container.clientWidth;

            if (scrollWidth > containerWidth) {
                target.dataset.isHovered = 'true';
                const scrollDist = scrollWidth - containerWidth;
                // Constant speed (approx 50px per second)
                const duration = Math.max(1, scrollDist / 50);

                startMarquee(target, scrollDist, duration);
            } else {
                // Restore styles if not overflowing
                target.style.maxWidth = originalStyle.maxWidth;
                target.style.display = originalStyle.display;
                target.style.whiteSpace = originalStyle.whiteSpace;
            }
        });
    }, true);

    document.addEventListener('mouseleave', (e) => {
        const row = e.target.closest('.log-item, #whitelistUl li, #blacklistUl li');
        if (!row) return;

        const targets = row.querySelectorAll('.log-link, .log-title, .channel-link, .channel-name-static, .log-channel');
        
        targets.forEach(target => {
            target.dataset.isHovered = 'false';
            
            // Clear any active timers
            if (target.dataset.timeoutId) {
                clearTimeout(parseInt(target.dataset.timeoutId));
                target.dataset.timeoutId = '';
            }

            // Remove active transitionend listeners
            if (target.onMarqueeEnd) {
                target.removeEventListener('transitionend', target.onMarqueeEnd);
                target.onMarqueeEnd = null;
            }

            target.style.transition = 'transform 0.25s ease-out';
            target.style.transform = 'translateX(0)';

            // Clean up styles after transition finishes
            setTimeout(() => {
                if (target.dataset.isHovered !== 'true') {
                    target.style.maxWidth = target.dataset.originalMaxWidth || '';
                    target.style.display = target.dataset.originalDisplay || '';
                    target.style.whiteSpace = target.dataset.originalWhiteSpace || '';
                    target.style.textOverflow = target.dataset.originalTextOverflow || '';
                    target.style.transition = '';
                }
            }, 250);
        });
    }, true);
}