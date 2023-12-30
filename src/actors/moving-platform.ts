import * as ex from 'excalibur'
import { TouchingComponent } from '../components/TouchingComponent'
import { PhysicsActor } from './physics-actor'

export class MovingPlatform extends ex.Actor {
  touching = new TouchingComponent()

  private actionsCb: (actions: ex.ActionsComponent) => any

  constructor(args: ex.ActorArgs, cb: (actions: ex.ActionsComponent) => any) {
    super({
      color: ex.Color.Green,
      collisionType: ex.CollisionType.Fixed,
      ...args,
    })

    this.actionsCb = cb

    this.addComponent(new ex.TagComponent('moving-platform'))
    this.addComponent(this.touching)
  }

  onInitialize(_engine: ex.Engine): void {
    this.actionsCb(this.actions)
  }

  update(engine: ex.Engine, delta: number): void {
    this.movePassengersX(this.touching.top)
    this.movePassengersY(this.touching.top)
    super.update(engine, delta)
  }

  onPostUpdate(_engine: ex.Engine, _delta: number): void {}
  movePassengersY(actors: ex.Actor[]) {
    for (const actor of actors) {
      // snap the actor to the top of the platform
      actor.pos.y = this.collider.bounds.top + 1
    }
  }

  movePassengersX(actors: ex.Actor[]) {
    for (const actor of actors) {
      // move the actor along with the platform if they're not moving
      const distance = this.pos.x - this.oldPos.x
      actor.pos.x += distance

      // replace 120 with fixedUpdateFps value
      // for some reason, this has the same "lag" effect when platform changes direction
      // actor.pos.x += this.vel.x / 120
    }
  }
}
