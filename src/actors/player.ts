import * as ex from 'excalibur'
import { Resources } from '../resources'

const spritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.img_player,
  grid: {
    columns: 4,
    rows: 6,
    spriteWidth: 48,
    spriteHeight: 48,
  },
})

export default class Player extends ex.Actor {
  /**
   * The amount of friction to apply to the player when they are on the ground and not
   * moving left or right.
   */
  GROUND_FRICTION = 0.925

  /**
   * The amount of acceleration to apply to the player when they are walking or running.
   */
  ACCELERATION = 24 * 16

  /**
   * The maximum velocity the player can walk at.
   */
  WALK_MAX_VELOCITY = 80

  /**
   * The maximum velocity the player can run at.
   */
  RUN_MAX_VELOCITY = 140

  /**
   * The maximum velocity the player can sprint at (triggers when running for a while)
   */
  SPRINT_MAX_VELOCITY = 185

  /**
   * The amount of time the player must be running before they can sprint.
   */
  SPRINT_TRIGGER_TIME = 300

  /**
   * The base duration of each frame in the player's animation.
   * This gets modified based on the player's velocity.
   */
  FRAME_DURATION = 140

  animations = {
    idle: ex.Animation.fromSpriteSheet(
      spritesheet,
      [0, 1, 2, 3],
      this.FRAME_DURATION
    ),
    run: ex.Animation.fromSpriteSheet(
      spritesheet,
      [4, 5, 6, 7],
      this.FRAME_DURATION
    ),
    jump: ex.Animation.fromSpriteSheet(spritesheet, [8], this.FRAME_DURATION),
    fall: ex.Animation.fromSpriteSheet(spritesheet, [9], this.FRAME_DURATION),
    wall_slide: ex.Animation.fromSpriteSheet(
      spritesheet,
      [12],
      this.FRAME_DURATION
    ),
    ladder_climb: ex.Animation.fromSpriteSheet(
      spritesheet,
      [16, 17],
      this.FRAME_DURATION
    ),
    wall_climb: ex.Animation.fromSpriteSheet(
      spritesheet,
      [20, 21, 22],
      this.FRAME_DURATION
    ),
  }

  sprintTimer = 0

  constructor(x: number, y: number) {
    super({
      name: 'Player',
      pos: new ex.Vector(x, y),
      anchor: new ex.Vector(0.5, 1),
      width: 16,
      height: 16,
      collisionType: ex.CollisionType.Active,
    })
  }

  onInitialize() {
    // offset sprite to account for anchor
    this.graphics.offset = new ex.Vector(0, 16)
    this.setAnimation('idle')
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.handleInput(engine, delta)
  }

  onPostUpdate(engine: ex.Engine, delta: number): void {
    const maxVelocity = (() => {
      switch (true) {
        case this.isSprinting:
          return this.SPRINT_MAX_VELOCITY
        case this.isRunning:
          return this.RUN_MAX_VELOCITY
        default:
          return this.WALK_MAX_VELOCITY
      }
    })()

    // decelerate if we're over the max velocity or stopped walking
    // (i think this is what causes the oscillating max speed behaviour in SNES mario)
    if (Math.abs(this.vel.x) > maxVelocity || !this.isWalking) {
      this.applyGroundFriction()
    }

    // increment the sprint timer if we're running
    if (
      this.isRunning &&
      Math.abs(this.vel.x) >= this.RUN_MAX_VELOCITY * 0.95
    ) {
      this.sprintTimer = Math.min(
        this.sprintTimer + delta,
        this.SPRINT_TRIGGER_TIME
      )
    }
    // reset the sprint timer if we're not running
    else if (!this.isRunning) {
      this.sprintTimer = 0
    }

    // modify the current animation frame duration based on the player's velocity
    this.getCurrentAnimation().frames.forEach((frame) => {
      frame.duration = Math.max(
        30,
        this.FRAME_DURATION - Math.abs(this.vel.x) / 2
      )
    })
  }

  /**
   * Process user input to control the character
   */
  handleInput(engine: ex.Engine, delta: number) {
    // move left or right
    if (this.isWalking) {
      const isHoldingLeft = engine.input.keyboard.isHeld(ex.Keys.Left)
      const direction = isHoldingLeft ? -1 : 1
      this.acc.x = this.ACCELERATION * direction

      // if we're turning around, apply more friction to slow down faster
      if (this.vel.x * direction < 0) {
        this.applyGroundFriction()
      }

      this.graphics.flipHorizontal = isHoldingLeft
      this.setAnimation('run')
    }
    // if we're not holding left or right, stop accelerating
    else {
      this.acc.x = 0

      // if we're not moving, play the idle animation
      if (this.vel.x === 0) {
        this.setAnimation('idle')
      }
    }
  }

  /**
   * Sets the current animation starting from the beginning. If the animation is already playing,
   * it will not be restarted.
   */
  setAnimation(key: keyof typeof this.animations) {
    const anim = this.animations[key]

    // if we're already playing this animation, don't restart it
    if (this.getCurrentAnimation() === anim) return

    this.graphics.use(anim)

    // reset the animation to the beginning
    anim.reset()
  }

  /**
   * Returns the current animation.
   */
  getCurrentAnimation() {
    return this.graphics.current[0]?.graphic as ex.Animation
  }

  get isWalking() {
    return (
      this.scene.engine.input.keyboard.isHeld(ex.Keys.Left) ||
      this.scene.engine.input.keyboard.isHeld(ex.Keys.Right)
    )
  }

  get isRunning() {
    return this.isWalking && this.scene.engine.input.keyboard.isHeld(ex.Keys.S)
  }

  get isSprinting() {
    return this.isRunning && this.sprintTimer >= this.SPRINT_TRIGGER_TIME
  }

  /**
   * Applies ground friction to the player's velocity.
   */
  applyGroundFriction(friction = this.GROUND_FRICTION) {
    if (this.vel.x > 1 || this.vel.x < -1) {
      this.vel.x *= friction
    } else {
      this.vel.x = 0
    }
  }
}

/**
 * NOTES
 *
 * SNES Mario speeds (https://www.smwcentral.net/?p=viewthread&t=97883)
 *
 * sp = sub pixel
 * 16 sp = 1 pixel
 *
 * walking max speed: 21sp per frame = 1.3125 pixels per frame = 78.75 pixels per second
 * running max speed: 37sp per frame = 2.3125 pixels per frame = 138.75 pixels per second
 * sprinting max speed: 49sp per frame = 3.0625 pixels per frame = 183.75 pixels per second
 *
 * acceleration rate: 1.5sp per frame = 0.09375 pixels per frame = 5.625 pixels per second
 *
 * Mario max speed oscillates in a 0-1-0-1-2 pattern. When mario jumps, his speed stays at that value until he lands.
 *
 * I wonder if this is because mario decelerates when he crosses the max velocity on the ground? I accidentally
 * managed to mimic this behaviour by doing this
 */
