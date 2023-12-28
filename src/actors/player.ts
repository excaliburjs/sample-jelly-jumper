import * as ex from 'excalibur'
import { Resources } from '../resources'
import { AnimationComponent } from '../components/AnimationComponent'
import { RaycastComponent } from '../components/RaycastComponent'
import { InputComponent } from '../components/InputComponent'

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
  /* Constants */

  /**
   * The amount of friction to apply to the player when they are on the ground and not
   * moving left or right.
   */
  GROUND_FRICTION = 0.925

  /**
   * The amount of acceleration to apply to the player when they are walking or running.
   */
  ACCELERATION = 384

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

  IDLE_JUMP_FORCE = 300
  WALK_JUMP_FORCE = 375
  RUN_JUMP_FORCE = 330

  /**
   * The amount of time the player must be running before they can sprint.
   */
  SPRINT_TRIGGER_TIME = 500

  /**
   * The base duration of each frame in the player's animation.
   * This gets modified based on the player's velocity.
   */
  FRAME_DURATION = 140

  /* Components */

  animation = new AnimationComponent({
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
    sprint: ex.Animation.fromSpriteSheet(
      spritesheet,
      [8, 9, 10, 11],
      this.FRAME_DURATION
    ),
    jump: ex.Animation.fromSpriteSheet(spritesheet, [12], this.FRAME_DURATION),
    fall: ex.Animation.fromSpriteSheet(spritesheet, [13], this.FRAME_DURATION),
    turn: ex.Animation.fromSpriteSheet(spritesheet, [16], this.FRAME_DURATION),
    ladder_climb: ex.Animation.fromSpriteSheet(
      spritesheet,
      [20, 21],
      this.FRAME_DURATION
    ),
    wall_climb: ex.Animation.fromSpriteSheet(
      spritesheet,
      [24, 25, 26],
      this.FRAME_DURATION
    ),
  })
  raycast = new RaycastComponent()
  input = new InputComponent()

  /* State */

  sprintTimer = 0

  constructor(x: number, y: number) {
    super({
      name: 'Player',
      pos: new ex.Vector(x, y),
      anchor: new ex.Vector(0.5, 1),
      width: 16,
      height: 16,
      collisionType: ex.CollisionType.Active,
      collider: ex.Shape.Box(10, 16, ex.vec(0.5, 1)),
    })

    this.addComponent(this.animation)
    this.addComponent(this.raycast)
    this.addComponent(this.input)
  }

  onInitialize() {
    // offset sprite to account for anchor
    this.graphics.offset = new ex.Vector(0, 16)
    this.animation.set('idle')
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.handleInput(engine, delta)
  }

  onPostUpdate(engine: ex.Engine, delta: number): void {
    // set jump/fall animation if we're in the air
    if (this.vel.y !== 0 && !this.raycast.isOnGround()) {
      if (this.vel.y < 0) {
        this.animation.set('jump')
      } else {
        this.animation.set('fall')
      }
    }

    // decelerate if we're over the max velocity or stopped walking
    // (i think this is what causes the oscillating max speed behaviour in SNES mario)
    if (Math.abs(this.vel.x) > this.maxVelocity || !this.isMoving) {
      this.applyGroundFriction()
    }

    // increment the sprint timer if we're running
    if (
      this.isRunning &&
      // allow a little bit of wiggle room as we're not always at max velocity
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

    // speed up the animation the faster we're moving
    this.animation.speed = Math.min(
      // increase anim speed exponentially up to 3x
      1 + Math.pow(Math.abs(this.vel.x) / 200, 2) * 3,
      3
    )

    // if standing on slope, apply force to counteract gravity
    const slopeAngle = this.raycast.isOnSlope()
    if (slopeAngle) {
      const gravity = ex.Physics.acc
      const gravityAngle = Math.atan2(gravity.y, gravity.x)
      const angle = gravityAngle - slopeAngle
      const magnitude = Math.sqrt(gravity.x * gravity.x + gravity.y * gravity.y)
      const forceX = Math.cos(angle) * magnitude
      this.acc.x += forceX
      console.log(this.vel.y)
    }
  }

  /**
   * Process user input to control the character
   */
  handleInput(engine: ex.Engine, delta: number) {
    const jumpPressed = this.input.wasPressed('Jump')
    const jumpHeld = this.input.isHeld('Jump')
    const isOnGround = this.raycast.isOnGround()

    // move left or right
    if (this.input.isHeld('Left') || this.input.isHeld('Right')) {
      const isHoldingLeft = this.input.isHeld('Left')
      const direction = isHoldingLeft ? -1 : 1
      this.acc.x = this.ACCELERATION * direction
      this.graphics.flipHorizontal = isHoldingLeft

      // if we're turning around, apply more friction to slow down faster
      if (isOnGround) {
        if (this.vel.x * direction < 0) {
          this.animation.set('turn')
          this.applyGroundFriction()
        } else {
          if (this.isSprinting) {
            this.animation.set(
              'sprint',
              this.animation.current === this.animation.get('run')
                ? this.animation.current.currentFrameIndex
                : 0
            )
          } else {
            this.animation.set(
              'run',
              this.animation.current === this.animation.get('sprint')
                ? this.animation.current.currentFrameIndex
                : 0
            )
          }
        }
      }
    }
    // if we're not holding left or right, stop accelerating
    else {
      this.acc.x = 0

      if (isOnGround) {
        // if we're not moving, play the idle animation
        if (this.vel.x === 0) {
          this.animation.set('idle')
        }
      }
    }

    if (jumpPressed && isOnGround) {
      this.jump()
    }
  }

  jump() {
    let jumpForce = this.IDLE_JUMP_FORCE

    // if (this.isWalking) {
    //   jumpForce = this.WALK_JUMP_FORCE
    // } else if (this.isRunning) {
    //   jumpForce = this.RUN_JUMP_FORCE
    // }

    this.vel.y = -jumpForce
  }

  get isMoving() {
    return this.input.isHeld('Left') || this.input.isHeld('Right')
  }

  get isRunning() {
    return this.isMoving && this.scene.engine.input.keyboard.isHeld(ex.Keys.S)
  }

  get isSprinting() {
    return (
      this.isRunning &&
      this.sprintTimer >= this.SPRINT_TRIGGER_TIME &&
      Math.abs(this.vel.x) >= this.RUN_MAX_VELOCITY
    )
  }

  get maxVelocity() {
    switch (true) {
      case this.isSprinting:
        return this.SPRINT_MAX_VELOCITY
      case this.isRunning:
        return this.RUN_MAX_VELOCITY
      default:
        return this.WALK_MAX_VELOCITY
    }
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
