/**
 * Options page script
 * Uses shared BackupUtils for import/export
 */

const statusEl = document.getElementById('status');
const btnExport = document.getElementById('btnExport');
const fileInput = document.getElementById('fileInput');

function showStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.className = isError ? 'error' : 'success';
    setTimeout(() => {
        statusEl.className = '';
        statusEl.textContent = '';
    }, CONFIG.TIMING.statusMessage);
}

async function handleExport() {
    try {
        await BackupUtils.exportBackup();
        showStatus("Backup exported.");
    } catch {
        showStatus("Export failed.", true);
    }
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        await BackupUtils.importBackup(file);
        showStatus("Imported! Reload the popup to see changes.");
    } catch {
        showStatus("Import failed.", true);
    }
    event.target.value = '';
}

btnExport.addEventListener('click', handleExport);
fileInput.addEventListener('change', handleImport);
