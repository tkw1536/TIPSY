import Sigma from 'sigma'

export default async function exportRaster(
  renderer: Sigma,
  format: string,
  inputLayers?: string[],
): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const { width, height } = getCanvasDimensions(renderer)

    canvas.setAttribute('width', width + '')
    canvas.setAttribute('height', height + '')

    const ctx = canvas.getContext('2d')
    if (ctx === null) {
      reject(new Error('missing canvas context'))
      return
    }

    const cleanup = renderContext(renderer, ctx, inputLayers)

    // Save the canvas as a PNG image:
    canvas.toBlob(blob => {
      if (blob !== null) {
        resolve(blob)
      } else {
        reject(new Error('no blob produced'))
      }

      cleanup()
    }, format)
  })
}

/**
 * Renders an existing instance into an svg context, and returns a function to cleanup said context.
 * Adapted from https://github.com/jacomyal/sigma.js/blob/0c4cb64fdc3561f8085822ca44260b049e7758fe/packages/storybook/stories/png-snapshot/saveAsPNG.ts.
 *
 * The original code is licensed as follows:
 *
 * @license
 *
 * Copyright (C) 2013-2024, Alexis Jacomy, Guillaume Plique, Benoît Simard https://www.sigmajs.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
function renderContext(
  sigma: Sigma,
  ctx: CanvasRenderingContext2D,
  inputLayers?: string[],
): () => void {
  const { width, height } = sigma.getDimensions()

  const rootElement = document.createElement('DIV')
  rootElement.style.width = `${width}px`
  rootElement.style.height = `${height}px`
  rootElement.style.position = 'absolute'
  rootElement.style.right = '101%'
  rootElement.style.bottom = '101%'
  document.body.appendChild(rootElement)

  const { width: cWidth, height: cHeight } = getCanvasDimensions(sigma)

  // draw a background
  // eslint-disable-next-line no-param-reassign -- intentional side effect
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, cWidth, cHeight)

  // Instantiate sigma:
  const tmpRenderer = new Sigma(
    sigma.getGraph(),
    rootElement,
    sigma.getSettings(),
  )

  // Copy camera and force to render now, to avoid having to wait the schedule /
  // debounce frame:
  tmpRenderer.getCamera().setState(sigma.getCamera().getState())
  tmpRenderer.refresh()

  // For each layer, draw it on our canvas:
  const canvases = tmpRenderer.getCanvases()
  const layers =
    typeof inputLayers !== 'undefined'
      ? inputLayers.filter(id => Object.hasOwn(canvases, id))
      : Object.keys(canvases)
  layers.forEach(id => {
    ctx.drawImage(canvases[id], 0, 0, cWidth, cHeight, 0, 0, cWidth, cHeight)
  })

  return () => {
    tmpRenderer.kill()
    rootElement.remove()
  }
}

/**
 * Gets the real dimensions of a sigma renderer.
 * Adapted from https://github.com/jacomyal/sigma.js/blob/0c4cb64fdc3561f8085822ca44260b049e7758fe/packages/storybook/stories/png-snapshot/saveAsPNG.ts.
 *
 * The original code is licensed as follows:
 *
 * @license
 *
 * Copyright (C) 2013-2024, Alexis Jacomy, Guillaume Plique, Benoît Simard https://www.sigmajs.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
function getCanvasDimensions(sigma: Sigma): {
  width: number
  height: number
} {
  // This pixel ratio is here to deal with retina displays.
  // Indeed, for dimensions W and H, on a retina display, the canvases
  // dimensions actually are 2 * W and 2 * H. Sigma properly deals with it, but
  // we need to readapt here:
  const { devicePixelRatio: pixelRatio } = window
  const { width, height } = sigma.getDimensions()

  return { width: width * pixelRatio, height: height * pixelRatio }
}

// spellchecker:words Jacomy Guillaume Plique Benoît Simard
