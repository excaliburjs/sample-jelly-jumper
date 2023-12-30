import * as ex from 'excalibur'

/**
 * Tracks which entities are touching this entity currently.
 *
 * This is cheaper than raycasting and should be used for simple
 * checks on current collisions.
 */
export class TouchingComponent extends ex.Component {
  type = 'touching'

  left: ex.Actor[] = []
  right: ex.Actor[] = []
  top: ex.Actor[] = []
  bottom: ex.Actor[] = []

  onAdd(owner: ex.Actor): void {
    owner.on('collisionstart', (ev) => {
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

      const side = getSide()

      if (side) {
        this[side].push(ev.other)
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
    })
  }
}
