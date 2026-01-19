use std::sync::Arc;
use tokio::sync::RwLock;

use crate::services::node::NodeConfig;
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
        // Load persisted configuration
        let config_service = ConfigService::new();
        let app_config = config_service.get();

        // Create NodeConfig from persisted settings
        let node_config = NodeConfig::from_node_settings(&app_config.node);

        log::info!(
            "Initializing NodeService with config: api_port={}, discovery_port={}, listen_port={}, data_dir={}",
            node_config.api_port,
            node_config.discovery_port,
            node_config.listen_port,
            node_config.data_dir
        );

        Self {
            node: Arc::new(RwLock::new(NodeService::with_config(node_config))),
            files: Arc::new(RwLock::new(FileService::new())),
            sync: Arc::new(RwLock::new(SyncService::new())),
            peers: Arc::new(RwLock::new(PeerService::new())),
            config: Arc::new(RwLock::new(config_service)),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
