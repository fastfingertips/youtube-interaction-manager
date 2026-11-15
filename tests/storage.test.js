const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockChrome } = require('./helpers/mock-chrome.js');

global.CONFIG = require('../src/config.js');
const mockChrome = createMockChrome();
global.chrome = mockChrome;

const StorageUtils = require('../src/utils/storage.js');

describe('StorageUtils - Extension Storage Management', () => {
    beforeEach(() => {
        mockChrome._reset();
    });

    describe('getAllData()', () => {
        it('should retrieve stored data matching CONFIG.STORAGE_KEYS', async () => {
            await StorageUtils.saveSettings({
                enableExtension: true,
                whitelist: [{ name: 'Test' }]
            });

            const data = await StorageUtils.getAllData();
            assert.equal(data.enableExtension, true);
            assert.deepEqual(data.whitelist, [{ name: 'Test' }]);
        });

        it('should resolve to empty object if storage error occurs', async () => {
            mockChrome.runtime.lastError = { message: 'Storage error' };
            const data = await StorageUtils.getAllData();
            assert.deepEqual(data, {});
        });
    });

    describe('addChannel()', () => {
        it('should add channel to whitelist and include date', async () => {
            const res = await StorageUtils.addChannel('MyChannel', 'https://youtube.com/@mychannel', 'whitelist');
            assert.equal(res.success, true);
            assert.equal(res.message, 'Added to whitelist.');

            const data = await StorageUtils.getAllData();
            assert.equal(data.whitelist.length, 1);
            assert.equal(data.whitelist[0].name, 'MyChannel');
            assert.ok(data.whitelist[0].date);
        });

        it('should prevent adding duplicate channel to same list', async () => {
            await StorageUtils.addChannel('MyChannel', 'url', 'whitelist');
            const res = await StorageUtils.addChannel('MyChannel', 'url', 'whitelist');
            assert.equal(res.success, false);
            assert.equal(res.message, 'Already in list.');

            const data = await StorageUtils.getAllData();
            assert.equal(data.whitelist.length, 1);
        });

        it('should remove channel from other list when adding (cross-list deduplication)', async () => {
            // First add to blacklist
            await StorageUtils.addChannel('TargetChannel', 'url', 'blacklist');
            let data = await StorageUtils.getAllData();
            assert.equal(data.blacklist.length, 1);

            // Now add to whitelist
            const res = await StorageUtils.addChannel('TargetChannel', 'url', 'whitelist');
            assert.equal(res.success, true);

            data = await StorageUtils.getAllData();
            assert.equal(data.whitelist.length, 1);
            assert.equal(data.blacklist.length, 0);
        });
    });

    describe('removeChannel()', () => {
        it('should remove channel by name and return updated list', async () => {
            await StorageUtils.addChannel('KeepMe', 'url', 'whitelist');
            await StorageUtils.addChannel('RemoveMe', 'url', 'whitelist');

            const updated = await StorageUtils.removeChannel('RemoveMe', 'whitelist');
            assert.equal(updated.length, 1);
            assert.equal(updated[0].name, 'KeepMe');

            const data = await StorageUtils.getAllData();
            assert.deepEqual(data.whitelist, updated);
        });
    });

    describe('Activity Logs & Settings', () => {
        it('should clear logs', async () => {
            await StorageUtils.saveSettings({ activityLogs: [{ action: 'LIKE' }] });
            await StorageUtils.clearLogs();
            const data = await StorageUtils.getAllData();
            assert.deepEqual(data.activityLogs, []);
        });

        it('should remove log entry by index', async () => {
            await StorageUtils.saveSettings({
                activityLogs: [{ id: 1 }, { id: 2 }, { id: 3 }]
            });

            const updated = await StorageUtils.removeLog(1);
            assert.equal(updated.length, 2);
            assert.equal(updated[0].id, 1);
            assert.equal(updated[1].id, 3);
        });

        it('should toggle boolean setting', async () => {
            await StorageUtils.toggleSetting('enableExtension', false);
            let data = await StorageUtils.getAllData();
            assert.equal(data.enableExtension, false);

            await StorageUtils.toggleSetting('enableExtension', true);
            data = await StorageUtils.getAllData();
            assert.equal(data.enableExtension, true);
        });
    });
});
