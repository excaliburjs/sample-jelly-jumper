/* 
temporary to avoid circular imports with actors 
until entityClassNameFactories can be provided at runtime w/ scene
*/
import * as ex from 'excalibur'
import {
  FactoryProps,
  TiledResource,
  TiledObject,
} from '@excaliburjs/plugin-tiled'
import Player from './actors/player'
import { OneWayPlatform } from './actors/platforms/one-way-platform'
import { BugEnemy } from './actors/enemies/bug'
import { EnemySpawner } from './actors/enemy-spawner'
import { MovingPlatform } from './actors/platforms/moving-platform'

const entityClassNameFactories:
  | Record<string, (props: FactoryProps) => ex.Entity | undefined>
  | undefined = {
  /* Player */
  Player: (props) =>
    new Player({
      x: props.object?.x ?? 0,
      y: props.object?.y ?? 0,
      z: props.layer.order ?? 0,
    }),

  /* Platforms */
  MovingPlatform: (props) => {
    const x = props.object?.x ?? 0
    const y = props.object?.y ?? 0
    return new MovingPlatform(
      {
        x,
        y,
        z: props.layer.order ?? 0,
        width: props.object?.tiledObject?.width ?? 64,
        height: props.object?.tiledObject?.height ?? 16,
      },
      (actions) => {
        const speed = (props.object?.properties.get('speed') as number) ?? 20
        const pathObjectId = props.object?.properties.get('path') as number

        // props.layer is lacking types for tiledObjectLayer
        const pathObject = (props.layer as any).tiledObjectLayer.objects.find(
          (obj: TiledObject) => obj.id === pathObjectId
        ) as TiledObject

        actions.repeatForever((ctx) =>
          ctx
            .moveTo(ex.vec(pathObject.x!, pathObject.y!), speed)
            .moveTo(ex.vec(x, y), speed)
        )
      }
    )
  },
  /* Enemies */
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
}

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

export const TiledResources = {
  tiled: {
    level1: new TiledResource('/res/tilemaps/level1.tmx', {
      useTilemapCameraStrategy: true,
      entityClassNameFactories,
    }),
  },
} as const
