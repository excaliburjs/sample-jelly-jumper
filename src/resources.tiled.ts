/* 
temporary to avoid circular imports with actors 
until entityClassNameFactories can be provided at runtime w/ scene
*/
import { TiledResource } from '@excaliburjs/plugin-tiled'
import Player from './actors/player'
import { OneWayPlatform } from './actors/one-way-platform'

export const TiledResources = {
  tilemap_level1: new TiledResource('/res/tilemaps/level1.tmx', {
    useTilemapCameraStrategy: true,
    entityClassNameFactories: {
      Player: (props) =>
        new Player({
          x: props.object?.x ?? 0,
          y: props.object?.y ?? 0,
          z: props.layer.order ?? 0,
        }),

      OneWayPlatform: (props) =>
        new OneWayPlatform({
          x: props.object?.x ?? 0,
          y: props.object?.y ?? 0,
          width: props.object?.tiledObject.width ?? 0,
          height: props.object?.tiledObject.height ?? 0,
          z: props.layer.order ?? 0,
        }),
    },
  }),
} as const
