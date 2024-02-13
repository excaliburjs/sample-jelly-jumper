import * as ex from 'excalibur'
import { Tag } from '../../util/tag'

type Side = 'left' | 'right' | 'top' | 'bottom'

/**
 * Tracks which entities are touching this entity currently.
 *
 * left, right, top, and bottom will contain active or fixed entities,
 * while passives will contain passive entities.
 */
export class TouchingComponent extends ex.Component {
  type = 'touching'
  declare owner: ex.Actor

  left = new Set<ex.Entity>()
  right = new Set<ex.Entity>()
  top = new Set<ex.Entity>()
  bottom = new Set<ex.Entity>()

  /**
   * Entities that are touching this entity but are not solid. They are
   * not tracked by side because they can move through the entity.
   */
  passives = new Set<ex.Entity>()

  onAdd(owner: ex.Actor): void {
    owner.on('preupdate', ({ delta }) => {
      this.left.clear()
      this.right.clear()
      this.top.clear()
      this.bottom.clear()
      this.passives.clear()

      const velPx = owner.vel.scale(delta / 1000)
      const xDistance = Math.min(1, Math.abs(velPx.x))

      this.raycastSide('left', xDistance).forEach((hit) =>
        this.left.add(hit.body.owner!)
      )
      this.raycastSide('right', xDistance).forEach((hit) =>
        this.right.add(hit.body.owner!)
      )

      this.raycastSide(
        'top',
        Math.min(1, velPx.y >= 0 ? 1 : Math.abs(velPx.y))
      ).forEach((hit) => this.top.add(hit.body.owner!))

      this.raycastSide(
        'bottom',
        Math.min(1, velPx.y <= 0 ? 1 : Math.abs(velPx.y))
      ).forEach((hit) => this.bottom.add(hit.body.owner!))

      // if (this.owner.name === 'player') console.log(this.right)
    })

    owner.on('collisionstart', (ev) => {
      if (
        ev.other.get(ex.BodyComponent)?.collisionType ===
        ex.CollisionType.Passive
      ) {
        this.passives.add(ev.other)
      }
    })

    owner.on('collisionend', (ev) => {
      if (
        ev.other.get(ex.BodyComponent)?.collisionType ===
        ex.CollisionType.Passive
      ) {
        this.passives.delete(ev.other)
      }
    })

    // // process the collisionstart/end events at the end of the frame
    // owner.on('initialize', () => {
    //   // doing this in the scene's postupdate will ensure that it runs after all actor's postupdates
    //   owner.scene!.on('postupdate', () => {
    //     let update = false

    //     // handle collisionend first, incase the same actor is in both lists
    //     this.queue.collisionend.forEach((ev) => {
    //       if (ev.other.body?.collisionType === ex.CollisionType.Passive) {
    //         this.passives.delete(ev.other)
    //       } else {
    //         this.all.delete(ev.other)
    //         update = true
    //       }
    //     })

    //     // handle collisionstart
    //     this.queue.collisionstart.forEach((ev) => {
    //       // @ts-expect-error - bug in new tiled plugin has collider as undefined
    //       ev.other.collider ??= ev.other._collider

    //       if (ev.other.collider) {
    //         if (ev.other.body?.collisionType === ex.CollisionType.Passive) {
    //           this.passives.add(ev.other)
    //         } else {
    //           const side = ev.side.toLowerCase() as
    //             | 'left'
    //             | 'right'
    //             | 'top'
    //             | 'bottom'

    //           this.all.set(ev.other, { side, contact: ev.contact })
    //           update = true
    //         }
    //       }
    //     })

    //     if (update) {
    //       this.updateSides()
    //     }

    //     this.queue.collisionstart.length = 0
    //     this.queue.collisionend.length = 0
    //   })
    // })
  }

  get ladders(): Set<ex.Actor> {
    return new Set(
      Array.from(this.passives).filter((e) =>
        e.hasTag(Tag.Ladder)
      ) as ex.Actor[]
    )
  }

  raycast(
    ray: ex.Ray,
    distance: number,
    opts?: Omit<ex.RayCastOptions, 'maxDistance'>
  ) {
    return this.owner
      .scene!.physics.rayCast(ray, {
        maxDistance: distance,
        searchAllColliders: true, // temporary
        filter: (hit) => hit.body !== this.owner.body,
        ...opts,
      })
      .sort((a, b) => a.distance - b.distance)
  }

  raycastSide(
    side: 'left' | 'right' | 'top' | 'bottom',
    distance: number,
    opts?: Omit<ex.RayCastOptions, 'maxDistance'>
  ) {
    const bounds = new ex.BoundingBox({
      left: Math.round(this.owner.collider.bounds.left) + 1,
      right: Math.round(this.owner.collider.bounds.right) - 1,
      top: Math.round(this.owner.collider.bounds.top) + 1,
      bottom: Math.round(this.owner.collider.bounds.bottom) - 1,
    })

    let ray1!: ex.Ray
    let ray2!: ex.Ray

    if (side === 'left' || side === 'right') {
      ray1 = new ex.Ray(
        ex.vec(side === 'left' ? bounds.left : bounds.right, bounds.top),
        ex.vec(side === 'left' ? -1 : 1, 0)
      )
      ray2 = new ex.Ray(
        ex.vec(side === 'left' ? bounds.left : bounds.right, bounds.bottom),
        ex.vec(side === 'left' ? -1 : 1, 0)
      )
    } else if (side === 'top' || side === 'bottom') {
      ray1 = new ex.Ray(
        ex.vec(bounds.left, side === 'top' ? bounds.top : bounds.bottom),
        ex.vec(0, side === 'top' ? -1 : 1)
      )
      ray2 = new ex.Ray(
        ex.vec(bounds.right, side === 'top' ? bounds.top : bounds.bottom),
        ex.vec(0, side === 'top' ? -1 : 1)
      )
    }

    return (
      [
        ...this.raycast(ray1, distance, opts),
        ...this.raycast(ray2, distance, opts),
      ]
        // remove self make unique
        .filter((value, index, arr) => {
          return arr.indexOf(value) === index
        })
    )
  }
}
