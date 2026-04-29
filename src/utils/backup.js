/**
 * Backup Utilities
 * Shared export/import functions for popup and options pages
 */

const BackupUtils = {
    /**
     * Create backup data object
     * @returns {Promise<Object>} Backup data with timestamp
     */
    createBackup() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (data) => {
                // Order keys: simple settings first, arrays last
                const ordered = {};
                const arrayKeys = ['whitelist', 'blacklist', 'activityLogs'];
                Object.keys(data).sort((a, b) => {
                    const aIsArray = arrayKeys.includes(a);
                    const bIsArray = arrayKeys.includes(b);
                    if (aIsArray !== bIsArray) return aIsArray ? 1 : -1;
                    return a.localeCompare(b);
                }).forEach(key => {
                    if (key !== '_migrated') ordered[key] = data[key];
                });
                resolve({
                    timestamp: new Date().toISOString(),
                    data: ordered
                });
            });
        });
    },

    /**
     * Download backup as JSON file
     * @param {Object} backupData - Backup data object
     * @param {string} [filename] - Optional custom filename
     */
    downloadBackup(backupData, filename) {
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = filename || `${CONFIG.BACKUP_PREFIX}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    /**
     * Parse backup file content
     * @param {File} file - File object from input
     * @returns {Promise<Object>} Parsed backup data
     */
    parseBackupFile(file) {
        return file.text().then(text => {
            const json = JSON.parse(text);
            if (!json.data || typeof json.data !== 'object') {
                throw new Error('Invalid backup format');
            }
            return json;
        });
    },

    /**
     * Save backup data to storage
     * @param {Object} data - Data to save
     * @returns {Promise<void>}
     */
    saveBackup(data) {
        return new Promise((resolve, reject) => {
            // Handle both Chrome (callback) and Firefox (Promise) APIs
            const result = chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });

            // Firefox Promise style
            if (result && typeof result.then === 'function') {
                result.then(resolve).catch(reject);
            }
        });
    },

    /**
     * Full export flow
     * @returns {Promise<void>}
     */
    async exportBackup() {
        const backupData = await this.createBackup();
        this.downloadBackup(backupData);
    },

    /**
     * Full import flow
     * @param {File} file - File to import
     * @returns {Promise<void>}
     */
    async importBackup(file) {
        const backup = await this.parseBackupFile(file);
        await this.saveBackup(backup.data);
    }
};

// Export for ES modules (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupUtils;
}
