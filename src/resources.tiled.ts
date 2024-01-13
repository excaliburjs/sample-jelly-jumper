/* 
temporary to avoid circular imports with actors 
until entityClassNameFactories can be provided at runtime w/ scene
*/
import { TiledResource } from '@excaliburjs/plugin-tiled'
import Player from './actors/player'
import { OneWayPlatform } from './actors/platforms/one-way-platform'
import { BugEnemy } from './actors/enemies/bug'
import { EnemySpawner } from './actors/enemy-spawner'

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

      BugEnemy: (props) =>
        new EnemySpawner({
          x: props.object?.x ?? 0,
          y: props.object?.y ?? 0,
          spawn: (pos) =>
            new BugEnemy({
              pos,
              z: props.layer.order ?? 0,
              type:
                (props.object?.properties.get('type') as 'green' | 'gray') ??
                'green',
            }),
        }),
    },
  }),
} as const
