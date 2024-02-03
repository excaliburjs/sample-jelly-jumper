import * as ex from 'excalibur'
import Player from '../actors/player'
import { Tween } from './tween'

/**
 * A camera strategy that locks the camera to the player, but keeps
 * the camera ahead smothly so that the player can see what's coming.
 */
export class LockToPlayerStrategy implements ex.CameraStrategy<Player> {
  /**
   * The duration of the camera offset tween in milliseconds.
   */
  X_OFFSET_UPDATE_RATE = 500

  /**
   * The number of pixels from the center of the screen that the player
   * can move before the camera starts to follow.
   */
  X_EDGE_BUFFER = 20
  Y_EDGE_BUFFER = 40

  target: Player
  xOffset: Tween
  facing: 'left' | 'right' = 'right'

  constructor(target: Player) {
    this.target = target
    this.xOffset = new Tween(this.target.scene!.engine, 40, {
      easing: ex.EasingFunctions.Linear,
      duration: this.X_OFFSET_UPDATE_RATE,
    })
  }

  action(target: Player, camera: ex.Camera, engine: ex.Engine, delta: number) {
    // get global position of target as target.pos is relative to its parent
    const targetPos = target.getGlobalPos()

    const relativeX = targetPos.x - camera.pos.x + this.xOffset.value
    const relativeY = targetPos.y - camera.pos.y

    const isAtLeftEdge = relativeX < -this.X_EDGE_BUFFER
    const isAtRightEdge = relativeX > this.X_EDGE_BUFFER

    const isAtTopEdge = relativeY < -this.Y_EDGE_BUFFER
    const isAtBottomEdge = relativeY > this.Y_EDGE_BUFFER

    let nextX = camera.pos.x
    let nextY = camera.pos.y

    if (
      (isAtLeftEdge && this.facing !== 'left') ||
      (isAtRightEdge && this.facing !== 'right')
    ) {
      this.turn(isAtLeftEdge ? 'left' : 'right')
    }

    if (isAtLeftEdge) {
      nextX = targetPos.x + this.X_EDGE_BUFFER + this.xOffset.value
    } else if (isAtRightEdge) {
      nextX = targetPos.x - this.X_EDGE_BUFFER + this.xOffset.value
    }

    if (isAtTopEdge || isAtBottomEdge) {
      nextY = isAtTopEdge
        ? targetPos.y + this.Y_EDGE_BUFFER
        : targetPos.y - this.Y_EDGE_BUFFER
    }

    return ex.vec(nextX, nextY)
  }

  turn(direction: 'left' | 'right') {
    this.facing = direction
    if (direction === 'left') {
      this.xOffset.set(-this.X_EDGE_BUFFER * 4)
    } else {
      this.xOffset.set(this.X_EDGE_BUFFER * 4)
    }
  }
}
