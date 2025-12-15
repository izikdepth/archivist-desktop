import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface PeerInfo {
  peerId: string;
  addresses: string[];
  connected: boolean;
  nickname?: string;
}

function Peers() {
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectInput, setConnectInput] = useState('');

  const loadPeers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<PeerInfo[]>('list_peers');
      setPeers(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load peers');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnect = async () => {
    if (!connectInput.trim()) return;

    try {
      setLoading(true);
      await invoke('connect_peer', { address: connectInput.trim() });
      setConnectInput('');
      await loadPeers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect to peer');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (peerId: string) => {
    try {
      await invoke('disconnect_peer', { peerId });
      await loadPeers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect peer');
    }
  };

  useEffect(() => {
    loadPeers();
    const interval = setInterval(loadPeers, 10000);
    return () => clearInterval(interval);
  }, [loadPeers]);

  const connectedPeers = peers.filter((p) => p.connected);
  const knownPeers = peers.filter((p) => !p.connected);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Peers</h2>
        <button onClick={loadPeers} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="connect-peer">
        <h3>Connect to Peer</h3>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter multiaddr or SPR (e.g., /ip4/1.2.3.4/tcp/9000/p2p/...)"
            value={connectInput}
            onChange={(e) => setConnectInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <button onClick={handleConnect} disabled={loading || !connectInput.trim()}>
            Connect
          </button>
        </div>
      </div>

      <div className="peers-section">
        <h3>Connected Peers ({connectedPeers.length})</h3>
        {connectedPeers.length === 0 ? (
          <div className="empty-state">
            <p>No peers connected.</p>
            <p>Share your node's address with friends to connect.</p>
          </div>
        ) : (
          <ul className="peer-list">
            {connectedPeers.map((peer) => (
              <li key={peer.peerId} className="peer-item connected">
                <div className="peer-info">
                  <span className="peer-id">
                    {peer.nickname || peer.peerId.slice(0, 16) + '...'}
                  </span>
                  <span className="peer-addresses">
                    {peer.addresses.length} addresses
                  </span>
                </div>
                <button
                  className="small danger"
                  onClick={() => handleDisconnect(peer.peerId)}
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {knownPeers.length > 0 && (
        <div className="peers-section">
          <h3>Known Peers ({knownPeers.length})</h3>
          <ul className="peer-list">
            {knownPeers.map((peer) => (
              <li key={peer.peerId} className="peer-item offline">
                <div className="peer-info">
                  <span className="peer-id">
                    {peer.nickname || peer.peerId.slice(0, 16) + '...'}
                  </span>
                  <span className="peer-status">Offline</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Peers;
