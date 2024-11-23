import { formatError } from '../../../utils/errors'
import {
  type GraphVizRequest,
  type GraphVizResponse,
  processRequest,
} from './impl'

onmessage = function (e) {
  processMessage(e.data)
    .then(result => {
      const message: GraphVizResponse = { success: true, result }
      postMessage(message)
    })
    .catch((err: unknown) => {
      const message: GraphVizResponse = {
        success: false,
        message: formatError(err),
      }
      postMessage(message)
    })
}

async function processMessage(data: any): Promise<string> {
  if (!isRequest(data)) {
    throw new Error('invalid request received')
  }

  return await processRequest(data)
}

function isRequest(data: any): data is GraphVizRequest {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  return (
    Object.hasOwn(data as object, 'input') &&
    Object.hasOwn(data as object, 'options')
  )
}
