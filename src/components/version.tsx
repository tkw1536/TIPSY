import type { VNode } from 'preact'
import getVersionInfo from '../../macros/version' with { type: 'macro' }

const version = getVersionInfo()

export default function VersionInfo(): VNode<any> {
  return <code>{JSON.stringify(version)}</code>
}
