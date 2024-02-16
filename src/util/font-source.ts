import * as ex from 'excalibur'

export interface FontSourceOptions
  extends Omit<ex.FontOptions, 'family'>,
    ex.GraphicOptions,
    ex.RasterOptions {
  bustCache?: boolean
}

export class FontSource implements ex.Loadable<FontFace> {
  private path: string
  private _resource: ex.Resource<Blob>
  private _isLoaded = false
  private options: FontSourceOptions = {}

  data!: FontFace
  family: string

  constructor(
    path: string,
    family: string,
    { bustCache, ...options }: FontSourceOptions = {}
  ) {
    this.path = path
    this._resource = new ex.Resource(path, 'blob', bustCache)
    this.options = options
    this.family = family
  }

  async load(): Promise<FontFace> {
    if (this.isLoaded()) {
      return this.data
    }

    try {
      const blob = await this._resource.load()
      const url = URL.createObjectURL(blob)

      const fontFile = new FontFace(this.family, `url(${url})`)
      document.fonts.add(fontFile)

      await fontFile.load()
      this.data = fontFile
      this._isLoaded = true
    } catch (error) {
      throw `Error loading FontSource from path '${this.path}' with error [${
        (error as Error).message
      }]`
    }
    return this.data
  }

  isLoaded(): boolean {
    return this._isLoaded
  }

  toFont(options?: FontSourceOptions): ex.Font {
    return new ex.Font({ family: this.family, ...this.options, ...options })
  }
}
