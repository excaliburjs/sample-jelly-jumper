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
}
