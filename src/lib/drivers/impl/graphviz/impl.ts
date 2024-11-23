import type { Graph, RenderOptions } from '@viz-js/viz'
import { formatError } from '../../../utils/errors'

export interface GraphVizRequest {
  input: string | Graph
  options: RenderOptions
}
export type GraphVizResponse =
  | { success: true; result: string }
  | { success: false; message: string }

/** processes a graphviz request */
export async function processRequest(
  request: GraphVizRequest,
): Promise<string> {
  const { instance } = await import('@viz-js/viz')
  const result = (await instance()).render(request.input, request.options)
  if (result.status !== 'success') {
    const message =
      'render() returned failure: \n' +
      result.errors.map(formatError).join('\n')
    throw new Error(message)
  }
  return result.output
}
