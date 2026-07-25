use serde::{Deserialize, Serialize};

/// 每日统计
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DailyStats {
    /// 今日日期 (YYYY-MM-DD)
    pub date: String,
    /// 各类型提醒完成次数
    pub completions: ReminderCompletions,
    /// 连续打卡天数
    pub streak_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ReminderCompletions {
    pub stretch: u32,
    pub eye_relax: u32,
    pub kegel: u32,
    pub breathing: u32,
}

/// 单条提醒日志
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReminderLog {
    pub id: u64,
    pub reminder_type: String,
    pub triggered_at: String,
    pub completed: bool,
    pub snoozed: bool,
}
