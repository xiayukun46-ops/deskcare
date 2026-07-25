// ════════════════════════════════════════════════════════════════
// 统计数据 IPC 命令
// ════════════════════════════════════════════════════════════════

use crate::models::stats::DailyStats;

/// 获取今日统计数据
#[tauri::command]
pub fn get_today_stats() -> DailyStats {
    // TODO: 集成持久化存储 (SQLite / 文件) 读写统计数据
    DailyStats::default()
}
