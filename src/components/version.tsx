import type { VNode } from 'preact'
import getVersionInfo from '../../macros/version' with { type: 'macro' }

/**
 * Version info returned when running in test mode.
 */
export const testVersionInfo = {
  version: 'debug',
  git: 'debug',
  compileTime: '1970-01-01T00:00:00.000Z',
}
const version =
  import.meta.env.MODE === 'test' ? testVersionInfo : getVersionInfo()

/**
 * Displays current version info in a code block.
 */
export default function VersionInfo(): VNode<any> {
  return <code>{JSON.stringify(version)}</code>
}
