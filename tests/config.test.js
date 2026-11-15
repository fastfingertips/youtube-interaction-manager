'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const CONFIG = require('../src/config.js');

describe('CONFIG integrity & defaults', () => {
    it('should be deeply frozen and immutable', () => {
        assert.ok(Object.isFrozen(CONFIG));
        assert.ok(Object.isFrozen(CONFIG.DEFAULTS));
        assert.ok(Object.isFrozen(CONFIG.TIMING));
        assert.ok(Object.isFrozen(CONFIG.HUMANIZE));
        assert.ok(Object.isFrozen(CONFIG.COLORS));
        assert.ok(Object.isFrozen(CONFIG.SELECTORS));
        assert.ok(Object.isFrozen(CONFIG.STORAGE_KEYS));

        assert.throws(() => {
            CONFIG.APP_NAME = 'Modified Name';
        }, TypeError);
    });

    it('should define valid default settings', () => {
        const { DEFAULTS } = CONFIG;
        assert.equal(DEFAULTS.triggerType, 'instant');
        assert.equal(DEFAULTS.triggerSeconds, 10);
        assert.equal(DEFAULTS.triggerPercent, 50);
        assert.equal(DEFAULTS.enableHumanize, false);
        assert.equal(DEFAULTS.showNeutralBadge, true);
        assert.equal(DEFAULTS.enableDebug, false);
        assert.equal(DEFAULTS.enableExtension, true);
        assert.equal(DEFAULTS.enableHistory, true);
        assert.equal(DEFAULTS.highlightChannels, true);
    });

    it('should have required timing and humanize boundaries', () => {
        assert.ok(CONFIG.TIMING.checkInterval > 0);
        assert.ok(CONFIG.TIMING.statusMessage > 0);
        assert.ok(CONFIG.HUMANIZE.minDelay < CONFIG.HUMANIZE.maxDelay);
        assert.equal(CONFIG.HUMANIZE.minDelay, 3);
        assert.equal(CONFIG.HUMANIZE.maxDelay, 15);
    });

    it('should include all essential storage keys', () => {
        const requiredKeys = [
            'enableExtension',
            'whitelist',
            'blacklist',
            'activityLogs',
            'triggerType',
            'triggerSeconds',
            'triggerPercent',
            'actionWhitelist',
            'actionBlacklist',
            'actionUnlisted'
        ];

        for (const key of requiredKeys) {
            assert.ok(CONFIG.STORAGE_KEYS.includes(key), `Missing key in STORAGE_KEYS: ${key}`);
        }
    });

    it('should define valid DOM selector arrays', () => {
        assert.ok(Array.isArray(CONFIG.SELECTORS.adIndicator));
        assert.ok(CONFIG.SELECTORS.adIndicator.length > 0);
        assert.ok(Array.isArray(CONFIG.SELECTORS.channelName));
        assert.ok(CONFIG.SELECTORS.channelName.length > 0);
        assert.ok(Array.isArray(CONFIG.SELECTORS.videoTitle));
        assert.ok(CONFIG.SELECTORS.videoTitle.length > 0);
        assert.ok(Array.isArray(CONFIG.SELECTORS.likeBtn));
        assert.ok(CONFIG.SELECTORS.likeBtn.length > 0);
        assert.ok(Array.isArray(CONFIG.SELECTORS.dislikeBtn));
        assert.ok(CONFIG.SELECTORS.dislikeBtn.length > 0);
    });
});
