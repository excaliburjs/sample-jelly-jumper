import * as ex from 'excalibur'
import { OneWayCollisionComponent } from '../components/one-way-collision'

export interface MovingPlatformArgs extends ex.ActorArgs {
  oneWay?: boolean
}
export class MovingPlatform extends ex.Actor {
  constructor(
    args: MovingPlatformArgs,
    cb: (actions: ex.ActionsComponent) => any
  ) {
    super({
      color: ex.Color.Green,
      collisionType: ex.CollisionType.Fixed,
      ...args,
    })

    cb(this.actions)

    if (args.oneWay) {
      this.addComponent(new OneWayCollisionComponent())
    }
  }

  /**
   * When an actor lands on top add it as a child so that
   * it moves with the platform.
   */
  onCollisionStart(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    if (other.owner instanceof ex.Actor) {
      if (side === ex.Side.Top && !this.children.includes(other.owner)) {
        this.addChild(other.owner)

        // children's position are local to the parent so we need adjust it
        // so that the child stays in the same position on the platform
        other.owner.pos.x -= this.pos.x
        other.owner.pos.y -= this.pos.y
      }
    }
  }

  /**
   * When an actor leaves the platform remove it as a child
   */
  onCollisionEnd(self: ex.Collider, other: ex.Collider): void {
    if (other.owner instanceof ex.Actor) {
      if (this.children.includes(other.owner)) {
        this.removeChild(other.owner)
        this.scene.add(other.owner)

        // now that the child is no longer a child we need to adjust its position
        // back to global coordinates
        other.owner.pos.x += this.pos.x
        other.owner.pos.y += this.pos.y
      }
    }
  }
}
