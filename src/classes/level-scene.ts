import * as ex from 'excalibur'
import { TiledResource } from '@excaliburjs/plugin-tiled'
import { OneWayPlatform } from '../actors/platforms/one-way-platform'
import Player from '../actors/player'
import { ScrollingBackground } from '../actors/scrolling-background'
import { LockToPlayerStrategy } from '../util/lock-to-player-strategy'
import { audioManager } from '../util/audio-manager'

export default class LevelScene extends ex.Scene {
  song?: ex.Sound
  tilemap: TiledResource
  background: ex.ImageSource

  entityFactory: Record<string, any> = {
    Player,
    OneWayPlatform,
  }

  constructor(args: {
    tilemap: TiledResource
    background: ex.ImageSource
    song?: ex.Sound
  }) {
    super()
    this.tilemap = args.tilemap
    this.background = args.background
    this.song = args.song
  }

  onInitialize() {
    this.tilemap.addToScene(this)
    this.setupCamera()
    this.setupBackground()
    this.setupWorldBounds()
    this.setupOneWayPlatforms()
  }

  onActivate(context: ex.SceneActivationContext<unknown>): void {
    if (this.song) {
      audioManager.playSong(this.song)
    }
  }

  setupCamera() {
    // set camera to follow player
    const player = this.entities.find((e) => e instanceof Player) as Player
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
    const tileWidth = this.tilemap.map.tilewidth
    const tileHeight = this.tilemap.map.tileheight

    // create one way platforms at each tile
    for (const { exTile } of onewayTiles) {
      const col = exTile.x
      const row = exTile.y

      const platform = new OneWayPlatform({
        x: col * tileWidth,
        y: row * tileHeight,
        width: tileWidth,
        height: tileHeight,
      })
      this.add(platform)
    }
  }
}
