import * as ex from 'excalibur'
import { LadderComponent } from './ladder'

/**
 * Tracks which entities are touching this entity currently.
 */
export class TouchingComponent extends ex.Component {
  type = 'touching'

  left: ex.Actor[] = []
  right: ex.Actor[] = []
  top: ex.Actor[] = []
  bottom: ex.Actor[] = []

  ladders: ex.Actor[] = []

  onAdd(owner: ex.Actor): void {
    owner.on('collisionstart', (ev) => {
      // @ts-expect-error - bug in new tiled plugin has collider as undefined
      ev.other.collider ??= ev.other._collider

      if (ev.other.collider) {
        const otherBounds = ev.other.collider.bounds
        const bounds = owner.collider.bounds

        const getSide = () => {
          // Contact normal points away from collider A, but we aren't guaranteed an order
          // so flip to match
          let normal: ex.Vector;
          if (ev.contact.colliderA === owner.collider.get()) {
            normal = ev.contact.normal;
          } else {
            normal = ev.contact.normal.negate();
          }

          const side = ex.Side.fromDirection(normal);
          if (side === ex.Side.Left) {
            return 'left'
          } else if (side === ex.Side.Right) {
            return 'right'
          } else if (side === ex.Side.Top) {
            return 'top'
          } else if (side === ex.Side.Bottom) {
            return 'bottom'
          }
        }

        if (ev.other.has(LadderComponent)) {
          this.ladders.push(ev.other)
        } else {
          const side = getSide()

          if (side) {
            this[side].push(ev.other)
          }
        }
      }
    })

    owner.on('collisionend', (ev) => {
      const remove = (arr: ex.Entity[]) => {
        const index = arr.indexOf(ev.other)
        if (index !== -1) {
          arr.splice(index, 1)
        }
      }

      remove(this.left)
      remove(this.right)
      remove(this.top)
      remove(this.bottom)
      remove(this.ladders)
    })
  }
}
