use tauri::State;
use crate::error::Result;
use crate::state::AppState;
use crate::services::config::AppConfig;

#[tauri::command]
pub async fn get_config(state: State<'_, AppState>) -> Result<AppConfig> {
    let config = state.config.read().await;
    Ok(config.get())
}

#[tauri::command]
pub async fn save_config(state: State<'_, AppState>, config: AppConfig) -> Result<()> {
    let mut config_service = state.config.write().await;
    config_service.update(config)
}

#[tauri::command]
pub async fn reset_config(state: State<'_, AppState>) -> Result<()> {
    let mut config = state.config.write().await;
    config.reset_to_defaults()
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
pub fn get_arch() -> String {
    std::env::consts::ARCH.to_string()
}
