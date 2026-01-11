# P2P Network Testing Guide for Archivist Desktop

This guide explains how to test peer-to-peer connectivity between two or more Archivist Desktop instances.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Test: Same Network](#quick-test-same-network)
3. [Testing Across Networks](#testing-across-networks)
4. [Troubleshooting](#troubleshooting)
5. [Common Issues](#common-issues)
6. [Diagnostic Commands](#diagnostic-commands)

## Prerequisites

- Two or more machines with Archivist Desktop v0.1.0+ installed
- Both nodes able to communicate (same network, or proper firewall/NAT configuration)
- Basic understanding of network concepts (IP addresses, ports, NAT)

## Quick Test: Same Network

### Step 1: Start Both Nodes

On **Machine A**:
1. Open Archivist Desktop
2. Click "Start Node" on the Dashboard
3. Wait for status to show "Running"

On **Machine B**:
1. Open Archivist Desktop
2. Click "Start Node" on the Dashboard
3. Wait for status to show "Running"

### Step 2: Get Connection Info from Machine A

On **Machine A**, go to the **Peers** page:

1. Find the "Your Node" section
2. Copy the **SPR** (Signed Peer Record) by clicking "Copy SPR"
3. Note the **Peer ID** (format: `12D3Koo...`)
4. Note the **Addresses** - look for one with your local IP:
   - Example: `/ip4/192.168.1.100/tcp/8090/p2p/12D3Koo...`

### Step 3: Connect from Machine B

On **Machine B**, go to the **Peers** page:

1. In the "Connect to Peer" section, paste the SPR you copied
2. Click "Connect"
3. Check the "Connected Peers" list - you should see Machine A appear

### Step 4: Verify Connection

On **Machine A**:
- Go to the **Peers** page
- Check "Connected Peers" - Machine B should appear automatically

On **Dashboard** (both machines):
- "Connected Peers" count should be at least 1

### Step 5: Test Data Transfer

On **Machine A**:
1. Go to the **Files** page
2. Upload a test file
3. Note the **CID** (e.g., `zdj7W...`)

On **Machine B**:
1. Go to the **Files** page
2. In the download section, paste the CID from Machine A
3. Click "Download from Network"
4. The file should download through the P2P network from Machine A

## Testing Across Networks

### Understanding NAT and Firewalls

When machines are on different networks, you'll need to configure port forwarding or use a relay.

#### Option 1: Port Forwarding (Direct Connection)

On **Machine A** (the one receiving connections):

1. Find your P2P port (default: 8090)
2. Configure your router to forward port 8090 to Machine A's local IP
3. Find your public IP address: `curl ifconfig.me`
4. Your multiaddr will be: `/ip4/YOUR_PUBLIC_IP/tcp/8090/p2p/YOUR_PEER_ID`

On **Machine B**:
- Use Machine A's public multiaddr to connect

#### Option 2: Relay Server (Easier, Slower)

> **Note**: This requires archivist-node to support relay functionality (check version)

If both nodes support libp2p circuit relay, they can connect through a public relay node without port forwarding.

### Testing Connection with Multiaddr

Instead of using SPR, you can manually construct a multiaddr:

```
/ip4/192.168.1.100/tcp/8090/p2p/12D3KooWABC123...
```

Parts:
- `/ip4/192.168.1.100` - IP address
- `/tcp/8090` - P2P port
- `/p2p/12D3KooWABC123...` - Peer ID

## Troubleshooting

### Check 1: Node is Running

**Dashboard** → Check "Node Status" = "Running"

If stopped or error:
- Check logs in Settings
- Try restarting the node
- Check that port 8080 (API) and 8090 (P2P) are available

### Check 2: Ports are Open

On **each machine**, verify ports are listening:

**Linux/macOS**:
```bash
# Check API port (should be 127.0.0.1:8080)
lsof -i :8080

# Check P2P port (should be 0.0.0.0:8090)
lsof -i :8090
```

**Windows**:
```powershell
# Check both ports
netstat -ano | findstr "8080 8090"
```

Expected output:
- Port 8080: Listening on localhost only (127.0.0.1)
- Port 8090: Listening on all interfaces (0.0.0.0 or ::)

### Check 3: Firewall Rules

Ensure firewall allows **incoming** connections on port 8090:

**Linux (ufw)**:
```bash
sudo ufw allow 8090/tcp
```

**macOS**:
System Preferences → Security & Privacy → Firewall → Firewall Options → Allow Archivist Desktop

**Windows**:
Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port 8090

### Check 4: Network Connectivity

Test basic connectivity between machines:

```bash
# From Machine B, ping Machine A
ping 192.168.1.100

# Check if P2P port is reachable (requires netcat/nc)
nc -zv 192.168.1.100 8090
```

### Check 5: SPR Format

A valid SPR looks like:
```
spr:CiUIAhIhA...very-long-base64-string...
```

If connection fails with SPR:
1. Verify you copied the entire string
2. Try using the multiaddr directly instead
3. Check that the peer is still running

## Common Issues

### Issue: "Connection failed" or "Peer not found"

**Causes**:
- Peer is offline or not running
- Network unreachable (firewall, NAT)
- Wrong SPR/multiaddr

**Solutions**:
1. Verify peer is running (check Dashboard on other machine)
2. Test network connectivity (ping, nc)
3. Try using multiaddr with local IP first: `/ip4/192.168.x.x/tcp/8090/p2p/...`
4. Check firewall rules on both machines

### Issue: Peer connects but appears offline after a few seconds

**Causes**:
- NAT timeout
- Network instability
- Node restart

**Solutions**:
1. Check node logs for errors
2. Try reconnecting
3. Use persistent connection (stay on same network)

### Issue: Can't download files from peer

**Causes**:
- File doesn't exist on peer (CID mismatch)
- Connection dropped
- Peer has insufficient storage/bandwidth

**Solutions**:
1. Verify CID is correct (check Files page on uploading peer)
2. Ensure peers are still connected (check Peers page)
3. Try uploading a smaller test file first

### Issue: Connection works on LAN but not across internet

**Causes**:
- Port forwarding not configured
- ISP blocks peer-to-peer traffic
- Symmetric NAT (can't traverse)

**Solutions**:
1. Configure port forwarding on router
2. Use a relay server (if supported)
3. Try a VPN (WireGuard, Tailscale) to create virtual LAN

## Diagnostic Commands

### Get Node Info Directly

Query the archivist-node API directly:

```bash
# Get debug info (replace 8080 with your API port)
curl http://127.0.0.1:8080/api/archivist/v1/debug/info

# Get SPR
curl http://127.0.0.1:8080/api/archivist/v1/spr

# List connected peers
curl http://127.0.0.1:8080/api/archivist/v1/peers

# List local files
curl http://127.0.0.1:8080/api/archivist/v1/data
```

### Check Logs

Logs are stored in:
- **Linux**: `~/.local/share/archivist/logs/`
- **macOS**: `~/Library/Application Support/archivist/logs/`
- **Windows**: `%APPDATA%\archivist\logs\`

Look for:
- Connection attempts
- Error messages
- Peer discovery events

### Network Diagnostics

Test reachability:

```bash
# Check if remote peer's P2P port is open (from your machine)
telnet REMOTE_IP 8090

# Or using netcat
nc -zv REMOTE_IP 8090

# Check your public IP (for remote connections)
curl ifconfig.me
```

## Advanced Testing

### Test with 3+ Nodes

Network topology:
```
Machine A <---> Machine B <---> Machine C
```

1. Connect A ↔ B
2. Connect B ↔ C
3. Upload file on A
4. Download on C (should route through B)

### Test Content Discovery

1. Upload file on Machine A (note CID)
2. Stop Machine A
3. Upload same file on Machine B (should get same CID)
4. Start Machine C, connect to Machine B
5. Download using CID - should get from B even though A originally uploaded

### Bandwidth Testing

Upload progressively larger files:
- 1 KB text file
- 100 KB image
- 1 MB document
- 10 MB video

Monitor:
- Transfer speed (check Peers page stats)
- Connection stability
- Memory/CPU usage

## Expected Behavior

### Successful Connection

When two peers connect successfully:

1. **Peers page** on both machines shows the other peer in "Connected Peers"
2. **Dashboard** shows peer count incremented
3. **Stats** show bytes sent/received updating
4. Files can be transferred via CID

### Connection Latency

Typical latencies:
- **Same LAN**: 1-10ms
- **Same city**: 10-50ms
- **Different regions**: 50-200ms
- **Cross-continent**: 200-500ms

If latency is very high (>1000ms), check network quality.

### Data Transfer

Expected behavior:
- Small files (<1MB): instant
- Medium files (1-10MB): 1-10 seconds on LAN
- Large files (>10MB): depends on network speed

The first chunk may be slower due to connection setup.

## Getting Help

If you're still having issues:

1. Check GitHub Issues: https://github.com/durability-labs/archivist-desktop/issues
2. Include in your report:
   - OS and version
   - Archivist Desktop version
   - Network configuration (LAN/WAN)
   - Error messages from logs
   - Output of diagnostic commands

## References

- libp2p Multiaddrs: https://docs.libp2p.io/concepts/fundamentals/addressing/
- NAT Traversal: https://docs.libp2p.io/concepts/nat/
- Archivist Node API: See `CLAUDE.md` in the repository
