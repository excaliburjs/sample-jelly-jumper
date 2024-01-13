import * as ex from 'excalibur'

/**
 * TODO: simplify this - it was taken from another project.
 */
export class RaycastComponent extends ex.Component {
  declare owner: ex.Entity & {
    body: ex.BodyComponent
    collider: ex.ColliderComponent
  }
  type = 'raycast'

  cast = (
    pos: ex.Vector,
    dir: ex.Vector,
    {
      exclude,
      ...opts
    }: ex.RayCastOptions & { exclude?: Array<{ body: ex.BodyComponent }> }
  ) => {
    const hits = this.owner.scene.physics.rayCast(new ex.Ray(pos, dir), {
      searchAllColliders: true,
      ...opts,
    })

    if (exclude) {
      const excludedBodies = exclude.map((e) => e.body)
      return hits.filter(({ body }) => !excludedBodies.includes(body))
    }

    return hits
  }

  /**
   * Casts a ray in each corner both directions and returns the hits.
   *
   * Corner names are ordered direction-first.
   *
   * `topLeft` is the raycast pointing upwards from the top left corner.
   * `leftTop` is the raycast pointing leftwards from the top left corner.
   * etc.
   */
  castCorners(
    distance: number,
    corners: Partial<Record<Corner, boolean>>
  ): Hits {
    const bounds = this.owner.collider.bounds

    const cast = (pos: ex.Vector, dir: ex.Vector) =>
      this.cast(pos, dir, { maxDistance: distance, exclude: [this.owner] })

    const offset = 0.5

    // points are substracted by 0.5 on their opposite axis to help with collider overlap.
    // i.e leftBottom detecting a collision from below when on ground (it should only detect from the left)
    const hits = {
      // vertical
      topRight: corners.topRight
        ? cast(
            ex.vec(Math.floor(bounds.right - offset), Math.ceil(bounds.top)),
            ex.Vector.Up
          )
        : [],
      topLeft: corners.topLeft
        ? cast(
            ex.vec(Math.ceil(bounds.left + offset), Math.ceil(bounds.top)),
            ex.Vector.Up
          )
        : [],
      bottomRight: corners.bottomRight
        ? cast(
            ex.vec(
              Math.floor(bounds.right - offset),
              Math.floor(bounds.bottom)
            ),
            ex.Vector.Down
          )
        : [],
      bottomLeft: corners.bottomLeft
        ? cast(
            ex.vec(Math.ceil(bounds.left + offset), Math.floor(bounds.bottom)),
            ex.Vector.Down
          )
        : [],

      // horizontal
      rightTop: corners.rightTop
        ? cast(
            ex.vec(Math.floor(bounds.right), Math.ceil(bounds.top + offset)),
            ex.Vector.Right
          )
        : [],
      rightBottom: corners.rightBottom
        ? cast(
            ex.vec(Math.floor(bounds.right), Math.ceil(bounds.bottom - offset)),
            ex.Vector.Right
          )
        : [],
      leftTop: corners.leftTop
        ? cast(
            ex.vec(Math.ceil(bounds.left), Math.ceil(bounds.top + offset)),
            ex.Vector.Left
          )
        : [],
      leftBottom: corners.leftBottom
        ? cast(
            ex.vec(Math.ceil(bounds.left), Math.floor(bounds.bottom - offset)),
            ex.Vector.Left
          )
        : [],
    }

    return {
      ...hits,
      left: [...hits.leftTop, ...hits.leftBottom],
      right: [...hits.rightTop, ...hits.rightBottom],
      top: [...hits.topLeft, ...hits.topRight],
      bottom: [...hits.bottomLeft, ...hits.bottomRight],
    }
  }

  isOnGround(distance: number = 1) {
    const hits = this.castCorners(distance, {
      bottomLeft: true,
      bottomRight: true,
    })

    return hits.bottom.length > 0 || !!this.getSlope()
  }

  isOnSlope() {
    return !!this.getSlope()
  }

  getSlope(
    groundDistance = 1,
    maxSlopeDistance = 8
  ): {
    angle: number
    hit: ex.RayCastHit
  } | null {
    const { bottomLeft, bottomRight } = this.castCorners(maxSlopeDistance, {
      bottomLeft: true,
      bottomRight: true,
    })

    // pick closest hit
    const left = bottomLeft.sort((a, b) => a.distance - b.distance)[0]
    const right = bottomRight.sort((a, b) => a.distance - b.distance)[0]

    if (!left || !right) {
      return null
    }

    const leftOnGround = Math.round(left.distance) <= groundDistance
    const rightOnGround = Math.round(right.distance) <= groundDistance
    const isEven = Math.round(left.distance) === Math.round(right.distance)

    // if we're in the air or on flat ground
    if ((!leftOnGround && !rightOnGround) || isEven) {
      return null
    }

    const angle = Math.atan2(
      left.point.y - right.point.y,
      left.point.x - right.point.x
    )

    return { angle, hit: leftOnGround ? right : left }
  }

  isOnWall(distance: number = 1) {
    const hits = this.castCorners(distance, {
      leftTop: true,
      leftBottom: true,
      rightTop: true,
      rightBottom: true,
    })

    return (
      hits.leftTop.length > 0 ||
      hits.leftBottom.length > 0 ||
      hits.rightTop.length > 0 ||
      hits.rightBottom.length > 0
    )
  }
}

type Corner =
  | 'topRight'
  | 'topLeft'
  | 'bottomRight'
  | 'bottomLeft'
  | 'rightTop'
  | 'rightBottom'
  | 'leftTop'
  | 'leftBottom'

type Hits = Record<
  Corner | 'left' | 'right' | 'bottom' | 'top',
  ex.RayCastHit[]
>
