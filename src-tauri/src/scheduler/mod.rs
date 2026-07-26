use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::models::timer::{
    EngineSnapshot, ReminderPayload, TimerEngine, reminder_meta,
};

pub mod stretch;
pub mod eye_relax;
pub mod kegel;
pub mod breathing;

// ── 全局句柄 ──

pub type SharedEngine = Arc<Mutex<TimerEngine>>;
static ENGINE: std::sync::OnceLock<SharedEngine> = std::sync::OnceLock::new();

pub fn get_engine() -> Option<SharedEngine> {
    ENGINE.get().cloned()
}

// ── 用户空闲检测 ──

const IDLE_RESET_SECS: u64 = 300; // 5 分钟

static WAS_IDLE: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "windows")]
fn get_idle_seconds() -> u64 {
    #[repr(C)]
    struct LASTINPUTINFO { cbSize: u32, dwTime: u32 }
    extern "system" { fn GetLastInputInfo(plii: *mut LASTINPUTINFO) -> i32; fn GetTickCount() -> u32; }
    unsafe {
        let mut lii = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        if GetLastInputInfo(&mut lii) != 0 {
            let tick = GetTickCount();
            if tick >= lii.dwTime { ((tick - lii.dwTime) / 1000) as u64 } else { 0 }
        } else { 0 }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_idle_seconds() -> u64 { 0 }

async fn check_idle_and_reset(engine: &SharedEngine) {
    let secs = get_idle_seconds();
    if secs >= IDLE_RESET_SECS {
        if !WAS_IDLE.swap(true, Ordering::SeqCst) {
            log::info!("💤 用户 {} 秒未操作 — 暂停并重置全部计时器", secs);
            let mut eng = engine.lock().await;
            eng.global_paused = true;
            eng.reset_all();
        }
    } else if WAS_IDLE.swap(false, Ordering::SeqCst) {
        log::info!("👋 用户回归 — 恢复计时（已重置）");
        let mut eng = engine.lock().await;
        eng.global_paused = false;
    }
}

// ── 初始化 ──

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let engine = Arc::new(Mutex::new(TimerEngine::default()));
    let _ = ENGINE.set(engine.clone());

    let app_clone = app.clone();
    let engine_clone = engine.clone();

    tauri::async_runtime::spawn(async move {
        tick_loop(app_clone, engine_clone).await;
    });

    log::info!("✅ DeskCare Timer 引擎已启动");
    Ok(())
}

// ── 主 Tick 循环 ──

async fn tick_loop(app: AppHandle, engine: SharedEngine) {
    let mut ticker = interval(Duration::from_secs(1));
    let mut menu_update_counter: u32 = 0;

    loop {
        ticker.tick().await;

        check_idle_and_reset(&engine).await;

        let triggered: Vec<String> = {
            let mut eng = engine.lock().await;
            eng.tick_all()
        };

        for ty in &triggered {
            handle_reminder_triggered(&app, ty).await;
        }

        menu_update_counter = (menu_update_counter + 1) % 5;
        if menu_update_counter == 0 {
            update_tray_menu_text(&app, &engine).await;
        }

        {
            let eng = engine.lock().await;
            let _ = app.emit("timer-tick", eng.snapshot());
        }
    }
}

// ── 提醒触发 ──

async fn handle_reminder_triggered(app: &AppHandle, reminder_type: &str) {
    let meta = reminder_meta(reminder_type);
    let body = random_action(reminder_type).unwrap_or_else(|| "该休息一下了".into());

    let payload = ReminderPayload {
        reminder_type: reminder_type.into(),
        title: meta.notify_title.into(),
        body: body.clone(),
        timestamp: chrono::Local::now().to_rfc3339(),
    };

    log::info!("🔔 [{}] {} — {}", reminder_type, payload.title, payload.body);

    let _ = app
        .notification()
        .builder()
        .title(&payload.title)
        .body(&payload.body)
        .show();

    let _ = app.emit("reminder-triggered", &payload);

    show_reminder_modal(app, &payload);
}

// ── 弹窗唤醒 ──

fn show_reminder_modal(app: &AppHandle, payload: &ReminderPayload) {
    let Some(window) = app.get_webview_window("reminder-modal") else {
        log::warn!("⚠️ 找不到 reminder-modal 窗口");
        return;
    };
    let _ = window.emit("show-reminder", payload);
    let _ = window.center();
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.set_always_on_top(true);
    log::info!("🪟 reminder-modal 已弹出");
}

// ── 动态菜单 ──

async fn update_tray_menu_text(app: &AppHandle, engine: &SharedEngine) {
    let snapshot = { engine.lock().await.snapshot() };
    let Some(tray) = app.tray_by_id("deskcare-tray") else { return };
    if let Ok(menu) = crate::tray::menu::build_dynamic_menu(app, &snapshot) {
        let _ = tray.set_menu(Some(menu));
    }
}

// ── 公共 API ──

pub async fn set_paused(ty: &str, paused: bool) {
    if let Some(eng) = get_engine() {
        eng.lock().await.set_paused(ty, paused);
    }
}

pub async fn set_global_paused(paused: bool) {
    if let Some(eng) = get_engine() {
        eng.lock().await.global_paused = paused;
    }
}

pub async fn trigger_now(app: &AppHandle, ty: &str) -> bool {
    if let Some(eng) = get_engine() {
        let ok = eng.lock().await.trigger_now(ty);
        if ok {
            handle_reminder_triggered(app, ty).await;
        }
        ok
    } else {
        false
    }
}

pub async fn set_interval_minutes(ty: &str, minutes: u64) {
    if let Some(eng) = get_engine() {
        eng.lock().await.set_interval_minutes(ty, minutes);
    }
}

pub async fn get_snapshot() -> Option<EngineSnapshot> {
    if let Some(eng) = get_engine() {
        Some(eng.lock().await.snapshot())
    } else {
        None
    }
}

// ── 随机动作 ──

fn random_action(ty: &str) -> Option<String> {
    let actions: &[&str] = match ty {
        "stretch" => stretch::ACTIONS,
        "eye_relax" => eye_relax::ACTIONS,
        "kegel" => kegel::ACTIONS,
        "breathing" => breathing::ACTIONS,
        _ => return None,
    };
    if actions.is_empty() { return None; }
    use std::time::SystemTime;
    let idx = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.subsec_nanos() as usize % actions.len())
        .unwrap_or(0);
    Some(actions[idx].to_string())
}