import type { JSX, VNode } from 'preact'
import generateDisclaimer from '../../macros/disclaimer' with { type: 'macro' }
import markdownDocument from '../../macros/markdown' with { type: 'macro' }
import UnClosableModal from './layout/banner'
import HTML from './html'
import { useCallback, useRef, useState } from 'preact/hooks'
import { classes } from '../lib/utils/classes'
import * as styles from './legal.module.css'

const disclaimer = generateDisclaimer()

export default function Legal(): VNode<any> {
  return (
    <>
      <p>
        While the code to this project is open source and you may inspect it to
        your heart's content, it does not have a license. This means that you
        may not publicly perform, create derivative works of or distribute this
        code. In particular you are not granted a license to use this code to
        create visualizations of your own pathbuilders. If you would like to
        acquire a license to use this software, please contact us.
      </p>
      <p>
        This app makes use of several JavaScript libraries. Some of these
        require that attribution is given to their authors. You can look at
        these notices below.
      </p>
      <details>
        <summary>Legal Notices</summary>
        <LegalDisclaimer />
      </details>
    </>
  )
}

export function LegalDisclaimer(): VNode<any> {
  return (
    <pre>
      <code>{disclaimer}</code>
    </pre>
  )
}

function Copyable(props: { children: VNode[] }): VNode {
  const ref = useRef<HTMLSpanElement>(null)
  const handleClick = useCallback(() => {
    const { current } = ref
    if (current === null) {
      throw new Error('never reached')
    }
    const { innerHTML, innerText } = current

    navigator.clipboard
      .write([
        new ClipboardItem({
          'text/plain': new Blob([innerText], { type: 'text/plain' }),
          'text/html': new Blob([innerHTML], { type: 'text/html' }),
        }),
      ])
      .then(
        () => {},
        (err: unknown) => {
          console.error('Unable to copy to clipboard: ', err)
        },
      )
  }, [])

  return (
    <span class={classes(styles.copyable)} ref={ref} onClick={handleClick}>
      {props.children}
    </span>
  )
}

const bannerHTML = markdownDocument('banner.md')

export function LegalModal(props: {
  open: boolean
  onClose: () => void
}): JSX.Element | null {
  const { open, onClose } = props
  const handleClose = useCallback((): boolean => {
    if (!isAllowedBrowser()) {
      return false
    }
    onClose()
    return true
  }, [onClose])

  // create a key that identifies the <Modal> component.
  // This is incremented to force a re-create; triggered when the dialog element is
  // manually removed from the dom.
  // The re-creation should force re-adding the element.
  const [key, setKey] = useState(0)
  const forceRecreateModal = useCallback(() => {
    setKey(key => key + 1)
  }, [])

  if (!open) return null

  return (
    <UnClosableModal
      key={key.toString()}
      onClose={handleClose}
      onDisappear={forceRecreateModal}
      buttonText='I Understand And Agree To These Terms'
    >
      <p>
        <h1>
          TIPSY - Tom's Inspector for Pathbuilders <sub>Yaaaaaahs!</sub>
        </h1>
        <BannerContents />
      </p>
    </UnClosableModal>
  )
}

export function BannerContents(): VNode {
  return (
    <HTML
      html={bannerHTML}
      trim={false}
      noContainer
      components={{ Legal: LegalDisclaimer, Copyable }}
    />
  )
}

const skipBrowserCheckEnv = import.meta.env.VITE_SKIP_ALLOWED_BROWSER_CHECK
const skipBrowserCheck =
  typeof skipBrowserCheckEnv === 'string' && skipBrowserCheckEnv !== ''
export const IsAllowedBrowser = skipBrowserCheck
  ? true
  : !('chrome' in globalThis)

/**
 * Checks if the browser is allowed to use this software.
 * If so, returns true.
 * If not, returns false and {@link window.alert}s the user.
 */
function isAllowedBrowser(): boolean {
  if (!IsAllowedBrowser) {
    return confirm(
      'You are using Chrome or a Chromium-based browser. Please be aware that export functionality is not be available. ',
    )
  }

  return true
}
