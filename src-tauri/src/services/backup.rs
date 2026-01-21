//! Backup peer notification service
//!
//! This service handles notifying a designated backup peer about new manifest files.
//! It uses HTTP triggers to notify the backup server's daemon to poll immediately,
//! rather than relying on on-chain persistence features.

use crate::error::{ArchivistError, Result};
use crate::node_api::NodeApiClient;
use crate::services::peers::PeerService;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Service for managing backup peer notifications
pub struct BackupService {
    #[allow(dead_code)]
    api_client: NodeApiClient,
    peer_service: Arc<RwLock<PeerService>>,
}

impl BackupService {
    /// Create a new BackupService
    pub fn new(api_client: NodeApiClient, peer_service: Arc<RwLock<PeerService>>) -> Self {
        Self {
            api_client,
            peer_service,
        }
    }

    /// Notify backup peer to poll for new manifests via HTTP trigger
    ///
    /// This ensures the backup peer is connected via P2P (for file transfer)
    /// and then sends an HTTP trigger to the backup server's daemon to poll
    /// immediately for new manifests.
    ///
    /// # Arguments
    /// * `manifest_cid` - CID of the manifest (for logging)
    /// * `backup_peer_addr` - Multiaddr of backup peer (e.g., /ip4/1.2.3.4/tcp/8070/p2p/...)
    /// * `trigger_port` - Port of backup server's trigger HTTP endpoint (default: 8086)
    pub async fn notify_backup_peer(
        &self,
        manifest_cid: &str,
        backup_peer_addr: &str,
        trigger_port: u16,
    ) -> Result<()> {
        log::info!(
            "Notifying backup peer about manifest CID: {} via HTTP trigger",
            manifest_cid
        );

        // 1. Ensure connected to backup peer via P2P (for file transfer later)
        self.ensure_backup_peer_connected(backup_peer_addr).await?;

        // 2. Extract IP from multiaddr
        let ip = Self::extract_ip_from_multiaddr(backup_peer_addr)?;
        log::info!("Extracted IP from multiaddr: {}", ip);

        // 3. Send HTTP trigger to backup server's daemon
        let trigger_url = format!("http://{}:{}/trigger", ip, trigger_port);
        log::info!("Sending HTTP trigger to: {}", trigger_url);

        let client = reqwest::Client::new();
        let response = client
            .post(&trigger_url)
            .timeout(std::time::Duration::from_secs(10))
            .send()
            .await
            .map_err(|e| {
                ArchivistError::SyncError(format!(
                    "Failed to send trigger to backup peer at {}: {}",
                    trigger_url, e
                ))
            })?;

        if response.status().is_success() {
            log::info!(
                "Successfully triggered backup peer to poll for manifest: {}",
                manifest_cid
            );
            Ok(())
        } else {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            Err(ArchivistError::SyncError(format!(
                "Backup peer trigger failed with status {}: {}",
                status, body
            )))
        }
    }

    /// Extract IP address from multiaddr string
    ///
    /// Parses multiaddr format: /ip4/<ip>/tcp/<port>/p2p/<peer-id>
    /// Returns the IP address portion
    fn extract_ip_from_multiaddr(multiaddr: &str) -> Result<String> {
        // Format: /ip4/1.2.3.4/tcp/8070/p2p/16Uiu2HAm...
        let parts: Vec<&str> = multiaddr.split('/').collect();

        // Find ip4 or ip6 index
        for (i, part) in parts.iter().enumerate() {
            if (*part == "ip4" || *part == "ip6") && i + 1 < parts.len() {
                return Ok(parts[i + 1].to_string());
            }
        }

        // Also handle DNS multiaddr: /dns4/hostname/tcp/...
        for (i, part) in parts.iter().enumerate() {
            if (*part == "dns4" || *part == "dns6" || *part == "dns") && i + 1 < parts.len() {
                return Ok(parts[i + 1].to_string());
            }
        }

        Err(ArchivistError::ConfigError(format!(
            "Could not extract IP from multiaddr: {}. Expected format: /ip4/<ip>/tcp/<port>/p2p/<peer-id>",
            multiaddr
        )))
    }

    /// Connect to backup peer if not already connected
    async fn ensure_backup_peer_connected(&self, peer_addr: &str) -> Result<()> {
        log::info!("Ensuring backup peer is connected: {}", peer_addr);

        let mut peers = self.peer_service.write().await;

        // Try to connect (this is idempotent - if already connected, it succeeds)
        match peers.connect_peer(peer_addr).await {
            Ok(_) => {
                log::info!("Backup peer connected successfully");
                Ok(())
            }
            Err(e) => {
                log::error!("Failed to connect to backup peer: {}", e);
                Err(ArchivistError::PeerConnectionFailed(format!(
                    "Failed to connect to backup peer: {}",
                    e
                )))
            }
        }
    }

    /// Get node API client reference (for manifest verification)
    #[allow(dead_code)]
    pub fn api_client(&self) -> &NodeApiClient {
        &self.api_client
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_ip_from_multiaddr() {
        // Test ip4 format
        let result = BackupService::extract_ip_from_multiaddr(
            "/ip4/192.168.1.100/tcp/8070/p2p/16Uiu2HAmXYZ",
        );
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "192.168.1.100");

        // Test with public IP
        let result =
            BackupService::extract_ip_from_multiaddr("/ip4/203.0.113.50/tcp/8070/p2p/16Uiu2HAmABC");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "203.0.113.50");

        // Test dns4 format
        let result = BackupService::extract_ip_from_multiaddr(
            "/dns4/backup.example.com/tcp/8070/p2p/16Uiu2HAmXYZ",
        );
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "backup.example.com");

        // Test invalid format
        let result = BackupService::extract_ip_from_multiaddr("invalid-multiaddr");
        assert!(result.is_err());
    }
}
