import * as ex from 'excalibur'
import { RaycastComponent } from '../components/RaycastComponent'
import { TouchingComponent } from '../components/TouchingComponent'

export class PhysicsActor extends ex.Actor {
  touching = new TouchingComponent()
  raycast = new RaycastComponent()

  onInitialize(engine: ex.Engine): void {
    this.on('collisionstart', (ev) => {
      const otherBounds = ev.other.collider.bounds
      const bounds = this.collider.bounds

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
        this.touching[side].push(ev.other)
      }
    })

    this.on('collisionend', (ev) => {
      const remove = (arr: ex.Entity[]) => {
        const index = arr.indexOf(ev.other)
        if (index !== -1) {
          arr.splice(index, 1)
        }
      }

      remove(this.touching.left)
      remove(this.touching.right)
      remove(this.touching.top)
      remove(this.touching.bottom)
    })

    this.addComponent(this.raycast)
    this.addComponent(this.touching)
  }
}
