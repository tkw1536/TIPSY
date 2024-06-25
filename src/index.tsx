if (process.env.NODE_ENV !== 'production') {
  require('preact/debug')
}

import { render } from 'preact' // eslint-disable-line import/first
import { App } from './app' // eslint-disable-line import/first
import { ErrorBoundary } from './lib/components/error' // eslint-disable-line import/first

function main (): void {
  const root = document.getElementById('root')
  if (root == null) {
    console.error('no root element')
    return
  }
  render(<ErrorBoundary><App /></ErrorBoundary>, root)
}
main()
