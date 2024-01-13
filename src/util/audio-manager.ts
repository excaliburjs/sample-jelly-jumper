import * as ex from 'excalibur'

class AudioManager {
  currentSong: ex.Sound | null = null
  engine!: ex.Engine

  init(engine: ex.Engine) {
    this.engine = engine
  }

  playSong(song: ex.Sound) {
    if (this.currentSong) {
      this.currentSong.stop()
    }

    this.currentSong = song
    this.currentSong.play()
    this.currentSong.loop = true
  }

  playSfx(
    sfx: ex.Sound,
    opts: { volume?: number; ignoreIfPlaying?: boolean } = {}
  ) {
    const { volume = 0.7, ignoreIfPlaying = false } = opts

    if (ignoreIfPlaying || !sfx.isPlaying()) {
      sfx.play(volume)
    }
  }
}

export const audioManager = new AudioManager()
