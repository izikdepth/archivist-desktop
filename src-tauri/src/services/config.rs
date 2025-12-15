use serde::{Deserialize, Serialize};
use crate::error::{ArchivistError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    // General settings
    pub theme: Theme,
    pub language: String,
    pub start_minimized: bool,
    pub start_on_boot: bool,

    // Node settings
    pub node: NodeSettings,

    // Sync settings
    pub sync: SyncSettings,

    // V2 Marketplace settings (optional)
    #[cfg(feature = "marketplace")]
    pub blockchain: Option<BlockchainSettings>,

    #[cfg(feature = "marketplace")]
    pub marketplace: Option<MarketplaceSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeSettings {
    pub data_directory: String,
    pub api_port: u16,
    pub p2p_port: u16,
    pub max_storage_gb: u32,
    pub auto_start: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSettings {
    pub auto_sync: bool,
    pub sync_interval_seconds: u32,
    pub bandwidth_limit_mbps: Option<u32>,
    pub exclude_patterns: Vec<String>,
}

#[cfg(feature = "marketplace")]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockchainSettings {
    pub network: String,
    pub rpc_url: String,
    pub wallet_address: Option<String>,
}

#[cfg(feature = "marketplace")]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceSettings {
    pub enabled: bool,
    pub auto_renew_storage: bool,
    pub max_price_per_gb: Option<f64>,
}

impl Default for AppConfig {
    fn default() -> Self {
        let data_dir = dirs::data_dir()
            .map(|p| p.join("archivist"))
            .unwrap_or_else(|| std::path::PathBuf::from(".archivist"))
            .to_string_lossy()
            .to_string();

        Self {
            theme: Theme::System,
            language: "en".to_string(),
            start_minimized: false,
            start_on_boot: false,
            node: NodeSettings {
                data_directory: data_dir,
                api_port: 5001,
                p2p_port: 4001,
                max_storage_gb: 10,
                auto_start: true,
            },
            sync: SyncSettings {
                auto_sync: true,
                sync_interval_seconds: 300,
                bandwidth_limit_mbps: None,
                exclude_patterns: vec![
                    "*.tmp".to_string(),
                    "*.temp".to_string(),
                    ".DS_Store".to_string(),
                    "Thumbs.db".to_string(),
                ],
            },
            #[cfg(feature = "marketplace")]
            blockchain: None,
            #[cfg(feature = "marketplace")]
            marketplace: None,
        }
    }
}

pub struct ConfigService {
    config: AppConfig,
    config_path: std::path::PathBuf,
}

impl ConfigService {
    pub fn new() -> Self {
        let config_path = dirs::config_dir()
            .map(|p| p.join("archivist").join("config.toml"))
            .unwrap_or_else(|| std::path::PathBuf::from("config.toml"));

        let config = Self::load_from_file(&config_path)
            .unwrap_or_default();

        Self {
            config,
            config_path,
        }
    }

    fn load_from_file(path: &std::path::Path) -> Result<AppConfig> {
        if !path.exists() {
            return Ok(AppConfig::default());
        }

        let contents = std::fs::read_to_string(path)
            .map_err(|e| ArchivistError::ConfigError(e.to_string()))?;

        toml::from_str(&contents)
            .map_err(|e| ArchivistError::ConfigError(e.to_string()))
    }

    pub fn get(&self) -> AppConfig {
        self.config.clone()
    }

    pub fn update(&mut self, config: AppConfig) -> Result<()> {
        self.config = config;
        self.save()
    }

    pub fn save(&self) -> Result<()> {
        // Ensure parent directory exists
        if let Some(parent) = self.config_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| ArchivistError::ConfigError(e.to_string()))?;
        }

        let contents = toml::to_string_pretty(&self.config)
            .map_err(|e| ArchivistError::ConfigError(e.to_string()))?;

        std::fs::write(&self.config_path, contents)
            .map_err(|e| ArchivistError::ConfigError(e.to_string()))?;

        log::info!("Configuration saved to {:?}", self.config_path);
        Ok(())
    }

    pub fn reset_to_defaults(&mut self) -> Result<()> {
        self.config = AppConfig::default();
        self.save()
    }
}

impl Default for ConfigService {
    fn default() -> Self {
        Self::new()
    }
}
