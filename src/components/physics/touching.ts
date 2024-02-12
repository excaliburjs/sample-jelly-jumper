import * as ex from 'excalibur'
import { Tag } from '../../util/tag'

/**
 * Tracks which entities are touching this entity currently.
 */
export class TouchingComponent extends ex.Component {
  type = 'touching'

  left: ex.Actor[] = []
  right: ex.Actor[] = []
  top: ex.Actor[] = []
  bottom: ex.Actor[] = []

  /**
   * Entities that are touching this entity but are not solid. They are
   * not tracked by side because they can move through the entity.
   */
  passives: ex.Actor[] = []

  onAdd(owner: ex.Actor): void {
    owner.on('collisionstart', (ev) => {
      // @ts-expect-error - bug in new tiled plugin has collider as undefined
      ev.other.collider ??= ev.other._collider

      if (ev.other.collider) {
        if (ev.other.body?.collisionType === ex.CollisionType.Passive) {
          this.passives.push(ev.other)
        } else {
          const side = ev.side.toLowerCase() as
            | 'left'
            | 'right'
            | 'top'
            | 'bottom'

          this[side].push(ev.other)
        }
      }
    })

    owner.on('collisionend', (ev) => {
      const side = ev.side.toLowerCase() as 'left' | 'right' | 'top' | 'bottom'
      const remove = (arr: ex.Entity[]) => {
        const index = arr.indexOf(ev.other)
        if (index !== -1) {
          arr.splice(index, 1)
        }
      }

      remove(this[side])
      remove(this.passives)
    })
  }

  get ladders() {
    return this.passives.filter((e) => e.hasTag(Tag.Ladder))
  }
}
