use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::error::{ArchivistError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub id: String,
    pub address: String,
    pub connected: bool,
    pub latency_ms: Option<u32>,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub connected_at: Option<DateTime<Utc>>,
    pub last_seen: Option<DateTime<Utc>>,
    pub agent_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerStats {
    pub total_peers: u32,
    pub connected_peers: u32,
    pub bytes_sent_total: u64,
    pub bytes_received_total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerList {
    pub peers: Vec<PeerInfo>,
    pub stats: PeerStats,
}

pub struct PeerService {
    peers: Vec<PeerInfo>,
}

impl PeerService {
    pub fn new() -> Self {
        Self {
            peers: Vec::new(),
        }
    }

    pub fn get_peers(&self) -> PeerList {
        let connected = self.peers.iter().filter(|p| p.connected).count() as u32;
        let bytes_sent: u64 = self.peers.iter().map(|p| p.bytes_sent).sum();
        let bytes_recv: u64 = self.peers.iter().map(|p| p.bytes_received).sum();

        PeerList {
            peers: self.peers.clone(),
            stats: PeerStats {
                total_peers: self.peers.len() as u32,
                connected_peers: connected,
                bytes_sent_total: bytes_sent,
                bytes_received_total: bytes_recv,
            },
        }
    }

    pub async fn connect_peer(&mut self, address: &str) -> Result<PeerInfo> {
        // Check if already connected
        if let Some(peer) = self.peers.iter().find(|p| p.address == address) {
            if peer.connected {
                return Ok(peer.clone());
            }
        }

        // TODO: Actually connect to peer via node API
        log::info!("Connecting to peer: {}", address);

        let peer = PeerInfo {
            id: format!("peer-{}", uuid::Uuid::new_v4()),
            address: address.to_string(),
            connected: true,
            latency_ms: Some(50),
            bytes_sent: 0,
            bytes_received: 0,
            connected_at: Some(chrono::Utc::now()),
            last_seen: Some(chrono::Utc::now()),
            agent_version: Some("archivist/0.1.0".to_string()),
        };

        self.peers.push(peer.clone());
        Ok(peer)
    }

    pub async fn disconnect_peer(&mut self, peer_id: &str) -> Result<()> {
        let peer = self.peers.iter_mut()
            .find(|p| p.id == peer_id)
            .ok_or_else(|| ArchivistError::PeerConnectionFailed(
                format!("Peer not found: {}", peer_id)
            ))?;

        peer.connected = false;
        log::info!("Disconnected from peer: {}", peer.address);

        Ok(())
    }

    pub async fn remove_peer(&mut self, peer_id: &str) -> Result<()> {
        let pos = self.peers.iter()
            .position(|p| p.id == peer_id)
            .ok_or_else(|| ArchivistError::PeerConnectionFailed(
                format!("Peer not found: {}", peer_id)
            ))?;

        let peer = self.peers.remove(pos);
        log::info!("Removed peer: {}", peer.address);

        Ok(())
    }

    pub fn get_peer(&self, peer_id: &str) -> Option<&PeerInfo> {
        self.peers.iter().find(|p| p.id == peer_id)
    }
}

impl Default for PeerService {
    fn default() -> Self {
        Self::new()
    }
}
