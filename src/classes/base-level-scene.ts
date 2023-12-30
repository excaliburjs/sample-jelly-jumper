import * as ex from 'excalibur'
import Player from '../actors/player'
import { Resources } from '../resources'
import { TiledMapResource, TiledObjectGroup } from '@excaliburjs/plugin-tiled'
import { OneWayPlatform } from '../actors/one-way-platform'

export default class BaseLevelScene extends ex.Scene {
  tilemap: TiledMapResource

  entityFactory: Record<string, any> = {
    Player,
    OneWayPlatform,
  }

  constructor(args: { tilemap: TiledMapResource }) {
    super()
    this.tilemap = args.tilemap
  }

  onInitialize() {
    this.tilemap.addTiledMapToScene(this)

    this.setupEntities()
    this.setupCamera()
    this.setupWorldBounds()
  }

  setupEntities() {
    const objectLayers: TiledObjectGroup[] =
      Resources.tilemap_level1.data.getObjects()

    for (const layer of objectLayers) {
      for (const object of layer.objects) {
        let className = object.type as keyof typeof this.entityFactory

        if (className && this.entityFactory[className]) {
          const entity = new this.entityFactory[className]({
            x: object.x,
            y: object.y,
            width: object.width,
            height: object.height,
            z: objectLayers.indexOf(layer),
          })
          this.add(entity)
        }
      }
    }
  }

  setupCamera() {
    // set camera to follow player
    const player = this.entities.find((e) => e instanceof Player) as Player
    this.camera.strategy.lockToActor(player)

    // set camera bounds
    const width = this.tilemap.data.width * this.tilemap.data.tileWidth
    const height = this.tilemap.data.height * this.tilemap.data.tileHeight
    const tilemap = this.tileMaps[0]
    if (tilemap) {
      this.camera.strategy.limitCameraBounds(
        new ex.BoundingBox(0, 0, width, height)
      )
    }
  }

  setupWorldBounds() {
    const tilemapWidth = this.tilemap.data.width * this.tilemap.data.tileWidth
    const tilemapHeight =
      this.tilemap.data.height * this.tilemap.data.tileHeight

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
}
