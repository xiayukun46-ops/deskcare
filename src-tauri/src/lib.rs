use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let settings = models::settings::AppSettings::default();
    let settings_state = commands::settings::SettingsState(Mutex::new(settings));

    tauri::Builder::default()
        .manage(settings_state)
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle();

            notifications::request_permission(handle);
            tray::create_tray(handle)?;
            scheduler::init(handle)?;
            power::init_lock_detector();

            log::info!("🎯 DeskCare 启动完成 — 后台常驻运行中");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::increment_health,
            commands::settings::get_health_score,
            commands::scheduler::get_engine_snapshot,
            commands::scheduler::pause_timer,
            commands::scheduler::toggle_timer,
            commands::scheduler::toggle_global_pause,
            commands::scheduler::trigger_reminder_now,
            commands::scheduler::set_reminder_interval,
            commands::stats::get_today_stats,
        ])
        .run(tauri::generate_context!())
        .expect("DeskCare 启动失败");
}

mod tray;
mod scheduler;
mod notifications;
mod commands;
mod models;
mod power;
