// ════════════════════════════════════════════════════════════════
// 通知模块 — 系统原生通知
// ════════════════════════════════════════════════════════════════

use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

/// 发送系统原生通知。
/// tauri-plugin-notification v2 使用链式 API: builder().title().body().show()
pub fn send_native(app: &AppHandle, title: &str, body: &str) {
    let _ = app
        .notification()
        .builder()
        .title(title)
        .body(body)
        .show();
}

/// 检查并记录通知权限状态
pub fn request_permission(app: &AppHandle) {
    // tauri-plugin-notification v2: permission_state() 替代 is_permission_granted()
    match app.notification().permission_state() {
        Ok(state) => log::info!("📢 通知权限状态: {:?}", state),
        Err(e) => log::warn!("⚠️ 检查通知权限失败: {}", e),
    }
}

pub mod sound;
