import * as ex from 'excalibur'
import { RaycastComponent } from '../components/physics/raycast'
import { TouchingComponent } from '../components/physics/touching'

export class PhysicsActor extends ex.Actor {
  touching = new TouchingComponent()
  raycast = new RaycastComponent()

  maxSlopeAngle = ex.toRadians(45)

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
    // if (side === ex.Side.Left || side === ex.Side.Right) {
    //   const bottomLeft = ex.vec(
    //     this.collider.bounds.left + 1,
    //     this.collider.bounds.bottom - 1
    //   )

    //   const bottomRight = ex.vec(
    //     this.collider.bounds.right - 1,
    //     this.collider.bounds.bottom - 1
    //   )
    //   const raycastOrigin = side === ex.Side.Left ? bottomLeft : bottomRight
    //   const [hit] = this.scene.physics.rayCast(
    //     new ex.Ray(
    //       raycastOrigin,
    //       side === ex.Side.Left ? ex.Vector.Left : ex.Vector.Right
    //     ),
    //     {
    //       searchAllColliders: true,
    //       maxDistance: Math.abs(this.vel.x),
    //     }
    //   )

    //   if (hit) {
    //     const slopeAngle = getVecAngle(hit.normal, ex.Vector.Up)
    //     const moveDistance = Math.abs(contact.mtv.x)
    //     const climbVelocityY = -Math.sin(slopeAngle) * moveDistance

    //     // debugger
    //     // if (contact.mtv.y >= climbVelocityY) {
    //     contact.mtv.y = climbVelocityY
    //     contact.mtv.x =
    //       Math.cos(slopeAngle) * moveDistance * Math.sign(contact.mtv.x)
    //     // }
    //   }
    // }

    const selfIsColliderA = self === contact.colliderA
    let normal = contact.normal.clone()

    // contact.normal always points away from colliderA,
    // so we need to flip the normal direction if we are colliderA
    if (selfIsColliderA) {
      normal = normal.scale(-1)
    }

    const isSlope = Math.abs(normal.x) !== 0 && Math.abs(normal.y) !== 0

    const angle = getVecAngle(normal, ex.Vector.Up)

    // manually resolve slope collisions
    if (isSlope && angle <= this.maxSlopeAngle) {
      contact.cancel()

      // mtv always points away from colliderA
      if (selfIsColliderA) {
        this.pos.y -= contact.mtv.y
      } else {
        this.pos.y += contact.mtv.y
      }

      this.vel.y = 0

      // manually call onCollisionStart since because we cancelled the default collision
      // and actor may be expecting this event
      this.onCollisionStart(self, other, side, contact)
    }
  }
}

function getVecAngle(v1: ex.Vector, v2: ex.Vector) {
  return Math.acos(v1.dot(v2) / (v1.size * v2.size))
}
