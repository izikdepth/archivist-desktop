use std::sync::Arc;
use tokio::sync::RwLock;

use crate::services::{ConfigService, FileService, NodeService, PeerService, SyncService};

/// Global application state managed by Tauri
pub struct AppState {
    pub node: Arc<RwLock<NodeService>>,
    pub files: Arc<RwLock<FileService>>,
    pub sync: Arc<RwLock<SyncService>>,
    pub peers: Arc<RwLock<PeerService>>,
    pub config: Arc<RwLock<ConfigService>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            node: Arc::new(RwLock::new(NodeService::new())),
            files: Arc::new(RwLock::new(FileService::new())),
            sync: Arc::new(RwLock::new(SyncService::new())),
            peers: Arc::new(RwLock::new(PeerService::new())),
            config: Arc::new(RwLock::new(ConfigService::new())),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
