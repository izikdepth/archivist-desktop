// Feature flag constants

export const FEATURES = {
  // V1 features - always enabled
  NODE_MANAGEMENT: true,
  FILE_UPLOAD: true,
  FILE_DOWNLOAD: true,
  FOLDER_SYNC: true,
  PEER_CONNECTION: true,
  SYSTEM_TRAY: true,

  // V2 features - enabled via compile-time feature flags
  MARKETPLACE: false, // Will be true when built with `--features marketplace`
  WALLET: false,
  ZK_PROOFS: false,
  SMART_CONTRACTS: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}
