// ════════════════════════════════════════════════════════════════
// 禅意磬音 — Web Audio API 合成的颂钵敲击声
// ════════════════════════════════════════════════════════════════
//
// 声学设计（模拟西藏颂钵的物理声学特征）：
//   - 敲击瞬态：极短白噪声 (30ms) 模拟木槌触碰金属
//   - 基频 528 Hz（Solfeggio "转化"频率，冥想常用）
//   - 5 层谐波泛音 (1× 2× 3× 4× 6×)，无 5 倍频避免尖锐
//   - 高频谐波比低频衰减更快 — 符合金属振动物理规律
//   - ±1.5 Hz 随机 detune 产生微幅拍音 (beating)，增添"活"的质感
//   - 总衰减约 3.5 秒，尾部融入静默
//
// 零外部依赖，全部由 AudioContext 实时合成。

/** 谐波配置：频率倍数 / 相对衰减速度（越小越持久） */
interface HarmonicVoice {
  ratio: number       // 基频倍数
  decaySpeed: number  // 相对衰减速度 (1.0 = 标准)
  gain: number        // 相对响度
}

const HARMONICS: HarmonicVoice[] = [
  { ratio: 1.0,  decaySpeed: 1.0,  gain: 0.28 },  // 基频 528 Hz — 最持久
  { ratio: 2.0,  decaySpeed: 1.6,  gain: 0.18 },  // 1st 八度
  { ratio: 3.0,  decaySpeed: 2.2,  gain: 0.10 },  // 八度+五度 (≈ third overtone)
  { ratio: 4.0,  decaySpeed: 2.8,  gain: 0.06 },  // 2nd 八度
  { ratio: 6.0,  decaySpeed: 3.5,  gain: 0.03 },  // 高泛音 — 快速消逝
]

/** 敲击瞬态时长（秒） */
const STRIKE_DURATION = 0.03
/** 磬音总时长（秒） */
const TOTAL_DURATION = 3.8
/** 基频 (Hz) */
const FUNDAMENTAL = 528.0
/** 随机 detune 幅度 (Hz) */
const DETUNE_SPREAD = 1.5

/**
 * 播放一次颂钵磬音。
 * 每次调用的 detune 值略有不同，产生自然的音色变化。
 */
export function playCompletionChime(): void {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime

    // ── ① 敲击瞬态 — 短白噪声模拟木槌触钵 ──
    strikeTransient(ctx, now)

    // ── ② 基频 + 泛音层 ──
    for (const voice of HARMONICS) {
      // 左右声道独立随机 detune，产生立体声感
      playVoice(ctx, now, voice, -DETUNE_SPREAD)
      playVoice(ctx, now, voice, +DETUNE_SPREAD)
    }

    // ── 清理 ──
    setTimeout(() => {
      ctx.close().catch(() => {})
    }, TOTAL_DURATION * 1000 + 500)
  } catch {
    // 极端情况：AudioContext 不可用
  }
}

/** 生成一个 -0.5 ~ +0.5 的随机数 */
function randHalf(): number {
  return Math.random() - 0.5
}

/**
 * 单层谐波振荡器 — 连接到立体声 panner + gain 包络
 */
function playVoice(
  ctx: AudioContext,
  now: number,
  voice: HarmonicVoice,
  detuneOffset: number,
): void {
  const freq = FUNDAMENTAL * voice.ratio + detuneOffset * randHalf()

  // 振荡器：纯正弦波
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq

  // 增益包络
  const gain = ctx.createGain()
  // 攻击：10ms 快速起音
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(voice.gain, now + 0.01)
  // 衰减：根据 decaySpeed 计算指数衰减时间
  const decayDuration = TOTAL_DURATION / voice.decaySpeed
  gain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration)

  // 立体声定位（微幅偏移，模拟空间感）
  const panner = ctx.createStereoPanner()
  panner.pan.value = detuneOffset / DETUNE_SPREAD * 0.3 // ±30% 声道偏移

  osc.connect(gain)
  gain.connect(panner)
  panner.connect(ctx.destination)

  osc.start(now + 0.005) // 比敲击瞬态稍晚 5ms
  osc.stop(now + TOTAL_DURATION / voice.decaySpeed + 0.2)
}

/**
 * 敲击瞬态 — 极短白噪声 + 快速带通滤波，模拟木槌碰金属
 */
function strikeTransient(ctx: AudioContext, now: number): void {
  // 白噪声源
  const bufferSize = Math.floor(ctx.sampleRate * STRIKE_DURATION)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  // 带通滤波器：集中在 2-8 kHz，模拟金属碰触
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 4000
  bandpass.Q.value = 0.7

  // 增益包络：极快 attack + 快速衰减
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.12, now + 0.002)  // 2ms attack
  gain.gain.exponentialRampToValueAtTime(0.001, now + STRIKE_DURATION)

  noise.connect(bandpass)
  bandpass.connect(gain)
  gain.connect(ctx.destination)

  noise.start(now)
  noise.stop(now + STRIKE_DURATION + 0.01)
}
