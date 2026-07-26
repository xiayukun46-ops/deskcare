import { useSettingsStore } from '../../stores/settingsStore'
import { useSettings } from '../../hooks/useSettings'
import { Icon } from '../shared/Icon'

function TimeSliderWidget({ label, value, min, max, step = 5, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-mono font-semibold text-primary-600 tabular-nums">{value} 分钟</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-[10px] text-gray-400"><span>{min} min</span><span>{max} min</span></div>
    </div>
  )
}

export function SettingsPanel() {
  const settings = useSettingsStore((s) => s.settings)
  const updateInterval = useSettingsStore((s) => s.updateInterval)
  const updateNotification = useSettingsStore((s) => s.updateNotification)
  const updateGeneral = useSettingsStore((s) => s.updateGeneral)
  const { saveSettings } = useSettings()

  const handleIntervalChange = (key: 'stretchMinutes' | 'eyeRelaxMinutes' | 'kegelMinutes' | 'breathingMinutes', value: number) => {
    updateInterval(key, value)
    saveSettings({ ...settings, intervals: { ...settings.intervals, [key]: value } })
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">提醒间隔</h3>
        <div className="space-y-4">
          <TimeSliderWidget label="久坐拉伸" value={settings.intervals.stretchMinutes} min={15} max={90}
            onChange={(v) => handleIntervalChange('stretchMinutes', v)} />
          <TimeSliderWidget label="眼部放松" value={settings.intervals.eyeRelaxMinutes} min={10} max={45}
            onChange={(v) => handleIntervalChange('eyeRelaxMinutes', v)} />
          <TimeSliderWidget label="提肛运动" value={settings.intervals.kegelMinutes} min={30} max={120}
            onChange={(v) => handleIntervalChange('kegelMinutes', v)} />
          <TimeSliderWidget label="呼吸训练" value={settings.intervals.breathingMinutes} min={30} max={180}
            onChange={(v) => handleIntervalChange('breathingMinutes', v)} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">通知偏好</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Icon name="bell-off" size={16} className="text-gray-400" />
              <span className="text-xs text-gray-700">夜间静音</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.notification.silentMode}
                onChange={() => updateNotification({ silentMode: !settings.notification.silentMode })} />
              <span className="toggle-slider" />
            </label>
          </div>
          {settings.notification.silentMode && (
            <div className="flex items-center gap-2 pl-7 text-xs text-gray-500">
              <span>静音时段</span>
              <input type="time" value={settings.notification.silentStart}
                onChange={(e) => updateNotification({ silentStart: e.target.value })}
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5" />
              <span>至</span>
              <input type="time" value={settings.notification.silentEnd}
                onChange={(e) => updateNotification({ silentEnd: e.target.value })}
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5" />
            </div>
          )}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Icon name="info" size={16} className="text-gray-400" />
              <span className="text-xs text-gray-700">显示通知预览</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.notification.showPreview}
                onChange={() => updateNotification({ showPreview: !settings.notification.showPreview })} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">通用</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-700">开机自动启动</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.general.launchAtLogin}
                onChange={() => updateGeneral({ launchAtLogin: !settings.general.launchAtLogin })} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </section>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-700">语言 / Language</span>
            <select value={settings.general.language}
              onChange={(e) => updateGeneral({ language: e.target.value })}
              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white">
              <option value="zh-CN">中文</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
              <option value="ja">日本語</option>
            </select>
          </div>
      <div className="pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">DeskCare v0.1.0 - 让健康成为习惯</p>
      </div>
    </div>
  )
}
