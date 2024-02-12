import * as ex from 'excalibur'
import { Tag } from '../../util/tag'

type Side = 'left' | 'right' | 'top' | 'bottom'
/**
 * Tracks which entities are touching this entity currently.
 *
 * left, right, top, and bottom will contain active or fixed entities,
 * while passives will contain passive entities.
 */
export class TouchingComponent extends ex.Component {
  type = 'touching'

  private all = new Map<ex.Actor, Side>()

  left = new Set<ex.Actor>()
  right = new Set<ex.Actor>()
  top = new Set<ex.Actor>()
  bottom = new Set<ex.Actor>()

  /**
   * Entities that are touching this entity but are not solid. They are
   * not tracked by side because they can move through the entity.
   */
  passives = new Set<ex.Actor>()

  onAdd(owner: ex.Actor): void {
    owner.on('collisionstart', (ev) => {
      // @ts-expect-error - bug in new tiled plugin has collider as undefined
      ev.other.collider ??= ev.other._collider

      if (ev.other.collider) {
        if (ev.other.body?.collisionType === ex.CollisionType.Passive) {
          this.passives.add(ev.other)
        } else {
          const side = ev.side.toLowerCase() as
            | 'left'
            | 'right'
            | 'top'
            | 'bottom'

          this.all.set(ev.other, side)
          this.updateSides()
        }
      }
    })

    owner.on('collisionend', (ev) => {
      if (ev.other.body?.collisionType === ex.CollisionType.Passive) {
        this.passives.delete(ev.other)
      } else {
        const side = ev.side.toLowerCase() as Side

        // if this was the side we were tracking, remove it. otherwise we
        // are still colliding with other but on a different side
        if (this[side].has(ev.other)) {
          this.all.delete(ev.other)
          this.updateSides()
        }
      }
    })
  }

  private updateSides() {
    this.left.clear()
    this.right.clear()
    this.top.clear()
    this.bottom.clear()

    for (const [actor, side] of this.all.entries()) {
      this[side].add(actor)
    }
  }

  get ladders() {
    return new Set(
      Array.from(this.passives).filter((e) => e.hasTag(Tag.Ladder))
    )
  }
}
