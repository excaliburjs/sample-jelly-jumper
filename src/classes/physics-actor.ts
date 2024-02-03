import * as ex from 'excalibur'
import { TouchingComponent } from '../components/physics/touching'

export class PhysicsActor extends ex.Actor {
  touching = new TouchingComponent()

  isOnGround = false

  onInitialize(engine: ex.Engine): void {
    this.addComponent(this.touching)

    this.on('preupdate', () => {
      this.isOnGround = this.touching.bottom.length > 0
    })
  }

  raycast(ray: ex.Ray, distance: number) {
    return this.scene!.physics.rayCast(ray, {
      maxDistance: distance,
      searchAllColliders: true,
    })
      .filter((hit) => hit.body !== this.body)
      .sort((a, b) => a.distance - b.distance)
  }
}
