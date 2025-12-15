use serde::{Deserialize, Serialize};
use std::process::Child;
use crate::error::{ArchivistError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeStatus {
    pub running: bool,
    pub pid: Option<u32>,
    pub version: Option<String>,
    pub uptime_seconds: Option<u64>,
    pub peer_count: u32,
    pub storage_used_bytes: u64,
    pub storage_available_bytes: u64,
}

impl Default for NodeStatus {
    fn default() -> Self {
        Self {
            running: false,
            pid: None,
            version: None,
            uptime_seconds: None,
            peer_count: 0,
            storage_used_bytes: 0,
            storage_available_bytes: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    pub data_dir: String,
    pub api_port: u16,
    pub p2p_port: u16,
    pub max_storage_bytes: u64,
}

impl Default for NodeConfig {
    fn default() -> Self {
        let data_dir = dirs::data_dir()
            .map(|p| p.join("archivist"))
            .unwrap_or_else(|| std::path::PathBuf::from(".archivist"))
            .to_string_lossy()
            .to_string();

        Self {
            data_dir,
            api_port: 5001,
            p2p_port: 4001,
            max_storage_bytes: 10 * 1024 * 1024 * 1024, // 10 GB default
        }
    }
}

pub struct NodeService {
    status: NodeStatus,
    config: NodeConfig,
    process: Option<Child>,
}

impl NodeService {
    pub fn new() -> Self {
        Self {
            status: NodeStatus::default(),
            config: NodeConfig::default(),
            process: None,
        }
    }

    pub async fn start(&mut self) -> Result<()> {
        if self.status.running {
            return Err(ArchivistError::NodeAlreadyRunning);
        }

        // TODO: Start the sidecar node process
        // For now, just simulate starting
        log::info!("Starting Archivist node...");

        self.status.running = true;
        self.status.uptime_seconds = Some(0);

        Ok(())
    }

    pub async fn stop(&mut self) -> Result<()> {
        if !self.status.running {
            return Err(ArchivistError::NodeNotRunning);
        }

        if let Some(mut process) = self.process.take() {
            process.kill().map_err(|e| ArchivistError::NodeStartFailed(e.to_string()))?;
        }

        self.status.running = false;
        self.status.pid = None;
        self.status.uptime_seconds = None;

        log::info!("Archivist node stopped");
        Ok(())
    }

    pub fn get_status(&self) -> NodeStatus {
        self.status.clone()
    }

    pub fn get_config(&self) -> NodeConfig {
        self.config.clone()
    }

    pub fn set_config(&mut self, config: NodeConfig) {
        self.config = config;
    }
}

impl Default for NodeService {
    fn default() -> Self {
        Self::new()
    }
}
