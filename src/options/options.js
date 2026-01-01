// Options page script for import/export

const statusEl = document.getElementById('status');
const btnExport = document.getElementById('btnExport');
const fileInput = document.getElementById('fileInput');

function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = isError ? 'error' : 'success';
    setTimeout(() => {
        statusEl.className = '';
        statusEl.textContent = '';
    }, 3000);
}

function handleExport() {
    chrome.storage.sync.get(null, (res) => {
        const backupData = {
            timestamp: new Date().toISOString(),
            data: res
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `auto_like_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showStatus("Backup exported successfully!");
    });
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    file.text().then(text => {
        try {
            const json = JSON.parse(text);
            if (json.data && typeof json.data === 'object') {
                // Handle both Chrome (callback) and Firefox (Promise) APIs
                const setResult = chrome.storage.sync.set(json.data, () => {
                    if (chrome.runtime.lastError) {
                        showStatus("Import failed: " + chrome.runtime.lastError.message, true);
                        return;
                    }
                    showStatus("Settings imported successfully! Reload the extension popup to see changes.");
                });

                // Firefox Promise style
                if (setResult && typeof setResult.then === 'function') {
                    setResult.then(() => {
                        showStatus("Settings imported successfully! Reload the extension popup to see changes.");
                    }).catch(err => {
                        showStatus("Import failed: " + err.message, true);
                    });
                }
            } else {
                showStatus("Invalid backup file format.", true);
            }
        } catch (err) {
            showStatus("Error reading file: " + err.message, true);
        }
    }).catch(err => {
        showStatus("Error reading file.", true);
    });

    event.target.value = '';
}

btnExport.addEventListener('click', handleExport);
fileInput.addEventListener('change', handleImport);
