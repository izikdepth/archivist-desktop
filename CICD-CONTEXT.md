# Archivist Desktop - CI/CD Context for Self-Hosted Runners

This document contains all context needed to set up self-hosted GitHub Actions runners for building the Archivist Desktop application.

## Project Overview

**Archivist Desktop** is a Tauri v2 desktop application for decentralized file storage.

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Rust + Tauri v2 |
| Sidecar | archivist-node (separate binary from durability-labs/archivist-node) |
| Package Manager | pnpm v10 |
| Node.js | v20 |
| Rust | 1.77.2+ (stable) |

## Repository Structure

```
archivist-desktop/
├── src/                          # React frontend
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/                      # Rust source code
│   ├── sidecars/                 # archivist-node binaries (downloaded)
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── scripts/
│   └── download-sidecar.sh       # Downloads archivist-node binary
├── .github/workflows/
│   ├── ci.yml                    # CI workflow (tests, lint, build)
│   └── release.yml               # Release workflow (build artifacts)
├── package.json                  # npm dependencies + scripts
└── pnpm-lock.yaml                # Lockfile
```

## Build Targets

The application builds for:

| Target Triple | Platform | Architecture |
|--------------|----------|--------------|
| `x86_64-unknown-linux-gnu` | Linux | x86_64 |
| `aarch64-unknown-linux-gnu` | Linux | ARM64 |
| `x86_64-apple-darwin` | macOS | Intel |
| `aarch64-apple-darwin` | macOS | Apple Silicon |
| `x86_64-pc-windows-msvc` | Windows | x86_64 |

## Current CI/CD Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on: `push` and `pull_request` to `main` and `develop` branches

Jobs:
1. **frontend-test** - TypeScript type check, lint, tests (ubuntu-latest)
2. **backend-test** - Rust fmt, clippy, tests (ubuntu/macos/windows-latest)
3. **security-audit** - cargo audit, pnpm audit
4. **integration-build** - Full Tauri debug build (ubuntu-latest)
5. **coverage** - Code coverage with tarpaulin

### Release Workflow (`.github/workflows/release.yml`)

Runs on: Tag push matching `v*.*.*` or manual dispatch

Jobs:
1. **create-release** - Creates draft GitHub release
2. **build-tauri** - Builds for all platforms (matrix)
3. **publish-release** - Marks release as non-draft

## System Dependencies

### Linux (Ubuntu/Debian)

```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libgtk-3-dev
```

### macOS

- Xcode Command Line Tools
- No additional packages needed (webkit is built-in)

### Windows

- Visual Studio Build Tools with C++ workload
- WebView2 runtime (downloaded during build if needed)

## Required Secrets

| Secret Name | Description |
|------------|-------------|
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |
| `TAURI_SIGNING_PRIVATE_KEY` | For signing update bundles |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for signing key |

## Sidecar Binary

The application requires the `archivist-node` sidecar binary. It's downloaded from:
```
https://github.com/durability-labs/archivist-node/releases/download/v0.1.0/archivist-v0.1.0-{platform}.{tar.gz|zip}
```

Platform mappings:
- `linux-amd64` → `archivist-x86_64-unknown-linux-gnu`
- `linux-arm64` → `archivist-aarch64-unknown-linux-gnu`
- `darwin-amd64` → `archivist-x86_64-apple-darwin`
- `darwin-arm64` → `archivist-aarch64-apple-darwin`
- `windows-amd64` → `archivist-x86_64-pc-windows-msvc.exe`

## Build Commands

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Download sidecar for current platform
pnpm download-sidecar
# Or for specific target:
bash scripts/download-sidecar.sh x86_64-unknown-linux-gnu

# Development build
pnpm tauri dev

# Production build (current platform)
pnpm tauri build

# Production build (specific target)
pnpm tauri build --target aarch64-apple-darwin

# Run tests
pnpm test                    # Frontend tests
cargo test --manifest-path src-tauri/Cargo.toml  # Backend tests

# Lint
pnpm lint                    # Frontend lint
cargo clippy --manifest-path src-tauri/Cargo.toml  # Backend lint
cargo fmt --manifest-path src-tauri/Cargo.toml --check  # Format check
```

## Build Outputs

After `pnpm tauri build`, artifacts are in:
```
src-tauri/target/release/bundle/
├── appimage/           # Linux AppImage
├── deb/               # Linux .deb package
├── dmg/               # macOS disk image
├── macos/             # macOS .app bundle
├── msi/               # Windows installer
└── nsis/              # Windows NSIS installer
```

## Recent Bug Fix (v0.1.1)

### Issue: Sync Folder Not Working

The `upload_file` function in `src-tauri/src/node_api.rs` was using `multipart/form-data` but the archivist-node API expects raw binary uploads.

**Fix Applied:**
- Changed from `multipart::Form` to raw `body()` with headers
- Added `Content-Type` header (MIME type)
- Added `Content-Disposition` header for filename
- Changed response parsing from JSON to plain text (CID)

**File changed:** `src-tauri/src/node_api.rs` (lines 177-235)

## Self-Hosted Runner Requirements

### Minimum Hardware

| Platform | CPU | RAM | Disk |
|----------|-----|-----|------|
| Linux | 4 cores | 8GB | 50GB |
| macOS | 4 cores | 8GB | 50GB |
| Windows | 4 cores | 8GB | 50GB |

### Software Requirements

**All Platforms:**
- Git
- Node.js 20.x
- pnpm 10.x
- Rust stable (1.77.2+)
- GitHub Actions Runner

**Linux:**
- Ubuntu 22.04+ or Debian 12+
- GTK3, WebKit2GTK 4.1, and other system deps (see above)

**macOS:**
- macOS 12+ (Monterey)
- Xcode 14+ with Command Line Tools
- Both Intel and ARM runners recommended

**Windows:**
- Windows 10/11 or Server 2019+
- Visual Studio 2022 Build Tools
- WebView2 runtime

## Environment Variables

```bash
CARGO_TERM_COLOR=always
RUST_BACKTRACE=1

# For release builds:
TAURI_SIGNING_PRIVATE_KEY=<base64 encoded key>
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=<password>
```

## Tauri Configuration Highlights

From `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Archivist",
  "version": "0.1.0",
  "identifier": "org.basedmint.archivist",
  "bundle": {
    "externalBin": ["sidecars/archivist"],
    "targets": "all",
    "linux": {
      "deb": {
        "postInstallScript": "scripts/postinst.sh"
      }
    }
  },
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/basedmint/archivist-desktop/releases/latest/download/latest.json"
      ]
    }
  }
}
```

## GitHub Repository

- **Org:** basedmint
- **Repo:** archivist-desktop
- **Sidecar Repo:** durability-labs/archivist-node

## Workflow Modifications for Self-Hosted

To use self-hosted runners, change `runs-on` in workflows:

```yaml
# From:
runs-on: ubuntu-latest

# To:
runs-on: self-hosted-linux-x64
# Or with labels:
runs-on: [self-hosted, linux, x64]
```

Example labels:
- `self-hosted-linux-x64`
- `self-hosted-linux-arm64`
- `self-hosted-macos-x64`
- `self-hosted-macos-arm64`
- `self-hosted-windows-x64`

## Caching

The workflows use:
- `actions/cache` or `pnpm/action-setup` for pnpm cache
- `Swatinem/rust-cache@v2` for Cargo dependencies

For self-hosted runners, consider:
- Persistent Cargo cache at `~/.cargo`
- Persistent pnpm store
- Pre-installed system dependencies

## Notes

1. The sidecar download script needs internet access to GitHub releases
2. Code signing requires secrets to be configured
3. macOS builds may need notarization for distribution
4. Windows builds may need EV code signing certificate for SmartScreen trust
5. ARM64 Linux builds are supported but may need cross-compilation setup
