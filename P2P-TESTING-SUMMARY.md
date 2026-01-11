# P2P Testing Summary - Diagnostic Features Added

## Overview

I've added comprehensive P2P testing and diagnostic capabilities to Archivist Desktop to help you troubleshoot connectivity issues between nodes.

## What Was Added

### 1. Connection Diagnostics Panel (Dashboard)

A new collapsible "Connection Diagnostics" section has been added to the Dashboard page that provides:

- **API Reachability Check**: Verifies the archivist-node backend is responding
- **Node Version**: Shows the version of the running archivist-node
- **Peer ID**: Displays your node's peer ID
- **Network Addresses**: Shows how many network addresses were found
- **Contextual Tips**: Provides troubleshooting suggestions based on the diagnostic results

**Usage**:
1. Start your node
2. On the Dashboard, click "Show Diagnostics"
3. Click "Run Diagnostics" to perform connection checks
4. Review the results and follow the troubleshooting tips

### 2. P2P Testing Guide

A comprehensive testing guide ([P2P-TESTING-GUIDE.md](P2P-TESTING-GUIDE.md)) that covers:

- Quick test procedures for same-network setups
- Cross-network testing with NAT traversal
- Port forwarding configuration
- Firewall setup for Linux/macOS/Windows
- Diagnostic commands (curl, netstat, nc)
- Common issues and solutions
- Expected behavior and latency guidelines

### 3. Backend Diagnostics Command

New Tauri command `run_node_diagnostics` that:
- Checks if the node API is reachable
- Fetches node version and peer information
- Counts available network addresses
- Returns detailed error messages for troubleshooting

## How to Test P2P Connectivity

### Quick Test (Two Machines on Same Network)

**Machine A**:
1. Start Archivist Desktop
2. Click "Start Node"
3. Go to Peers page
4. Click "Copy SPR"

**Machine B**:
1. Start Archivist Desktop
2. Click "Start Node"
3. Go to Peers page
4. Paste Machine A's SPR into "Connect to Peer"
5. Click "Connect"

**Verify**:
- Both machines should show 1 connected peer on Dashboard
- Peers page shows the other peer in "Connected Peers"

### Testing File Transfer

**Machine A**:
1. Go to Files page
2. Upload a test file
3. Copy the CID

**Machine B**:
1. Go to Files page
2. Paste the CID in "Download from Network"
3. Click "Download"
4. File should download via P2P from Machine A

## Troubleshooting with Diagnostics

### If Diagnostics Show "API Not Reachable"

**Problem**: The Tauri frontend can't communicate with archivist-node
**Solutions**:
1. Restart the node (Dashboard → Stop → Start)
2. Check if port 8080 is in use: `lsof -i :8080` (macOS/Linux)
3. Check Settings → Advanced → API Port configuration

### If "0 Addresses Found"

**Problem**: Node has no network addresses (can't be reached by peers)
**Solutions**:
1. Check firewall allows port 8090 (P2P port)
2. Ensure you're connected to a network
3. Check Settings → Advanced → P2P Port configuration

### If Connected But Can't Transfer Files

**Problem**: Peers connected but file transfers fail
**Solutions**:
1. Verify the CID is correct (check Files page on source machine)
2. Ensure source machine still has the file stored
3. Check "Connected Peers" shows stable connection
4. Try with a smaller test file first

## Common Issues & Solutions

### Issue: "Peer shows connected then disconnects immediately"

**Causes**:
- NAT timeout
- One node restarted
- Network instability

**Solutions**:
1. Check both nodes are still running (Dashboard status)
2. Try reconnecting with fresh SPR
3. Ensure both machines stay on same network

### Issue: "Connection works on LAN but not over internet"

**Causes**:
- Port forwarding not configured
- ISP blocks P2P
- Symmetric NAT

**Solutions**:
1. Configure port forwarding on router (port 8090)
2. Use the Testing Guide's NAT traversal section
3. Consider using a VPN to create virtual LAN

### Issue: "Files upload but peers can't find them"

**Causes**:
- Peers not connected when file was uploaded
- DHT not propagated yet
- File was deleted locally

**Solutions**:
1. Ensure peers are connected BEFORE uploading
2. Wait 10-30 seconds after upload for DHT propagation
3. Verify file still exists on Files page

## Key Files Modified

- `src/pages/Dashboard.tsx` - Added diagnostics panel UI
- `src-tauri/src/commands/node.rs` - Added `run_node_diagnostics` command
- `src-tauri/src/lib.rs` - Registered new command
- `src/styles/App.css` - Added diagnostics panel styling
- `P2P-TESTING-GUIDE.md` - Comprehensive testing documentation

## Next Steps for Enhanced Debugging

If you're still having connectivity issues, you can add:

1. **Peer Connection Logs**: Show recent connection attempts with timestamps
2. **Network Latency Testing**: Ping connected peers to measure latency
3. **Port Availability Checker**: Verify ports 8080 and 8090 are open
4. **SPR Validator**: Check if SPR format is valid before connecting
5. **Connection History**: Track successful/failed connection attempts

## Testing the New Features

To test the diagnostic panel:

```bash
pnpm tauri dev
```

1. Start the app
2. Start the node (Dashboard → Start Node)
3. Click "Show Diagnostics" on Dashboard
4. Click "Run Diagnostics"
5. Verify the results show:
   - ✓ API Reachable: Yes
   - Node Version: v0.1.0 (or your version)
   - Peer ID: 12D3Koo...
   - Network Addresses: 1+ found

## API Documentation

### `run_node_diagnostics`

**TypeScript**:
```typescript
interface DiagnosticInfo {
  apiReachable: boolean;
  apiUrl: string;
  nodeVersion?: string;
  peerId?: string;
  addressCount: number;
  error?: string;
}

const diagnostics = await invoke<DiagnosticInfo>('run_node_diagnostics');
```

**Rust**:
```rust
#[tauri::command]
pub async fn run_node_diagnostics(state: State<'_, AppState>) -> Result<DiagnosticInfo>
```

Returns diagnostic information about the node's connectivity status.

## Resources

- **Testing Guide**: [P2P-TESTING-GUIDE.md](P2P-TESTING-GUIDE.md)
- **Main Documentation**: [CLAUDE.md](CLAUDE.md)
- **Architecture**: See "Archivist-Node API" section in CLAUDE.md
- **GitHub Issues**: https://github.com/durability-labs/archivist-desktop/issues

## Summary

You now have:

✅ **Diagnostic Panel** - Real-time connectivity checks in the Dashboard
✅ **Testing Guide** - Step-by-step instructions for P2P testing
✅ **Troubleshooting** - Common issues and solutions
✅ **API Commands** - Direct node API access for debugging

This should make it much easier to:
- Identify connectivity problems
- Test P2P functionality between machines
- Debug file transfer issues
- Verify network configuration

The diagnostic panel will guide you with specific tips based on what it detects, making troubleshooting much more straightforward.
