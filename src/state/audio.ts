import * as ex from 'excalibur'

let currentSong: ex.Sound | null = null

export abstract class AudioManager {
  static playSong(song: ex.Sound) {
    if (currentSong) {
      currentSong.stop()
    }

    currentSong = song
    currentSong.play()
    currentSong.loop = true
  }

  static playSfx(
    sfx: ex.Sound,
    opts: { volume?: number; ignoreIfPlaying?: boolean } = {}
  ) {
    const { volume = 0.7, ignoreIfPlaying = false } = opts

    if (ignoreIfPlaying || !sfx.isPlaying()) {
      sfx.play(volume)
    }
  }
}
