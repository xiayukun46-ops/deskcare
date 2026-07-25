// ════════════════════════════════════════════════════════════════
// 动态托盘菜单构建
// ════════════════════════════════════════════════════════════════
//
// 菜单结构（从上到下）：
// ┌─────────────────────────┐
// │ 🧘 久坐拉伸  剩余 23:14 │  ← disabled 状态行（不可点击）
// │ 👁 眼部放松  剩余 08:42 │
// │ 🔄 提肛运动  剩余 45:00 │
// │ 🌬 呼吸训练  剩余 71:33 │
// │ ─────────────────────── │  ← 分隔线
// │ ⏸ 暂停全部计时          │  ← 可点击操作项
// │ ⚡ 立即提醒            │
// │ ⚙ 设置               │
// │ ─────────────────────── │
// │ ✕ 退出 DeskCare        │
// └─────────────────────────┘
//
// 每 5 秒由 Timer 引擎重建菜单，更新倒计时文字。

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    AppHandle, Wry,
};

use crate::models::timer::{EngineSnapshot, reminder_meta};

/// 构建带动态倒计时的托盘菜单
///
/// - `snapshot`：当前 TimerEngine 快照，包含各类计时器的 remaining_seconds
pub fn build_dynamic_menu(
    app: &AppHandle,
    snapshot: &EngineSnapshot,
) -> tauri::Result<tauri::menu::Menu<Wry>> {
    let mut builder = MenuBuilder::new(app);

    // ── 1. 状态行：每类提醒的 emoji + 名称 + 剩余时间 ──
    for ty in &["stretch", "eye_relax", "kegel", "breathing"] {
        let meta = reminder_meta(ty);
        let remaining_text = snapshot
            .timers
            .get(*ty)
            .map(|info| {
                let tag = if info.paused { " ⏸" } else { "" };
                format_remaining(info.remaining_seconds, tag)
            })
            .unwrap_or_else(|| "--:--".into());

        // 状态行使用 disabled MenuItem，不可点击
        let label = format!("{} {}  {}", meta.emoji, meta.label, remaining_text);
        let item = MenuItemBuilder::with_id(format!("status_{}", ty), label)
            .enabled(false)
            .build(app)?;
        builder = builder.item(&item);
    }

    // ── 2. 分隔线 ──
    let sep1 = tauri::menu::PredefinedMenuItem::separator(app)?;
    builder = builder.item(&sep1);

    // ── 3. 暂停/恢复全部 ──
    let pause_label = if snapshot.global_paused {
        "▶  继续全部计时"
    } else {
        "⏸  暂停全部计时"
    };
    let pause_item = MenuItemBuilder::with_id("toggle_pause_all", pause_label).build(app)?;
    builder = builder.item(&pause_item);

    // ── 4. 立即提醒子菜单 ──
    let trigger_now_item = MenuItemBuilder::with_id("trigger_now", "⚡ 立即提醒")
        .enabled(true)
        .build(app)?;
    builder = builder.item(&trigger_now_item);

    // ── 5. 设置 ──
    let settings_item =
        MenuItemBuilder::with_id("open_settings", "⚙ 设置").build(app)?;
    builder = builder.item(&settings_item);

    // ── 6. 分隔线 ──
    let sep2 = tauri::menu::PredefinedMenuItem::separator(app)?;
    builder = builder.item(&sep2);

    // ── 7. 退出 ──
    let quit_item =
        MenuItemBuilder::with_id("quit_app", "✕ 退出 DeskCare").build(app)?;
    builder = builder.item(&quit_item);

    builder.build()
}

// ════════════════════════════════════════════════════════════════
// 工具函数
// ════════════════════════════════════════════════════════════════

/// 将秒数格式化为 "MM:SS" 或 "HH:MM:SS"
fn format_remaining(total_seconds: i64, suffix: &str) -> String {
    if total_seconds <= 0 {
        return "现在！".into();
    }
    let h = total_seconds / 3600;
    let m = (total_seconds % 3600) / 60;
    let s = total_seconds % 60;
    if h > 0 {
        format!("{:02}:{:02}:{:02}{}", h, m, s, suffix)
    } else {
        format!("{:02}:{:02}{}", m, s, suffix)
    }
}
