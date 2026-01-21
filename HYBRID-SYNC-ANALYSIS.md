# Hybrid Sync Feature Analysis

## Overview

This document analyzes the current state of the backup/sync feature to identify what's working, what's broken, and what needs to be completed.

## Intended Architecture (Hybrid Solution)

The hybrid sync solution is designed to work **without** on-chain marketplace/persistence features. Instead, it uses:

1. **HTTP-based manifest discovery** (Machine A exposes manifests via HTTP server)
2. **P2P file transfer** (Machine B downloads files via libp2p network)

### Flow Diagram

```
Machine A (Source Peer)                    Machine B (Backup Server)
========================                   =========================

1. File Watcher detects changes
2. Upload files to local node → CIDs
3. Generate manifest JSON
4. Upload manifest to local node → manifest CID
5. Register manifest with ManifestRegistry
6. ManifestServer exposes /manifests endpoint

        ←── HTTP Poll (every 30s) ──────── 7. BackupDaemon polls ManifestServer
        ─── ManifestDiscoveryResponse ──→  8. Receives manifest CIDs
                                           9. Download manifest via P2P (/data/{cid}/network)
                                           10. Parse manifest, get file CIDs
                                           11. Download each file via P2P
                                           12. Update processed state
```

## Current Implementation Status

### Machine A Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| SyncService | `services/sync.rs` | ✅ Working | Watches folders, uploads files, generates manifests |
| ManifestRegistry | `services/manifest_server.rs` | ✅ Implemented | Stores manifest CIDs for discovery |
| ManifestServer | `services/manifest_server.rs` | ✅ Implemented | HTTP server on port 8085 |
| BackupService | `services/backup.rs` | ✅ FIXED | Now uses HTTP trigger to Machine B (port 8086) |

### Machine B Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| BackupDaemon | `services/backup_daemon.rs` | ✅ Implemented | Polls source peers, downloads manifests |
| ManifestClient | `services/manifest_server.rs` | ✅ Implemented | HTTP client to query ManifestServer |
| Source Peer Config | `services/config.rs` | ✅ Implemented | Stores source peer URLs |
| HTTP Trigger Server | `services/backup_daemon.rs` | ✅ Implemented | Receives triggers on port 8086 |

## The "Backup Now" Button - FIXED

### Current (Working) Flow

When user clicks "Backup Now" on Machine A:

```
UI: Backup Now clicked
    ↓
commands/sync.rs: notify_backup_peer()
    ↓
1. Verify manifest is registered in ManifestRegistry ✅
    ↓
2. Get backup peer IP from multiaddr config ✅
    ↓
3. Get trigger_port from config (default: 8086) ✅
    ↓
BackupService.notify_backup_peer(manifest_cid, backup_peer_addr, trigger_port)
    ↓
1. Connect to backup peer via P2P (for file transfer) ✅
2. Extract IP from multiaddr ✅
3. HTTP POST to http://<ip>:8086/trigger ✅
    ↓
Machine B: BackupDaemon receives trigger
    ↓
Machine B: Immediately polls all source peers for manifests ✅
```

### Implementation Details

The fix replaced the broken `request_storage()` call with a lightweight HTTP trigger:

**Machine A (Sender)**:
- `BackupService.notify_backup_peer()` now extracts IP from multiaddr
- Sends HTTP POST to Machine B's trigger endpoint
- Trigger port configurable via `sync.backup_trigger_port` (default: 8086)

**Machine B (Receiver)**:
- `BackupDaemon.start_trigger_server()` listens on port 8086
- `POST /trigger` endpoint signals immediate poll
- Uses `tokio::select!` to wake on trigger OR interval timer

## Correct Flow Summary

### Machine A "Backup Now" Flow

```
UI: Backup Now clicked
    ↓
1. Verify manifest is registered with ManifestRegistry ✅
    ↓
2. Connect to backup peer via P2P (for file transfer later) ✅
    ↓
3. Send HTTP trigger to Machine B's daemon ✅
    ↓
4. Machine B immediately polls and discovers manifest ✅
```

### Correct Flow for Machine B Discovery

```
BackupDaemon loop (every 30 seconds):
    ↓
1. Poll each source peer's ManifestServer
   GET http://<source-ip>:8085/manifests
    ↓
2. Receive ManifestDiscoveryResponse with manifest CIDs
    ↓
3. For each new manifest CID:
   a. Download manifest via P2P: GET /data/{cid}/network
   b. Parse manifest JSON
   c. Download each file CID via P2P
   d. Mark as processed
```

## Files Changed

### 1. `services/backup.rs` - ✅ REWRITTEN

**Before**: Used `request_storage()` which requires on-chain persistence.

**After**: Now uses HTTP trigger to notify Machine B:
- Extracts IP from multiaddr (supports ip4/ip6/dns4/dns6)
- Sends HTTP POST to `http://<ip>:<trigger_port>/trigger`
- Still connects via P2P for later file transfer

### 2. `commands/sync.rs` - ✅ UPDATED

The `notify_backup_peer` command now:
- Verifies manifest is registered in ManifestRegistry
- Gets trigger_port from config (default: 8086)
- Passes trigger_port to BackupService

### 3. `services/backup_daemon.rs` - ✅ ADDED HTTP TRIGGER SERVER

Added HTTP trigger server functionality:
- `start_trigger_server()` - warp server on port 8086
- `POST /trigger` - signals immediate poll
- `GET /health` - health check endpoint
- Main loop uses `tokio::select!` to wake on trigger OR interval

### 4. `services/config.rs` - ✅ UPDATED

Added configuration fields:
- `SyncSettings.backup_trigger_port` - Machine A's config for trigger port (default: 8086)
- `BackupServerSettings.trigger_port` - Machine B's trigger server port (default: 8086)

### UI Settings

Current settings now properly support hybrid sync:
- **Machine A**: "Backup Peer Address" (multiaddr) - used for P2P + trigger
- **Machine B**: ManifestServer enabled (port 8085), Trigger server on port 8086

## Configuration Requirements

### Machine A (Source)

```toml
[manifest_server]
enabled = true
port = 8085
whitelisted_ips = ["<Machine-B-IP>"]  # Security: Only allow backup server
```

### Machine B (Backup Server)

```toml
[backup_server]
enabled = true
poll_interval_secs = 30
max_concurrent_downloads = 3

[[backup_server.source_peers]]
name = "My Desktop"
manifest_server_url = "http://<Machine-A-IP>:8085"
peer_id = "16Uiu2HAm..."  # For P2P file downloads
```

## Network Requirements

| Direction | Protocol | Port | Purpose |
|-----------|----------|------|---------|
| A → B | TCP | 8070 | P2P file transfer (libp2p) |
| B → A | TCP | 8085 | HTTP manifest discovery |
| Both | UDP | 8090 | P2P peer discovery (DHT) |

**Note**: Machine B needs to be able to reach Machine A on port 8085 (HTTP) in addition to the P2P ports.

## Implementation Complete ✅

Both options have been implemented:
- **Option 2**: Manifest verification before triggering
- **Option 3**: HTTP trigger endpoint on Machine B

### What Was Done

1. **BackupService rewritten** (`services/backup.rs`):
   - Extracts IP from multiaddr format
   - Sends HTTP POST to `http://<ip>:8086/trigger`
   - Maintains P2P connection for file transfer

2. **BackupDaemon extended** (`services/backup_daemon.rs`):
   - `start_trigger_server()` - warp HTTP server on port 8086
   - `POST /trigger` - signals immediate poll via channel
   - `GET /health` - health check endpoint
   - Main loop uses `tokio::select!` to wake on trigger OR timer

3. **Config updated** (`services/config.rs`):
   - `SyncSettings.backup_trigger_port` - default 8086
   - `BackupServerSettings.trigger_port` - default 8086

4. **Command updated** (`commands/sync.rs`):
   - Verifies manifest is in ManifestRegistry
   - Gets trigger_port from config
   - Passes to BackupService

## Verification Steps

### To Test Current State:

1. **Machine A**: Check if ManifestServer is running
   ```bash
   curl http://localhost:8085/manifests
   ```
   Should return JSON with manifest list (or empty if none registered)

2. **Machine A**: Check if manifest is registered after sync
   - Add files to watched folder
   - Wait for threshold (10 files by default)
   - Check ManifestServer again

3. **Machine B**: Check BackupDaemon configuration
   - Verify source_peers is configured with Machine A's URL
   - Check daemon state file: `~/.local/share/archivist/backup-daemon-state.json`

### Expected Behavior Once Fixed:

1. Machine A syncs files and generates manifest
2. Manifest is registered with ManifestRegistry
3. ManifestServer exposes manifest CID via HTTP
4. Machine B's BackupDaemon polls Machine A every 30 seconds
5. Machine B discovers new manifest CID
6. Machine B downloads manifest and files via P2P
7. Machine B marks manifest as processed

## Summary

| Issue | Root Cause | Status |
|-------|------------|--------|
| "Backup Now" fails with 503 | Used on-chain `/storage/request` endpoint | ✅ FIXED - Uses HTTP trigger to port 8086 |
| Machine B doesn't discover manifests | Source peers not configured | Configure `source_peers` with Machine A's URL |
| ManifestServer not running | May be disabled in config | Enable in Settings |

## Network Requirements (Updated)

| Direction | Protocol | Port | Purpose |
|-----------|----------|------|---------|
| A → B | TCP | 8070 | P2P file transfer (libp2p) |
| B → A | TCP | 8085 | HTTP manifest discovery |
| A → B | TCP | 8086 | HTTP trigger for immediate poll |
| Both | UDP | 8090 | P2P peer discovery (DHT) |

**Note**: Machine A needs to reach Machine B on port 8086 to send trigger notifications.
