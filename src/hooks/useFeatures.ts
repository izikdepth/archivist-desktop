import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface Features {
  marketplaceEnabled: boolean;
  walletEnabled: boolean;
  zkProofsEnabled: boolean;
}

const defaultFeatures: Features = {
  marketplaceEnabled: false,
  walletEnabled: false,
  zkProofsEnabled: false,
};

export function useFeatures(): Features {
  const [features, setFeatures] = useState<Features>(defaultFeatures);

  useEffect(() => {
    async function loadFeatures() {
      try {
        const result = await invoke<Features>('get_features');
        setFeatures(result);
      } catch {
        // Features command not available, use defaults (v1 mode)
        setFeatures(defaultFeatures);
      }
    }
    loadFeatures();
  }, []);

  return features;
}
