// ════════════════════════════════════════════════════════════════
// Timer 调度器 IPC 命令
// ════════════════════════════════════════════════════════════════

use crate::models::timer::EngineSnapshot;

// ── 查询类 ──

/// 获取所有计时器的当前快照（供前端初始化/轮询）
#[tauri::command]
pub async fn get_engine_snapshot() -> Result<EngineSnapshot, String> {
    crate::scheduler::get_snapshot()
        .await
        .ok_or_else(|| "Timer 引擎尚未初始化".into())
}

// ── 控制类 ──

/// 暂停/恢复某类提醒
#[tauri::command]
pub async fn pause_timer(reminder_type: String, paused: bool) -> Result<String, String> {
    crate::scheduler::set_paused(&reminder_type, paused).await;
    let status = if paused { "已暂停" } else { "已恢复" };
    Ok(format!("{} {}", reminder_type, status))
}

/// toggle_timer — 前端开关调用的别名，与 pause_timer 语义相反
/// enabled=true 即 paused=false
#[tauri::command]
pub async fn toggle_timer(reminder_type: String, enabled: bool) -> Result<String, String> {
    crate::scheduler::set_paused(&reminder_type, !enabled).await;
    let status = if enabled { "已启用" } else { "已停用" };
    Ok(format!("{} {}", reminder_type, status))
}

/// 全局暂停/恢复
#[tauri::command]
pub async fn toggle_global_pause(paused: bool) -> Result<String, String> {
    crate::scheduler::set_global_paused(paused).await;
    let status = if paused { "已暂停全部计时" } else { "已恢复全部计时" };
    Ok(status.into())
}

/// 立即触发某类提醒（不等倒计时归零）
#[tauri::command]
pub async fn trigger_reminder_now(app: tauri::AppHandle, reminder_type: String) -> Result<String, String> {
    let ok = crate::scheduler::trigger_now(&app, &reminder_type).await;
    if ok {
        Ok(format!("已立即触发 {}", reminder_type))
    } else {
        Err(format!("未找到计时器: {}", reminder_type))
    }
}

/// 修改某类提醒的间隔
#[tauri::command]
pub async fn set_reminder_interval(reminder_type: String, minutes: u64) -> Result<String, String> {
    if minutes < 5 {
        return Err("间隔不能小于 5 分钟".into());
    }
    crate::scheduler::set_interval_minutes(&reminder_type, minutes).await;
    Ok(format!("{} 间隔已更新为 {} 分钟", reminder_type, minutes))
}
