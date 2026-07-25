// ════════════════════════════════════════════════════════════════════
// 电源状态与锁屏感知模块
// ════════════════════════════════════════════════════════════════════
//
// 所有检测通过一个隐藏的 Windows 消息专用窗口完成：
//   - WM_POWERBROADCAST → PBT_APMSUSPEND / PBT_APMRESUMESUSPEND (休眠)
//   - WM_WTSSESSION_CHANGE → WTS_SESSION_LOCK / WTS_SESSION_UNLOCK (锁屏)
//
// 行为：休眠/锁屏 → pause 所有计时器；唤醒/解锁 → resume 所有计时器。
// 使用 Arc<AtomicBool> 去重，防止重复触发。

use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

// ── 去重标志（同一事件可能因 WM 消息重复触发） ──

fn power_paused() -> &'static Arc<AtomicBool> {
    static FLAG: std::sync::OnceLock<Arc<AtomicBool>> = std::sync::OnceLock::new();
    FLAG.get_or_init(|| Arc::new(AtomicBool::new(false)))
}

// ── 公共入口 ──

/// 初始化锁屏 + 休眠监听（内部 spawn 一个 Windows 消息线程）
pub fn init_lock_detector() {
    let _ = power_paused(); // 确保 OnceLock 初始化

    #[cfg(target_os = "windows")]
    {
        std::thread::Builder::new()
            .name("deskcare-power-mon".into())
            .spawn(windows_power_loop)
            .expect("无法启动电源监听线程");
        log::info!("✅ 电源/锁屏检测器已启动");
    }

    #[cfg(not(target_os = "windows"))]
    {
        log::info!("🔒 锁屏/休眠检测暂不支持此平台");
    }
}

// ════════════════════════════════════════════════════════════════
// 暂停 / 恢复逻辑
// ════════════════════════════════════════════════════════════════

fn handle_suspend(reason: &str) {
    let flag = power_paused();
    if flag.load(Ordering::SeqCst) {
        return; // 已暂停，跳过重复
    }
    flag.store(true, Ordering::SeqCst);
    log::info!("💤 {} — 暂停全部计时", reason);

    tauri::async_runtime::spawn(async {
        crate::scheduler::set_global_paused(true).await;
    });
}

fn handle_resume(reason: &str) {
    let flag = power_paused();
    if !flag.load(Ordering::SeqCst) {
        return; // 已在运行，跳过重复
    }
    flag.store(false, Ordering::SeqCst);
    log::info!("⚡ {} — 恢复全部计时", reason);

    tauri::async_runtime::spawn(async {
        crate::scheduler::set_global_paused(false).await;
    });
}

// ════════════════════════════════════════════════════════════════
// Windows 消息窗口 FFI
// ════════════════════════════════════════════════════════════════

#[cfg(target_os = "windows")]
mod ffi {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    pub type HWND = isize;
    pub type WPARAM = usize;
    pub type LPARAM = isize;
    pub type LRESULT = isize;
    pub type UINT = u32;
    pub type DWORD = u32;
    pub type LPCWSTR = *const u16;
    pub type HINSTANCE = isize;
    pub type ATOM = u16;

    pub const HWND_MESSAGE: HWND = -3;

    // WM_POWERBROADCAST
    pub const WM_POWERBROADCAST: UINT = 0x0218;
    pub const PBT_APMSUSPEND: WPARAM = 0x0004;
    pub const PBT_APMRESUMESUSPEND: WPARAM = 0x0007;
    pub const PBT_APMRESUMEAUTOMATIC: WPARAM = 0x0012;

    // WM_WTSSESSION_CHANGE
    pub const WM_WTSSESSION_CHANGE: UINT = 0x02B1;
    pub const WTS_SESSION_LOCK: DWORD = 0x7;
    pub const WTS_SESSION_UNLOCK: DWORD = 0x8;
    pub const NOTIFY_FOR_THIS_SESSION: DWORD = 0;

    pub const WS_OVERLAPPED: DWORD = 0;

    #[repr(C)]
    pub struct WNDCLASSEXW {
        pub cbSize: UINT,
        pub style: UINT,
        pub lpfnWndProc: Option<unsafe extern "system" fn(HWND, UINT, WPARAM, LPARAM) -> LRESULT>,
        pub cbClsExtra: i32,
        pub cbWndExtra: i32,
        pub hInstance: HINSTANCE,
        pub hIcon: isize,
        pub hCursor: isize,
        pub hbrBackground: isize,
        pub lpszMenuName: LPCWSTR,
        pub lpszClassName: LPCWSTR,
        pub hIconSm: isize,
    }

    #[repr(C)]
    pub struct MSG {
        pub hwnd: HWND,
        pub message: UINT,
        pub wParam: WPARAM,
        pub lParam: LPARAM,
        pub time: DWORD,
        pub pt_x: i32,
        pub pt_y: i32,
    }

    #[link(name = "user32")]
    extern "system" {
        pub fn CreateWindowExW(
            dwExStyle: DWORD, lpClassName: LPCWSTR, lpWindowName: LPCWSTR,
            dwStyle: DWORD, X: i32, Y: i32, nWidth: i32, nHeight: i32,
            hWndParent: HWND, hMenu: isize, hInstance: HINSTANCE, lpParam: isize,
        ) -> HWND;
        pub fn DestroyWindow(hWnd: HWND) -> i32;
        pub fn DefWindowProcW(hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM) -> LRESULT;
        pub fn GetMessageW(lpMsg: *mut MSG, hWnd: HWND, wMsgFilterMin: UINT, wMsgFilterMax: UINT) -> i32;
        pub fn DispatchMessageW(lpMsg: *const MSG) -> LRESULT;
        pub fn RegisterClassExW(lpWndClass: *const WNDCLASSEXW) -> ATOM;
        pub fn GetModuleHandleW(lpModuleName: LPCWSTR) -> HINSTANCE;
    }

    #[link(name = "wtsapi32")]
    extern "system" {
        pub fn WTSRegisterSessionNotification(hWnd: HWND, dwFlags: DWORD) -> i32;
        pub fn WTSUnRegisterSessionNotification(hWnd: HWND) -> i32;
    }

    pub fn to_wide(s: &str) -> Vec<u16> {
        OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
    }
}

#[cfg(target_os = "windows")]
fn windows_power_loop() {
    use ffi::*;
    use std::ptr::null;

    unsafe {
        let class_name = to_wide("DeskCarePowerMon");
        let h_inst = GetModuleHandleW(null());

        // ── 窗口过程：处理电源广播 + 会话变更 ──
        unsafe extern "system" fn wnd_proc(
            _hwnd: HWND, msg: UINT, w_param: WPARAM, _l_param: LPARAM,
        ) -> LRESULT {
            match msg {
                WM_POWERBROADCAST => match w_param {
                    PBT_APMSUSPEND => crate::power::handle_suspend("系统休眠"),
                    PBT_APMRESUMESUSPEND | PBT_APMRESUMEAUTOMATIC => {
                        crate::power::handle_resume("系统唤醒")
                    }
                    _ => {}
                },
                WM_WTSSESSION_CHANGE => match w_param as DWORD {
                    WTS_SESSION_LOCK => crate::power::handle_suspend("锁屏"),
                    WTS_SESSION_UNLOCK => crate::power::handle_resume("解锁"),
                    _ => {}
                },
                _ => {}
            }
            DefWindowProcW(_hwnd, msg, w_param, _l_param)
        }

        // ── 注册窗口类 ──
        let wc = WNDCLASSEXW {
            cbSize: std::mem::size_of::<WNDCLASSEXW>() as UINT,
            style: 0,
            lpfnWndProc: Some(wnd_proc),
            cbClsExtra: 0,
            cbWndExtra: 0,
            hInstance: h_inst,
            hIcon: 0, hCursor: 0, hbrBackground: 0,
            lpszMenuName: null(),
            lpszClassName: class_name.as_ptr(),
            hIconSm: 0,
        };

        if RegisterClassExW(&wc) == 0 {
            log::error!("❌ RegisterClassExW 失败");
            return;
        }

        // ── 创建消息专用窗口 ──
        let hwnd = CreateWindowExW(
            0, class_name.as_ptr(), null(), WS_OVERLAPPED,
            0, 0, 0, 0, HWND_MESSAGE, 0, h_inst, 0,
        );

        if hwnd == 0 {
            log::error!("❌ CreateWindowExW 失败");
            return;
        }

        // ── 注册 WTS 会话通知 ──
        if WTSRegisterSessionNotification(hwnd, NOTIFY_FOR_THIS_SESSION) == 0 {
            log::error!("❌ WTSRegisterSessionNotification 失败");
            DestroyWindow(hwnd);
            return;
        }

        log::info!("🔌 电源/锁屏消息窗口就绪");

        // ── 消息循环 ──
        let mut msg: MSG = std::mem::zeroed();
        loop {
            let ret = GetMessageW(&mut msg, 0, 0, 0);
            if ret <= 0 { break; }
            DispatchMessageW(&msg);
        }

        WTSUnRegisterSessionNotification(hwnd);
        DestroyWindow(hwnd);
    }
}
