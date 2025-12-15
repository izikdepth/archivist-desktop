import { invoke } from '@tauri-apps/api/core';

// Node commands
export const nodeCommands = {
  start: () => invoke('start_node'),
  stop: () => invoke('stop_node'),
  status: () => invoke('node_status'),
};

// File commands
export const fileCommands = {
  upload: (path: string) => invoke('upload_file', { path }),
  download: (cid: string, destPath: string) => invoke('download_file', { cid, destPath }),
  list: () => invoke('list_files'),
};

// Sync commands
export const syncCommands = {
  status: () => invoke('sync_status'),
  addWatchFolder: (path: string) => invoke('add_watch_folder', { path }),
  removeWatchFolder: (path: string) => invoke('remove_watch_folder', { path }),
  toggleWatchFolder: (path: string, enabled: boolean) =>
    invoke('toggle_watch_folder', { path, enabled }),
};

// Peer commands
export const peerCommands = {
  list: () => invoke('list_peers'),
  connect: (address: string) => invoke('connect_peer', { address }),
  disconnect: (peerId: string) => invoke('disconnect_peer', { peerId }),
};

// System commands
export const systemCommands = {
  getFeatures: () => invoke('get_features'),
  getSettings: () => invoke('get_settings'),
  saveSettings: (settings: unknown) => invoke('save_settings', { settings }),
  getAppInfo: () => invoke('app_info'),
};
