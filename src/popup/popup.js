document.addEventListener('DOMContentLoaded', initApp);

let UI = {};

function initApp() {
    UI = {
        masterSwitch: document.getElementById('masterSwitch'),
        tabs: {
            settings: document.getElementById('btn-settings'),
            whitelist: document.getElementById('btn-whitelist'),
            blacklist: document.getElementById('btn-blacklist'),
            activity: document.getElementById('btn-activity'),

            contentSettings: document.getElementById('content-settings'),
            contentWhitelist: document.getElementById('content-whitelist'),
            contentBlacklist: document.getElementById('content-blacklist'),
            contentActivity: document.getElementById('content-activity')
        },
        settings: {
            // YENİ AYARLAR
            checkLikeWhitelist: document.getElementById('checkLikeWhitelist'),
            checkDislikeBlacklist: document.getElementById('checkDislikeBlacklist'),
            selectUnlisted: document.getElementById('selectUnlisted'), // Dropdown

            radioInstant: document.getElementById('radioInstant'),
            radioPercent: document.getElementById('radioPercent'),
            radioTime: document.getElementById('radioTime'),
            inputPercent: document.getElementById('triggerPercent'),
            inputSeconds: document.getElementById('triggerSeconds'),
            checkHumanize: document.getElementById('checkHumanize'),
            checkDebug: document.getElementById('checkDebug')
        },
        lists: {
            addWhitelistBtn: document.getElementById('addWhitelistBtn'),
            addBlacklistBtn: document.getElementById('addBlacklistBtn'),
            whitelistUl: document.getElementById('whitelistUl'),
            blacklistUl: document.getElementById('blacklistUl'),
            btnExport: document.getElementById('btnExport'),
            btnImport: document.getElementById('btnImport'),
            fileInput: document.getElementById('fileInput')
        },
        logs: {
            ul: document.getElementById('activityLogs')
        },
        status: document.getElementById('statusMsg')
    };

    setupEventListeners();

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        loadAllData();
    } else {
        console.warn("Chrome Storage API not found.");
    }
}

function setupEventListeners() {
    if (UI.masterSwitch) {
        UI.masterSwitch.addEventListener('change', () => {
            const isEnabled = UI.masterSwitch.checked;
            chrome.storage.sync.set({ enableExtension: isEnabled });
            updateMasterUI(isEnabled);
            showStatus(isEnabled ? "Extension Enabled" : "Extension Disabled");
        });
    }

    const tabs = ['settings', 'whitelist', 'blacklist', 'activity'];
    tabs.forEach(t => {
        if (UI.tabs[t]) UI.tabs[t].addEventListener('click', () => switchTab(t));
    });

    const settingInputs = [
        UI.settings.checkLikeWhitelist,
        UI.settings.checkDislikeBlacklist,
        UI.settings.selectUnlisted, // Select change event
        UI.settings.radioInstant, UI.settings.radioPercent,
        UI.settings.radioTime, UI.settings.checkHumanize,
        UI.settings.checkDebug
    ];
    settingInputs.forEach(el => {
        if (el) el.addEventListener('change', saveSettings);
    });

    if (UI.settings.inputSeconds) UI.settings.inputSeconds.addEventListener('input', saveSettings);
    if (UI.settings.inputPercent) UI.settings.inputPercent.addEventListener('input', saveSettings);

    if (UI.lists.addWhitelistBtn) UI.lists.addWhitelistBtn.addEventListener('click', () => handleAutoAdd('whitelist'));
    if (UI.lists.addBlacklistBtn) UI.lists.addBlacklistBtn.addEventListener('click', () => handleAutoAdd('blacklist'));

    if (UI.lists.btnExport) UI.lists.btnExport.addEventListener('click', handleExport);
    if (UI.lists.btnImport) UI.lists.btnImport.addEventListener('click', () => UI.lists.fileInput.click());
    if (UI.lists.fileInput) UI.lists.fileInput.addEventListener('change', handleImportFile);
}

function switchTab(tabName) {
    Object.values(UI.tabs).forEach(el => {
        if (el && el.classList) el.classList.remove('active');
    });

    if (UI.tabs[tabName]) UI.tabs[tabName].classList.add('active');

    const contentKey = 'content' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    if (UI.tabs[contentKey]) UI.tabs[contentKey].classList.add('active');
}

function loadAllData() {
    // YENİ ANAHTARLAR EKLENDİ
    const keys = [
        'enableExtension',
        'whitelist', 'blacklist',

        // Eski Anahtarlar (Migration için)
        'enableLike', 'enableDislike',

        // Yeni Anahtarlar
        'actionWhitelist',   // boolean (eski enableLike)
        'actionBlacklist',   // boolean (varsayılan true)
        'actionUnlisted',    // string: 'none', 'like', 'dislike'

        'triggerType',
        'triggerSeconds',
        'triggerPercent',
        'enableHumanize',
        'enableDebug',
        'activityLogs'
    ];

    chrome.storage.sync.get(keys, (res) => {
        if (chrome.runtime.lastError) return;

        const isEnabled = res.enableExtension ?? true;
        UI.masterSwitch.checked = isEnabled;
        updateMasterUI(isEnabled);

        // --- MIGRATION & DEFAULT LOGIC ---
        // 1. Whitelist: Eğer yeni ayar varsa onu kullan, yoksa eskisine bak, o da yoksa true.
        let valWhitelist = true;
        if (res.actionWhitelist !== undefined) valWhitelist = res.actionWhitelist;
        else if (res.enableLike !== undefined) valWhitelist = res.enableLike;

        // 2. Blacklist: Yeni ayar varsa kullan, yoksa varsayılan true.
        let valBlacklist = true;
        if (res.actionBlacklist !== undefined) valBlacklist = res.actionBlacklist;

        // 3. Unlisted: Yeni ayar varsa kullan. Yoksa eski 'enableDislike' true ise 'dislike', değilse 'none'.
        let valUnlisted = 'none';
        if (res.actionUnlisted !== undefined) {
            valUnlisted = res.actionUnlisted;
        } else if (res.enableDislike === true) {
            valUnlisted = 'dislike';
        }

        // UI Set
        if (UI.settings.checkLikeWhitelist) UI.settings.checkLikeWhitelist.checked = valWhitelist;
        if (UI.settings.checkDislikeBlacklist) UI.settings.checkDislikeBlacklist.checked = valBlacklist;
        if (UI.settings.selectUnlisted) UI.settings.selectUnlisted.value = valUnlisted;

        // Diğer Ayarlar
        if (UI.settings.checkHumanize) UI.settings.checkHumanize.checked = res.enableHumanize ?? false;
        if (UI.settings.checkDebug) UI.settings.checkDebug.checked = res.enableDebug ?? false;

        const type = res.triggerType || 'instant';
        if (type === 'percent' && UI.settings.radioPercent) UI.settings.radioPercent.checked = true;
        else if (type === 'time' && UI.settings.radioTime) UI.settings.radioTime.checked = true;
        else if (UI.settings.radioInstant) UI.settings.radioInstant.checked = true;

        if (UI.settings.inputSeconds) UI.settings.inputSeconds.value = res.triggerSeconds || 10;
        if (UI.settings.inputPercent) UI.settings.inputPercent.value = res.triggerPercent || 50;

        renderList(res.whitelist || [], 'whitelist');
        renderList(res.blacklist || [], 'blacklist');
        renderLogs(res.activityLogs || []);
    });
}

function updateMasterUI(isEnabled) {
    const mainContent = document.querySelectorAll('.tab-content, .tabs');
    mainContent.forEach(el => {
        el.style.opacity = isEnabled ? '1' : '0.4';
        el.style.pointerEvents = isEnabled ? 'auto' : 'none';
        el.style.filter = isEnabled ? 'none' : 'grayscale(100%)';
    });
}

function saveSettings() {
    if (!chrome?.storage?.sync) return;

    let triggerType = 'instant';
    if (UI.settings.radioPercent?.checked) triggerType = 'percent';
    if (UI.settings.radioTime?.checked) triggerType = 'time';

    const settings = {
        // YENİ KAYIT YAPISI
        actionWhitelist: UI.settings.checkLikeWhitelist ? UI.settings.checkLikeWhitelist.checked : true,
        actionBlacklist: UI.settings.checkDislikeBlacklist ? UI.settings.checkDislikeBlacklist.checked : true,
        actionUnlisted: UI.settings.selectUnlisted ? UI.settings.selectUnlisted.value : 'none',

        enableHumanize: UI.settings.checkHumanize ? UI.settings.checkHumanize.checked : false,
        enableDebug: UI.settings.checkDebug ? UI.settings.checkDebug.checked : false,
        triggerType: triggerType,
        triggerSeconds: UI.settings.inputSeconds ? (parseInt(UI.settings.inputSeconds.value) || 10) : 10,
        triggerPercent: UI.settings.inputPercent ? (parseInt(UI.settings.inputPercent.value) || 50) : 50
    };

    chrome.storage.sync.set(settings, () => showStatus("Saved."));
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

function addChannel(name, url, targetListKey) {
    chrome.storage.sync.get(['whitelist', 'blacklist'], (res) => {
        const list = res[targetListKey] || [];
        const otherListKey = targetListKey === 'whitelist' ? 'blacklist' : 'whitelist';
        const otherList = res[otherListKey] || [];

        if (list.some(i => i.name === name)) {
            showStatus(`Already in ${targetListKey}!`, true);
            return;
        }

        let newOtherList = otherList;
        let moved = false;
        if (otherList.some(i => i.name === name)) {
            newOtherList = otherList.filter(i => i.name !== name);
            moved = true;
        }

        list.push({ name: name, url: url });

        const updateData = {};
        updateData[targetListKey] = list;
        updateData[otherListKey] = newOtherList;

        chrome.storage.sync.set(updateData, () => {
            renderList(list, targetListKey);
            renderList(newOtherList, otherListKey);
            showStatus(moved ? `Moved to ${targetListKey}` : `Added to ${targetListKey}`);
        });
    });
}

function removeChannel(nameToDelete, listKey) {
    chrome.storage.sync.get([listKey], (res) => {
        let list = res[listKey] || [];
        list = list.filter(item => item.name !== nameToDelete);

        const update = {};
        update[listKey] = list;

        chrome.storage.sync.set(update, () => renderList(list, listKey));
    });
}

function renderList(list, listKey) {
    const ul = listKey === 'whitelist' ? UI.lists.whitelistUl : UI.lists.blacklistUl;
    if (!ul) return;

    ul.innerHTML = '';
    if (!list || list.length === 0) {
        ul.innerHTML = '<li style="justify-content:center; opacity:0.5; border:none; padding:20px;">List Empty</li>';
        return;
    }

    [...list].reverse().forEach(item => {
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
            span.textContent = name;
            contentDiv.appendChild(span);
        }

        const btn = document.createElement('span');
        btn.className = 'del-btn';
        btn.innerHTML = '&times;';
        btn.onclick = () => removeChannel(name, listKey);

        li.appendChild(contentDiv);
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

function renderLogs(logs) {
    if (!UI.logs.ul) return;
    UI.logs.ul.innerHTML = '';

    if (!logs || logs.length === 0) {
        UI.logs.ul.innerHTML = '<li style="color:#888; font-style:italic; justify-content:center;">No activity yet...</li>';
        return;
    }

    const ICONS = {
        LIKE: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>`,
        DISLIKE: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>`
    };

    logs.forEach(log => {
        const li = document.createElement('li');
        const reasonText = log.reason ? `Reason: ${log.reason}` : "Auto Action";
        li.setAttribute('title', reasonText);
        li.style.cursor = "help";

        const displayText = log.title || log.channel || "Unknown";

        const actionIcon = ICONS[log.action] || "?";

        const logContent = log.videoId
            ? `<a href="https://www.youtube.com/watch?v=${log.videoId}" target="_blank" title="${log.channel || 'View Channel'}" style="color:inherit; text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; display:flex; align-items:center; gap:4px;">${displayText} <span style="font-size:10px;">🔗</span></a>`
            : `<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${displayText}</span>`;

        li.innerHTML = `
            <div style="display:flex; align-items:center; width:100%;">
                <span style="opacity:0.5; margin-right:8px; font-size:9px; min-width:30px;">${log.time}</span>
                <span class="log-action ${log.action}">${actionIcon}</span>
                ${logContent}
            </div>
        `;
        UI.logs.ul.appendChild(li);
    });
}

function handleExport() {
    chrome.storage.sync.get(null, (res) => {
        const backupData = {
            timestamp: new Date().toISOString(),
            data: res
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `auto_like_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus("Backup exported.");
    });
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const json = JSON.parse(e.target.result);
            if (json.data && typeof json.data === 'object') {
                chrome.storage.sync.set(json.data, () => {
                    loadAllData();
                    showStatus("Imported successfully!");
                });
            } else {
                showStatus("Invalid format.", true);
            }
        } catch (err) {
            console.error(err);
            showStatus("Read error.", true);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function showStatus(msg, isError = false) {
    if (!UI.status) return;
    UI.status.textContent = msg;
    UI.status.style.color = isError ? '#ff5252' : 'var(--success-color)';
    setTimeout(() => {
        if (UI.status) UI.status.textContent = '';
    }, 2500);
}