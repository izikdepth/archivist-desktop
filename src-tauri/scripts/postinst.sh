#!/bin/bash
# Post-install script for Archivist Desktop .deb package
# Creates symlink for sidecar binary with target triple suffix
# Configures firewall for P2P connectivity

set -e

# The sidecar is installed as /usr/bin/archivist
# But Tauri looks for it with the target triple suffix at runtime
SIDECAR_PATH="/usr/bin/archivist"
SIDECAR_LINK="/usr/bin/archivist-x86_64-unknown-linux-gnu"

if [ -f "$SIDECAR_PATH" ] && [ ! -e "$SIDECAR_LINK" ]; then
    ln -s "$SIDECAR_PATH" "$SIDECAR_LINK"
    echo "Created sidecar symlink: $SIDECAR_LINK -> $SIDECAR_PATH"
fi

# Configure firewall for P2P connectivity (port 8090)
# Only if ufw is installed and active
if command -v ufw >/dev/null 2>&1; then
    if ufw status | grep -q "Status: active"; then
        echo "Configuring firewall for Archivist P2P..."
        ufw allow 8090/tcp comment "Archivist P2P" >/dev/null 2>&1 || true
        ufw allow 8090/udp comment "Archivist P2P" >/dev/null 2>&1 || true
        echo "Firewall rules added for port 8090 (TCP/UDP)"
    fi
fi

exit 0
