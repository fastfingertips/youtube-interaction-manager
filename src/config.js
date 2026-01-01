/**
 * ============================================
 * APPLICATION CONFIGURATION
 * Centralized constants and default values
 * ============================================
 */

const CONFIG = {

    // ─────────────────────────────────────────
    // APP INFO
    // ─────────────────────────────────────────
    APP_NAME: 'YouTube Interaction Manager',
    BACKUP_PREFIX: 'interaction_manager_backup',

    // ─────────────────────────────────────────
    // DEFAULT SETTINGS
    // ─────────────────────────────────────────
    DEFAULTS: {
        triggerType: 'instant',
        triggerSeconds: 10,
        triggerPercent: 50,
        enableHumanize: false,
        showNeutralBadge: true,
        enableDebug: false,
        enableExtension: true,
        enableHistory: true
    },

    // ─────────────────────────────────────────
    // TIMING (milliseconds)
    // ─────────────────────────────────────────
    TIMING: {
        statusMessage: 2500,        // Status message display duration
        checkInterval: 1000,        // Video status check interval
        notificationDuration: 3000, // Toast notification duration
        notificationFadeOut: 300,   // Fade out animation
        verificationDelays: [2000, 5000] // Action verification delays
    },

    // ─────────────────────────────────────────
    // HUMANIZE (seconds)
    // ─────────────────────────────────────────
    HUMANIZE: {
        minDelay: 3,
        maxDelay: 15
    },

    // ─────────────────────────────────────────
    // COLORS
    // ─────────────────────────────────────────
    COLORS: {
        // Badge colors
        badgeLike: '#00E676',
        badgeDislike: '#FF5252',
        badgeNeutral: '#666666',

        // Notification colors
        notifySuccess: '#0f9d58',
        notifyError: '#db4437',

        // Status colors
        statusError: '#ff5252'
    },

    // ─────────────────────────────────────────
    // YOUTUBE DOM SELECTORS
    // ─────────────────────────────────────────
    SELECTORS: {
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
    },

    // ─────────────────────────────────────────
    // STORAGE KEYS
    // ─────────────────────────────────────────
    STORAGE_KEYS: [
        'enableExtension',
        'enableLike',
        'enableDislike',
        'triggerType',
        'triggerSeconds',
        'triggerPercent',
        'enableHumanize',
        'whitelist',
        'blacklist',
        'actionWhitelist',
        'actionBlacklist',
        'actionUnlisted',
        'showNeutralBadge',
        'enableDebug',
        'enableHistory',
        'activityLogs'
    ],

    // ─────────────────────────────────────────
    // DEBUG LOG STYLING
    // ─────────────────────────────────────────
    LOG_STYLE: [
        'background: #000',
        'color: #00ff00',
        'font-family: monospace',
        'font-size: 10px',
        'padding: 2px 4px',
        'border-radius: 2px'
    ].join('; ')

};

// ─────────────────────────────────────────
// FREEZE CONFIG (prevent modification)
// ─────────────────────────────────────────
Object.freeze(CONFIG);
Object.freeze(CONFIG.DEFAULTS);
Object.freeze(CONFIG.TIMING);
Object.freeze(CONFIG.HUMANIZE);
Object.freeze(CONFIG.COLORS);
Object.freeze(CONFIG.SELECTORS);
Object.freeze(CONFIG.STORAGE_KEYS);
