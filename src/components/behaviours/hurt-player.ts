import * as ex from 'excalibur'

/**
 * Hurts the player on collision.
 */
export class HurtPlayerComponent extends ex.Component {
  amount: number

  constructor({ amount }: { amount: number }) {
    super()

    this.amount = amount
  }
}
