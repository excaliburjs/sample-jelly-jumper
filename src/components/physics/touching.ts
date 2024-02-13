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

  private all = new Map<
    ex.Actor,
    { side: Side; contact: ex.CollisionContact }
  >()

  left = new Set<ex.Actor>()
  right = new Set<ex.Actor>()
  top = new Set<ex.Actor>()
  bottom = new Set<ex.Actor>()

  /**
   * Entities that are touching this entity but are not solid. They are
   * not tracked by side because they can move through the entity.
   */
  passives = new Set<ex.Actor>()

  private queue: {
    collisionstart: ex.CollisionStartEvent[]
    collisionend: ex.CollisionEndEvent[]
  } = {
    collisionstart: [],
    collisionend: [],
  }

  onAdd(owner: ex.Actor): void {
    // collect up all of the collisionstart/end events for each frame
    owner.on('collisionstart', (ev) => {
      this.queue.collisionstart.push(ev)
    })

    owner.on('collisionend', (ev) => {
      this.queue.collisionend.push(ev)
    })

    // process the collisionstart/end events at the end of the frame
    owner.on('initialize', () => {
      // doing this in the scene's postupdate will ensure that it runs after all actor's postupdates
      owner.scene!.on('postupdate', () => {
        let update = false

        // handle collisionend first, incase the same actor is in both lists
        this.queue.collisionend.forEach((ev) => {
          if (ev.other.body?.collisionType === ex.CollisionType.Passive) {
            this.passives.delete(ev.other)
          } else {
            this.all.delete(ev.other)
            update = true
          }
        })

        // handle collisionstart
        this.queue.collisionstart.forEach((ev) => {
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

              this.all.set(ev.other, { side, contact: ev.contact })
              update = true
            }
          }
        })

        if (update) {
          this.updateSides()
        }

        this.queue.collisionstart.length = 0
        this.queue.collisionend.length = 0
      })
    })
  }

  private updateSides() {
    this.left.clear()
    this.right.clear()
    this.top.clear()
    this.bottom.clear()

    for (const [actor, { side }] of this.all.entries()) {
      this[side].add(actor)
    }
  }

  get ladders() {
    return new Set(
      Array.from(this.passives).filter((e) => e.hasTag(Tag.Ladder))
    )
  }
}
