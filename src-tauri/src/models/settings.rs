use serde::{Deserialize, Serialize};

/// 完整应用设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// 各提醒类型的间隔配置
    pub intervals: ReminderIntervals,
    /// 通知偏好
    pub notification: NotificationPrefs,
    /// 通用选项
    pub general: GeneralPrefs,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReminderIntervals {
    /// 久坐拉伸间隔 (分钟)
    pub stretch_minutes: u64,
    /// 眼部放松间隔 (分钟)
    pub eye_relax_minutes: u64,
    /// 提肛运动间隔 (分钟)
    pub kegel_minutes: u64,
    /// 呼吸训练间隔 (分钟)
    pub breathing_minutes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationPrefs {
    /// 是否静音（静默时段不弹通知）
    pub silent_mode: bool,
    /// 静默开始时间 (HH:MM 格式)
    pub silent_start: String,
    /// 静默结束时间 (HH:MM 格式)
    pub silent_end: String,
    /// 是否显示通知内容预览
    pub show_preview: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralPrefs {
    /// 是否开机自启
    pub launch_at_login: bool,
    /// 界面语言
    pub language: String,
    /// 累计健康值（完成打卡次数，永不归零）
    pub health_score: u64,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            intervals: ReminderIntervals {
                stretch_minutes: 45,
                eye_relax_minutes: 20,
                kegel_minutes: 60,
                breathing_minutes: 90,
            },
            notification: NotificationPrefs {
                silent_mode: false,
                silent_start: "22:00".into(),
                silent_end: "07:00".into(),
                show_preview: true,
            },
            general: GeneralPrefs {
                launch_at_login: true,
                language: "zh-CN".into(),
                health_score: 0,
            },
        }
    }
}
