/**
 * Storage Utilities
 * Centralized data management for Chrome Storage
 */

const StorageUtils = {
    /**
     * Get all extension data with defaults
     * @returns {Promise<Object>}
     */
    getAllData() {
        return new Promise((resolve) => {
            chrome.storage.local.get(CONFIG.STORAGE_KEYS, (res) => {
                if (chrome.runtime.lastError) {
                    console.error("Storage Error:", chrome.runtime.lastError);
                    resolve({});
                    return;
                }
                resolve(res);
            });
        });
    },

    /**
     * Save specific settings
     * @param {Object} settings 
     * @returns {Promise<void>}
     */
    saveSettings(settings) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(settings, () => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve();
            });
        });
    },

    /**
     * Add a channel to whitelist or blacklist
     * @param {string} name 
     * @param {string} url 
     * @param {string} listName ('whitelist' or 'blacklist')
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async addChannel(name, url, listName) {
        const res = await this.getAllData();
        const currentList = res[listName] || [];

        // Check if already exists
        if (currentList.some(item => item.name === name)) {
            return { success: false, message: "Already in list." };
        }

        // Add to list
        const updatedList = [{ name, url, date: new Date().toISOString() }, ...currentList];

        // Remove from the other list if exists
        const otherListName = listName === 'whitelist' ? 'blacklist' : 'whitelist';
        const otherList = res[otherListName] || [];
        const updatedOtherList = otherList.filter(item => item.name !== name);

        await this.saveSettings({
            [listName]: updatedList,
            [otherListName]: updatedOtherList
        });

        return { success: true, message: `Added to ${listName}.` };
    },

    /**
     * Remove a channel from a list
     * @param {string} name 
     * @param {string} listName 
     * @returns {Promise<Object>} Updated list
     */
    async removeChannel(name, listName) {
        const res = await this.getAllData();
        const currentList = res[listName] || [];
        const updatedList = currentList.filter(item => item.name !== name);

        await this.saveSettings({ [listName]: updatedList });
        return updatedList;
    },

    /**
     * Clear all activity logs
     * @returns {Promise<void>}
     */
    async clearLogs() {
        await this.saveSettings({ activityLogs: [] });
    },

    /**
     * Simple toggle for boolean settings (e.g. enableExtension)
     * @param {string} key 
     * @param {boolean} value 
     */
    async toggleSetting(key, value) {
        await this.saveSettings({ [key]: value });
    }
};

// Export for ES modules (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageUtils;
}
