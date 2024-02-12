import { TiledResource } from '@excaliburjs/plugin-tiled'
import * as ex from 'excalibur'
import { OneWayPlatform } from '../actors/platforms/one-way-platform'
import Player from '../actors/player'
import { ScrollingBackground } from '../actors/scrolling-background'
import { audioManager } from '../util/audio-manager'
import { LockToPlayerStrategy } from '../util/lock-to-player-strategy'

import { FactoryProps, TiledObject } from '@excaliburjs/plugin-tiled'
import { SpiderEnemy } from '../actors/enemies/spider'
import { MovingPlatform } from '../actors/platforms/moving-platform'
import { EnemySpawner } from '../actors/enemy-spawner'
import { BirdEnemy } from '../actors/enemies/bird'
import { Bouncepad, BouncepadArgs } from '../actors/platforms/bouncepad'
import { AxeEnemy } from '../actors/hazards/swinging-axe'
import { CircularSawEnemy } from '../actors/hazards/circular-saw'
import { Tag } from '../util/tag'

export default class LevelScene extends ex.Scene {
  song?: ex.Sound
  tilemap: TiledResource
  background: ex.ImageSource

  entityFactory: Record<
    string,
    (props: FactoryProps) => ex.Entity | undefined
  > = {
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
    Bouncepad: (props) => {
      const x = props.object?.x ?? 0
      const y = props.object?.y ?? 0
      return new Bouncepad({
        x,
        y,
        z: props.layer.order ?? 0,
        type: props.object?.properties.get('type') as BouncepadArgs['type'],
      })
    },

    /* Enemies */
    SpiderEnemy: makeSpawner((args, props) => {
      const typeProp = props.object?.properties.get('type') as
        | 'green'
        | 'gray'
        | undefined

      return new SpiderEnemy({
        ...args,
        type: typeProp ?? 'green',
      })
    }),
    BirdEnemy: makeSpawner((args, props) => {
      const typeProp = props.object?.properties.get('type') as
        | 'purple'
        | 'orange'

      return new BirdEnemy({
        ...args,
        type: typeProp ?? 'red',
      })
    }),

    AxeEnemy: (props) => {
      return new AxeEnemy({
        x: props.object?.x ?? 0,
        y: props.object?.y ?? 0,
        z: props.layer.order ?? 0,
      })
    },

    CircularSawEnemy: (props) => {
      return new CircularSawEnemy({
        x: props.object?.x ?? 0,
        y: props.object?.y ?? 0,
        z: props.layer.order ?? 0,
      })
    },
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

    for (const [className, factory] of Object.entries(this.entityFactory)) {
      this.tilemap.registerEntityFactory(className, factory)
    }
  }

  onInitialize() {
    this.tilemap.addToScene(this)
    this.setupCamera()
    this.setupBackground()
    this.setupWorldBounds()
    this.setupOneWayPlatforms()
    this.setupLadders()
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

    const bounds = new ex.Actor({
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
    bounds.addTag(Tag.WorldBounds)
    // create world bounds
    this.engine.add(bounds)
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

  setupLadders() {
    const ladderTiles = this.tilemap.getTilesByProperty('ladder', true)
    const tileWidth = this.tilemap.map.tilewidth
    const tileHeight = this.tilemap.map.tileheight

    // create an actor with a ladder component at each tile
    for (const { exTile } of ladderTiles) {
      const col = exTile.x
      const row = exTile.y
      const ladder = new ex.Actor({
        anchor: ex.vec(0, 0),
        x: col * tileWidth,
        y: row * tileHeight,
        width: tileWidth,
        height: tileHeight,
        collisionType: ex.CollisionType.Passive,
      })
      ladder.addTag(Tag.Ladder)
      this.add(ladder)
    }
  }
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
