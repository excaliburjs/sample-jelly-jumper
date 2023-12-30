import * as ex from 'excalibur'

export class MovingPlatform extends ex.Actor {
  constructor(args: ex.ActorArgs, cb: (actions: ex.ActionsComponent) => any) {
    super({
      color: ex.Color.Green,
      collisionType: ex.CollisionType.Fixed,
      ...args,
    })

    cb(this.actions)

    this.on('collisionstart', this.onCollisionStart.bind(this))
    this.on('collisionend', this.onCollisionEnd.bind(this))
  }

  /**
   * When an actor lands on top add it as a child so that
   * it moves with the platform.
   */
  onCollisionStart(ev: ex.CollisionStartEvent) {
    if (ev.other.collider) {
      const side = this.getCollisionSide(ev.other)

      if (side === 'top' && !this.children.includes(ev.other)) {
        this.addChild(ev.other)

        // children's position are local to the parent so we need adjust it
        // so that the child stays in the same position on the platform
        ev.other.pos.x -= this.pos.x
        ev.other.pos.y -= this.pos.y
      }
    }
  }

  /**
   * When an actor leaves the platform remove it as a child
   */
  onCollisionEnd(ev: ex.CollisionEndEvent) {
    if (this.children.includes(ev.other)) {
      this.removeChild(ev.other)
      this.scene.add(ev.other)

      // now that the child is no longer a child we need to adjust its position
      // back to global coordinates
      ev.other.pos.x += this.pos.x
      ev.other.pos.y += this.pos.y
    }
  }

  /**
   * Get the side of the collision that is closest to the other actor.
   */
  getCollisionSide(other: ex.Actor) {
    const otherBounds = other.collider.bounds
    const bounds = this.collider.bounds

    const bottom = Math.abs(bounds.bottom - otherBounds.top)
    const top = Math.abs(bounds.top - otherBounds.bottom)
    const left = Math.abs(bounds.left - otherBounds.right)
    const right = Math.abs(bounds.right - otherBounds.left)

    const min = Math.min(left, right, top, bottom)

    if (min === left) {
      return 'left'
    } else if (min === right) {
      return 'right'
    } else if (min === top) {
      return 'top'
    } else if (min === bottom) {
      return 'bottom'
    }
  }
}
