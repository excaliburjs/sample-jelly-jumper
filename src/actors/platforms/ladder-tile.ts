import * as ex from 'excalibur'
import { Tag } from '../../util/tag'

export class LadderTile extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      anchor: ex.vec(0, 0),
      collisionType: ex.CollisionType.Passive,
      ...args,
    })

    this.addTag(Tag.Ladder)
  }
}
