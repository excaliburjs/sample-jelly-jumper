import * as ex from 'excalibur'
import { PhysicsActor } from './physics-actor'

export interface EnemyActorArgs extends ex.ActorArgs {}

export type EnemyKillMethod = 'instant' | 'squish'

export class EnemyActor extends PhysicsActor {
  dead = false
  constructor(args: EnemyActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Active,
    })

    this.addTag('enemy')
  }

  onPreCollisionResolve(
    self: ex.Collider,
    other: ex.Collider,
    side: ex.Side,
    contact: ex.CollisionContact
  ): void {
    if (other.owner instanceof EnemyActor) {
      contact.cancel()
    }
  }

  kill(method: EnemyKillMethod = 'instant') {
    if (this.dead) return
    this.dead = true

    if (method === 'instant') {
      super.kill()
    } else if (method === 'squish') {
      this.actions
        .callMethod(() => {
          this.graphics.current!.scale = ex.vec(1, 0.25)
        })
        .delay(700)
        .callMethod(() => {
          super.kill()
        })
    }
  }
}
