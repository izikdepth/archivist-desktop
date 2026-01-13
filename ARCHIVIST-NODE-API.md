# Archivist Node API Documentation

This document describes the REST API endpoints available in archivist-node v0.1.0.

**Base URL:** `http://localhost:8080/api/archivist/v1`

---

## Table of Contents

1. [Node Management](#node-management)
2. [Data Operations](#data-operations)
3. [Marketplace Operations](#marketplace-operations)
4. [Debug Operations](#debug-operations)
5. [Common Response Models](#common-response-models)

---

## Node Management

### Connect to Peer

Connect to another archivist node using its peer ID.

- **Endpoint:** `GET /connect/{peerId}`
- **Method:** GET
- **Parameters:**
  - `peerId` (path, required) - The peer ID to connect to
  - `addrs[]` (query, optional) - Array of MultiAddress strings to dial
- **Description:** If `addrs` param is supplied, it will be used to dial the peer, otherwise the peerId is used to invoke peer discovery
- **Status Codes:**
  - 200: Success
  - 400: Bad request

**Example:**
```bash
# Connect using peer discovery
curl "http://127.0.0.1:8080/api/archivist/v1/connect/16Uiu2HAmXYZ..."

# Connect with specific address
curl "http://127.0.0.1:8080/api/archivist/v1/connect/16Uiu2HAmXYZ...?addrs[]=/ip4/192.168.0.42/tcp/37311"
```

### Get Node SPR

Get the Signed Peer Record for this node (used for peer connection).

- **Endpoint:** `GET /spr`
- **Method:** GET
- **Response:** Signed Peer Record
- **Content-Type:** `text/plain` or `application/json`
- **Status Codes:**
  - 200: Success
  - 503: SPR not ready

**Example:**
```bash
curl http://127.0.0.1:8080/api/archivist/v1/spr
```

### Get Node PeerID

Get this node's peer identifier.

- **Endpoint:** `GET /peerid`
- **Method:** GET
- **Response:** Peer ID string
- **Status Codes:**
  - 200: Success

**Example:**
```bash
curl http://127.0.0.1:8080/api/archivist/v1/peerid
```

---

## Data Operations

### List Stored Content

List all content stored locally on this node.

- **Endpoint:** `GET /data`
- **Method:** GET
- **Response:** DataList object containing array of content items
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 404: Not found
  - 422: Validation error
  - 500: Server error

**Example:**
```bash
curl http://127.0.0.1:8080/api/archivist/v1/data
```

### Upload File

Upload a file to local storage.

- **Endpoint:** `POST /data`
- **Method:** POST
- **Headers:**
  - `Content-Type` (required) - MIME type of the file
  - `Content-Disposition` (optional) - Contains filename
- **Request Body:** Binary file stream
- **Response:** CID of uploaded file (plain text)
- **Status Codes:**
  - 200: Success
  - 422: Invalid MIME type
  - 500: Server error

**Example:**
```bash
curl -X POST \
  -H "Content-Type: application/octet-stream" \
  -H "Content-Disposition: attachment; filename=\"test.txt\"" \
  --data-binary @test.txt \
  http://127.0.0.1:8080/api/archivist/v1/data
```

### Download Local File

Download a file from local storage by CID.

- **Endpoint:** `GET /data/{cid}`
- **Method:** GET
- **Parameters:**
  - `cid` (path, required) - Content identifier
- **Response:** Binary file stream
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 404: Not available locally
  - 500: Server error

**Example:**
```bash
curl http://127.0.0.1:8080/api/archivist/v1/data/zdj7W... > downloaded_file
```

### Delete Data

Delete content from local storage.

- **Endpoint:** `DELETE /data/{cid}`
- **Method:** DELETE
- **Parameters:**
  - `cid` (path, required) - Content identifier
- **Status Codes:**
  - 204: Success (no content)
  - 400: Bad request
  - 500: Server error

**Example:**
```bash
curl -X DELETE http://127.0.0.1:8080/api/archivist/v1/data/zdj7W...
```

### Download from Network (Async)

Request download of content from the P2P network.

- **Endpoint:** `POST /data/{cid}/network`
- **Method:** POST
- **Parameters:**
  - `cid` (path, required) - Content identifier
- **Response:** DataItem object with manifest
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 404: Not found on network
  - 500: Server error
- **Note:** Download is performed asynchronously. Call can return before download is completed.

**Example:**
```bash
curl -X POST http://127.0.0.1:8080/api/archivist/v1/data/zdj7W.../network
```

### Stream Download from Network

Stream download content directly from the P2P network.

- **Endpoint:** `GET /data/{cid}/network/stream`
- **Method:** GET
- **Parameters:**
  - `cid` (path, required) - Content identifier
- **Response:** Binary file stream
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 404: Not found on network
  - 500: Server error

**Example:**
```bash
curl http://127.0.0.1:8080/api/archivist/v1/data/zdj7W.../network/stream > file
```

### Download Network Manifest

Get manifest information for content on the network.

- **Endpoint:** `GET /data/{cid}/network/manifest`
- **Method:** GET
- **Parameters:**
  - `cid` (path, required) - Content identifier
- **Response:** DataItem object with manifest information
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 404: Not found
  - 500: Server error

### Get Storage Space Summary

Get storage space usage information.

- **Endpoint:** `GET /space`
- **Method:** GET
- **Response:** Space object
- **Status Codes:**
  - 200: Success
  - 500: Server error

**Response Example:**
```json
{
  "totalBlocks": 1000,
  "quotaMaxBytes": 10737418240,
  "quotaUsedBytes": 1073741824,
  "quotaReservedBytes": 0
}
```

---

## Marketplace Operations

### Get Active Slots

Retrieve all active storage slots.

- **Endpoint:** `GET /sales/slots`
- **Method:** GET
- **Response:** Array of slot objects with request details
- **Status Codes:**
  - 200: Success
  - 503: Persistence disabled

### Get Active Slot by ID

Get a specific storage slot.

- **Endpoint:** `GET /sales/slots/{slotId}`
- **Method:** GET
- **Parameters:**
  - `slotId` (path, required) - Slot identifier
- **Response:** Single slot object with state information
- **Status Codes:**
  - 200: Success
  - 400: Invalid ID
  - 404: Not found
  - 503: Persistence disabled

### Get Storage Availability

Get current storage availability configuration.

- **Endpoint:** `GET /sales/availability`
- **Method:** GET
- **Response:** Availability object
- **Status Codes:**
  - 200: Success
  - 500: Error
  - 503: Persistence disabled

### Offer Storage for Sale

Configure storage availability for the marketplace.

- **Endpoint:** `POST /sales/availability`
- **Method:** POST
- **Request Body:**
```json
{
  "maximumDuration": "string (integer as decimal)",
  "minimumPricePerBytePerSecond": "string (integer as decimal)",
  "maximumCollateralPerByte": "string (integer as decimal)",
  "availableUntil": "string (optional, integer as decimal)"
}
```
- **Status Codes:**
  - 201: Created
  - 400: Bad request
  - 422: Validation failed
  - 500: Server error
  - 503: Persistence disabled

### Create Storage Request

Request storage for content on the network.

- **Endpoint:** `POST /storage/request/{cid}`
- **Method:** POST
- **Parameters:**
  - `cid` (path, required) - Content identifier
- **Request Body:**
```json
{
  "duration": "string (integer as decimal)",
  "pricePerBytePerSecond": "string (integer as decimal)",
  "proofProbability": "string (integer as decimal)",
  "nodes": "integer",
  "tolerance": "integer",
  "collateralPerByte": "string (integer as decimal)",
  "expiry": "string (integer as decimal)"
}
```
- **Response:** Request ID as decimal string
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 404: CID not found
  - 422: Validation failed
  - 503: Persistence disabled

### Get Purchase List

List all storage purchases.

- **Endpoint:** `GET /storage/purchases`
- **Method:** GET
- **Response:** Array of purchase IDs
- **Status Codes:**
  - 200: Success
  - 503: Persistence disabled

### Get Purchase Details

Get details of a specific purchase.

- **Endpoint:** `GET /storage/purchases/{id}`
- **Method:** GET
- **Parameters:**
  - `id` (path, required) - Hexadecimal purchase ID
- **Response:** Purchase object
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 404: Not found
  - 503: Persistence disabled

---

## Debug Operations

### Set Log Level

Change the logging level at runtime.

- **Endpoint:** `POST /debug/chronicles/loglevel`
- **Method:** POST
- **Query Parameters:**
  - `level` (required) - One of: TRACE, DEBUG, INFO, NOTICE, WARN, ERROR, FATAL
- **Status Codes:**
  - 200: Success
  - 400: Bad request
  - 500: Server error

**Example:**
```bash
curl -X POST "http://127.0.0.1:8080/api/archivist/v1/debug/chronicles/loglevel?level=DEBUG"
```

### Get Debug Info

Get comprehensive node debug information.

- **Endpoint:** `GET /debug/info`
- **Method:** GET
- **Response:** DebugInfo object
- **Status Codes:**
  - 200: Success

**Response Example:**
```json
{
  "id": "16Uiu2HAmXYZ...",
  "addrs": ["/ip4/127.0.0.1/tcp/8090", "/ip4/192.168.0.1/tcp/8090"],
  "repo": "/home/user/.local/share/archivist/node",
  "spr": "spr:CiUIAhI...",
  "announceAddresses": [...],
  "ethAddress": "0x...",
  "table": {
    "localNode": {...},
    "nodes": [...]
  },
  "archivist": {
    "version": "v0.1.0",
    "revision": "abc123",
    "contracts": "def456"
  }
}
```

### Lookup Peer (System Testing Only)

Look up a peer's information by ID.

- **Endpoint:** `GET /debug/peer/{peerId}`
- **Method:** GET
- **Parameters:**
  - `peerId` (path, required) - Peer identifier
- **Response:** DebugPeerRecord
- **Status Codes:**
  - 200: Success
  - 500: Server error

### Set Testing Option (System Testing Only)

Set a testing configuration option.

- **Endpoint:** `POST /debug/testing/option/{key}/{value}`
- **Method:** POST
- **Parameters:**
  - `key` (path, required)
  - `value` (path, required)
- **Status Codes:**
  - 200: Success

---

## Common Response Models

### DataItem
```json
{
  "cid": "string",
  "manifest": {
    "treeCid": "string",
    "datasetSize": "integer",
    "blockSize": "integer",
    "protected": "boolean",
    "filename": "string (optional)",
    "mimetype": "string (optional)"
  }
}
```

### DataList
```json
{
  "content": [
    {
      "cid": "string",
      "manifest": {...}
    }
  ]
}
```

### StorageRequest
```json
{
  "id": "string",
  "client": "string",
  "ask": {
    "slots": "integer",
    "slotSize": "integer",
    "duration": "integer",
    "proofProbability": "string",
    "pricePerBytePerSecond": "string",
    "collateralPerByte": "string",
    "maxSlotLoss": "integer"
  },
  "content": {
    "cid": "string"
  },
  "expiry": "integer",
  "nonce": "string"
}
```

### Purchase
```json
{
  "state": "string (cancelled|errored|failed|finished|pending|started|submitted|unknown)",
  "error": "string (nullable)",
  "request": {...},
  "requestId": "string"
}
```

### Space
```json
{
  "totalBlocks": "integer",
  "quotaMaxBytes": "integer",
  "quotaUsedBytes": "integer",
  "quotaReservedBytes": "integer"
}
```

---

## Authentication

All endpoints currently require no authentication.

---

## Notes

- All decimal string parameters (durations, prices, etc.) should be passed as string representations of integers
- CIDs follow the IPFS/IPLD content identifier format
- MultiAddress follows the libp2p multiaddr specification
- SPR (Signed Peer Record) is a base64-encoded peer record used for peer discovery

---

*Generated from http://api.archivist.storage/ - Archivist API v0.0.1*
