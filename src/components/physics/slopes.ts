import * as ex from 'excalibur'

/**
 * Allows actor to climb slopes without sliding down or impacting
 * x velocity. Requires SlopeSystem to be added to the world.
 *
 * Velocity is adjusted by the SlopeSystem during the update loop. If you wish to change
 * the velocity on the entity **after** moving along the slope (for example, jumping),
 * you should do so during postupdate.
 *
 * You can check if you're currently on a slope by using the `isOnSlope` on the component.
 */
export class SlopesComponent extends ex.Component {
  /**
   * The difference in angles (rad) between the slope and the entity's velocity
   * at which the entity will "break away" from the slope.
   */
  breakawayAngle = 1

  slope?: {
    collider: ex.Collider
    contact: ex.CollisionContact
  }

  isMovingAlongSlope = false

  get isOnSlope() {
    return !!this.slope
  }

  private get vel() {
    const motion = this.owner?.get(ex.MotionComponent)

    if (!motion) {
      throw new Error('MotionComponent is required on owner')
    }

    return motion.vel
  }

  onAdd(owner: ex.Entity<any>): void {
    const collider = owner.get(ex.ColliderComponent)
    collider.events.on('precollision', this.onPreCollisionResolve.bind(this))
    collider.events.on('collisionend', this.onCollisionEnd.bind(this))
  }

  onPreCollisionResolve({
    contact,
    other,
  }: {
    contact: ex.CollisionContact
    other: ex.Collider
  }): void {
    // determine if collision happened on a sloped plane
    const isSlope =
      Math.abs(contact.normal.y) > 0 && Math.abs(contact.normal.y) < 1

    if (isSlope) {
      this.slope = {
        collider: other,
        contact,
      }

      const { slope, intercept, begin, end } = contact.info.side!

      const point = contact.info.point
      const x = ex.clamp(point.x, begin.x, end.x)
      const y = slope * x + intercept

      const isColliderA = other === contact.colliderB

      contact.mtv.x = 0
      contact.mtv.y = (point.y - y) * (isColliderA ? 1 : -1)

      // treat this collision as a flat surface
      // prevents collision system(?) from adding vel on x during resolve
      contact.normal = ex.vec(0, isColliderA ? 1 : -1)
    }
  }

  onCollisionEnd({ other }: { other: ex.Collider }): void {
    if (this.slope?.collider === other) {
      this.slope = undefined
    }
  }
}

export class SlopesSystem extends ex.System {
  query: ex.Query<typeof ex.MotionComponent | typeof SlopesComponent>

  constructor(world: ex.World) {
    super()
    this.query = world.query([ex.MotionComponent, SlopesComponent])
  }

  // should run before ex.MotionSystem, which is priority -5
  public priority = -6

  public systemType = ex.SystemType.Update

  update() {
    for (const entity of this.query.entities) {
      const motion = entity.get(ex.MotionComponent)
      const slopes = entity.get(SlopesComponent)

      const wasMovingAlongSlope = slopes.isMovingAlongSlope
      slopes.isMovingAlongSlope = false

      if (slopes.slope) {
        const plane = slopes.slope.contact.info.side

        if (plane) {
          const { begin, end, slope } = plane
          const deltaX = end.x - begin.x
          const deltaY = end.y - begin.y
          const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          const slopeDirX = deltaX / length
          const slopeDirY = deltaY / length

          const currentVelSlope = motion.vel.y / motion.vel.x

          // is moving up the slope at an angle less than the slope
          // (therefore we need to adjust the vel)
          const isMovingUpSlope =
            Math.sign(motion.vel.x) !== Math.sign(slopeDirY) &&
            Math.abs(currentVelSlope) <= Math.abs(slope)

          // is moving down at any angle
          const isMovingDownSlope =
            Math.sign(motion.vel.x) === Math.sign(slopeDirY)

          const isBreakingAwayFromSlope =
            Math.abs(currentVelSlope) !== Infinity &&
            Math.abs(currentVelSlope) - Math.abs(slope) > slopes.breakawayAngle

          // cancel out y if we've stopped moving up the slope
          if (
            !isBreakingAwayFromSlope &&
            !isMovingUpSlope &&
            !isMovingDownSlope &&
            wasMovingAlongSlope
          ) {
            motion.vel.y = 0
          }

          if (
            !isBreakingAwayFromSlope &&
            (isMovingUpSlope || isMovingDownSlope)
          ) {
            const velocityAlongSlope = motion.vel.x / slopeDirX

            motion.vel.x = velocityAlongSlope * slopeDirX
            motion.vel.y = velocityAlongSlope * slopeDirY

            slopes.isMovingAlongSlope = true
          }
        }
      }
    }
  }
}
