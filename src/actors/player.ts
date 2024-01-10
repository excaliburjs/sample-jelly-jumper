import * as ex from 'excalibur'
import { Resources } from '../resources'
import { AnimationComponent } from '../components/animation'
import { InputComponent } from '../components/input'
import { PhysicsActor } from './physics-actor'

const spritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.img_player,
  grid: {
    columns: 4,
    rows: 6,
    spriteWidth: 48,
    spriteHeight: 48,
  },
})

export default class Player extends PhysicsActor {
  /* Constants */

  /**
   * The amount of acceleration to apply to the player when they are walking or running.
   */
  ACCELERATION = 365

  STOP_DECELERATION = this.ACCELERATION
  TURN_DECELERATION = this.ACCELERATION * 2

  /**
   * The maximum velocity the player can walk at.
   */
  WALK_MAX_VELOCITY = 90

  /**
   * The maximum velocity the player can run at.
   */
  RUN_MAX_VELOCITY = 150

  /**
   * The maximum velocity the player can sprint at (triggers when running for a while)
   */
  SPRINT_MAX_VELOCITY = 210

  /**
   * The amount of time the player must be running before they can sprint.
   */
  SPRINT_TRIGGER_TIME = 1000

  IDLE_JUMP_FORCE = 300
  RUN_JUMP_FORCE = 330
  SPRINT_JUMP_FORCE = 375

  /* Components */

  animation = new AnimationComponent({
    idle: ex.Animation.fromSpriteSheet(spritesheet, [0, 1, 2, 3], 140),
    run: ex.Animation.fromSpriteSheet(spritesheet, [4, 5, 6, 7], 140),
    sprint: ex.Animation.fromSpriteSheet(spritesheet, [8, 9, 10, 11], 140),
    jump: ex.Animation.fromSpriteSheet(spritesheet, [12], 140),
    fall: ex.Animation.fromSpriteSheet(spritesheet, [13], 140),
    turn: ex.Animation.fromSpriteSheet(spritesheet, [16], 140),
    ladder_climb: ex.Animation.fromSpriteSheet(spritesheet, [20, 21], 140),
    wall_climb: ex.Animation.fromSpriteSheet(spritesheet, [28, 29, 30], 140),
  })
  input = new PlayerInputComponent()

  /* State */
  // (none yet)

  constructor(args: { x: number; y: number; z?: number }) {
    super({
      ...args,
      name: 'Player',
      anchor: new ex.Vector(0.5, 1),
      width: 16,
      height: 16,
      collisionType: ex.CollisionType.Active,
      collider: ex.Shape.Box(10, 16, ex.vec(0.5, 1)),
      // collider: ex.Shape.Capsule(10, 16, ex.vec(0.5, -8)),
    })

    this.addComponent(this.animation)
    this.addComponent(this.input)
  }

  onInitialize(engine: ex.Engine) {
    super.onInitialize(engine)

    // offset sprite to account for anchor
    this.graphics.offset = new ex.Vector(0, 16)
    this.animation.set('idle')

    this.on('precollision', this.onPreCollision.bind(this))
    this.on('postcollision', this.onPostCollision.bind(this))
  }

  onPreCollision(ev: ex.PreCollisionEvent) {}

  onPostCollision(ev: ex.PostCollisionEvent) {}

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.handleInput(engine, delta)
  }

  update(engine: ex.Engine, delta: number): void {
    this.acc.setTo(0, 0)
    super.update(engine, delta)
  }

  onPostUpdate(engine: ex.Engine, delta: number): void {
    // speed up the animation the faster we're moving
    this.animation.speed = Math.min(
      // increase anim speed exponentially up to 3x
      1 + Math.pow(Math.abs(this.vel.x) / 200, 2) * 3,
      3
    )

    this.handleAnimation()
    this.applyDeceleration()
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
      const accel = this.ACCELERATION * direction

      this.graphics.flipHorizontal = isHoldingLeft

      this.acc.x += accel
    }

    if (jumpPressed && isOnGround) {
      this.jump()
    } else if (!jumpHeld && this.vel.y < 0) {
      this.vel.y *= 0.5
    }
  }

  /**
   * Sets the player's animation based on their current state.
   */
  handleAnimation() {
    const isOnGround = this.raycast.isOnGround()
    const currentFrameIndex = this.animation.current.currentFrameIndex
    const currentFrameTimeLeft = this.animation.current.currentFrameTimeLeft

    if (isOnGround) {
      if (this.input.isTurning) {
        this.animation.set('turn')
      } else {
        const isMovingInInputDirection =
          (!this.input.isHeld('Left') && !this.input.isHeld('Right')) ||
          (this.input.isHeld('Left') && this.vel.x < 0) ||
          (this.input.isHeld('Right') && this.vel.x > 0)

        if (isMovingInInputDirection) {
          if (this.input.isSprinting) {
            const fromRunToSprint = this.animation.current === this.animation.get('run')
            this.animation.set(
              'sprint', 
                fromRunToSprint
                  ? currentFrameIndex
                  : 0,
                fromRunToSprint
                  ? currentFrameTimeLeft
                  : 0
            )
          } else if (this.vel.x !== 0) {
            const fromSprintToRun = this.animation.current === this.animation.get('sprint')
            this.animation.set(
              'run',
              fromSprintToRun
                ? currentFrameIndex
                : 0,
              fromSprintToRun 
                ? currentFrameTimeLeft
                : 0
            )
          }
        } else {
          this.animation.set('idle')
        }
      }
      // if we're not moving, play the idle animation
      if (Math.round(this.vel.x) === 0) {
        this.animation.set('idle')
      }
    } else {
      // set jump/fall animation if we're in the air
      if (this.vel.y !== 0) {
        if (this.vel.y < 0) {
          this.animation.set('jump')
        } else {
          this.animation.set('fall')
        }
      }
    }
  }

  jump() {
    let jumpForce = this.IDLE_JUMP_FORCE

    if (this.input.isSprinting) {
      jumpForce = this.SPRINT_JUMP_FORCE
    } else if (this.input.isRunning) {
      jumpForce = this.RUN_JUMP_FORCE
    }

    this.vel.y = -jumpForce
  }

  get maxVelocity() {
    switch (true) {
      case this.input.isSprinting:
        return this.SPRINT_MAX_VELOCITY
      case this.input.isRunning:
        return this.RUN_MAX_VELOCITY
      default:
        return this.WALK_MAX_VELOCITY
    }
  }

  /**
   * Applies ground friction to the player's velocity.
   */
  applyDeceleration() {
    const isOnGround = this.raycast.isOnGround()
    const isOverMaxVelocity = Math.abs(this.vel.x) > this.maxVelocity

    // ground deceleration
    if (isOnGround) {
      // apply turn deceleration if we're turning
      if (this.input.isTurning) {
        this.acc.x = -this.TURN_DECELERATION * Math.sign(this.vel.x)
      }
      // decelerate if we're over the max velocity or stopped walking
      else if (!this.input.isMoving || isOverMaxVelocity) {
        // if we're close to stopping, just stop
        if (Math.abs(this.vel.x) < 3) {
          this.vel.x = 0
          this.acc.x = 0
        } else if (this.vel.x !== 0) {
          this.acc.x = -this.STOP_DECELERATION * Math.sign(this.vel.x)
        }
      }
    }
    // air deceleration
    else {
      if (this.input.isTurning) {
        this.acc.x = -this.TURN_DECELERATION * Math.sign(this.vel.x)
      } else if (isOverMaxVelocity) {
        // in air, clamp to max velocity
        this.vel.x = ex.clamp(this.vel.x, -this.maxVelocity, this.maxVelocity)
        this.acc.x = 0
      }
    }
  }
}

/**
 * Handles user input for the player, adding some extra helper methods
 * to get the intent of movement via input.
 *
 * For example, `isMoving` returns true if the player is holding left or right, but
 * does not necessarily mean the player is actually moving.
 */
class PlayerInputComponent extends InputComponent {
  declare owner: Player

  sprintTimer = 0

  onAdd(owner: Player): void {
    super.onAdd?.(owner)

    // increment the sprint timer to toggle sprinting if we're running for SPRINT_TRIGGER_TIME
    owner.on('postupdate', ({ delta }) => {
      const isOnGround = this.owner.raycast.isOnGround()
      const jumpedBeforeSprinting = !isOnGround && !this.isSprinting
      const isTurningOnGround = this.isTurning && isOnGround

      if (this.isRunning && isOnGround) {
        this.sprintTimer = Math.min(
          this.sprintTimer + delta,
          this.owner.SPRINT_TRIGGER_TIME
        )
      }
      // reset the sprint timer if we're not running
      else if (!this.isRunning || isTurningOnGround || jumpedBeforeSprinting) {
        this.sprintTimer = 0
      }
    })
  }

  get isMoving() {
    return this.isHeld('Left') || this.isHeld('Right')
  }

  get isRunning() {
    return this.isMoving && this.isHeld('Run')
  }

  get isSprinting() {
    return this.isRunning && this.sprintTimer >= this.owner.SPRINT_TRIGGER_TIME
  }

  get isTurning() {
    return (
      (this.isHeld('Left') && this.owner.vel.x > 0) ||
      (this.isHeld('Right') && this.owner.vel.x < 0)
    )
  }
}
/*
Flat Ground Physics
 
                px/s
Max velocity (walking)        - 90
Max velocity (running)        - 150
Max velocity (sprinting)      - 210
End-of-level walk speed       - 75
Airship cutscene walk speed   - 120
 
                px/s^2
Walk/run/sprint acceleration  - 0.1015625
Stop Deceleration (normal)    - 0.1015625
*/
