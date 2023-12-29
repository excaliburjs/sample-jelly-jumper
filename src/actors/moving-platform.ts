import * as ex from 'excalibur'
import { TouchingComponent } from '../components/TouchingComponent'
import { PhysicsActor } from './physics-actor'

export class MovingPlatform extends ex.Actor {
  touching = new TouchingComponent()

  private prevVel = ex.vec(0, 0)
  private prevPos = ex.vec(0, 0)
  private prevTouching: {
    top: ex.Actor[]
    bottom: ex.Actor[]
    left: ex.Actor[]
    right: ex.Actor[]
  } = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  }

  private actionsCb: (actions: ex.ActionsComponent) => any

  constructor(args: ex.ActorArgs, cb: (actions: ex.ActionsComponent) => any) {
    super({
      color: ex.Color.Green,
      collisionType: ex.CollisionType.Fixed,
      ...args,
    })

    this.body.mass = Infinity
    this.body.useGravity = false
    this.actionsCb = cb

    this.addComponent(new ex.TagComponent('moving-platform'))
    this.addComponent(this.touching)
  }

  onInitialize(_engine: ex.Engine): void {
    this.actionsCb(this.actions)

    this.prevPos = this.pos.clone()
    this.prevVel = this.vel.clone()

    this.on('actionstart', (ev) => {
      this.snapTopActors(this.prevTouching.top)
    })

    this.on('actioncomplete', (ev) => {
      this.prevTouching = {
        top: [...this.touching.top],
        bottom: [...this.touching.bottom],
        left: [...this.touching.left],
        right: [...this.touching.right],
      }
    })
  }

  onPreUpdate(_engine: ex.Engine, _delta: number): void {}

  onPostUpdate(_engine: ex.Engine, _delta: number): void {
    this.snapTopActors(this.touching.top)
    this.prevVel = this.vel.clone()
    this.prevPos = this.pos.clone()
  }

  /**
   * Snap actors to the top of the platform
   */
  snapTopActors(actors: ex.Actor[]) {
    for (const actor of actors) {
      const platformBounds = this.collider.bounds

      if (actor.vel.y >= 0) {
        actor.pos.y = platformBounds.top + 1
      }

      if (this.pos.x - this.prevPos.x !== 0) {
        actor.pos.x += this.pos.x - this.prevPos.x
      }
    }
  }
}
