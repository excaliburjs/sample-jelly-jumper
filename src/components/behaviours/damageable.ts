import * as ex from 'excalibur'
import { HealthComponent } from './health'
import { coroutine } from '../../util/coroutine'
import { AudioManager } from '../../state/audio'
import { Resources } from '../../resources'

export class DamageableComponent extends ex.Component {
  declare owner: ex.Actor

  events = new ex.EventEmitter<{
    damage: { amount: number; knockback?: 'left' | 'right' }
  }>()

  INVINCIBILITY_DURATION = 2000
  KNOCKBACK_DURATION = 200

  isInvincible: boolean = false
  isBeingKnockedBack: boolean = false

  damage(amount: number, knockback?: 'left' | 'right') {
    if (this.isInvincible) return
    const self = this
    const health = this.owner.get(HealthComponent)

    this.events.emit('damage', { amount, knockback })
    this.isInvincible = true

    AudioManager.playSfx(Resources.sfx.damage)
    if (health) {
      health.amount -= amount
    }

    if (knockback) {
      const yVel = -300
      const xVel = 100 * (knockback === 'left' ? -1 : 1)
      this.owner.vel = ex.vec(xVel, yVel)
      this.owner.acc = ex.vec(0, 0)
      this.isBeingKnockedBack = true
    }

    coroutine(this.owner, function* () {
      let elapsed = 0

      let flashRate = 100

      while (
        elapsed < Math.max(self.KNOCKBACK_DURATION, self.INVINCIBILITY_DURATION)
      ) {
        const { delta } = yield
        elapsed += delta

        if (self.isBeingKnockedBack && elapsed > self.KNOCKBACK_DURATION) {
          self.isBeingKnockedBack = false
          self.owner.vel.x = 0
        }

        if (elapsed > self.INVINCIBILITY_DURATION) {
          self.isInvincible = false
        }

        if (self.owner.graphics.current) {
          const shouldFlash = Math.floor(elapsed / flashRate) % 2 === 0

          self.owner.graphics.current.opacity = shouldFlash ? 0.35 : 1
        }
      }

      if (self.owner.graphics.current) {
        self.owner.graphics.current.opacity = 1
      }
    })
  }
}
