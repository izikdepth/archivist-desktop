# Sidecar Binaries

This directory contains the Archivist node binaries that run alongside the desktop application.

## Automatic Download

Use the download script to fetch the appropriate binary for your platform:

```bash
# From the project root - download for current platform
pnpm download-sidecar

# Or for a specific target (cross-compilation)
bash scripts/download-sidecar.sh x86_64-apple-darwin
bash scripts/download-sidecar.sh aarch64-apple-darwin
bash scripts/download-sidecar.sh x86_64-pc-windows-msvc
```

## Manual Download

Download the appropriate binary from the [archivist-node releases](https://github.com/durability-labs/archivist-node/releases):

| Platform | Release Archive | Sidecar Filename |
|----------|-----------------|------------------|
| Linux x64 | `archivist-v0.1.0-linux-amd64.tar.gz` | `archivist-x86_64-unknown-linux-gnu` |
| Linux ARM64 | `archivist-v0.1.0-linux-arm64.tar.gz` | `archivist-aarch64-unknown-linux-gnu` |
| macOS Intel | `archivist-v0.1.0-darwin-amd64.tar.gz` | `archivist-x86_64-apple-darwin` |
| macOS Apple Silicon | `archivist-v0.1.0-darwin-arm64.tar.gz` | `archivist-aarch64-apple-darwin` |
| Windows x64 | `archivist-v0.1.0-windows-amd64-libs.zip` | `archivist-x86_64-pc-windows-msvc.exe` |

Extract and rename the binary to match the sidecar filename, then place it in this directory.

## Windows Runtime DLLs

The Windows binary requires MinGW runtime DLLs (`libgcc_s_seh-1.dll` and `libwinpthread-1.dll`).
These are automatically extracted from the Windows release archive by the download script.
Unlike the binary, these DLLs are tracked in git since they're small and required for the app to run.

## Note

The main binary is gitignored due to its size. Each developer/CI pipeline must download it before building.
The DLL files are tracked in git to ensure the app works out of the box on Windows.
