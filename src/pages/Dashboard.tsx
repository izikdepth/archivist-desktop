import { useNode } from '../hooks/useNode';
import { useSync } from '../hooks/useSync';

function Dashboard() {
  const { status, loading, error, startNode, stopNode } = useNode();
  const { syncStatus } = useSync();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page">
      <h2>Dashboard</h2>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Node Status</h3>
          <div className={`status-indicator ${status.running ? 'running' : 'stopped'}`}>
            {status.running ? 'Running' : 'Stopped'}
          </div>
          {status.version && <p>Version: {status.version}</p>}
          {status.peerId && <p className="peer-id">Peer ID: {status.peerId.slice(0, 16)}...</p>}
          <div className="node-controls">
            {status.running ? (
              <button onClick={stopNode} disabled={loading}>
                Stop Node
              </button>
            ) : (
              <button onClick={startNode} disabled={loading}>
                Start Node
              </button>
            )}
          </div>
        </div>

        <div className="stat-card">
          <h3>Connected Peers</h3>
          <div className="big-number">{status.peers}</div>
          <p>Active connections</p>
        </div>

        <div className="stat-card">
          <h3>Storage</h3>
          <div className="storage-bar">
            <div
              className="storage-used"
              style={{
                width: `${status.storage.available > 0
                  ? (status.storage.used / status.storage.available) * 100
                  : 0}%`,
              }}
            />
          </div>
          <p>
            {formatBytes(status.storage.used)} / {formatBytes(status.storage.available)}
          </p>
        </div>

        <div className="stat-card">
          <h3>Sync Status</h3>
          <div className={`status-indicator ${syncStatus.syncing ? 'syncing' : 'idle'}`}>
            {syncStatus.syncing ? 'Syncing' : 'Idle'}
          </div>
          <p>{syncStatus.queueSize} files in queue</p>
          <p>{syncStatus.watchedFolders.length} watched folders</p>
        </div>
      </div>

      {syncStatus.recentUploads.length > 0 && (
        <div className="recent-activity">
          <h3>Recent Uploads</h3>
          <ul>
            {syncStatus.recentUploads.slice(0, 5).map((cid, i) => (
              <li key={i}>
                <code>{cid}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
