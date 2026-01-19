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

## License

MIT
