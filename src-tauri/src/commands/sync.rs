use tauri::State;
use crate::error::Result;
use crate::state::AppState;
use crate::services::sync::{SyncState, WatchedFolder};

#[tauri::command]
pub async fn get_sync_status(state: State<'_, AppState>) -> Result<SyncState> {
    let sync = state.sync.read().await;
    Ok(sync.get_state())
}

#[tauri::command]
pub async fn add_watch_folder(state: State<'_, AppState>, path: String) -> Result<WatchedFolder> {
    let mut sync = state.sync.write().await;
    sync.add_folder(&path).await
}

#[tauri::command]
pub async fn remove_watch_folder(state: State<'_, AppState>, folder_id: String) -> Result<()> {
    let mut sync = state.sync.write().await;
    sync.remove_folder(&folder_id).await
}

#[tauri::command]
pub async fn toggle_watch_folder(
    state: State<'_, AppState>,
    folder_id: String,
    enabled: bool,
) -> Result<()> {
    let mut sync = state.sync.write().await;
    sync.toggle_folder(&folder_id, enabled).await
}

#[tauri::command]
pub async fn sync_now(state: State<'_, AppState>) -> Result<()> {
    let mut sync = state.sync.write().await;
    sync.sync_now().await
}

#[tauri::command]
pub async fn pause_sync(state: State<'_, AppState>) -> Result<()> {
    let mut sync = state.sync.write().await;
    sync.pause_sync().await
}
