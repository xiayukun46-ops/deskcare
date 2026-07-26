use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Wry,
};
use crate::models::timer::{EngineSnapshot, reminder_meta};

pub fn build_dynamic_menu(
    app: &AppHandle,
    snapshot: &EngineSnapshot,
) -> tauri::Result<tauri::menu::Menu<Wry>> {
    let mut builder = MenuBuilder::new(app);

    for ty in &["stretch", "eye_relax", "kegel", "breathing"] {
        let meta = reminder_meta(ty);
        let remaining_text = snapshot.timers.get(*ty)
            .map(|info| {
                let tag = if info.paused { " ⏸" } else { "" };
                format_remaining(info.remaining_seconds, tag)
            })
            .unwrap_or_else(|| "--:--".into());
        let label = format!("{} {}  {}", meta.emoji, meta.label, remaining_text);
        let item = MenuItemBuilder::with_id(format!("status_{}", ty), label).enabled(false).build(app)?;
        builder = builder.item(&item);
    }

    builder = builder.item(&tauri::menu::PredefinedMenuItem::separator(app)?);

    let pause_label = if snapshot.global_paused { "▶  继续全部计时" } else { "⏸  暂停全部计时" };
    builder = builder.item(&MenuItemBuilder::with_id("toggle_pause_all", pause_label).build(app)?);

    // 立即提醒子菜单
    let mut trigger_sub = SubmenuBuilder::new(app, "⚡ 立即提醒");
    for ty in &["stretch", "eye_relax", "kegel", "breathing"] {
        let meta = reminder_meta(ty);
        trigger_sub = trigger_sub.item(&MenuItemBuilder::with_id(format!("trigger_{}", ty), format!("{} {}", meta.emoji, meta.label)).build(app)?);
    }
    builder = builder.item(&trigger_sub.build()?);

    builder = builder.item(&MenuItemBuilder::with_id("open_settings", "⚙ 设置").build(app)?);
    builder = builder.item(&tauri::menu::PredefinedMenuItem::separator(app)?);
    builder = builder.item(&MenuItemBuilder::with_id("quit_app", "✕ 退出 DeskCare").build(app)?);

    builder.build()
}

fn format_remaining(total_seconds: i64, suffix: &str) -> String {
    if total_seconds <= 0 { return "现在！".into(); }
    let h = total_seconds / 3600;
    let m = (total_seconds % 3600) / 60;
    let s = total_seconds % 60;
    if h > 0 { format!("{:02}:{:02}:{:02}{}", h, m, s, suffix) }
    else { format!("{:02}:{:02}{}", m, s, suffix) }
}