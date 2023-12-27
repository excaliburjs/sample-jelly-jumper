import * as ex from 'excalibur'

/**
 * Allows you to set the animations on the actor by key, adjust the speed of the animations,
 * and get the current animation.
 */
export class AnimationComponent<Keys extends string> extends ex.Component {
  declare owner: ex.Entity & { graphics: ex.GraphicsComponent }

  type = 'animation'

  private _animations: Record<Keys, ex.Animation>
  private _speed = 1
  private _frameDurations = new WeakMap<ex.Frame, number>()

  constructor(animations: Record<Keys, ex.Animation>) {
    super()
    this._animations = animations
  }

  /**
   * Sets the current animation starting from the beginning. If the animation is already playing,
   * it will not be restarted.
   */
  set(name: Keys, startFromBeginning = true) {
    const anim = this._animations[name]

    // return if the animation is already playing
    if (this.current === anim) return

    this.owner.graphics.use(anim)

    // reset the animation to the beginning
    if (startFromBeginning) {
      anim.reset()
    }
  }

  /**
   * Returns the animation by name.
   */
  get(name: Keys) {
    return this._animations[name]
  }

  /**
   * Sets the speed of the animation. 1 is normal speed, 2 is double speed, etc.
   */
  set speed(value: number) {
    this._speed = value

    if (value === 0) return

    this.current.frames.forEach((frame) => {
      // store the initial duration of the frame
      if (!this._frameDurations.has(frame)) {
        this._frameDurations.set(frame, frame.duration ?? 0)
      }

      const baseDuration = this._frameDurations.get(frame)!
      frame.duration = baseDuration / value
    })
  }

  /**
   * Returns the speed of the animation.
   */
  get speed() {
    return this._speed
  }

  /**
   * Returns the current animation.
   */
  get current() {
    return this.owner.graphics.current[0]?.graphic as ex.Animation
  }
}
