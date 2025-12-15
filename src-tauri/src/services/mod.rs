// Service layer - trait-based abstractions for V2 extensibility

pub mod config;
pub mod files;
pub mod node;
pub mod peers;
pub mod sync;

pub use config::ConfigService;
pub use files::FileService;
pub use node::NodeService;
pub use peers::PeerService;
pub use sync::SyncService;

// V2 Marketplace services (conditionally compiled)
#[cfg(feature = "marketplace")]
mod wallet;
#[cfg(feature = "marketplace")]
mod marketplace;

#[cfg(feature = "marketplace")]
pub use wallet::WalletService;
#[cfg(feature = "marketplace")]
pub use marketplace::MarketplaceService;
