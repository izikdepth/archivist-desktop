import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface NodeStatus {
  running: boolean;
  peerId?: string;
  version?: string;
  peers: number;
  storage: {
    used: number;
    available: number;
  };
}

const defaultStatus: NodeStatus = {
  running: false,
  peers: 0,
  storage: {
    used: 0,
    available: 0,
  },
};

export function useNode() {
  const [status, setStatus] = useState<NodeStatus>(defaultStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const result = await invoke<NodeStatus>('node_status');
      setStatus(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get node status');
    }
  }, []);

  const startNode = useCallback(async () => {
    try {
      setLoading(true);
      await invoke('start_node');
      await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start node');
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  const stopNode = useCallback(async () => {
    try {
      setLoading(true);
      await invoke('stop_node');
      await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to stop node');
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await refreshStatus();
      setLoading(false);
    }
    init();

    // Poll status every 5 seconds
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    status,
    loading,
    error,
    startNode,
    stopNode,
    refreshStatus,
  };
}
