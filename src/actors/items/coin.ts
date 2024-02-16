import * as ex from 'excalibur'
import { CollectableComponent } from '../../components/behaviours/collectable'
import { Resources } from '../../resources'
import { AudioManager } from '../../state/audio'
import { CollisionGroup } from '../../util/collision-group'
import Player from '../player'
import { GameManager } from '../../state/game'

export class CoinItem extends ex.Actor {
  private elapsedMs = 0
  private collected = false

  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      anchor: ex.vec(0.5, 0.75),
      collisionType: ex.CollisionType.Passive,
      collisionGroup: CollisionGroup.Item,
      width: 8,
      height: 8,
    })

    this.pos.x += this.width * this.anchor.x
    this.pos.y -= this.height * this.anchor.y

    this.addComponent(new CollectableComponent())
    this.graphics.use(Resources.img.coin.toSprite())
  }

  onPreUpdate(engine: ex.Engine<any>, delta: number): void {
    this.elapsedMs += delta

    // bobble up and down
    this.pos.y -= Math.sin(this.elapsedMs / 200) / 10
  }

  onCollisionStart() {
    if (this.collected) return

    AudioManager.playSfx(Resources.sfx.collectCoin)
    GameManager.coins += 1

    this.collected = true
    this.actions
      .runAction(
        new ex.ParallelActions([
          new ex.ActionSequence(this, (ctx) => ctx.moveBy(ex.vec(0, -16), 150)),
          new ex.ActionSequence(this, (ctx) => ctx.fade(0, 150)),
        ])
      )
      .callMethod(() => {
        this.kill()
      })
  }
}
