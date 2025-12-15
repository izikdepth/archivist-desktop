mod commands;
mod error;
mod features;
mod services;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init());

    // Single instance plugin (desktop only)
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
            log::info!("Another instance attempted to start");
        }));
    }

    builder
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Feature detection
            features::get_features,
            // Node commands
            commands::start_node,
            commands::stop_node,
            commands::get_node_status,
            commands::get_node_config,
            commands::set_node_config,
            // File commands
            commands::list_files,
            commands::upload_file,
            commands::download_file,
            commands::delete_file,
            commands::pin_file,
            // Sync commands
            commands::get_sync_status,
            commands::add_watch_folder,
            commands::remove_watch_folder,
            commands::toggle_watch_folder,
            commands::sync_now,
            commands::pause_sync,
            // Peer commands
            commands::get_peers,
            commands::connect_peer,
            commands::disconnect_peer,
            commands::remove_peer,
            // System commands
            commands::get_config,
            commands::save_config,
            commands::reset_config,
            commands::get_app_version,
            commands::get_platform,
            commands::get_arch,
        ])
        .setup(|_app| {
            log::info!("Archivist Desktop v{} starting...", env!("CARGO_PKG_VERSION"));

            // Log feature status
            let features = features::Features::new();
            log::info!("Features: marketplace={}, zk_proofs={}",
                features.marketplace, features.zk_proofs);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Archivist");
}
