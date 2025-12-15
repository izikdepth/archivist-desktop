import { useSync } from '../hooks/useSync';
import { open } from '@tauri-apps/plugin-dialog';

function Sync() {
  const {
    syncStatus,
    loading,
    error,
    addWatchFolder,
    removeWatchFolder,
    toggleWatchFolder,
  } = useSync();

  const handleAddFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        title: 'Select folder to watch',
      });

      if (selected && typeof selected === 'string') {
        await addWatchFolder(selected);
      }
    } catch (e) {
      console.error('Failed to add folder:', e);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Sync</h2>
        <div className="actions">
          <button onClick={handleAddFolder} disabled={loading}>
            Add Watch Folder
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="sync-status-card">
        <h3>Sync Status</h3>
        <div className={`status-indicator ${syncStatus.syncing ? 'syncing' : 'idle'}`}>
          {syncStatus.syncing ? 'Syncing...' : 'Idle'}
        </div>
        {syncStatus.queueSize > 0 && (
          <p>{syncStatus.queueSize} files waiting to upload</p>
        )}
      </div>

      <div className="watched-folders">
        <h3>Watched Folders</h3>
        {syncStatus.watchedFolders.length === 0 ? (
          <div className="empty-state">
            <p>No folders being watched.</p>
            <p>Add a folder to automatically sync its contents to the network.</p>
          </div>
        ) : (
          <ul className="folder-list">
            {syncStatus.watchedFolders.map((folder) => (
              <li key={folder.path} className="folder-item">
                <div className="folder-info">
                  <span className="folder-path">{folder.path}</span>
                  <span className="folder-stats">
                    {folder.fileCount} files
                    {folder.lastScan && (
                      <span className="last-scan">
                        Last scan: {new Date(folder.lastScan).toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                </div>
                <div className="folder-actions">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={folder.enabled}
                      onChange={(e) => toggleWatchFolder(folder.path, e.target.checked)}
                    />
                    <span className="toggle-label">
                      {folder.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                  <button
                    className="small danger"
                    onClick={() => removeWatchFolder(folder.path)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sync-info">
        <h3>How Sync Works</h3>
        <ol>
          <li>Add folders you want to keep synced</li>
          <li>Files are automatically uploaded to your local node</li>
          <li>CIDs are announced to connected peers</li>
          <li>Paired peers can request and download your files</li>
        </ol>
      </div>
    </div>
  );
}

export default Sync;
