import * as ex from 'excalibur'
import { RaycastComponent } from '../components/physics/raycast'

export class PhysicsActor extends ex.Actor {
  raycast = new RaycastComponent()

  onInitialize(engine: ex.Engine): void {
    this.addComponent(this.raycast)
  }
}
