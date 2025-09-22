// spellchecker:words canvg
import { Canvg, type IOptions, presets } from 'canvg'

const preset = presets.offscreen() as unknown as IOptions
export default async function SVG2Image(
  source: string,
  width: number,
  height: number,
  mediaType: string,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('SVG2Image: OffscreenCanvas not supported')
  }

  // the type casting here is needed because OffScreenCanvas may return null
  const v = Canvg.fromString(ctx, source, preset)
  v.resize(width, height, true)
  await v.render()

  return await canvas.convertToBlob()
}
