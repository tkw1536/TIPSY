import { type JSX, type VNode } from 'preact'
import generateDisclaimer from '../../macros/disclaimer' with { type: 'macro' }
import markdownDocument from '../../macros/markdown' with { type: 'macro' }
import UnClosableModal from './layout/banner'
import HTML from './html'
import { useCallback, useState } from 'preact/hooks'

const disclaimer = generateDisclaimer()

export default function Legal(): VNode<any> {
  return (
    <>
      <p>
        While the code to this project is open source and you may inspect it to
        your heart's content, it (currently) does not have a license. This means
        that you may not run, create derivative works of or distribute this code
        (except for what is explicitly permitted by{' '}
        <a
          href='https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#5-license-grant-to-other-users'
          target='_blank'
          rel='noopener noreferrer'
        >
          Section 5 of GitHub terms of service
        </a>
        ). In particular you are not granted a license to use this code to
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
        <HTML
          html={bannerHTML}
          trim={false}
          noContainer
          components={{ Legal: LegalDisclaimer }}
        />
      </p>
    </UnClosableModal>
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
    return (
      confirm(
        'You are using a Chromium-based browser. Please be aware that export functionality is not be available, and per the licensing terms you may not take screenshots. ',
      ) ?? false
    )
  }

  return true
}
