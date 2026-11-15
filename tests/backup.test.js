const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMockChrome } = require('./helpers/mock-chrome.js');

global.CONFIG = require('../src/config.js');
const mockChrome = createMockChrome();
global.chrome = mockChrome;

const BackupUtils = require('../src/utils/backup.js');

describe('BackupUtils - Export & Import System', () => {
    beforeEach(() => {
        mockChrome._reset();
    });

    describe('createBackup()', () => {
        it('should create backup object with ISO timestamp and ordered data', async () => {
            mockChrome._reset({
                enableExtension: true,
                _migrated: true,
                whitelist: [{ name: 'A' }],
                blacklist: [{ name: 'B' }],
                activityLogs: [{ id: 1 }],
                triggerType: 'instant'
            });

            const backup = await BackupUtils.createBackup();

            assert.ok(backup.timestamp);
            assert.ok(!Number.isNaN(Date.parse(backup.timestamp)));

            // _migrated internal flag must be omitted from backup
            assert.equal(backup.data._migrated, undefined);

            assert.equal(backup.data.enableExtension, true);
            assert.equal(backup.data.triggerType, 'instant');
            assert.deepEqual(backup.data.whitelist, [{ name: 'A' }]);
            assert.deepEqual(backup.data.blacklist, [{ name: 'B' }]);
            assert.deepEqual(backup.data.activityLogs, [{ id: 1 }]);
        });
    });

    describe('parseBackupFile()', () => {
        it('should successfully parse valid backup JSON file', async () => {
            const validData = {
                timestamp: '2026-01-01T00:00:00.000Z',
                data: {
                    enableExtension: true,
                    whitelist: [{ name: 'Channel X' }]
                }
            };

            const mockFile = {
                text: async () => JSON.stringify(validData)
            };

            const parsed = await BackupUtils.parseBackupFile(mockFile);
            assert.deepEqual(parsed, validData);
        });

        it('should reject invalid backup without data object', async () => {
            const mockFile = {
                text: async () => JSON.stringify({ timestamp: 'now' })
            };

            await assert.rejects(async () => {
                await BackupUtils.parseBackupFile(mockFile);
            }, /Invalid backup format/);
        });

        it('should reject corrupt non-JSON file', async () => {
            const mockFile = {
                text: async () => 'Not a valid JSON {{{'
            };

            await assert.rejects(async () => {
                await BackupUtils.parseBackupFile(mockFile);
            }, SyntaxError);
        });
    });

    describe('saveBackup()', () => {
        it('should write restored data into chrome.storage.local', async () => {
            const backupToRestore = {
                enableExtension: false,
                whitelist: [{ name: 'Restored Channel' }]
            };

            await BackupUtils.saveBackup(backupToRestore);

            const store = mockChrome._getStore();
            assert.equal(store.enableExtension, false);
            assert.deepEqual(store.whitelist, [{ name: 'Restored Channel' }]);
        });
    });
});
