import { type JSX, type ComponentChildren } from 'preact'
import { classes } from '../../lib/utils/classes'
import * as styles from './index.module.css'
import getVersionInfo from '../../../macros/version' with { type: 'macro' }

const version = getVersionInfo()

function readEnvSafe(env: any): string | null {
  if (typeof env !== 'string') return null
  return env !== '' ? env : null
}

const LEGAL_URL = readEnvSafe(import.meta.env.VITE_LEGAL_URL)
const LEGAL_COPYRIGHT = readEnvSafe(import.meta.env.VITE_COPYRIGHT_NOTICE)

const VERSION_INFO = [
  import.meta.env.MODE,
  // version.version,
  version.git,
  version.compileTime,
]
  .filter(x => x !== '')
  .join(' / ')

export default function Layout(props: {
  children: ComponentChildren
}): JSX.Element {
  return (
    <>
      <main class={classes(styles.main)}>{props.children}</main>
      <footer class={classes(styles.footer)}>
        &copy; {LEGAL_COPYRIGHT}
        {` `}
        {LEGAL_URL !== null && (
          <>
            <a href={LEGAL_URL} target='_blank' rel='noopener noreferrer'>
              Imprint & Privacy Policy
            </a>
            . {` `}
          </>
        )}
        <a
          href={'https://github.com/tkw1536/TIPSY'}
          target='_blank'
          rel='noopener noreferrer'
        >
          Source Code
        </a>
        .{` `}
        TIPSY Version: {` `}
        <code>{VERSION_INFO}</code>
      </footer>
    </>
  )
}
