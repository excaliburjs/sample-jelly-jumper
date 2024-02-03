import * as ex from 'excalibur'
import { RaycastComponent } from '../components/physics/raycast'
import { CarrierComponent } from '../components/physics/carrier'
import { OneWayCollisionComponent } from '../components/physics/one-way-collision'

export class PhysicsActor extends ex.Actor {
  raycast = new RaycastComponent()

  isOnGround = false

  onInitialize(engine: ex.Engine): void {
    this.addComponent(this.raycast)

    this.on('preupdate', ({ delta }) => {
      if (this.parent?.get(CarrierComponent)) {
        this.isOnGround = true
        return
      }

      const distance = Math.max(1, (this.vel.y * delta) / 1000)

      const hits = this.raycast
        .checkCollision(ex.Side.Bottom, distance)
        .filter((hit) => {
          if (hit.body.owner?.get(OneWayCollisionComponent)) {
            return (
              Math.round(this.collider.bounds.bottom) <=
              Math.round(hit.collider.bounds.top)
            )
          }

          return true
        })

      this.isOnGround = hits.length > 0
    })
  }
}
