import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFeatures } from '../hooks/useFeatures';

interface AppSettings {
  node: {
    port: number;
    dataDir: string;
    autoStart: boolean;
  };
  sync: {
    autoUpload: boolean;
    debounceMs: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    minimizeToTray: boolean;
  };
  // V2 settings (present but unused in v1)
  blockchain: {
    network?: string;
    rpcUrl?: string;
  };
  marketplace: {
    providerMode: boolean;
  };
}

const defaultSettings: AppSettings = {
  node: {
    port: 8080,
    dataDir: '',
    autoStart: true,
  },
  sync: {
    autoUpload: true,
    debounceMs: 1000,
  },
  ui: {
    theme: 'system',
    minimizeToTray: true,
  },
  blockchain: {},
  marketplace: {
    providerMode: false,
  },
};

function Settings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { marketplaceEnabled } = useFeatures();

  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await invoke<AppSettings>('get_settings');
        setSettings(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await invoke('save_settings', { settings });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(
    section: K,
    key: keyof AppSettings[K],
    value: AppSettings[K][keyof AppSettings[K]]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return <div className="page">Loading settings...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Settings</h2>
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">Settings saved successfully!</div>}

      <div className="settings-section">
        <h3>Node</h3>
        <div className="setting-item">
          <label>API Port</label>
          <input
            type="number"
            value={settings.node.port}
            onChange={(e) => updateSetting('node', 'port', parseInt(e.target.value))}
          />
        </div>
        <div className="setting-item">
          <label>Data Directory</label>
          <input
            type="text"
            value={settings.node.dataDir}
            onChange={(e) => updateSetting('node', 'dataDir', e.target.value)}
            placeholder="Default location"
          />
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.node.autoStart}
              onChange={(e) => updateSetting('node', 'autoStart', e.target.checked)}
            />
            Start node automatically with app
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Sync</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.sync.autoUpload}
              onChange={(e) => updateSetting('sync', 'autoUpload', e.target.checked)}
            />
            Automatically upload new files in watched folders
          </label>
        </div>
        <div className="setting-item">
          <label>Debounce delay (ms)</label>
          <input
            type="number"
            value={settings.sync.debounceMs}
            onChange={(e) => updateSetting('sync', 'debounceMs', parseInt(e.target.value))}
            min={100}
            max={10000}
          />
          <span className="hint">Wait time before uploading after file changes</span>
        </div>
      </div>

      <div className="settings-section">
        <h3>Interface</h3>
        <div className="setting-item">
          <label>Theme</label>
          <select
            value={settings.ui.theme}
            onChange={(e) => updateSetting('ui', 'theme', e.target.value as 'light' | 'dark' | 'system')}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.ui.minimizeToTray}
              onChange={(e) => updateSetting('ui', 'minimizeToTray', e.target.checked)}
            />
            Minimize to system tray instead of closing
          </label>
        </div>
      </div>

      {/* V2 Settings - Only shown when marketplace enabled */}
      {marketplaceEnabled && (
        <>
          <div className="settings-section">
            <h3>Blockchain</h3>
            <div className="setting-item">
              <label>Network</label>
              <select
                value={settings.blockchain.network || ''}
                onChange={(e) => updateSetting('blockchain', 'network', e.target.value)}
              >
                <option value="">Select network</option>
                <option value="arbitrum-one">Arbitrum One</option>
                <option value="arbitrum-sepolia">Arbitrum Sepolia (Testnet)</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Custom RPC URL (optional)</label>
              <input
                type="text"
                value={settings.blockchain.rpcUrl || ''}
                onChange={(e) => updateSetting('blockchain', 'rpcUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Marketplace</h3>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.marketplace.providerMode}
                  onChange={(e) => updateSetting('marketplace', 'providerMode', e.target.checked)}
                />
                Enable provider mode (sell storage)
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Settings;
