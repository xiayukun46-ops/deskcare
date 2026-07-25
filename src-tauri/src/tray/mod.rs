// ════════════════════════════════════════════════════════════════
// 系统托盘 (System Tray) 模块
// ════════════════════════════════════════════════════════════════

use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, Emitter,
};

pub mod menu;

/// 创建系统托盘图标
pub fn create_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let initial_snapshot = crate::models::timer::EngineSnapshot {
        timers: Default::default(),
        global_paused: false,
    };
    let menu = menu::build_dynamic_menu(app, &initial_snapshot)?;

    register_menu_events(app);

    let _tray = TrayIconBuilder::with_id("deskcare-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("DeskCare — 每一个小时，对自己好一点")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray_handle, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_panel(tray_handle.app_handle());
            }
        })
        .build(app)?;

    log::info!("✅ 系统托盘已创建");
    Ok(())
}

// ── 菜单事件处理 ──

fn register_menu_events(app: &tauri::AppHandle) {
    app.on_menu_event(move |app_handle, event| {
        match event.id().as_ref() {
            "toggle_pause_all" => {
                let current_paused = {
                    if let Some(eng) = crate::scheduler::get_engine() {
                        let eng = eng.blocking_lock();
                        eng.global_paused
                    } else {
                        false
                    }
                };
                tauri::async_runtime::spawn(async move {
                    crate::scheduler::set_global_paused(!current_paused).await;
                });
                let _ = app_handle.emit(
                    "timer-state-changed",
                    serde_json::json!({ "global_paused": !current_paused }),
                );
            }
            "trigger_now" => {
                let app = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    crate::scheduler::trigger_now(&app, "stretch").await;
                });
            }
            "open_settings" => {
                if let Some(window) = app_handle.get_webview_window("tray-panel") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("navigate", "settings");
                }
            }
            "quit_app" => {
                log::info!("用户选择退出 DeskCare");
                app_handle.exit(0);
            }
            _ => {}
        }
    });
}

// ── 面板切换 ──

fn toggle_panel(app: &tauri::AppHandle) {
    let Some(window) = app.get_webview_window("tray-panel") else {
        log::warn!("⚠️ 未找到 tray-panel 窗口");
        return;
    };

    match window.is_visible() {
        Ok(true) => {
            let _ = window.hide();
        }
        _ => {
            if let Ok(Some(monitor)) = window.primary_monitor() {
                let scale = monitor.scale_factor();
                // to_logical 直接返回值，不是 Option
                let size = monitor.size().to_logical::<f64>(scale);
                let x = size.width - 360.0;
                let y = 28.0;
                let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
            }
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.set_always_on_top(true);
        }
    }
}
