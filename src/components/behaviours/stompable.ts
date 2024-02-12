import * as ex from 'excalibur'

/**
 * Makes an actor damage the player on collision.
 */
export class StompableComponent extends ex.Component {
  declare owner: ex.Actor

  stomped = false

  stomp() {
    if (this.stomped) return
    this.stomped = true
    this.owner.graphics.current!.scale = ex.vec(1, 0.25)
  }
}
