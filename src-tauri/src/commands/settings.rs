// ════════════════════════════════════════════════════════════════
// 设置 IPC 命令
// ════════════════════════════════════════════════════════════════

use tauri::State;

use crate::models::settings::AppSettings;

/// Tauri 托管状态包装 — 应用设置
pub struct SettingsState(pub std::sync::Mutex<AppSettings>);

/// 获取当前设置
#[tauri::command]
pub fn get_settings(state: State<SettingsState>) -> AppSettings {
    state.0.lock().unwrap().clone()
}

/// 全量更新设置（前端提交表单时调用）
#[tauri::command]
pub fn update_settings(
    state: State<SettingsState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    let mut current = state.0.lock().unwrap();
    *current = settings.clone();

    // 同步更新 Timer 引擎中的间隔配置
    let intervals = &settings.intervals;
    // 注意：这里不阻塞等待 — 后台 spawn 异步更新定时器间隔
    let stretch = intervals.stretch_minutes;
    let eye = intervals.eye_relax_minutes;
    let kegel = intervals.kegel_minutes;
    let breath = intervals.breathing_minutes;

    tauri::async_runtime::spawn(async move {
        crate::scheduler::set_interval_minutes("stretch", stretch).await;
        crate::scheduler::set_interval_minutes("eye_relax", eye).await;
        crate::scheduler::set_interval_minutes("kegel", kegel).await;
        crate::scheduler::set_interval_minutes("breathing", breath).await;
    });

    log::info!("✅ 设置已更新");
    Ok(settings)
}

/// 增加健康值（每次完成打卡 +1）
#[tauri::command]
pub fn increment_health(state: State<SettingsState>) -> Result<u64, String> {
    let mut current = state.0.lock().unwrap();
    current.general.health_score += 1;
    log::info!("❤️ 健康值 +1 → {}", current.general.health_score);
    Ok(current.general.health_score)
}

/// 获取当前健康值
#[tauri::command]
pub fn get_health_score(state: State<SettingsState>) -> u64 {
    state.0.lock().unwrap().general.health_score
}
