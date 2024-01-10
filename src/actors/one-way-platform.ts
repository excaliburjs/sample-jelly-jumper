import * as ex from 'excalibur'

export class OneWayPlatform extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Fixed,
      anchor: ex.vec(0, 0),
      height: 1,
    })
  }

  onPreCollisionResolve(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    if (!(other.owner instanceof ex.Actor)) return

    // ignore if the other actor is moving up
    if (other.owner.vel.y < 0) {
      contact.cancel()
      return
    }

    // ignore if collision is not from the top
    if (side !== ex.Side.Top) {
      contact.cancel()
      return
    }

    const bottomDistance = other.bounds.bottom - self.bounds.top

    // if (bottomDistance < 2) {
    //   contact.cancel()
    //   return
    // }
  }
}
