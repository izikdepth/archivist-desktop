# Archivist Desktop

Tauri v2 desktop application for decentralized file storage with P2P sync capabilities.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Rust + Tauri v2 |
| Sidecar | archivist-node (P2P storage daemon) |
| Package Manager | pnpm v10 |
| Node.js | v20 |
| Rust | 1.77.2+ stable |

## Quick Start

```bash
pnpm setup          # Install deps + download sidecar
pnpm tauri dev      # Development mode
pnpm tauri build    # Production build
```

## Project Structure

```
archivist-desktop/
├── src/                          # React frontend
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useNode.ts           # Node lifecycle (start/stop/status)
│   │   ├── useSync.ts           # Folder watching + sync queue
│   │   ├── usePeers.ts          # Peer connections
│   │   ├── useFeatures.ts       # Feature flag detection
│   │   └── useWallet.ts         # V2 wallet (stub)
│   ├── pages/                    # Route components
│   │   ├── Dashboard.tsx        # Main status overview
│   │   ├── Files.tsx            # Upload/download/list files
│   │   ├── Sync.tsx             # Watched folder management
│   │   ├── Peers.tsx            # P2P network view
│   │   └── Settings.tsx         # App configuration
│   ├── lib/                      # Utilities and types
│   │   ├── api.ts               # TypeScript interfaces
│   │   ├── features.ts          # Feature flag constants
│   │   └── tauri.ts             # Tauri invoke helpers
│   ├── styles/                   # CSS files
│   ├── App.tsx                   # Router + layout
│   └── main.tsx                  # Entry point
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs              # App entry (delegates to lib.rs)
│   │   ├── lib.rs               # Tauri setup, commands, tray
│   │   ├── error.rs             # ArchivistError enum
│   │   ├── state.rs             # AppState (service container)
│   │   ├── features.rs          # Runtime feature detection
│   │   ├── node_api.rs          # HTTP client for sidecar
│   │   ├── commands/            # Tauri command handlers
│   │   │   ├── node.rs          # start/stop/restart/status
│   │   │   ├── files.rs         # upload/download/list/delete
│   │   │   ├── sync.rs          # watch folders, sync queue
│   │   │   ├── peers.rs         # connect/disconnect/list
│   │   │   └── system.rs        # config, platform info
│   │   └── services/            # Business logic
│   │       ├── node.rs          # Sidecar process management
│   │       ├── files.rs         # File operations via API
│   │       ├── sync.rs          # File watching (notify crate)
│   │       ├── peers.rs         # Peer management
│   │       └── config.rs        # Settings persistence
│   ├── sidecars/                # archivist-node binaries (gitignored)
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
│
├── scripts/
│   └── download-sidecar.sh      # Downloads archivist-node binary
│
├── .github/workflows/
│   ├── ci.yml                   # Tests, lint, build checks
│   └── release.yml              # Multi-platform release builds
│
└── package.json                 # npm scripts + dependencies
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              React Frontend (localhost:1420)              │
│  Dashboard │ Files │ Sync │ Peers │ Settings             │
└─────────────────────────┬────────────────────────────────┘
                          │ Tauri IPC (invoke)
┌─────────────────────────▼────────────────────────────────┐
│              Rust Backend (Tauri Commands)                │
│                                                           │
│  Commands → Services → NodeApiClient                      │
│     ↓           ↓            ↓                            │
│  AppState   Business    HTTP requests                     │
│  (RwLock)   Logic       to sidecar                        │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP (localhost:8080)
┌─────────────────────────▼────────────────────────────────┐
│              archivist-node Sidecar                       │
│                                                           │
│  REST API │ P2P Network │ Storage │ CID Management       │
└──────────────────────────────────────────────────────────┘
```

## Archivist-Node API

Base URL: `http://127.0.0.1:8080`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/archivist/v1/debug/info` | GET | Node info, peer ID, addresses |
| `/api/archivist/v1/spr` | GET | Signed Peer Record |
| `/api/archivist/v1/data` | GET | List stored CIDs |
| `/api/archivist/v1/data` | POST | Upload file (raw binary body) |
| `/api/archivist/v1/data/{cid}` | GET | Download file |
| `/api/archivist/v1/data/{cid}/network` | GET | Download from network |
| `/api/archivist/v1/peers` | GET | List connected peers |
| `/api/archivist/v1/connect/{peerId}` | POST | Connect to peer |

**Upload format:** Raw binary body with headers:
- `Content-Type`: MIME type (e.g., `text/plain`)
- `Content-Disposition`: `attachment; filename="example.txt"`

## Tauri Commands

Commands are invoked from frontend via `@tauri-apps/api`:

```typescript
import { invoke } from '@tauri-apps/api/core';
const status = await invoke<NodeStatus>('get_node_status');
```

| Command | Description |
|---------|-------------|
| `start_node` | Start archivist-node sidecar |
| `stop_node` | Stop sidecar process |
| `restart_node` | Restart sidecar |
| `get_node_status` | Get running state, PID, storage |
| `get_node_config` / `set_node_config` | Node configuration |
| `list_files` | List stored files |
| `upload_file` | Upload file to node |
| `download_file` | Download file by CID |
| `get_sync_status` | Sync queue and folder states |
| `add_watch_folder` / `remove_watch_folder` | Manage watched folders |
| `sync_now` | Trigger manual sync |
| `get_peers` | List connected peers |
| `connect_peer` / `disconnect_peer` | Peer management |
| `get_features` | Runtime feature flags |

## Feature Flags

### Compile-time (Cargo.toml)

```toml
[features]
default = []
marketplace = ["ethers", "alloy"]  # V2 blockchain
zk-proofs = []                      # V2 ZK verification
```

Build with: `cargo build --features marketplace`

### Runtime Detection

```rust
// Backend: features.rs
pub struct Features {
    pub marketplace: bool,  // cfg!(feature = "marketplace")
    pub zk_proofs: bool,
    pub analytics: bool,
}
```

```typescript
// Frontend: useFeatures hook
const { marketplaceEnabled, zkProofsEnabled } = useFeatures();
```

## Error Handling

Rust errors are defined in `src-tauri/src/error.rs`:

```rust
pub enum ArchivistError {
    NodeNotRunning,
    NodeAlreadyRunning,
    NodeStartFailed(String),
    FileNotFound(String),
    ApiError(String),
    SyncError(String),
    // ... etc
}
```

All errors serialize to JSON for frontend consumption.

## Configuration

### Node Config (NodeConfig struct)

| Field | Default | Description |
|-------|---------|-------------|
| `data_dir` | `~/.local/share/archivist/node` | Node data directory |
| `api_port` | `8080` | REST API port |
| `p2p_port` | `8090` | P2P discovery port |
| `max_storage_bytes` | 10GB | Storage quota |
| `auto_start` | `false` | Start node on app launch |
| `auto_restart` | `true` | Restart on failure |

### Sync Config

| Field | Default | Description |
|-------|---------|-------------|
| `enabled` | `true` | Enable sync |
| `interval_secs` | `30` | Sync check interval |
| `batch_size` | `5` | Files per batch |

## Development

### Commands

```bash
# Frontend only
pnpm dev              # Vite dev server (port 1420)
pnpm build            # Build frontend
pnpm lint             # ESLint
pnpm test             # Vitest

# Backend only
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml

# Full app
pnpm tauri dev        # Dev mode with hot reload
pnpm tauri build      # Production build
```

### Testing

Frontend: Vitest with jsdom, mocked Tauri API
Backend: cargo test with mockall, wiremock, tempfile

```bash
pnpm test:coverage    # Frontend coverage
cargo tarpaulin --manifest-path src-tauri/Cargo.toml  # Backend coverage
```

## Build Targets

| Platform | Target Triple | Output |
|----------|--------------|--------|
| Linux x64 | `x86_64-unknown-linux-gnu` | AppImage, .deb |
| Linux ARM | `aarch64-unknown-linux-gnu` | AppImage, .deb |
| macOS Intel | `x86_64-apple-darwin` | .dmg, .app |
| macOS ARM | `aarch64-apple-darwin` | .dmg, .app |
| Windows | `x86_64-pc-windows-msvc` | .msi, .exe |

Cross-compile with:
```bash
pnpm tauri build --target aarch64-apple-darwin
```

## System Dependencies

### Linux (Ubuntu/Debian)

```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libgtk-3-dev
```

### macOS

Xcode Command Line Tools only.

### Windows

Visual Studio Build Tools with C++ workload.

## Key Files Reference

| File | Purpose |
|------|---------|
| `src-tauri/src/node_api.rs` | HTTP client for sidecar API |
| `src-tauri/src/services/sync.rs` | File watching + upload queue |
| `src-tauri/src/services/node.rs` | Sidecar process management |
| `src/hooks/useNode.ts` | Node state management hook |
| `src/hooks/useSync.ts` | Sync state management hook |
| `scripts/download-sidecar.sh` | Sidecar binary downloader |
| `src-tauri/tauri.conf.json` | Tauri app configuration |

## Common Issues

### Port 8080 in use
The archivist-node uses port 8080 by default. Change via Settings or node config.

### Sidecar not found
Run `pnpm download-sidecar` or `bash scripts/download-sidecar.sh`.

### Upload fails with 422
Ensure uploads use raw binary body (not multipart). Fixed in v0.1.1.

## Version History

- **v0.1.0** - Initial release
- **v0.1.1** - Fixed upload API (multipart → raw binary)
