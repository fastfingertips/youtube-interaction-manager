/**
 * Mock Chrome Extension API for Unit Tests
 */

function createMockChrome(initialData = {}) {
    let store = { ...initialData };

    const chrome = {
        runtime: {
            lastError: null,
            sendMessage(message, callback) {
                if (typeof callback === 'function') callback({ success: true });
            },
            onMessage: {
                listeners: [],
                addListener(fn) { this.listeners.push(fn); },
                removeListener(fn) {
                    this.listeners = this.listeners.filter(l => l !== fn);
                }
            },
            openOptionsPage() {}
        },
        action: {
            badges: {},
            setBadgeText({ text, tabId }) {
                this.badges[tabId] = { ...(this.badges[tabId] || {}), text };
            },
            setBadgeBackgroundColor({ color, tabId }) {
                this.badges[tabId] = { ...(this.badges[tabId] || {}), color };
            }
        },
        storage: {
            local: {
                get(keys, callback) {
                    if (chrome.runtime.lastError) {
                        callback({});
                        return;
                    }

                    if (keys === null || keys === undefined) {
                        callback(structuredClone(store));
                        return;
                    }

                    if (typeof keys === 'string') {
                        callback({ [keys]: structuredClone(store[keys]) });
                        return;
                    }

                    if (Array.isArray(keys)) {
                        const result = {};
                        for (const key of keys) {
                            if (key in store) {
                                result[key] = structuredClone(store[key]);
                            }
                        }
                        callback(result);
                        return;
                    }

                    if (typeof keys === 'object') {
                        const result = { ...keys };
                        for (const key of Object.keys(keys)) {
                            if (key in store) {
                                result[key] = structuredClone(store[key]);
                            }
                        }
                        callback(result);
                        return;
                    }

                    callback({});
                },
                set(items, callback) {
                    if (chrome.runtime.lastError) {
                        if (typeof callback === 'function') callback();
                        return;
                    }
                    Object.assign(store, structuredClone(items));
                    if (typeof callback === 'function') callback();
                },
                remove(keys, callback) {
                    const toRemove = Array.isArray(keys) ? keys : [keys];
                    for (const key of toRemove) {
                        delete store[key];
                    }
                    if (typeof callback === 'function') callback();
                },
                clear(callback) {
                    store = {};
                    if (typeof callback === 'function') callback();
                }
            }
        },
        _reset(newData = {}) {
            store = { ...newData };
            this.runtime.lastError = null;
            this.action.badges = {};
        },
        _getStore() {
            return store;
        }
    };

    return chrome;
}

module.exports = { createMockChrome };
