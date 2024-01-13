/* 
temporary to avoid circular imports with actors 
until entityClassNameFactories can be provided at runtime w/ scene
*/
import { FactoryProps, TiledResource } from '@excaliburjs/plugin-tiled'
import Player from './actors/player'
import { OneWayPlatform } from './actors/platforms/one-way-platform'
import { BugEnemy } from './actors/enemies/bug'
import { EnemySpawner } from './actors/enemy-spawner'

export const TiledResources = {
  tiled: {
    level1: new TiledResource('/res/tilemaps/level1.tmx', {
      useTilemapCameraStrategy: true,
      entityClassNameFactories: {
        Player: (props) =>
          new Player({
            x: props.object?.x ?? 0,
            y: props.object?.y ?? 0,
            z: props.layer.order ?? 0,
          }),

        BugEnemy: makeSpawner((args, props) => {
          const typeProp = props.object?.properties.get('type') as
            | 'green'
            | 'gray'
            | undefined

          return new BugEnemy({
            ...args,
            type: typeProp ?? 'green',
          })
        }),
      },
    }),
  },
} as const

/**
 * Helper function to create a spawner at the Tiled object position
 * for an enemy class
 */
function makeSpawner(
  spawn: (
    actorArgs: { x: number; y: number; z: number },
    props: FactoryProps
  ) => any
) {
  return (props: FactoryProps) => {
    const x = props.object?.x ?? 0
    const y = props.object?.y ?? 0
    const z = props.layer.order ?? 0
    return new EnemySpawner({
      x,
      y,
      spawn: () =>
        spawn(
          {
            x,
            y,
            z,
          },
          props
        ),
    })
  }
}
