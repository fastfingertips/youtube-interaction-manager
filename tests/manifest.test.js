const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const manifestPath = path.join(ROOT_DIR, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

describe('manifest.json - MV3 Spec & Asset Existence', () => {
    it('should be valid Manifest V3', () => {
        assert.equal(manifest.manifest_version, 3);
        assert.ok(manifest.name);
        assert.ok(manifest.version);
        assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
        assert.ok(manifest.description);
    });

    it('should reference physical icon files that exist', () => {
        const icons = manifest.icons || {};
        for (const [size, iconRelPath] of Object.entries(icons)) {
            const iconFullPath = path.join(ROOT_DIR, iconRelPath);
            assert.ok(
                fs.existsSync(iconFullPath),
                `Icon ${size}px not found at: ${iconRelPath}`
            );
        }
    });

    it('should reference physical background service worker', () => {
        const swPath = manifest.background?.service_worker;
        assert.ok(swPath, 'Missing background.service_worker in manifest');
        assert.ok(
            fs.existsSync(path.join(ROOT_DIR, swPath)),
            `Service worker file not found at: ${swPath}`
        );
    });

    it('should reference physical content script files', () => {
        const contentScripts = manifest.content_scripts || [];
        assert.ok(contentScripts.length > 0, 'No content_scripts defined');

        for (const cs of contentScripts) {
            for (const scriptPath of cs.js || []) {
                const fullPath = path.join(ROOT_DIR, scriptPath);
                assert.ok(
                    fs.existsSync(fullPath),
                    `Content script not found: ${scriptPath}`
                );
            }
        }
    });

    it('should reference physical popup and options pages', () => {
        const popupPath = manifest.action?.default_popup;
        assert.ok(popupPath, 'Missing default_popup in manifest');
        assert.ok(
            fs.existsSync(path.join(ROOT_DIR, popupPath)),
            `Popup HTML not found: ${popupPath}`
        );

        const optionsPath = manifest.options_ui?.page;
        assert.ok(optionsPath, 'Missing options_ui.page in manifest');
        assert.ok(
            fs.existsSync(path.join(ROOT_DIR, optionsPath)),
            `Options HTML not found: ${optionsPath}`
        );
    });

    it('should request only required permissions', () => {
        const permissions = manifest.permissions || [];
        assert.ok(permissions.includes('storage'));
        assert.ok(permissions.includes('activeTab'));

        const hostPermissions = manifest.host_permissions || [];
        assert.ok(hostPermissions.includes('https://*.youtube.com/*'));
    });

    it('should define keyboard shortcuts (commands)', () => {
        const commands = manifest.commands || {};
        assert.ok(commands['toggle-whitelist'], 'Missing toggle-whitelist command');
        assert.ok(commands['toggle-blacklist'], 'Missing toggle-blacklist command');
        assert.equal(commands['toggle-whitelist'].suggested_key.default, 'Alt+W');
        assert.equal(commands['toggle-blacklist'].suggested_key.default, 'Alt+B');
    });
});
