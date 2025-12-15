import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface WatchedFolder {
  path: string;
  enabled: boolean;
  fileCount: number;
  lastScan?: string;
}

export interface SyncStatus {
  syncing: boolean;
  queueSize: number;
  watchedFolders: WatchedFolder[];
  recentUploads: string[];
}

const defaultSyncStatus: SyncStatus = {
  syncing: false,
  queueSize: 0,
  watchedFolders: [],
  recentUploads: [],
};

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const result = await invoke<SyncStatus>('sync_status');
      setSyncStatus(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get sync status');
    }
  }, []);

  const addWatchFolder = useCallback(async (path: string) => {
    try {
      await invoke('add_watch_folder', { path });
      await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add watch folder');
      throw e;
    }
  }, [refreshStatus]);

  const removeWatchFolder = useCallback(async (path: string) => {
    try {
      await invoke('remove_watch_folder', { path });
      await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove watch folder');
      throw e;
    }
  }, [refreshStatus]);

  const toggleWatchFolder = useCallback(async (path: string, enabled: boolean) => {
    try {
      await invoke('toggle_watch_folder', { path, enabled });
      await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle watch folder');
      throw e;
    }
  }, [refreshStatus]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await refreshStatus();
      setLoading(false);
    }
    init();

    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    syncStatus,
    loading,
    error,
    addWatchFolder,
    removeWatchFolder,
    toggleWatchFolder,
    refreshStatus,
  };
}
