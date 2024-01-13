import * as ex from 'excalibur'
import { Resources } from '../resources'
import { AnimationComponent } from '../components/graphics/animation'
import { ControlsComponent } from '../components/input/controls'
import { PhysicsActor } from '../classes/physics-actor'
import { EnemyActor } from '../classes/enemy-actor'
import { FakeDie } from './fake-die'
import { audioManager } from '../util/audio-manager'

const spritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.img.player,
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
   * The amount of gravity to apply to the player when they are jumping.
   */
  JUMP_GRAVITY = ex.Physics.acc.y * 0.5

  /**
   * The amount of gravity to apply to the player when they are near the apex of their jump.
   */
  APEX_GRAVITY = ex.Physics.acc.y * 0.3

  /**
   * The maximum speed the player can fall at.
   */
  MAX_FALL_SPEED = 270

  /**
   * The amount of acceleration to apply to the player when they are walking or running.
   */
  ACCELERATION = 300

  /**
   * The amount of deceleration to apply to the player when they are stopping (i.e not hold any movement keys)
   */
  STOP_DECELERATION = this.ACCELERATION

  /**
   * The amount of deceleration to apply to the player when they are turning around on the ground.
   */
  GROUND_TURN_DECELERATION = this.ACCELERATION * 4

  /**
   * The amount of deceleration to apply to the player when they are turning around in the air.
   */
  AIR_TURN_DECELERATION = this.ACCELERATION * 7

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

  /**
   * The amount of force to apply to the player when they jump while standing still or walking
   */
  JUMP_FORCE = 300

  /**
   * The amount of force to apply to the player when they jump while running
   */
  RUN_JUMP_FORCE = this.JUMP_FORCE * 1.1

  /**
   * The amount of force to apply to the player when they jump while sprinting
   */
  SPRINT_JUMP_FORCE = this.JUMP_FORCE * 1.2

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
  controls = new PlayerControlsComponent()

  /* State */

  /**
   * True while the user is holding the jump button or reached the
   * apex of their jump before releasing the jump button.
   */
  isUsingJumpGravity = false
  facing: 'left' | 'right' = 'right'

  constructor(args: { x: number; y: number; z?: number }) {
    super({
      ...args,
      name: 'Player',
      anchor: new ex.Vector(0.5, 1),
      width: 16,
      height: 16,
      collisionType: ex.CollisionType.Active,
      collider: ex.Shape.Box(10, 16, ex.vec(0.5, 1)),
    })

    // we'll handle gravity ourselves
    this.body.useGravity = false

    this.addComponent(this.animation)
    this.addComponent(this.controls)

    this.animation.get('turn').events.on('frame', (frame) => {
      if (frame.frameIndex === 0) {
        audioManager.playSfx(Resources.sfx.turnAround)
      }
    })
  }

  onInitialize(engine: ex.Engine) {
    super.onInitialize(engine)

    // offset sprite to account for anchor
    this.graphics.offset = new ex.Vector(0, 16)
    this.animation.set('idle')
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.handleInput(engine, delta)
  }

  update(engine: ex.Engine, delta: number): void {
    let useApexGravity = false

    // if we're jumping use our jump gravity
    if (this.vel.y < 0) {
      this.isUsingJumpGravity = this.controls.isHeld('Jump')
    }

    // if we're near the apex of our jump, use apex gravity
    if (this.isUsingJumpGravity && this.vel.y > -10 && this.vel.y < 10) {
      useApexGravity = true
    }

    // apply gravity and reset X acceleration
    if (useApexGravity) {
      this.acc.setTo(0, this.APEX_GRAVITY)
    } else if (this.isUsingJumpGravity) {
      this.acc.setTo(0, this.JUMP_GRAVITY)
    } else {
      this.acc.setTo(0, ex.Physics.acc.y)
    }

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

    // clamp to max velocity
    if (this.vel.y > this.MAX_FALL_SPEED) {
      this.vel.y = this.MAX_FALL_SPEED
    }

    // reset jump gravity once we land on the ground
    if (this.raycast.isOnGround()) {
      this.isUsingJumpGravity = false
    }
  }

  onPreCollisionResolve(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    super.onPreCollisionResolve(self, other, side, contact)

    if (other.owner instanceof EnemyActor) {
      if (side === ex.Side.Bottom) {
        // jump off enemy
        this.bounceOffEnemy(other.owner)
        return
      } else {
        if (!other.owner.dead) {
          if (!this.scene.entities.find((e) => e instanceof FakeDie)) {
            this.scene.add(
              new FakeDie({
                x: this.pos.x,
                y: this.pos.y,
              })
            )
          }
        }
      }
      contact.cancel()
      return
    } else {
    }
  }

  onCollisionStart(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    const wasInAir = Math.round(this.pos.y - this.oldPos.y) > 1

    // player landed on the ground
    if (side === ex.Side.Bottom && wasInAir) {
      audioManager.playSfx(Resources.sfx.footstep)
    }
  }

  /**
   * Process user input to control the character
   */
  handleInput(engine: ex.Engine, delta: number) {
    const jumpPressed = this.controls.wasPressed('Jump')
    const jumpHeld = this.controls.isHeld('Jump')
    const isOnGround = this.raycast.isOnGround()

    const heldDirection = this.controls.getHeldDirection()
    // move left or right
    if (heldDirection) {
      const direction = heldDirection === 'Left' ? -1 : 1
      const accel = this.ACCELERATION * direction

      this.facing = direction === -1 ? 'left' : 'right'

      this.acc.x += accel
    }

    if (jumpPressed && isOnGround) {
      this.jump()
    }
    // cancel jump if we're not holding the jump button, but still
    // enforce a minimum jump height
    else if (!jumpHeld && this.vel.y < 0 && this.vel.y > -200) {
      this.vel.y *= 0.5
      this.isUsingJumpGravity = false
    }
  }

  /**
   * Sets the player's animation based on their current state.
   */
  handleAnimation() {
    const isOnGround = this.raycast.isOnGround()
    const currentFrameIndex = this.animation.current.currentFrameIndex
    const currentFrameTimeLeft = this.animation.current.currentFrameTimeLeft
    const heldDirection = this.controls.getHeldDirection()

    this.graphics.flipHorizontal = this.facing === 'left'

    if (isOnGround) {
      if (this.controls.isTurning) {
        this.animation.set('turn')
      } else {
        const isMovingInHeldDirection =
          !heldDirection ||
          (heldDirection === 'Left' && this.vel.x < 0) ||
          (heldDirection === 'Right' && this.vel.x > 0)

        if (isMovingInHeldDirection) {
          if (
            this.controls.isSprinting &&
            Math.abs(this.vel.x) > this.RUN_MAX_VELOCITY
          ) {
            const fromRunToSprint =
              this.animation.current === this.animation.get('run')

            this.animation.set(
              'sprint',
              fromRunToSprint ? currentFrameIndex : 0,
              fromRunToSprint ? currentFrameTimeLeft : 0
            )
          } else if (this.vel.x !== 0) {
            const fromSprintToRun =
              this.animation.current === this.animation.get('sprint')

            this.animation.set(
              'run',
              fromSprintToRun ? currentFrameIndex : 0,
              fromSprintToRun ? currentFrameTimeLeft : 0
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

  /**
   * Applies a jump force to the player.
   */
  jump() {
    let jumpForce = this.JUMP_FORCE

    if (this.controls.isSprinting) {
      jumpForce = this.SPRINT_JUMP_FORCE
    } else if (this.controls.isRunning) {
      jumpForce = this.RUN_JUMP_FORCE
    }

    this.vel.y = -jumpForce
    audioManager.playSfx(Resources.sfx.playerJump)
  }

  bounceOffEnemy(enemy: EnemyActor) {
    if (enemy.dead) return

    // use a higher jump force if we're jumping off an enemy
    this.vel.y = -this.RUN_JUMP_FORCE
    enemy.kill('squish')
    audioManager.playSfx(Resources.sfx.squish)
  }

  get maxVelocity() {
    switch (true) {
      case this.controls.isSprinting:
        return this.SPRINT_MAX_VELOCITY
      case this.controls.isRunning:
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
      if (this.controls.isTurning) {
        this.acc.x = -this.GROUND_TURN_DECELERATION * Math.sign(this.vel.x)
      }
      // decelerate if we're over the max velocity or stopped walking
      else if (!this.controls.isMoving || isOverMaxVelocity) {
        if (this.vel.x !== 0) {
          this.acc.x = -this.STOP_DECELERATION * Math.sign(this.vel.x)
        }
      }
    }
    // air deceleration
    else {
      if (this.controls.isTurning) {
        this.acc.x = -this.AIR_TURN_DECELERATION * Math.sign(this.vel.x)
      } else if (isOverMaxVelocity) {
        // in air, clamp to max velocity
        this.vel.x = ex.clamp(this.vel.x, -this.maxVelocity, this.maxVelocity)
        this.acc.x = 0
      }
    }

    const isDecelerating =
      Math.sign(this.vel.x) !== 0 &&
      Math.sign(this.vel.x) !== Math.sign(this.acc.x)
    // clamp to 0 if we're close enough
    if (isDecelerating && Math.abs(this.vel.x) < 1) {
      this.vel.x = 0
      this.acc.x = 0
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
class PlayerControlsComponent extends ControlsComponent {
  declare owner: Player

  sprintTimer = 0

  onAdd(owner: Player): void {
    super.onAdd?.(owner)

    // increment the sprint timer to toggle sprinting if we're running for SPRINT_TRIGGER_TIME
    owner.on('postupdate', ({ delta }) => {
      const isOnGround = this.owner.raycast.isOnGround()
      const jumpedBeforeSprinting = !isOnGround && !this.isSprinting
      const isTurningOnGround = this.isTurning && isOnGround

      if (this.isRunning && isOnGround && !isTurningOnGround) {
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
    return this.getHeldDirection() !== undefined
  }

  get isRunning() {
    return this.isMoving && this.isHeld('Run')
  }

  get isSprinting() {
    return this.isRunning && this.sprintTimer >= this.owner.SPRINT_TRIGGER_TIME
  }

  get isTurning() {
    const heldDirection = this.getHeldDirection()
    return (
      (heldDirection === 'Left' && this.owner.vel.x > 0) ||
      (heldDirection === 'Right' && this.owner.vel.x < 0)
    )
  }
}
