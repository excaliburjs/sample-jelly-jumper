import * as ex from 'excalibur'

export class InputComponent extends ex.Component {
  declare owner: ex.Entity

  type = 'input'

  controls = {
    Left: [ex.Keys.Left, ex.Buttons.DpadLeft],
    Right: [ex.Keys.Right, ex.Buttons.DpadRight],
    Up: [ex.Keys.Up, ex.Buttons.DpadUp],
    Down: [ex.Keys.Down, ex.Buttons.DpadDown],
    Jump: [ex.Keys.A, ex.Buttons.Face1],
    Run: [ex.Keys.S, ex.Buttons.Face2],
  } as const

  isHeld(control: keyof typeof this.controls) {
    const engine = this.owner.scene.engine
    const [key, button] = this.controls[control]

    return Boolean(
      engine.input.keyboard.isHeld(key) ||
        this.getGamepad()?.isButtonHeld(button)
    )
  }

  wasPressed(control: keyof typeof this.controls) {
    const engine = this.owner.scene.engine
    const [key, button] = this.controls[control]

    return Boolean(
      engine.input.keyboard.wasPressed(key) ||
        this.getGamepad()?.wasButtonPressed(button)
    )
  }

  wasReleased(control: keyof typeof this.controls) {
    const engine = this.owner.scene.engine
    const [key, button] = this.controls[control]

    return Boolean(
      engine.input.keyboard.wasReleased(key) ||
        this.getGamepad()?.wasButtonReleased(button)
    )
  }

  getGamepad() {
    const engine = this.owner.scene.engine
    return [
      engine.input.gamepads.at(0),
      engine.input.gamepads.at(1),
      engine.input.gamepads.at(2),
      engine.input.gamepads.at(3),
    ].find((g) => g.connected)
  }
}
