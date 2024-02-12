import * as ex from 'excalibur'
import { TouchingComponent } from '../components/physics/touching'

export class PhysicsActor extends ex.Actor {
  touching = new TouchingComponent()

  isOnGround = false

  private _oldPosGlobal = ex.vec(0, 0)

  onInitialize(engine: ex.Engine): void {
    this.addComponent(this.touching)

    this.on('preupdate', () => {
      this.isOnGround = this.touching.bottom.size > 0
    })
    this.on('postupdate', () => {
      this._oldPosGlobal = this.getGlobalPos().clone()
    })
  }

  raycast(
    ray: ex.Ray,
    distance: number,
    opts?: {
      collisionGroup?: ex.CollisionGroup
      collisionMask?: number
      searchAllColliders?: boolean
    }
  ) {
    return this.scene!.physics.rayCast(ray, {
      maxDistance: distance,
      searchAllColliders: opts?.searchAllColliders,
      collisionGroup: opts?.collisionGroup,
      collisionMask: opts?.collisionMask,
    })
      .filter((hit) => hit.body !== this.body)
      .sort((a, b) => a.distance - b.distance)
  }

  getGlobalOldPos() {
    return this._oldPosGlobal
  }
}
