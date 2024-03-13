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

  /**
   * Plays a sound effect if the sound is not already playing
   */
  static playSfx(sfx: ex.Sound, opts: PlaySfxOptions = {}) {
    const { volume = 0.7, force = false } = opts

    if (force || !sfx.isPlaying()) {
      sfx.play(volume)
    }
  }
}

interface PlaySfxOptions {
  /**
   * The volume to play the sound at (0.0 to 1.0)
   *
   * @default 0.7
   */
  volume?: number

  /**
   * If true, the sound will play even if it is already playing
   *
   * @default false
   */
  force?: boolean
}
