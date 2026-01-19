use crate::error::Result;
use crate::services::config::AppConfig;
use crate::services::node::NodeConfig;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn get_config(state: State<'_, AppState>) -> Result<AppConfig> {
    let config = state.config.read().await;
    Ok(config.get())
}

#[tauri::command]
pub async fn save_config(state: State<'_, AppState>, config: AppConfig) -> Result<()> {
    // Save to disk via ConfigService
    let mut config_service = state.config.write().await;
    config_service.update(config.clone())?;
    drop(config_service); // Release lock

    // Sync to NodeService in-memory config
    let node_config = NodeConfig::from_node_settings(&config.node);
    let mut node_service = state.node.write().await;
    node_service.set_config(node_config.clone());

    log::info!(
        "Configuration synced: api_port={}, discovery_port={}, listen_port={}, auto_start={}",
        node_config.api_port,
        node_config.discovery_port,
        node_config.listen_port,
        node_config.auto_start
    );

    Ok(())
}

#[tauri::command]
pub async fn reset_config(state: State<'_, AppState>) -> Result<()> {
    // Reset config to defaults
    let mut config_service = state.config.write().await;
    config_service.reset_to_defaults()?;
    let app_config = config_service.get();
    drop(config_service); // Release lock

    // Sync to NodeService in-memory config
    let node_config = NodeConfig::from_node_settings(&app_config.node);
    let mut node_service = state.node.write().await;
    node_service.set_config(node_config);

    log::info!("Configuration reset to defaults and synced to NodeService");

    Ok(())
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
