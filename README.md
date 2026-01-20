# Archivist Desktop

A cross-platform desktop application for decentralized file storage, built with Tauri v2, React, and TypeScript.

## Features

- **File Management**: Upload, download, and manage files on the decentralized network
- **Folder Sync**: Watch folders and automatically sync changes to the network
- **Peer Network**: Connect with peers, share SPR records, and monitor network stats
- **Node Logs**: Built-in real-time log viewer with auto-refresh and auto-scroll
- **System Tray**: Runs in the background with quick access from the system tray
- **Auto-Update**: Automatic updates from GitHub releases

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust + Tauri v2
- **Node**: archivist-node sidecar for P2P networking

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Archivist Desktop (Tauri App)               │
│                                                          │
│  ┌────────────────────┐      ┌────────────────────────┐ │
│  │  React Frontend    │      │   Rust Backend         │ │
│  │  (Webview)         │◄────►│   (Native Process)     │ │
│  │                    │ IPC  │                        │ │
│  │ • Dashboard        │      │ • Node Management      │ │
│  │ • Files            │      │ • File Operations      │ │
│  │ • Sync             │      │ • Folder Watching      │ │
│  │ • Peers            │      │ • Peer Management      │ │
│  │ • Logs             │      │ • Configuration        │ │
│  │ • Settings         │      │ • HTTP Client          │ │
│  └────────────────────┘      └───────────┬────────────┘ │
│                                          │              │
└──────────────────────────────────────────┼──────────────┘
                                           │
                                  HTTP (localhost:8080)
                                           │
┌──────────────────────────────────────────▼──────────────┐
│           archivist-node Sidecar (Separate Process)     │
│                                                          │
│  • REST API (port 8080)                                 │
│  • File Storage & CID Management                        │
│  • P2P Network (libp2p)                                 │
│  • Discovery (DHT/mDNS, UDP port 8090)                  │
│  • Listen (TCP port 8070)                               │
│  • Peer Connections                                     │
│  • Data Replication                                     │
└──────────────────────────────────────────┬──────────────┘
                                           │
                                   P2P (encrypted)
                                           │
                              ┌────────────▼────────────┐
                              │   External Peers        │
                              │   (libp2p network)      │
                              └─────────────────────────┘
```

### How It Works

1. **User Interface**: React frontend provides the UI (Dashboard, Files, Sync, Peers, Logs, Settings)
2. **Tauri Backend**: Rust backend handles:
   - Starting/stopping the archivist-node sidecar process
   - Managing file system operations (uploads, downloads, folder watching)
   - Proxying requests to the node's REST API
   - Persisting application configuration
3. **Archivist Node**: Standalone sidecar process that:
   - Exposes REST API on localhost:8080
   - Manages content-addressed storage (CIDs)
   - Handles P2P networking via libp2p
   - Discovers peers via DHT/mDNS on UDP port 8090
   - Accepts peer connections on TCP port 8070
   - Replicates data across the network
4. **P2P Network**: Encrypted libp2p connections between peers for file transfer and discovery

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Rust 1.77+
- Platform-specific dependencies for Tauri

### Setup

```bash
# Quick setup (install deps + download sidecar binary)
pnpm setup

# Or step by step:
pnpm install
pnpm download-sidecar  # Downloads archivist-node for your platform

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

### Cross-Platform Builds

To download sidecar binaries for other platforms (cross-compilation):

```bash
bash scripts/download-sidecar.sh x86_64-apple-darwin      # macOS Intel
bash scripts/download-sidecar.sh aarch64-apple-darwin     # macOS Apple Silicon
bash scripts/download-sidecar.sh x86_64-pc-windows-msvc   # Windows
```

### Project Structure

```
archivist-desktop/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   └── styles/             # CSS styles
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── services/       # Business logic services
│   │   ├── node_api.rs     # Node HTTP client
│   │   └── lib.rs          # App entry point
│   └── sidecars/           # archivist-node binary
└── public/                 # Static assets
```

## Configuration

Settings are stored in:
- **Linux**: `~/.config/archivist/config.toml`
- **macOS**: `~/Library/Application Support/archivist/config.toml`
- **Windows**: `%APPDATA%\archivist\config.toml`

## Network Setup

The application uses **two separate ports** for P2P networking:
- **Discovery Port** (UDP, default: 8090): For finding peers via DHT/mDNS
- **Listen Port** (TCP, default: 8070): For P2P connections and file transfers

You need to open both ports in your firewall for full P2P functionality.

### Linux (UFW)

```bash
sudo ufw allow 8090/udp  # Discovery
sudo ufw allow 8070/tcp  # P2P connections
```

### macOS

The firewall will prompt you to allow connections when the app first runs. Click "Allow" to enable P2P connectivity.

### Windows

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Archivist Discovery" dir=in action=allow protocol=udp localport=8090
netsh advfirewall firewall add rule name="Archivist P2P" dir=in action=allow protocol=tcp localport=8070
```

If you change the ports in Settings → Advanced, update your firewall rules accordingly.

## Backup Server Flow

The backup server daemon enables automatic continuous backup from source peers to a designated backup server. Here's how the complete flow works:

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MACHINE A (Source Peer)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐                                                  │
│  │  Watch Folder    │  1. User adds files                              │
│  │  ~/Documents/    │────────────────┐                                 │
│  └──────────────────┘                │                                 │
│           │                           ▼                                 │
│           │ 2. File watcher      ┌────────────────┐                    │
│           │    detects changes   │  Sync Service  │                    │
│           └─────────────────────►│  (Desktop App) │                    │
│                                  └────────┬───────┘                    │
│                                           │ 3. Upload files             │
│                                           │    (POST /data)             │
│                                           ▼                             │
│                                  ┌────────────────┐                    │
│                                  │ archivist-node │                    │
│                                  │  (Port 8080)   │                    │
│                                  └────────┬───────┘                    │
│                                           │                             │
│                                           │ 4. Store files as CIDs      │
│                                           │    file1.txt → zdj7W...    │
│                                           │    file2.pdf → zDvZR...    │
│                                           │                             │
│  ┌──────────────────────────────┐        │                             │
│  │ After 10 file changes:       │◄───────┘ 5. Threshold reached        │
│  │                              │                                       │
│  │ Generate manifest file:      │                                       │
│  │ .archivist-manifest-{id}.json│                                       │
│  │                              │                                       │
│  │ {                            │                                       │
│  │   "source_peer_id": "16Uiu..│                                       │
│  │   "sequence_number": 1,      │                                       │
│  │   "files": [                 │                                       │
│  │     {"path": "file1.txt",    │                                       │
│  │      "cid": "zdj7W..."},     │                                       │
│  │     {"path": "file2.pdf",    │                                       │
│  │      "cid": "zDvZR..."}      │                                       │
│  │   ]                          │                                       │
│  │ }                            │                                       │
│  └──────────────┬───────────────┘                                       │
│                 │                                                       │
│                 │ 6. Upload manifest                                    │
│                 │    (POST /data)                                       │
│                 ▼                                                       │
│        ┌────────────────┐                                              │
│        │ archivist-node │                                              │
│        │  Manifest CID: │                                              │
│        │  zDvZRwzm...   │                                              │
│        └────────┬───────┘                                              │
│                 │                                                       │
│                 │ 7. Create storage request                            │
│                 │    for backup peer                                   │
│                 │                                                       │
└─────────────────┼───────────────────────────────────────────────────────┘
                  │
                  │ 8. P2P Network
                  │    (libp2p encrypted)
                  │
┌─────────────────▼───────────────────────────────────────────────────────┐
│                        MACHINE B (Backup Server)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────┐                                │
│  │      Backup Daemon (Background)    │                                │
│  │   ┌────────────────────────────┐   │                                │
│  │   │ Every 30 seconds:          │   │  9. Poll for manifests         │
│  │   │ GET /data                  │───┼─────────────┐                  │
│  │   │ Filter: *.manifest*.json   │   │             │                  │
│  │   └────────────────────────────┘   │             │                  │
│  └────────────────┬───────────────────┘             │                  │
│                   │                                  ▼                  │
│                   │ 10. Manifest     ┌───────────────────────┐         │
│                   │     discovered   │   archivist-node      │         │
│                   │                  │   (Port 8080)         │         │
│                   │                  │                       │         │
│                   │                  │ Files stored:         │         │
│                   │                  │ • manifest.json       │         │
│                   │                  │ • file1.txt (zdj7W)   │         │
│                   │                  │ • file2.pdf (zDvZR)   │         │
│                   │                  └───────────────────────┘         │
│                   │                                                     │
│                   │ 11. Parse manifest                                 │
│                   │     Extract CID list                               │
│                   │                                                     │
│                   ▼                                                     │
│  ┌────────────────────────────────┐                                    │
│  │  Download missing files        │  12. For each CID:                 │
│  │  (3 concurrent downloads)      │      POST /data/{cid}/network      │
│  │                                │                                    │
│  │  zdj7W... ▓▓▓▓▓▓▓▓░░ 80%      │      (Download from network        │
│  │  zDvZR... ▓▓▓▓▓▓▓▓▓▓ 100%     │       via P2P from Machine A)      │
│  │  zDpuA... ▓░░░░░░░░░ 10%      │                                    │
│  └────────────────┬───────────────┘                                    │
│                   │                                                     │
│                   │ 13. Update state                                   │
│                   ▼                                                     │
│  ┌────────────────────────────────┐                                    │
│  │  backup-daemon-state.json      │                                    │
│  │                                │                                    │
│  │  {                             │                                    │
│  │    "processed_manifests": {    │                                    │
│  │      "zDvZRwzm...": {          │                                    │
│  │        "source_peer_id": "...", │                                    │
│  │        "sequence_number": 1,   │                                    │
│  │        "file_count": 15,       │                                    │
│  │        "total_size_bytes": ... │                                    │
│  │      }                          │                                    │
│  │    },                           │                                    │
│  │    "stats": {                   │                                    │
│  │      "total_manifests": 1,     │                                    │
│  │      "total_files": 15,        │                                    │
│  │      "total_bytes": ...        │                                    │
│  │    }                            │                                    │
│  │  }                             │                                    │
│  └────────────────────────────────┘                                    │
│                                                                         │
│  ┌────────────────────────────────┐                                    │
│  │  Backup Server Dashboard       │  14. User views status             │
│  │  (http://localhost:1420)       │                                    │
│  │                                │                                    │
│  │  📊 Manifests Processed: 1     │                                    │
│  │  📁 Files Downloaded: 15       │                                    │
│  │  💾 Total Size: 2.4 MB         │                                    │
│  │                                │                                    │
│  │  ✅ Processed Manifests        │                                    │
│  │  Source: 16Uiu2HAm... (Seq #1) │                                    │
│  │  Files: 15 | Size: 2.4 MB      │                                    │
│  └────────────────────────────────┘                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

**Machine A (Source Peer)**:
1. User adds files to watched folder
2. File watcher detects changes (create/modify/delete)
3. Sync service uploads files to local archivist-node via POST `/data`
4. Node stores files and returns CIDs (content identifiers)
5. After 10 file changes (configurable threshold), manifest is generated
6. Manifest file created: `.archivist-manifest-{peer_id}.json` containing:
   - Source peer ID
   - Sequence number (increments with each update)
   - List of all files with their CIDs
   - Deleted files (tombstones for cleanup)
7. Manifest uploaded to local node, gets its own CID
8. Storage request created for backup peer (if configured)

**P2P Network**:
- Manifest propagates through libp2p network
- Peers exchange data using encrypted connections
- Content-addressed storage ensures data integrity

**Machine B (Backup Server)**:
9. Backup daemon polls `/data` endpoint every 30 seconds
10. Discovers new manifest files (filter: `*.manifest*.json`)
11. Downloads and parses manifest to extract CID list
12. For each CID in manifest:
    - Check if already stored locally
    - If missing: POST `/data/{cid}/network` to download from network
    - Downloads happen concurrently (3 at a time by default)
13. Updates daemon state file with:
    - Processed manifests
    - Statistics (files downloaded, bytes, etc.)
    - Failed downloads (for retry)
14. Dashboard displays real-time backup status

### Configuration

**Machine A (Source Peer)**:
```toml
[sync]
backup_enabled = true
backup_peer_address = "spr:CiUIAhIhAml6..." # Machine B's SPR
backup_manifest_enabled = true
backup_auto_notify = true
manifest_update_threshold = 10  # Generate manifest after N file changes
```

**Machine B (Backup Server)**:
```toml
[backup_server]
enabled = true
poll_interval_secs = 30          # Check for new manifests every 30s
max_concurrent_downloads = 3      # Download 3 files at once
max_retries = 3                   # Retry failed downloads 3 times
auto_delete_tombstones = true     # Process file deletions
```

### Key Features

- **Event-Driven**: Manifests generated automatically after threshold reached
- **Continuous Sync**: New files trigger manifest updates without manual intervention
- **Deletion Tracking**: Deleted files tracked in manifest for proper cleanup
- **Sequence Numbers**: Detect gaps and ensure proper ordering
- **Retry Mechanism**: Failed downloads automatically retried with backoff
- **Concurrent Downloads**: Multiple files downloaded in parallel for speed
- **State Persistence**: Daemon state saved to disk, survives restarts
- **Real-Time Dashboard**: Monitor backup progress with auto-refreshing UI

### Network Requirements

For cross-network backup (Machine A → Internet → Machine B):

1. **Machine B (Backup Server)** must have port forwarding configured:
   - Forward external port 8070 (TCP) → Machine B's local IP:8070
   - This allows Machine A to connect and send data

2. **Firewall rules**:
   - Machine B: Allow incoming TCP on port 8070
   - Machine B: Allow incoming UDP on port 8090 (discovery)

3. **Connection verification**:
   - Machine A should connect to Machine B using the backup peer SPR
   - Check Peers page on both machines to confirm connection
   - Connected peers should show in Dashboard statistics

## License

MIT
