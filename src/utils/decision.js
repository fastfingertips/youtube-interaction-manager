/**
 * Decision Logic Utilities
 * Evaluates channel status and user settings to determine actions (like/dislike/none)
 */

const DecisionUtils = {
    /**
     * Helper to resolve setting with backward-compatibility
     * @param {*} primary - Primary setting value
     * @param {*} legacy - Legacy fallback value
     * @param {*} defaultValue - Default fallback value
     * @returns {*}
     */
    getActionSetting(primary, legacy, defaultValue) {
        if (primary !== undefined) return primary;
        if (legacy !== undefined) return legacy;
        return defaultValue;
    },

    /**
     * Determine unlisted channel action from settings
     * @param {Object} settings - Extension settings
     * @returns {string} 'like' | 'dislike' | 'none'
     */
    getUnlistedAction(settings) {
        if (!settings) return 'none';
        if (settings.actionUnlisted !== undefined) return settings.actionUnlisted;
        if (settings.enableDislike === true) return 'dislike';
        return 'none';
    },

    /**
     * Check if a channel exists in a given list
     * @param {Array} list - Whitelist or blacklist array
     * @param {string} name - Channel name to check
     * @returns {boolean}
     */
    checkIsListed(list, name) {
        if (!list || !Array.isArray(list) || !name) return false;
        return list.some(item => item && item.name === name);
    },

    /**
     * Check if an advertisement is currently playing in the DOM
     * @param {Document|Object} doc - Document or mock DOM object
     * @param {Array<string>} selectors - Array of CSS selector strings
     * @returns {boolean}
     */
    isAdPlaying(doc = (typeof document !== 'undefined' ? document : null), selectors = ['.ad-showing', '.ad-interrupting']) {
        if (!doc || typeof doc.querySelector !== 'function') return false;
        const list = Array.isArray(selectors) && selectors.length > 0 ? selectors : ['.ad-showing', '.ad-interrupting'];
        for (const sel of list) {
            if (doc.querySelector(sel)) return true;
        }
        return false;
    },

    /**
     * Resolve action and reasoning for a channel based on current settings
     * @param {string} channelName - Channel name
     * @param {Object} settings - Settings object
     * @returns {{ action: 'like' | 'dislike' | 'none', reason: string }}
     */
    resolveActionForChannel(channelName, settings = {}) {
        if (!channelName) {
            return { action: 'none', reason: "No channel name provided" };
        }

        const whitelist = settings.whitelist || [];
        const blacklist = settings.blacklist || [];

        const doLikeWhitelist = this.getActionSetting(settings.actionWhitelist, settings.enableLike, true);
        const doDislikeBlacklist = this.getActionSetting(settings.actionBlacklist, undefined, true);
        const doUnlisted = this.getUnlistedAction(settings);

        const isWhitelisted = this.checkIsListed(whitelist, channelName);
        const isBlacklisted = this.checkIsListed(blacklist, channelName);

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
};

// Export for ES modules / CommonJS (if used in tests/Node)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecisionUtils;
}
