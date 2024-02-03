import * as ex from 'excalibur'
import { EnemyActor, EnemyKillMethod } from '../../classes/enemy-actor'
import { Resources } from '../../resources'

const grid = {
  rows: 1,
  columns: 3,
  spriteWidth: 64,
  spriteHeight: 48,
}

const greenSpritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.img.spiderGreen,
  grid,
})

const graySpritesheet = ex.SpriteSheet.fromImageSource({
  image: Resources.img.spiderGray,
  grid,
})

export interface BugEnemyArgs extends ex.ActorArgs {
  type: 'green' | 'gray'
}

export class BugEnemy extends EnemyActor {
  spritesheet: ex.SpriteSheet

  speed: number
  direction: 'left' | 'right' = 'left'

  constructor(args: BugEnemyArgs) {
    super({
      ...args,
      anchor: ex.vec(0.5, 0.65),
      collider: ex.Shape.Box(20, 4, ex.vec(0.5, 1)),
      collisionGroup: ex.CollisionGroupManager.groupByName('enemies'),
    })

    this.spritesheet =
      args.type === 'green' ? greenSpritesheet : graySpritesheet

    this.speed = args.type === 'green' ? 20 : 30

    this.graphics.use(
      ex.Animation.fromSpriteSheet(
        this.spritesheet,
        [0, 1, 2],
        2500 / this.speed
      )
    )
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    if (this.dead) return

    const bottomLeft = this.raycast(
      new ex.Ray(
        ex.vec(
          this.collider.bounds.left + 1,
          Math.round(this.collider.bounds.bottom) - 1
        ),
        ex.Vector.Down
      ),
      1
    )

    const bottomRight = this.raycast(
      new ex.Ray(
        ex.vec(
          this.collider.bounds.right - 1,
          Math.round(this.collider.bounds.bottom) - 1
        ),
        ex.Vector.Down
      ),
      1
    )

    const isAtLeftEdge = this.direction === 'left' && bottomLeft.length === 0
    const isAtRightEdge = this.direction === 'right' && bottomRight.length === 0

    if (isAtLeftEdge || isAtRightEdge) {
      this.direction = this.direction === 'left' ? 'right' : 'left'
    }

    this.graphics.flipHorizontal = this.direction === 'right'

    if (this.direction === 'left') {
      this.vel.x = -this.speed
    } else {
      this.vel.x = this.speed
    }
  }

  onCollisionStart(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    const isSlope =
      Math.abs(contact.normal.x) !== 0 && Math.abs(contact.normal.y) !== 0
    if (!isSlope) {
      if (side === ex.Side.Left || side === ex.Side.Right) {
        this.direction = this.direction === 'left' ? 'right' : 'left'
      }
    }
  }

  kill(method: EnemyKillMethod) {
    const anim = this.graphics.current as ex.Animation

    anim.pause()
    this.vel.x = 0
    this.vel.y = 0
    this.body.useGravity = false

    super.kill(method)
  }
}
