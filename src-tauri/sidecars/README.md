# Sidecar Binaries

This directory contains the Archivist node binaries that run alongside the desktop application.

## Download Instructions

Download the appropriate binary from the [archivist-node releases](https://github.com/durability-labs/archivist-node/releases):

| Platform | Filename |
|----------|----------|
| Windows x64 | `archivist-x86_64-pc-windows-msvc.exe` |
| macOS Intel | `archivist-x86_64-apple-darwin` |
| macOS Apple Silicon | `archivist-aarch64-apple-darwin` |
| Linux x64 | `archivist-x86_64-unknown-linux-gnu` |

## Placement

Place the binaries in this directory (`src-tauri/sidecars/`) with the exact filenames above.

## Note

These binaries are gitignored due to their size. Each developer/CI pipeline must download them separately before building.

## Development

For development without the actual binary, you can create a placeholder script:

```bash
#!/bin/bash
echo "Archivist Node (placeholder)"
if [ "$1" = "--data-dir" ]; then
    while true; do sleep 1; done
fi
```

Make it executable: `chmod +x archivist-x86_64-unknown-linux-gnu`
