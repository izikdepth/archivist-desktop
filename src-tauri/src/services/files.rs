use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::error::{ArchivistError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub id: String,
    pub name: String,
    pub size_bytes: u64,
    pub content_hash: String,
    pub mime_type: Option<String>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub is_pinned: bool,
    pub peer_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadProgress {
    pub file_id: String,
    pub bytes_uploaded: u64,
    pub total_bytes: u64,
    pub status: UploadStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UploadStatus {
    Pending,
    Uploading,
    Processing,
    Complete,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileList {
    pub files: Vec<FileInfo>,
    pub total_count: u64,
    pub total_size_bytes: u64,
}

pub struct FileService {
    files: Vec<FileInfo>,
}

impl FileService {
    pub fn new() -> Self {
        Self {
            files: Vec::new(),
        }
    }

    pub async fn list_files(&self) -> Result<FileList> {
        let total_size: u64 = self.files.iter().map(|f| f.size_bytes).sum();

        Ok(FileList {
            files: self.files.clone(),
            total_count: self.files.len() as u64,
            total_size_bytes: total_size,
        })
    }

    pub async fn upload_file(&mut self, path: &str) -> Result<FileInfo> {
        let path = std::path::Path::new(path);

        if !path.exists() {
            return Err(ArchivistError::FileNotFound(path.to_string_lossy().to_string()));
        }

        let metadata = std::fs::metadata(path)
            .map_err(|e| ArchivistError::FileOperationFailed(e.to_string()))?;

        let file_info = FileInfo {
            id: Uuid::new_v4().to_string(),
            name: path.file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string()),
            size_bytes: metadata.len(),
            content_hash: String::new(), // TODO: Calculate hash
            mime_type: mime_guess::from_path(path)
                .first()
                .map(|m| m.to_string()),
            created_at: Utc::now(),
            modified_at: Utc::now(),
            is_pinned: true,
            peer_count: 0,
        };

        self.files.push(file_info.clone());

        log::info!("Uploaded file: {}", file_info.name);
        Ok(file_info)
    }

    pub async fn download_file(&self, file_id: &str, destination: &str) -> Result<()> {
        let file = self.files.iter()
            .find(|f| f.id == file_id)
            .ok_or_else(|| ArchivistError::FileNotFound(file_id.to_string()))?;

        // TODO: Actually download from network
        log::info!("Downloading file {} to {}", file.name, destination);

        Ok(())
    }

    pub async fn delete_file(&mut self, file_id: &str) -> Result<()> {
        let pos = self.files.iter()
            .position(|f| f.id == file_id)
            .ok_or_else(|| ArchivistError::FileNotFound(file_id.to_string()))?;

        let file = self.files.remove(pos);
        log::info!("Deleted file: {}", file.name);

        Ok(())
    }

    pub async fn pin_file(&mut self, file_id: &str, pinned: bool) -> Result<()> {
        let file = self.files.iter_mut()
            .find(|f| f.id == file_id)
            .ok_or_else(|| ArchivistError::FileNotFound(file_id.to_string()))?;

        file.is_pinned = pinned;
        log::info!("File {} pinned: {}", file.name, pinned);

        Ok(())
    }
}

impl Default for FileService {
    fn default() -> Self {
        Self::new()
    }
}
