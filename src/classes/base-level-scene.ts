import * as ex from 'excalibur'
import Player from '../actors/player'
import { Resources } from '../resources'
import { TiledMapResource, TiledObjectGroup } from '@excaliburjs/plugin-tiled'

export default class BaseLevelScene extends ex.Scene {
  tilemap: TiledMapResource

  constructor(args: { tilemap: TiledMapResource }) {
    super()
    this.tilemap = args.tilemap
  }

  onInitialize() {
    this.tilemap.addTiledMapToScene(this)

    const objectLayers: TiledObjectGroup[] =
      Resources.tilemap_level1.data.getObjects()

    const factory = {
      Player,
    }

    for (const layer of objectLayers) {
      for (const object of layer.objects) {
        let name = object.name as keyof typeof factory
        if (name && factory[name]) {
          const entity = new factory[name]({
            x: object.x,
            y: object.y,
          })
          this.add(entity)
        }
      }
    }

    const player = this.entities.find((e) => e instanceof Player) as Player
    this.camera.strategy.lockToActor(player)

    // set camera bounds
    const tilemap = this.tileMaps[0]
    if (tilemap) {
      this.camera.strategy.limitCameraBounds(
        new ex.BoundingBox(
          0,
          0,
          tilemap.tileWidth * tilemap.columns,
          tilemap.tileHeight * tilemap.rows
        )
      )
    }

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
