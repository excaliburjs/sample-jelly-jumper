import * as ex from 'excalibur'
import { Resources } from '../../resources'
import { HurtPlayerComponent } from '../../components/behaviours/hurt-player'
import { PhysicsActor } from '../../classes/physics-actor'
import { CollisionGroup } from '../../util/collision-group'
import { CarriableComponent } from '../../components/physics/carrier'

export class CircularSawHazard extends PhysicsActor {
  direction = 1
  speed = 25

  lastHit: ex.RayCastHit | null = null

  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      anchor: ex.vec(0.5, 0.5),
      width: 4,
      height: 4,
      collisionType: ex.CollisionType.Passive,
    })

    this.pos.x += this.width * this.anchor.x
    this.pos.y -= this.height * this.anchor.y

    this.body.useGravity = false
    this.graphics.use(Resources.img.circularSaw.toSprite())
    this.addComponent(new HurtPlayerComponent({ amount: Infinity }))
    this.addComponent(new CarriableComponent())

    const blade = new ex.Actor({
      pos: ex.vec(0, 0),
      anchor: ex.vec(0.5, 0.5),
      radius: 14,
      collisionType: ex.CollisionType.Passive,
      collisionGroup: CollisionGroup.Hazard,
    })
    this.addChild(blade)
  }

  onPostUpdate(_engine: ex.Engine, delta: number) {
    const edge = Math.round(
      this.direction === 1
        ? this.collider.bounds.right
        : this.collider.bounds.left
    )
    const bottom = Math.round(this.collider.bounds.bottom) - 1

    // get velocity in pixels per frame
    const velPx = this.vel.scale(delta / 1000)

    // check if next position is still on the platform
    const [hit] = this.raycast(
      new ex.Ray(ex.vec(edge + velPx.x, bottom), ex.Vector.Down),
      2,
      {
        searchAllColliders: true,
        filter: (hit) =>
          hit.body.owner !== this &&
          hit.body.collisionType !== ex.CollisionType.Passive,
      }
    )

    // we've hit the end of the platform
    if (!hit && this.lastHit) {
      this.direction *= -1
    }

    // move and rotate the saw
    this.graphics.current!.rotation +=
      ex.toRadians((this.speed * 3) / delta) * this.direction
    this.vel.x = this.speed * this.direction

    if (hit) {
      this.lastHit = hit
    }
  }
}
