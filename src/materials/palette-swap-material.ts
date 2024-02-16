import * as ex from 'excalibur'

export class PaletteSwapMaterial extends ex.Material {
  constructor(
    ctx: ex.ExcaliburGraphicsContext,
    colors: [ex.Color, ex.Color][]
  ) {
    super({
      name: 'palette-swap-material',
      fragmentSource: /*glsl*/ `#version 300 es
        precision mediump float;
  
        uniform sampler2D u_graphic;

        // old colors to replace new colors in groups of 3 (r, g, b)
        uniform float u_oldColors[256];
        uniform float u_newColors[256];

        in vec2 v_uv;
        out vec4 fragColor;

        void main() {
          vec4 color = texture(u_graphic, v_uv);
          fragColor = color;

          for (int i = 0; i < 256; i += 3) {
            // if the old color is -1, we've reached the end of the colors
            if (u_oldColors[i] == -1.0) break;
                        
            if (color.r * 255.0 == u_oldColors[i] && color.g * 255.0 == u_oldColors[i + 1] && color.b * 255.0 == u_oldColors[i + 2]) {              
              fragColor = vec4(u_newColors[i] / 255.0, u_newColors[i + 1] / 255.0, u_newColors[i + 2] / 255.0, color.a);
              break;
            }
          }
        }`,
      graphicsContext: ctx,
    })

    this.setPalette(colors)
  }

  setPalette(colors: [ex.Color, ex.Color][]) {
    const oldColors = new Array(256).fill(-1)
    const newColors = new Array(256).fill(-1)

    colors.forEach(([from, to], index) => {
      oldColors[index * 3] = from.r
      oldColors[index * 3 + 1] = from.g
      oldColors[index * 3 + 2] = from.b

      newColors[index * 3] = to.r
      newColors[index * 3 + 1] = to.g
      newColors[index * 3 + 2] = to.b
    })

    this.update((shader) => {
      shader.trySetUniformFloatArray('u_oldColors', oldColors)
      shader.trySetUniformFloatArray('u_newColors', newColors)
    })
  }
}
