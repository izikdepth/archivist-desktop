use crate::error::Result;
use crate::services::node::{NodeConfig, NodeStatus};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticInfo {
    pub api_reachable: bool,
    pub api_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_id: Option<String>,
    pub address_count: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[tauri::command]
pub async fn start_node(app_handle: AppHandle, state: State<'_, AppState>) -> Result<NodeStatus> {
    let mut node = state.node.write().await;
    node.start(&app_handle).await?;

    // Wait for the node's REST API to be ready (up to 30 seconds)
    // The node takes several seconds to initialize (NAT detection, etc.)
    for _ in 0..30 {
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        if node.health_check().await.unwrap_or(false) {
            break;
        }
    }

    Ok(node.get_status())
}

#[tauri::command]
pub async fn stop_node(state: State<'_, AppState>) -> Result<NodeStatus> {
    let mut node = state.node.write().await;
    node.stop().await?;
    Ok(node.get_status())
}

#[tauri::command]
pub async fn restart_node(app_handle: AppHandle, state: State<'_, AppState>) -> Result<NodeStatus> {
    let mut node = state.node.write().await;
    node.restart(&app_handle).await?;
    Ok(node.get_status())
}

#[tauri::command]
pub async fn get_node_status(state: State<'_, AppState>) -> Result<NodeStatus> {
    // Try to refresh peer info if node is running
    let mut node = state.node.write().await;
    let _ = node.health_check().await;
    Ok(node.get_status())
}

#[tauri::command]
pub async fn get_node_config(state: State<'_, AppState>) -> Result<NodeConfig> {
    let node = state.node.read().await;
    Ok(node.get_config())
}

#[tauri::command]
pub async fn set_node_config(state: State<'_, AppState>, config: NodeConfig) -> Result<()> {
    let mut node = state.node.write().await;
    node.set_config(config);
    Ok(())
}

#[tauri::command]
pub async fn health_check_node(state: State<'_, AppState>) -> Result<bool> {
    let mut node = state.node.write().await;
    node.health_check().await
}

#[tauri::command]
pub async fn run_node_diagnostics(state: State<'_, AppState>) -> Result<DiagnosticInfo> {
    use crate::node_api::NodeApiClient;

    let node = state.node.read().await;
    let config = node.get_config();
    let api_url = format!("http://127.0.0.1:{}", config.api_port);

    // Create an API client for diagnostics
    let client = NodeApiClient::new(config.api_port);

    // Try to get node info
    match client.get_info().await {
        Ok(info) => {
            let peer_id = info.local_node.as_ref().map(|n| n.peer_id.clone());
            let address_count = info.local_node.as_ref().map(|n| n.addrs.len()).unwrap_or(0);

            Ok(DiagnosticInfo {
                api_reachable: true,
                api_url,
                node_version: Some(info.version),
                peer_id,
                address_count,
                error: None,
            })
        }
        Err(e) => Ok(DiagnosticInfo {
            api_reachable: false,
            api_url,
            node_version: None,
            peer_id: None,
            address_count: 0,
            error: Some(format!("Failed to connect to node API: {}", e)),
        }),
    }
}
