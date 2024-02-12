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
        const side = ev.side.toLowerCase() as
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
      if (this.owner!.name === 'player') {
        console.log('collisionend', ev.other.name);
      }
      const side = ev.side.toLowerCase() as
          | 'left'
          | 'right'
          | 'top'
          | 'bottom'
      const remove = (arr: ex.Entity[]) => {
        const index = arr.indexOf(ev.other)
        if (index !== -1) {
          arr.splice(index, 1)
        }
      }

      remove(this[side]);
      remove(this.ladders)
    })
  }
}
