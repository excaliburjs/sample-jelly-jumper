import * as ex from 'excalibur'
import Player from '../actors/player'
import { Resources } from '../resources'
import { TiledResource, TiledObjectGroup } from '@excaliburjs/plugin-tiled'
import { OneWayPlatform } from '../actors/one-way-platform'
import { ScrollingBackground } from '../actors/scrolling-background'

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
  }

  setupCamera() {
    // set camera to follow player
    const player = this.entities.find((e) => e instanceof Player) as Player
    this.camera.strategy.lockToActor(player)

    // @ts-expect-error - temporary to prioritize lockToActor over tilemap strategy
    this.camera._cameraStrategies.reverse()
  }

  setupWorldBounds() {
    console.log(this.tilemap)
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
}
