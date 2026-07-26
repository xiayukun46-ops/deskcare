use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ════════════════════════════════════════════════════════════════
// Timer 引擎核心数据结构
// ════════════════════════════════════════════════════════════════

/// 单类提醒的运行时倒计时信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerInfo {
    /// 剩余秒数（实时递减）
    pub remaining_seconds: i64,
    /// 配置的总秒数（重置时使用）
    pub total_seconds: i64,
    /// 是否已暂停
    pub paused: bool,
}

impl TimerInfo {
    pub fn new(total_seconds: i64) -> Self {
        Self {
            remaining_seconds: total_seconds,
            total_seconds,
            paused: false,
        }
    }

    /// 从分钟数构建
    pub fn from_minutes(minutes: u64) -> Self {
        let secs = (minutes * 60) as i64;
        Self::new(secs)
    }

    /// 重置倒计时为满值
    pub fn reset(&mut self) {
        self.remaining_seconds = self.total_seconds;
    }

    /// 更新总时长（分钟），同时重置
    pub fn set_interval_minutes(&mut self, minutes: u64) {
        self.total_seconds = (minutes * 60) as i64;
        self.reset();
    }
}

/// 全局 Timer 引擎（线程安全共享状态）
///
/// 维护四类提醒的倒计时。每秒 tick 一次，
/// 归零时触发通知 + 弹窗 + 前端事件。
#[derive(Debug)]
pub struct TimerEngine {
    /// key: "stretch" | "eye_relax" | "kegel" | "breathing"
    pub timers: HashMap<String, TimerInfo>,
    /// 全局暂停开关（不影响单个暂停标志）
    pub global_paused: bool,
}

impl Default for TimerEngine {
    fn default() -> Self {
        let mut timers = HashMap::new();
        timers.insert("stretch".into(), TimerInfo::from_minutes(45));
        timers.insert("eye_relax".into(), TimerInfo::from_minutes(20));
        timers.insert("kegel".into(), TimerInfo::from_minutes(60));
        timers.insert("breathing".into(), TimerInfo::from_minutes(90));
        Self {
            timers,
            global_paused: false,
        }
    }
}

impl TimerEngine {
    /// 所有计时器 Tick 1 秒。返回归零的提醒类型列表。
    pub fn tick_all(&mut self) -> Vec<String> {
        if self.global_paused {
            return vec![];
        }

        let mut triggered: Vec<String> = vec![];

        for (key, info) in self.timers.iter_mut() {
            if info.paused {
                continue;
            }
            info.remaining_seconds = (info.remaining_seconds - 1).max(0);
            if info.remaining_seconds == 0 {
                triggered.push(key.clone());
                info.reset(); // 立即重置，开始下一轮
            }
        }

        triggered
    }

    /// 暂停/恢复某个类型的计时器
    pub fn set_paused(&mut self, ty: &str, paused: bool) {
        if let Some(info) = self.timers.get_mut(ty) {
            info.paused = paused;
        }
    }

    /// 立即触发某类提醒（归零，由 tick_loop 接管触发逻辑）
    pub fn trigger_now(&mut self, ty: &str) -> bool {
        if let Some(info) = self.timers.get_mut(ty) {
            info.remaining_seconds = 0;
            // 不 reset，留给 tick_loop 下次 tick 检测归零并处理
            true
        } else {
            false
        }
    }

    /// 修改某类提醒的间隔（分钟）
    pub fn set_interval_minutes(&mut self, ty: &str, minutes: u64) {
        if let Some(info) = self.timers.get_mut(ty) {
            info.set_interval_minutes(minutes);
        }
    }
    /// 重置全部计时器为满值
    pub fn reset_all(&mut self) {
        for info in self.timers.values_mut() {
            info.reset();
        }
    }

    /// 生成前端可消费的快照
    pub fn snapshot(&self) -> EngineSnapshot {
        let timers = self
            .timers
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect();
        EngineSnapshot {
            timers,
            global_paused: self.global_paused,
        }
    }
}

/// 通过 IPC 传给前端的快照
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineSnapshot {
    pub timers: HashMap<String, TimerInfo>,
    pub global_paused: bool,
}

// ════════════════════════════════════════════════════════════════
// 提醒事件 Payload（广播到前端）
// ════════════════════════════════════════════════════════════════

/// 单次提醒触发时的完整载荷
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReminderPayload {
    /// "stretch" | "eye_relax" | "kegel" | "breathing"
    pub reminder_type: String,
    /// 中文标题
    pub title: String,
    /// 随机选取的动作指令正文
    pub body: String,
    /// 通知发送时间
    pub timestamp: String,
}

// ════════════════════════════════════════════════════════════════
// 提醒类型全量配置表
// ════════════════════════════════════════════════════════════════

/// 每类提醒的静态元数据
pub struct ReminderMeta {
    /// Tray 菜单显示名称
    pub label: &'static str,
    /// 托盘菜单 emoji
    pub emoji: &'static str,
    /// 通知标题
    pub notify_title: &'static str,
    /// 默认间隔（分钟）
    pub default_minutes: u64,
}

/// 四类提醒的元数据查询表
pub fn reminder_meta(ty: &str) -> ReminderMeta {
    match ty {
        "stretch" => ReminderMeta {
            label: "久坐拉伸",
            emoji: "🧘",
            notify_title: "该动一动啦！",
            default_minutes: 45,
        },
        "eye_relax" => ReminderMeta {
            label: "眼部放松",
            emoji: "👁",
            notify_title: "让眼睛休息一下！",
            default_minutes: 20,
        },
        "kegel" => ReminderMeta {
            label: "提肛运动",
            emoji: "🔄",
            notify_title: "提肛运动时间！",
            default_minutes: 60,
        },
        "breathing" => ReminderMeta {
            label: "呼吸训练",
            emoji: "🌬",
            notify_title: "来一次深呼吸！",
            default_minutes: 90,
        },
        _ => ReminderMeta {
            label: "未知",
            emoji: "⏱",
            notify_title: "DeskCare 提醒",
            default_minutes: 60,
        },
    }
}
