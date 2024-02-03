import * as ex from 'excalibur'
import { Debug } from '../../util/debug'

export class RaycastComponent extends ex.Component {
  declare owner: ex.Actor
  type = 'raycast'

  cast(ray: ex.Ray, distance: number) {
    Debug.drawRay(this.owner, ray, distance)
    return this.owner
      .scene!.physics.rayCast(ray, {
        maxDistance: distance,
        searchAllColliders: true,
      })
      .filter((hit) => hit.body !== this.owner.body)
      .sort((a, b) => a.distance - b.distance)
  }

  checkCollision(side: ex.Side, distance: number) {
    const bounds = new ex.BoundingBox(
      Math.round(this.owner.collider.bounds.left),
      Math.round(this.owner.collider.bounds.top),
      Math.round(this.owner.collider.bounds.right),
      Math.round(this.owner.collider.bounds.bottom)
    )

    let corner1!: ex.Vector
    let corner2!: ex.Vector
    let direction!: ex.Vector

    if (side === ex.Side.Left || side === ex.Side.Right) {
      corner1 =
        side === ex.Side.Left
          ? ex.vec(bounds.left + 1, bounds.bottom - 1)
          : ex.vec(bounds.right - 1, bounds.bottom - 1)
      corner2 =
        side === ex.Side.Left
          ? ex.vec(bounds.left + 1, bounds.top + 1)
          : ex.vec(bounds.right - 1, bounds.top + 1)

      direction = side === ex.Side.Left ? ex.Vector.Left : ex.Vector.Right
    } else if (side === ex.Side.Top || side === ex.Side.Bottom) {
      corner1 =
        side === ex.Side.Top
          ? ex.vec(bounds.left + 1, bounds.top + 1)
          : ex.vec(bounds.left + 1, bounds.bottom - 1)
      corner2 =
        side === ex.Side.Top
          ? ex.vec(bounds.right - 1, bounds.top + 1)
          : ex.vec(bounds.right - 1, bounds.bottom - 1)

      direction = side === ex.Side.Top ? ex.Vector.Up : ex.Vector.Down
    }

    const corner1Hits = this.cast(new ex.Ray(corner1, direction), distance)
    const corner2Hits = this.cast(new ex.Ray(corner2, direction), distance)

    return (
      [...corner1Hits, ...corner2Hits]
        // remove duplicates
        .filter(
          (hit, index, self) =>
            self.findIndex((h) => h.body === hit.body) === index
        )
    )
  }
}
