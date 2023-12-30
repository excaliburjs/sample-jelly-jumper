import * as ex from 'excalibur'
import { TouchingComponent } from '../components/TouchingComponent'

export class MovingPlatform extends ex.Actor {
  touching = new TouchingComponent()

  private passengers: ex.Actor[] = []
  private actionCtx = new ex.ActionContext(this)

  constructor(args: ex.ActorArgs, cb: (actions: ex.ActionContext) => any) {
    super({
      color: ex.Color.Green,
      collisionType: ex.CollisionType.Fixed,
      ...args,
    })

    this.addComponent(new ex.TagComponent('moving-platform'))
    this.addComponent(this.touching)
    cb(this.actionCtx)
  }

  onPreUpdate(_engine: ex.Engine, _delta: number): void {}

  update(engine: ex.Engine, delta: number): void {
    this.passengers = [...this.touching.top]
    this.movePassengers()
    this.snapPassengers()
    super.update(engine, delta)
    this.actionCtx.update(delta)
  }

  onPostUpdate(_engine: ex.Engine, _delta: number): void {}

  snapPassengers() {
    for (const actor of this.passengers) {
      // snap the actor to the top of the platform
      actor.pos.y = this.collider.bounds.top + 1
    }
  }

  movePassengers() {
    for (const actor of this.passengers) {
      // move the actor by the same amount as the platform
      actor.pos.x += this.vel.x / this.scene.engine.fixedUpdateFps!
    }
  }
}
