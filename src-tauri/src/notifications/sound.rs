/// 提示音播放模块 (预留)
/// 可集成 rodio crate 播放本地音频文件
/// 当前版本使用系统通知自带的声音提示

pub fn play_reminder_sound() {
    // TODO: 集成 rodio 播放自定义音效
    // use rodio::{Decoder, OutputStream, Sink};
    // let (_stream, handle) = OutputStream::try_default().unwrap();
    // let sink = Sink::try_new(&handle).unwrap();
    // let file = std::fs::File::open("assets/chime.wav").unwrap();
    // sink.append(Decoder::new(file).unwrap());
    // sink.sleep_until_end();
}
