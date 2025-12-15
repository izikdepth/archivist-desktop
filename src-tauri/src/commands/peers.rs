use tauri::State;
use crate::error::Result;
use crate::state::AppState;
use crate::services::peers::{PeerInfo, PeerList};

#[tauri::command]
pub async fn get_peers(state: State<'_, AppState>) -> Result<PeerList> {
    let peers = state.peers.read().await;
    peers.get_peers().await
}

#[tauri::command]
pub async fn connect_peer(state: State<'_, AppState>, address: String) -> Result<PeerInfo> {
    let mut peers = state.peers.write().await;
    peers.connect_peer(&address).await
}

#[tauri::command]
pub async fn disconnect_peer(state: State<'_, AppState>, peer_id: String) -> Result<()> {
    let mut peers = state.peers.write().await;
    peers.disconnect_peer(&peer_id).await
}

#[tauri::command]
pub async fn remove_peer(state: State<'_, AppState>, peer_id: String) -> Result<()> {
    let mut peers = state.peers.write().await;
    peers.remove_peer(&peer_id).await
}
