use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::error::{ArchivistError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchedFolder {
    pub id: String,
    pub path: String,
    pub enabled: bool,
    pub file_count: u32,
    pub total_size_bytes: u64,
    pub last_synced: Option<DateTime<Utc>>,
    pub status: SyncStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SyncStatus {
    Idle,
    Scanning,
    Syncing,
    Error,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncProgress {
    pub folder_id: String,
    pub files_synced: u32,
    pub files_total: u32,
    pub bytes_synced: u64,
    pub bytes_total: u64,
    pub current_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncState {
    pub folders: Vec<WatchedFolder>,
    pub is_syncing: bool,
    pub total_files: u32,
    pub synced_files: u32,
}

pub struct SyncService {
    folders: Vec<WatchedFolder>,
    is_syncing: bool,
}

impl SyncService {
    pub fn new() -> Self {
        Self {
            folders: Vec::new(),
            is_syncing: false,
        }
    }

    pub fn get_state(&self) -> SyncState {
        let total_files: u32 = self.folders.iter().map(|f| f.file_count).sum();

        SyncState {
            folders: self.folders.clone(),
            is_syncing: self.is_syncing,
            total_files,
            synced_files: total_files, // TODO: Track actual sync progress
        }
    }

    pub async fn add_folder(&mut self, path: &str) -> Result<WatchedFolder> {
        let path_buf = std::path::Path::new(path);

        if !path_buf.exists() || !path_buf.is_dir() {
            return Err(ArchivistError::FileNotFound(path.to_string()));
        }

        // Check if already watching
        if self.folders.iter().any(|f| f.path == path) {
            return Err(ArchivistError::SyncError("Folder already being watched".to_string()));
        }

        let folder = WatchedFolder {
            id: Uuid::new_v4().to_string(),
            path: path.to_string(),
            enabled: true,
            file_count: 0,
            total_size_bytes: 0,
            last_synced: None,
            status: SyncStatus::Idle,
        };

        self.folders.push(folder.clone());
        log::info!("Added watched folder: {}", path);

        Ok(folder)
    }

    pub async fn remove_folder(&mut self, folder_id: &str) -> Result<()> {
        let pos = self.folders.iter()
            .position(|f| f.id == folder_id)
            .ok_or_else(|| ArchivistError::FileNotFound(folder_id.to_string()))?;

        let folder = self.folders.remove(pos);
        log::info!("Removed watched folder: {}", folder.path);

        Ok(())
    }

    pub async fn toggle_folder(&mut self, folder_id: &str, enabled: bool) -> Result<()> {
        let folder = self.folders.iter_mut()
            .find(|f| f.id == folder_id)
            .ok_or_else(|| ArchivistError::FileNotFound(folder_id.to_string()))?;

        folder.enabled = enabled;
        folder.status = if enabled { SyncStatus::Idle } else { SyncStatus::Paused };

        log::info!("Folder {} enabled: {}", folder.path, enabled);
        Ok(())
    }

    pub async fn sync_now(&mut self) -> Result<()> {
        if self.is_syncing {
            return Ok(());
        }

        self.is_syncing = true;

        for folder in &mut self.folders {
            if folder.enabled {
                folder.status = SyncStatus::Syncing;
            }
        }

        // TODO: Actually perform sync
        log::info!("Starting sync...");

        Ok(())
    }

    pub async fn pause_sync(&mut self) -> Result<()> {
        self.is_syncing = false;

        for folder in &mut self.folders {
            if matches!(folder.status, SyncStatus::Syncing | SyncStatus::Scanning) {
                folder.status = SyncStatus::Paused;
            }
        }

        log::info!("Sync paused");
        Ok(())
    }
}

impl Default for SyncService {
    fn default() -> Self {
        Self::new()
    }
}
