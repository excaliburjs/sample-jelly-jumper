import * as ex from 'excalibur'

export class OneWayPlatform extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Passive,

      anchor: ex.vec(0, 0),
      height: 4,
    })

    this.on('collisionstart', this.onCollisionStart.bind(this))
    this.on('collisionend', this.onCollisionEnd.bind(this))
  }

  /**
   * When an actor collides with the platform, if the actor is falling, then
   * the platform becomes solid. Otherwise, the platform is passable.
   */
  onCollisionStart(ev: ex.CollisionStartEvent) {
    const other = ev.other
    if (other instanceof ex.Actor && other.vel.y >= 0) {
      this.body.collisionType = ex.CollisionType.Fixed
    }
  }

  onCollisionEnd() {
    this.body.collisionType = ex.CollisionType.Passive
  }
}
