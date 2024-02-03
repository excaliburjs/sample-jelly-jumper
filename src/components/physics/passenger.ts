import * as ex from 'excalibur'

/**
 * Attaches actors that land on top of it as children, causing
 * them to move with it. Useful for moving platforms.
 */
export class PassengerComponent extends ex.Component {
  declare owner: ex.Actor
  type = 'carrier'

  onAdd(owner: ex.Actor): void {
    owner.on('collisionstart', this.onCollisionStart.bind(this))
    owner.on('collisionend', this.onCollisionEnd.bind(this))
  }
  /**
   * When an actor lands on top add it as a child so that
   * it moves with the platform.
   */
  onCollisionStart({ other, side }: ex.CollisionStartEvent): void {
    if (
      other instanceof ex.Actor &&
      other.body.collisionType === ex.CollisionType.Active
    ) {
      if (side === ex.Side.Top && !this.owner.children.includes(other)) {
        this.owner.addChild(other)

        // children's position are local to the parent so we need adjust it
        // so that the child stays in the same position on the platform
        other.pos.x -= this.owner.pos.x
        other.pos.y -= this.owner.pos.y
      }
    }
  }

  /**
   * When an actor leaves the platform remove it as a child
   */
  onCollisionEnd({ other }: ex.CollisionEndEvent): void {
    if (other instanceof ex.Actor) {
      if (this.owner.children.includes(other)) {
        this.owner.removeChild(other)
        this.owner.scene!.add(other)

        // now that the child is no longer a child we need to adjust its position
        // back to global coordinates
        other.pos.x += this.owner.pos.x
        other.pos.y += this.owner.pos.y
      }
    }
  }
}
