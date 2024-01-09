import * as ex from 'excalibur'

export class OneWayPlatform extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Fixed,
      anchor: ex.vec(0, 0),
      height: 4,
    })
  }

  onPreCollisionResolve(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    if (other.owner instanceof ex.Actor && other.owner.vel.y < 0) {
      contact.cancel()
    }
  }
}
