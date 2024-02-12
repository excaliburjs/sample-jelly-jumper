import * as ex from 'excalibur'

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
        // Contact normal points away from collider A, but we aren't guaranteed an order
        // so flip to match
        let normal: ex.Vector
        if (ev.contact.colliderA === owner.collider.get()) {
          normal = ev.contact.normal
        } else {
          normal = ev.contact.normal.negate()
        }

        const side = ex.Side.fromDirection(normal).toLowerCase() as
          | 'left'
          | 'right'
          | 'top'
          | 'bottom'

        if (ev.other.hasTag('ladder')) {
          this.ladders.push(ev.other)
        } else {
          this[side].push(ev.other)
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
