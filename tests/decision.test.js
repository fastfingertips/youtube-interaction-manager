const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const DecisionUtils = require('../src/utils/decision.js');

describe('DecisionUtils - Channel Action Logic', () => {
    describe('checkIsListed()', () => {
        const list = [
            { name: 'Channel A', url: 'https://youtube.com/@channelA' },
            { name: 'Channel B', url: 'https://youtube.com/@channelB' }
        ];

        it('should return true for existing channel', () => {
            assert.equal(DecisionUtils.checkIsListed(list, 'Channel A'), true);
            assert.equal(DecisionUtils.checkIsListed(list, 'Channel B'), true);
        });

        it('should return false for unlisted channel', () => {
            assert.equal(DecisionUtils.checkIsListed(list, 'Unknown Channel'), false);
        });

        it('should safely handle empty or null inputs', () => {
            assert.equal(DecisionUtils.checkIsListed([], 'Channel A'), false);
            assert.equal(DecisionUtils.checkIsListed(null, 'Channel A'), false);
            assert.equal(DecisionUtils.checkIsListed(list, ''), false);
            assert.equal(DecisionUtils.checkIsListed(list, null), false);
        });
    });

    describe('getUnlistedAction()', () => {
        it('should return actionUnlisted value when specified', () => {
            assert.equal(DecisionUtils.getUnlistedAction({ actionUnlisted: 'like' }), 'like');
            assert.equal(DecisionUtils.getUnlistedAction({ actionUnlisted: 'dislike' }), 'dislike');
            assert.equal(DecisionUtils.getUnlistedAction({ actionUnlisted: 'none' }), 'none');
        });

        it('should fall back to legacy enableDislike when actionUnlisted is omitted', () => {
            assert.equal(DecisionUtils.getUnlistedAction({ enableDislike: true }), 'dislike');
            assert.equal(DecisionUtils.getUnlistedAction({ enableDislike: false }), 'none');
        });

        it('should default to none when settings are empty', () => {
            assert.equal(DecisionUtils.getUnlistedAction({}), 'none');
            assert.equal(DecisionUtils.getUnlistedAction(null), 'none');
        });
    });

    describe('resolveActionForChannel()', () => {
        const baseSettings = {
            whitelist: [{ name: 'Good Creator' }],
            blacklist: [{ name: 'Spam Channel' }],
            actionWhitelist: true,
            actionBlacklist: true,
            actionUnlisted: 'none'
        };

        it('should return like when channel is in whitelist and action is enabled', () => {
            const res = DecisionUtils.resolveActionForChannel('Good Creator', baseSettings);
            assert.equal(res.action, 'like');
            assert.ok(res.reason.includes('Whitelisted & Action is ON'));
        });

        it('should return none when channel is in whitelist but action is disabled', () => {
            const res = DecisionUtils.resolveActionForChannel('Good Creator', {
                ...baseSettings,
                actionWhitelist: false
            });
            assert.equal(res.action, 'none');
            assert.ok(res.reason.includes('Action is OFF'));
        });

        it('should return dislike when channel is in blacklist and action is enabled', () => {
            const res = DecisionUtils.resolveActionForChannel('Spam Channel', baseSettings);
            assert.equal(res.action, 'dislike');
            assert.ok(res.reason.includes('Blacklisted & Action is ON'));
        });

        it('should return none when channel is in blacklist but action is disabled', () => {
            const res = DecisionUtils.resolveActionForChannel('Spam Channel', {
                ...baseSettings,
                actionBlacklist: false
            });
            assert.equal(res.action, 'none');
            assert.ok(res.reason.includes('Action is OFF'));
        });

        it('should return none for unlisted channel by default', () => {
            const res = DecisionUtils.resolveActionForChannel('Random Creator', baseSettings);
            assert.equal(res.action, 'none');
        });

        it('should return like for unlisted channel if actionUnlisted is like', () => {
            const res = DecisionUtils.resolveActionForChannel('Random Creator', {
                ...baseSettings,
                actionUnlisted: 'like'
            });
            assert.equal(res.action, 'like');
        });

        it('should return dislike for unlisted channel if actionUnlisted is dislike', () => {
            const res = DecisionUtils.resolveActionForChannel('Random Creator', {
                ...baseSettings,
                actionUnlisted: 'dislike'
            });
            assert.equal(res.action, 'dislike');
        });

        it('should support legacy enableLike setting when actionWhitelist is undefined', () => {
            const settingsWithLegacy = {
                whitelist: [{ name: 'Good Creator' }],
                enableLike: false
            };
            const res = DecisionUtils.resolveActionForChannel('Good Creator', settingsWithLegacy);
            assert.equal(res.action, 'none');
        });

        it('should return none when channelName is empty or missing', () => {
            const res = DecisionUtils.resolveActionForChannel('', baseSettings);
            assert.equal(res.action, 'none');
        });
    });
});
