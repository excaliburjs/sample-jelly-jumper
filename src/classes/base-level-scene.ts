import { TiledResource } from '@excaliburjs/plugin-tiled'
import * as ex from 'excalibur'
import { OneWayPlatform } from '../actors/one-way-platform'
import Player from '../actors/player'
import { ScrollingBackground } from '../actors/scrolling-background'
import { Tween } from '../util/tween'

export default class BaseLevelScene extends ex.Scene {
  tilemap: TiledResource
  background: ex.ImageSource

  entityFactory: Record<string, any> = {
    Player,
    OneWayPlatform,
  }

  constructor(args: { tilemap: TiledResource; background: ex.ImageSource }) {
    super()
    this.tilemap = args.tilemap
    this.background = args.background
  }

  onInitialize() {
    this.tilemap.addToScene(this)

    this.setupCamera()
    this.setupBackground()
    this.setupWorldBounds()
    this.setupOneWayPlatforms()
  }

  setupCamera() {
    // set camera to follow player
    const player = this.entities.find((e) => e instanceof Player) as Player
    // this.camera.strategy.lockToActor(player)
    this.camera.addStrategy(new LockToPlayerStrategy(player))

    // @ts-expect-error - temporary to prioritize lockToActor over tilemap strategy
    this.camera._cameraStrategies.reverse()
  }

  setupWorldBounds() {
    const tilemapWidth = this.tilemap.map.width * this.tilemap.map.tilewidth
    const tilemapHeight = this.tilemap.map.height * this.tilemap.map.tileheight

    // create world bounds
    this.engine.add(
      new ex.Actor({
        collisionType: ex.CollisionType.Fixed,
        collider: new ex.CompositeCollider([
          new ex.EdgeCollider({
            begin: ex.vec(0, 0),
            end: ex.vec(0, tilemapHeight),
          }),
          new ex.EdgeCollider({
            begin: ex.vec(0, tilemapHeight),
            end: ex.vec(tilemapWidth, tilemapHeight),
          }),
          new ex.EdgeCollider({
            begin: ex.vec(tilemapWidth, tilemapHeight),
            end: ex.vec(tilemapWidth, 0),
          }),
          new ex.EdgeCollider({
            begin: ex.vec(tilemapWidth, 0),
            end: ex.vec(0, 0),
          }),
        ]),
      })
    )
  }

  setupBackground() {
    this.add(new ScrollingBackground({ image: this.background }))
  }

  setupOneWayPlatforms() {
    // get all tiles with oneway property
    const onewayTiles = this.tilemap.getTilesByProperty('oneway', true)
    const layerNames = this.tilemap.map.layers.map((l) => l.name)
    const tileWidth = this.tilemap.map.tilewidth
    const tileHeight = this.tilemap.map.tileheight

    // iterate through all tiles, check if they are oneway tiles, and
    // then create a OneWayPlatform at that location
    for (const layerName of layerNames) {
      for (let row = 0; row < this.tilemap.map.width; row++) {
        for (let col = 0; col < this.tilemap.map.height; col++) {
          const tile = this.tilemap.getTileByCoordinate(layerName, row, col)

          if (!tile) continue

          if (onewayTiles.includes(tile?.tiledTile!)) {
            const platform = new OneWayPlatform({
              x: row * tileWidth,
              y: col * tileHeight,
              width: tileWidth,
              height: tileHeight,
            })
            this.add(platform)
          }
        }
      }
    }
  }
}

/**
 * A camera strategy that locks the camera to the player, but keeps
 * the camera ahead smothly so that the player can see what's coming.
 */
class LockToPlayerStrategy implements ex.CameraStrategy<Player> {
  /**
   * The duration of the camera offset tween in milliseconds.
   */
  X_OFFSET_UPDATE_RATE = 700

  /**
   * The number of pixels from the center of the screen that the player
   * can move before the camera starts to follow.
   */
  X_EDGE_BUFFER = 20
  Y_EDGE_BUFFER = 10

  target: Player
  xOffset: Tween
  facing: 'left' | 'right' = 'right'

  constructor(target: Player) {
    this.target = target
    this.xOffset = new Tween(this.target.scene.engine, 40, {
      easing: ex.EasingFunctions.EaseOutCubic,
      duration: this.X_OFFSET_UPDATE_RATE,
    })
  }

  action(target: Player, camera: ex.Camera, engine: ex.Engine, delta: number) {
    const relativeX = target.pos.x - camera.pos.x + this.xOffset.value
    const relativeY = target.pos.y - camera.pos.y

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
      nextX = target.pos.x + this.X_EDGE_BUFFER + this.xOffset.value
    } else if (isAtRightEdge) {
      nextX = target.pos.x - this.X_EDGE_BUFFER + this.xOffset.value
    }

    if (isAtTopEdge || isAtBottomEdge) {
      nextY = isAtTopEdge
        ? target.pos.y + this.Y_EDGE_BUFFER
        : target.pos.y - this.Y_EDGE_BUFFER
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
