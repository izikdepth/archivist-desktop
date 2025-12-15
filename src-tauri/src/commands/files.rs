use tauri::State;
use crate::error::Result;
use crate::state::AppState;
use crate::services::files::{FileInfo, FileList};

#[tauri::command]
pub async fn list_files(state: State<'_, AppState>) -> Result<FileList> {
    let files = state.files.read().await;
    files.list_files().await
}

#[tauri::command]
pub async fn upload_file(state: State<'_, AppState>, path: String) -> Result<FileInfo> {
    let mut files = state.files.write().await;
    files.upload_file(&path).await
}

#[tauri::command]
pub async fn download_file(
    state: State<'_, AppState>,
    file_id: String,
    destination: String,
) -> Result<()> {
    let files = state.files.read().await;
    files.download_file(&file_id, &destination).await
}

#[tauri::command]
pub async fn delete_file(state: State<'_, AppState>, file_id: String) -> Result<()> {
    let mut files = state.files.write().await;
    files.delete_file(&file_id).await
}

#[tauri::command]
pub async fn pin_file(
    state: State<'_, AppState>,
    file_id: String,
    pinned: bool,
) -> Result<()> {
    let mut files = state.files.write().await;
    files.pin_file(&file_id, pinned).await
}
