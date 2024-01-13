import * as ex from 'excalibur'
import { RaycastComponent } from '../components/physics/raycast'
import { TouchingComponent } from '../components/physics/touching'

export class PhysicsActor extends ex.Actor {
  touching = new TouchingComponent()
  raycast = new RaycastComponent()

  onInitialize(engine: ex.Engine): void {
    this.addComponent(this.raycast)
    this.addComponent(this.touching)
  }

  onPreCollisionResolve(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    const isSlope =
      Math.abs(contact.normal.x) !== 0 && Math.abs(contact.normal.y) !== 0

    // manually resolve slope collisions
    if (isSlope && this.vel.y !== 0) {
      contact.cancel()

      this.pos.y -= contact.mtv.y
      this.vel.y = 0

      // manually call onCollisionStart since because we cancelled the default collision
      // and actor may be expecting this event
      this.onCollisionStart(self, other, side, contact)
    }
  }
}
