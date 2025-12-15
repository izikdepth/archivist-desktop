// Node API types - matches archivist-node/openapi.yaml

export interface NodeInfo {
  version: string;
  localNode: {
    peerId: string;
    addrs: string[];
  };
}

export interface UploadResponse {
  cid: string;
}

export interface PeerInfo {
  peerId: string;
  addresses: string[];
}

export interface StorageInfo {
  used: number;
  available: number;
  totalSlots: number;
  usedSlots: number;
}

// V2 API types (not used in v1 but defined for consistency)

export interface SalesSlot {
  id: string;
  cid: string;
  size: number;
  price: string;
  expiry: string;
}

export interface Availability {
  id: string;
  totalSize: number;
  freeSize: number;
  duration: number;
  minPrice: string;
}

export interface Purchase {
  id: string;
  request: {
    cid: string;
    duration: number;
    pricePerSlot: string;
  };
  state: 'pending' | 'submitted' | 'started' | 'finished' | 'errored' | 'cancelled';
}
