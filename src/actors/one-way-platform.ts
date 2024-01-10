import * as ex from 'excalibur'

export class OneWayPlatform extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Fixed,
      anchor: ex.vec(0, 0),
      height: 16,
    })
  }

  onPreCollisionResolve(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    if (!(other.owner instanceof ex.Actor)) return

    // the difference between the current and previous position of the other actor
    const otherPosDelta = other.owner.pos.sub(other.owner.oldPos)

    // was the other actor above the platform in the previous frame?
    const otherWasAbovePlatform =
      other.bounds.bottom - otherPosDelta.y < self.bounds.top + 1

    // ignore collision if the collision side is not on the top,
    // or if other was not above the platform in the previous frame
    if (side !== ex.Side.Top || !otherWasAbovePlatform) {
      contact.cancel()
      return
    }
  }
}
