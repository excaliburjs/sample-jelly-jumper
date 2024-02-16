import * as ex from 'excalibur'

export class EaseAction implements ex.Action {
  private elapsed: number = 0
  private completed = false

  constructor(
    public args: {
      initial: number
      target: number
      duration: number
      easing: ex.EasingFunction
    },
    public callback: (value: number) => void
  ) {}

  update(delta: number): void {
    this.elapsed += delta
    const value = this.args.easing(
      this.elapsed,
      this.args.initial,
      this.args.target,
      this.args.duration
    )

    if (this.elapsed >= this.args.duration) {
      this.stop()
      this.callback(this.args.target)
    } else if (this.callback) {
      this.callback(value)
    }
  }

  isComplete(entity: ex.Entity<any>): boolean {
    return this.completed
  }

  reset(): void {
    this.elapsed = 0
    this.completed = false
  }

  stop(): void {
    this.completed = true
  }
}
