import * as ex from 'excalibur'

export class ScrollingBackground extends ex.Entity {
  xSpeed: number
  ySpeed: number

  image: ex.ImageSource

  graphics = new ex.GraphicsComponent()
  transform = new ex.TransformComponent()

  constructor(args: {
    image: ex.ImageSource
    xSpeed?: number
    ySpeed?: number
    z?: number
  }) {
    const { xSpeed = 0.1, ySpeed = 0.05, z = -100, image } = args
    super()
    this.addComponent(this.graphics)
    this.addComponent(this.transform)

    this.image = image
    this.xSpeed = xSpeed
    this.ySpeed = ySpeed

    this.graphics.anchor = ex.vec(0, 0)
    this.transform.pos = ex.vec(0, 0)
    this.transform.z = z
  }

  onInitialize(_engine: ex.Engine): void {
    const sprite = this.image.toSprite()

    // calculate how many times the sprite needs to be repeated in the X and Y
    // directions to cover the entire viewport (plus one extra to account for scrolling)
    const viewportWidth = this.scene.camera.viewport.width
    const viewportHeight = this.scene.camera.viewport.height
    const xRepeat = Math.ceil(viewportWidth / sprite.width) + 1
    const yRepeat = Math.ceil(viewportHeight / sprite.height) + 1

    // create a tiled graphic of the sprite repeated xRepeat * yRepeat times
    this.graphics.use(
      new ex.GraphicsGroup({
        members: Array.from({ length: xRepeat * yRepeat }).map((_, i) => {
          const column = i % xRepeat
          const row = Math.floor(i / yRepeat)

          return {
            graphic: sprite,
            pos: ex.vec(sprite.width * column, sprite.height * row),
          }
        }),
      })
    )

    this.scene.on('predraw', () => {
      const camera = this.scene.camera

      const cameraLeft = camera.interpolatedPos.x - _engine.halfDrawWidth
      const cameraTop = camera.interpolatedPos.y - _engine.halfDrawHeight
      const cameraCenter = camera.interpolatedPos

      // set the position of the background to the top left of the camera
      this.transform.pos.x = cameraLeft
      this.transform.pos.y = cameraTop

      // create a parallax effect by adjusting the anchor based on the camera's
      // position
      this.graphics.anchor.x =
        ((cameraCenter.x / sprite.width) * this.xSpeed) % (1 / xRepeat)

      this.graphics.anchor.y =
        ((cameraCenter.y / sprite.height) * this.ySpeed) % (1 / yRepeat)
    })
  }
}
