// Tauri command handlers

pub mod node;
pub mod files;
pub mod sync;
pub mod peers;
pub mod system;

// Re-export all commands for registration
pub use node::*;
pub use files::*;
pub use sync::*;
pub use peers::*;
pub use system::*;

// V2 Marketplace commands (conditionally compiled)
#[cfg(feature = "marketplace")]
pub mod wallet;
#[cfg(feature = "marketplace")]
pub mod marketplace;

#[cfg(feature = "marketplace")]
pub use wallet::*;
#[cfg(feature = "marketplace")]
pub use marketplace::*;
