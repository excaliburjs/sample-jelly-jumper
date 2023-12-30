import * as ex from 'excalibur'
import { Resources } from '../resources'
import { AnimationComponent } from '../components/AnimationComponent'
import { InputComponent } from '../components/InputComponent'
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

  /**
   * The amount of time the player must be running before they can sprint.
   */
  SPRINT_TRIGGER_TIME = 500

  IDLE_JUMP_FORCE = 300
  WALK_JUMP_FORCE = 375
  RUN_JUMP_FORCE = 330

  /* Components */

  animation = new AnimationComponent({
    idle: ex.Animation.fromSpriteSheet(spritesheet, [0, 1, 2, 3], 140),
    run: ex.Animation.fromSpriteSheet(spritesheet, [4, 5, 6, 7], 140),
    sprint: ex.Animation.fromSpriteSheet(spritesheet, [8, 9, 10, 11], 140),
    jump: ex.Animation.fromSpriteSheet(spritesheet, [12], 140),
    fall: ex.Animation.fromSpriteSheet(spritesheet, [13], 140),
    turn: ex.Animation.fromSpriteSheet(spritesheet, [16], 140),
    ladder_climb: ex.Animation.fromSpriteSheet(spritesheet, [20, 21], 140),
    wall_climb: ex.Animation.fromSpriteSheet(spritesheet, [24, 25, 26], 140),
  })
  input = new PlayerInputComponent()

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

    // decelerate if we're over the max velocity or stopped walking
    // (i think this is what causes the oscillating max speed behaviour in SNES mario)
    if (Math.abs(this.vel.x) > this.maxVelocity || !this.input.isMoving) {
      this.applyGroundFriction()
    }
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

      // if we're turning around, apply more friction to slow down faster
      if (isOnGround) {
        this.acc.x += accel

        if (this.input.isTurning) {
          // apply extra friction to turn around quicker
          this.applyGroundFriction()
        }
      } else {
        this.acc.x += accel
      }
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
            this.animation.set(
              'sprint',
              this.animation.current === this.animation.get('run')
                ? this.animation.current.currentFrameIndex
                : 0
            )
          } else if (this.vel.x !== 0) {
            this.animation.set(
              'run',
              this.animation.current === this.animation.get('sprint')
                ? this.animation.current.currentFrameIndex
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

    // if (this.isWalking) {
    //   jumpForce = this.WALK_JUMP_FORCE
    // } else if (this.input.isRunning) {
    //   jumpForce = this.RUN_JUMP_FORCE
    // }

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
  applyGroundFriction(friction = this.GROUND_FRICTION) {
    if (this.vel.x > 1 || this.vel.x < -1) {
      this.vel.x *= friction
    } else {
      this.vel.x = 0
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
      if (
        this.isRunning &&
        // allow a little bit of wiggle room as we're not always at max velocity
        Math.abs(this.owner.vel.x) >= this.owner.RUN_MAX_VELOCITY * 0.95
      ) {
        this.sprintTimer = Math.min(
          this.sprintTimer + delta,
          this.owner.SPRINT_TRIGGER_TIME
        )
      }
      // reset the sprint timer if we're not running
      else if (!this.isRunning) {
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
    return (
      this.isRunning &&
      this.sprintTimer >= this.owner.SPRINT_TRIGGER_TIME &&
      Math.abs(this.owner.vel.x) >= this.owner.RUN_MAX_VELOCITY
    )
  }

  get isTurning() {
    return (
      (this.isHeld('Left') && this.owner.vel.x > 0) ||
      (this.isHeld('Right') && this.owner.vel.x < 0)
    )
  }
}
