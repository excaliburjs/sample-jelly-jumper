import * as ex from 'excalibur'
import { Resources } from '../resources'
import { AnimationComponent } from '../components/graphics/animation'
import { ControlsComponent } from '../components/input/controls'
import { PhysicsActor } from '../classes/physics-actor'
import { EnemyActor } from '../classes/enemy-actor'
import { FakeDie } from './fake-die'
import { audioManager } from '../util/audio-manager'
import { GRAVITY } from '../util/world'
import { EaseAction } from '../actions/EaseAction'
import { coroutine } from '../util/coroutine'

const SPRITE_WIDTH = 48
const SPRITE_HEIGHT = 48
const spritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.img.player,
  grid: {
    columns: 4,
    rows: 6,
    spriteWidth: SPRITE_WIDTH,
    spriteHeight: SPRITE_HEIGHT,
  },
})

export default class Player extends PhysicsActor {
  /* Constants */

  /**
   * The amount of gravity to apply to the player when they are jumping.
   */
  JUMP_GRAVITY = GRAVITY.y * 0.5

  /**
   * The amount of gravity to apply to the player when they are near the apex of their jump.
   */
  APEX_GRAVITY = GRAVITY.y * 0.3

  /**
   * The maximum speed the player can fall at.
   */
  MAX_FALL_SPEED = 270

  /**
   * The speed at which the player can climb ladders.
   */
  LADDER_CLIMB_SPEED = 75

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

  /**
   * The amount of squish to apply to the player when they jump or land.
   *
   * Doing an even number divided by sprite width will ensure the player
   * squishes to a whole number of pixels.
   */
  FX_SQUISH_AMOUNT = 8 / SPRITE_WIDTH

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
  facing: 'left' | 'right' = 'right'
  isUsingJumpGravity = false
  isOnLadder = false

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

  // @ts-ignore
  update(engine: ex.Engine<any>, delta: number): void {
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
      this.acc.setTo(0, GRAVITY.y)
    }

    if (this.isOnLadder) {
      this.acc.setTo(0, 0)
      this.vel.setTo(0, 0)
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
    if (this.isOnGround) {
      this.isUsingJumpGravity = false
    }

    if (!this.touching.ladders.length) {
      this.isOnLadder = false
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
      // a lenient check to see if we stomped on the enemy by using the previous position.y
      // (we could check for side === ex.Side.Bottom, but depending on the angle you stomp an enemy, it might not be the case)
      const posDelta = this.getGlobalPos().sub(this.getGlobalOldPos())
      const didStomp = self.bounds.bottom - posDelta.y < other.bounds.top + 1

      if (didStomp) {
        this.bounceOffEnemy(other.owner)
      } else {
        if (!other.owner.dead) {
          if (!this.scene?.entities.find((e) => e instanceof FakeDie)) {
            this.scene?.add(
              new FakeDie({
                x: this.getGlobalPos().x,
                y: this.getGlobalPos().y,
              })
            )
          }
        }
      }
      contact.cancel()
    }
  }

  onCollisionStart(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    if (contact.isCanceled()) {
      return
    }

    const otherBody = other.owner.get(ex.BodyComponent)

    if (
      otherBody?.collisionType === ex.CollisionType.Fixed ||
      otherBody?.collisionType === ex.CollisionType.Active
    ) {
      const wasInAir = this.oldVel.y > 0

      // player landed on the ground
      if (side === ex.Side.Bottom && wasInAir) {
        audioManager.playSfx(Resources.sfx.footstep)

        // apply a squish animation when landing
        const duration = 70
        const scaleTo = 1 - this.FX_SQUISH_AMOUNT
        const easing = ex.EasingFunctions.EaseOutCubic

        this.actions
          .runAction(
            new EaseAction(
              {
                initial: 1,
                target: scaleTo,
                duration,
                easing,
              },
              (value) => {
                this.squishGraphic(value)
              }
            )
          )
          .runAction(
            new EaseAction(
              {
                initial: scaleTo,
                target: 1,
                duration,
                easing,
              },
              (value) => {
                this.squishGraphic(value)
              }
            )
          )
      }
    }
  }

  /**
   * Process user input to control the character
   */
  handleInput(engine: ex.Engine, delta: number) {
    const jumpPressed = this.controls.wasPressed('Jump')
    const jumpHeld = this.controls.isHeld('Jump')
    const isOnGround = this.isOnGround

    const heldXDirection = this.controls.getHeldXDirection()
    const heldYDirection = this.controls.getHeldYDirection()

    // move left or right
    if (heldXDirection && !this.isOnLadder) {
      const direction = heldXDirection === 'Left' ? -1 : 1
      const accel = this.ACCELERATION * direction

      this.facing = direction === -1 ? 'left' : 'right'

      this.acc.x += accel
    }

    // climb ladder
    if (heldYDirection) {
      if (this.touching.ladders.length) {
        this.climbLadder()
      }
    }

    if (jumpPressed) {
      // normal jump
      if (isOnGround) {
        this.jump()
      }
      // jump or fall off ladder
      else if (this.isOnLadder) {
        this.isOnLadder = false

        // when down is held we'll just let the player fall, otherwise jump
        if (heldYDirection !== 'Down') {
          this.jump()
        }
      }
    }
    // cancel jump if we're not holding the jump button, but still
    // enforce a minimum jump height
    else if (
      !jumpHeld &&
      this.vel.y < 0 &&
      this.vel.y > -200 &&
      !this.isOnLadder
    ) {
      this.vel.y *= 0.5
      this.isUsingJumpGravity = false
    }
  }

  /**
   * Sets the player's animation based on their current state.
   */
  handleAnimation() {
    const currentFrameIndex = this.animation.current.currentFrameIndex
    const currentFrameTimeLeft = this.animation.current.currentFrameTimeLeft
    const heldDirection = this.controls.getHeldXDirection()

    this.graphics.flipHorizontal = this.facing === 'left'

    if (this.isOnLadder) {
      this.animation.set('ladder_climb')
      if (this.vel.y === 0) {
        this.animation.current.goToFrame(0)
      }
    } else if (this.isOnGround) {
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

  climbLadder() {
    // it's possible to be touching multiple ladder tiles at once - find the closet one
    const closestLadder = this.touching.ladders
      .sort((a, b) => {
        return (
          Math.abs(this.pos.x - a.center.x) - Math.abs(this.pos.x - b.center.x)
        )
      })
      .at(0)

    if (closestLadder) {
      const heldYDirection = this.controls.getHeldYDirection()
      const dir = heldYDirection === 'Up' ? -1 : 1

      const isCloseEnoughOnX = Math.abs(this.pos.x - closestLadder.center.x) < 8
      const isJumping = this.vel.y <= -50

      // if we're in the same tile as the ladder
      const isOccupyingSameTile =
        Math.ceil(Math.round(this.collider.bounds.top) / 16) ===
        Math.ceil(Math.round(closestLadder.collider.bounds.top) / 16)

      // if we're in the tile above the ladder
      const isStandingAboveLadder =
        Math.ceil(Math.round(this.collider.bounds.top) / 16) <
        Math.ceil(Math.round(closestLadder.collider.bounds.top) / 16)

      // climb on to the ladder
      if (isCloseEnoughOnX && !isJumping) {
        if (heldYDirection === 'Up' && isOccupyingSameTile) {
          this.isOnLadder = true
        } else if (heldYDirection === 'Down' && isStandingAboveLadder) {
          this.isOnLadder = true
          this.pos.y += 1
        }
      }
      // apply climbing speed
      if (this.isOnLadder) {
        this.pos.x = closestLadder.center.x
        this.vel.y = this.LADDER_CLIMB_SPEED * dir
        this.vel.x = 0

        // if we're on the ground, exit the ladder
        if (
          this.isOnGround &&
          heldYDirection === 'Down' &&
          !isStandingAboveLadder
        ) {
          this.isOnLadder = false
        }
      }
    }
  }

  /**
   * Applies a jump force to the player.
   */
  jump(force?: number, playSfx = true) {
    if (force === undefined) {
      force = this.JUMP_FORCE

      if (this.controls.isSprinting) {
        force = this.SPRINT_JUMP_FORCE
      } else if (this.controls.isRunning) {
        force = this.RUN_JUMP_FORCE
      }
    }

    this.vel.y = -force
    if (playSfx) {
      audioManager.playSfx(Resources.sfx.playerJump)
    }

    // apply a stretch animation while jumping
    coroutine(
      this.scene!.engine,
      function* () {
        const duration = 70
        const scaleTo = 1 + 1 * this.FX_SQUISH_AMOUNT
        const easing = ex.EasingFunctions.EaseOutCubic

        let elapsed = 0

        // stretch player graphic while jumping
        while (this.vel.y < -force! * 0.25) {
          const { delta } = yield
          elapsed += delta

          if (elapsed < duration) {
            this.squishGraphic(
              easing(Math.min(elapsed, duration), 1, scaleTo, duration)
            )
          }
        }

        elapsed = 0

        // un-stretch player graphic while falling
        while (!this.touching.bottom.length) {
          const { delta } = yield
          elapsed += delta

          if (elapsed < duration) {
            this.squishGraphic(
              easing(Math.min(elapsed, duration), scaleTo, 1, duration * 2)
            )
          }
        }

        this.squishGraphic(1)
      },
      this
    )
  }

  bounceOffEnemy(enemy: EnemyActor) {
    if (enemy.dead) return

    enemy.kill('squish')
    audioManager.playSfx(Resources.sfx.squish)

    // use a higher jump force for jumping off an enemy, unless we're sprinting
    const force = !this.controls.isSprinting
      ? this.RUN_JUMP_FORCE
      : this.SPRINT_JUMP_FORCE

    this.jump(force, false)
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
    const isOnGround = this.isOnGround
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

  /**
   * Squishes the player's graphic by a scale factor. If below 1, it will
   * squash the player, if above 1, it will stretch the player.
   */
  squishGraphic(scale: number) {
    const y = scale
    const x = 2 - y
    this.graphics.current!.scale = ex.vec(x, y)
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
      const isOnGround = this.owner.isOnGround
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
    return this.getHeldXDirection() !== undefined
  }

  get isRunning() {
    return this.isMoving && this.isHeld('Run')
  }

  get isSprinting() {
    return this.isRunning && this.sprintTimer >= this.owner.SPRINT_TRIGGER_TIME
  }

  get isTurning() {
    const heldDirection = this.getHeldXDirection()
    return (
      (heldDirection === 'Left' && this.owner.vel.x > 0) ||
      (heldDirection === 'Right' && this.owner.vel.x < 0)
    )
  }
}
