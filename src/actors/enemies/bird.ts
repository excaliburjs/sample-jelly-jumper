import * as ex from 'excalibur'
import { EnemyActor } from '../../classes/enemy-actor'
import { Resources } from '../../resources'
import { KillableComponent } from '../../components/behaviours/killable'

const grid = {
  rows: 1,
  columns: 3,
  spriteWidth: 48,
  spriteHeight: 48,
}

const variants = {
  purple: {
    speed: 20,
    spritesheet: ex.SpriteSheet.fromImageSource({
      image: Resources.img.birdPurple,
      grid,
    }),
  },
  orange: {
    speed: 30,
    spritesheet: ex.SpriteSheet.fromImageSource({
      image: Resources.img.birdOrange,
      grid,
    }),
  },
}

export interface BirdEnemyArgs extends ex.ActorArgs {
  type: keyof typeof variants
}

export class BirdEnemy extends EnemyActor {
  spritesheet: ex.SpriteSheet

  speed: number
  direction: 'left' | 'right' = 'left'

  private elapsedMs = 0
  private deathPosition: ex.Vector | null = null

  constructor(args: BirdEnemyArgs) {
    super({
      ...args,
      stompDuration: 1500,
      anchor: ex.vec(0.5, 0.6),
      collider: ex.Shape.Box(10, 5, ex.vec(0.5, 1)),
      collisionGroup: ex.CollisionGroupManager.groupByName('enemies'),
      collisionType: ex.CollisionType.Passive,
    })

    this.spritesheet = variants[args.type].spritesheet
    this.speed = variants[args.type].speed
    this.body.useGravity = false

    this.graphics.use(
      ex.Animation.fromSpriteSheet(
        this.spritesheet,
        [0, 1, 2],
        3000 / this.speed
      )
    )
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.elapsedMs += delta
    if (this.dead && this.deathPosition) {
      // fall down in feather pattern, swinging left to right, based on distance from death
      this.vel.y = 10
      this.pos.x += Math.sin((this.pos.y - this.deathPosition.y) / 2)
      this.rotation = -Math.sin((this.pos.x - this.deathPosition.x) / 50)
    } else {
      this.graphics.flipHorizontal = this.direction === 'right'

      if (this.direction === 'left') {
        this.vel.x = -this.speed
      } else {
        this.vel.x = this.speed
      }

      this.pos.y +=
        Math.sin((this.elapsedMs / (this.speed * 10)) * Math.PI) * 0.3
    }
  }

  onKill() {
    this.deathPosition = this.pos.clone()
    const anim = this.graphics.current as ex.Animation

    anim.pause()
    this.vel.x = 0
    this.vel.y = 0
    this.body.useGravity = false
  }
}
