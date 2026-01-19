import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface PeerInfo {
  id: string;
  addresses: string[];
  connected: boolean;
  latencyMs: number | null;
  bytesSent: number;
  bytesReceived: number;
  connectedAt: string | null;
  lastSeen: string | null;
  agentVersion: string | null;
}

export interface PeerStats {
  totalPeers: number;
  connectedPeers: number;
  bytesSentTotal: number;
  bytesReceivedTotal: number;
}

export interface PeerList {
  peers: PeerInfo[];
  stats: PeerStats;
  localPeerId: string | null;
  localAddresses: string[];
  spr: string | null;
}

const defaultPeerList: PeerList = {
  peers: [],
  stats: {
    totalPeers: 0,
    connectedPeers: 0,
    bytesSentTotal: 0,
    bytesReceivedTotal: 0,
  },
  localPeerId: null,
  localAddresses: [],
  spr: null,
};

export function usePeers() {
  const [peerList, setPeerList] = useState<PeerList>(defaultPeerList);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPeers = useCallback(async () => {
    try {
      const result = await invoke<PeerList>('get_peers');
      setPeerList(result);
      setError(null);
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : 'Failed to get peers');
      setError(msg);
    }
  }, []);

  const connectPeer = useCallback(async (address: string) => {
    try {
      console.log('[usePeers] Attempting to connect to peer:', address);
      setError(null);
      console.log('[usePeers] Invoking connect_peer command...');
      await invoke('connect_peer', { address });
      console.log('[usePeers] connect_peer succeeded, refreshing peers...');
      await refreshPeers();
      console.log('[usePeers] Peer connection complete');
    } catch (e) {
      console.error('[usePeers] connect_peer failed:', e);
      const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : 'Failed to connect to peer');
      setError(msg);
      throw e;
    }
  }, [refreshPeers]);

  const disconnectPeer = useCallback(async (peerId: string) => {
    try {
      setError(null);
      await invoke('disconnect_peer', { peerId });
      await refreshPeers();
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : 'Failed to disconnect peer');
      setError(msg);
      throw e;
    }
  }, [refreshPeers]);

  const removePeer = useCallback(async (peerId: string) => {
    try {
      setError(null);
      await invoke('remove_peer', { peerId });
      await refreshPeers();
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : 'Failed to remove peer');
      setError(msg);
      throw e;
    }
  }, [refreshPeers]);

  const copySpr = useCallback(async () => {
    if (peerList.spr) {
      try {
        await navigator.clipboard.writeText(peerList.spr);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = peerList.spr;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  }, [peerList.spr]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await refreshPeers();
      setLoading(false);
    }
    init();

    // Poll for updates every 10 seconds
    const interval = setInterval(refreshPeers, 10000);
    return () => clearInterval(interval);
  }, [refreshPeers]);

  return {
    peerList,
    loading,
    error,
    connectPeer,
    disconnectPeer,
    removePeer,
    copySpr,
    refreshPeers,
  };
}
