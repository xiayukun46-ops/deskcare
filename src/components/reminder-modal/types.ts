// ════════════════════════════════════════════════════════════════
// 提醒弹窗共享类型定义（与 Rust ReminderPayload 对齐）
// ════════════════════════════════════════════════════════════════

/**
 * Rust 后端通过 tauri emit 发送的提醒载荷。
 *
 * 对应 src-tauri/src/models/timer.rs 中的 ReminderPayload。
 */
export interface ReminderPayload {
  /** "stretch" | "eye_relax" | "kegel" | "breathing" */
  reminder_type: string
  /** 通知标题，如 "该动一动啦！" */
  title: string
  /** 随机选取的动作指令正文 */
  body: string
  /** ISO-8601 格式时间戳 */
  timestamp: string
}
