import type { ComponentChildren, JSX } from 'preact'
import { useCallback, useEffect, useRef } from 'preact/hooks'
import * as styles from './banner.module.css'
import Button from '../form/button'

interface ModalProps {
  children?: ComponentChildren
  buttonText?: ComponentChildren
  onClose: () => boolean
  onDisappear?: () => void
}

export default function UnClosableModal({
  onClose,
  onDisappear,
  children,
  buttonText,
}: ModalProps): JSX.Element {
  const modalRef = useRef<HTMLDialogElement>(null)

  // show the modal dialog on first render
  useEffect(() => {
    const modal = modalRef.current
    if (modal === null) throw new Error('never reached')
    modal.showModal()
  }, [])

  // check that the element is not removed by hand
  useEffect(() => {
    if (typeof onDisappear !== 'function') {
      return
    }

    const modal = modalRef.current
    if (modal === null) throw new Error('never reached')
    const parent = modal.parentElement
    if (parent === null) throw new Error('never reached')

    const observer = new MutationObserver(() => {
      if (!document.contains(modal)) {
        onDisappear()
      }
    })
    observer.observe(parent, { childList: true })

    return () => {
      observer.disconnect()
    }
  }, [onDisappear])

  const handleButton = useCallback(() => {
    modalRef.current?.close()
  }, [])

  const handleCancel = useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  const handleClose = useCallback(
    (event: Event) => {
      event.preventDefault()

      if (!onClose()) {
        const modal = modalRef.current
        if (modal === null) throw new Error('never reached')

        // hack: on Chrome we need to re-open the dialog element
        // because preventDefault() is ineffective.
        queueMicrotask(() => {
          if (modal.open) return
          modal.showModal()
        })
      }
    },
    [onClose],
  )

  return (
    <dialog
      ref={modalRef}
      onCancel={handleCancel}
      onClose={handleClose}
      class={styles.banner}
    >
      {children}
      <Button onInput={handleButton}>{buttonText}</Button>
    </dialog>
  )
}
