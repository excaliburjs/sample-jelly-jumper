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
