import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import UnClosableModal from './banner'

import type {Window} from "happy-dom"

describe('UnClosableModal', () => {
  beforeEach(() => {
    // Mock showModal and close since jsdom doesn't fully support dialog
    HTMLDialogElement.prototype.showModal = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.open = false
      this.dispatchEvent(new Event('close'))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders dialog element', () => {
    const onClose = vi.fn(() => true)

    const { container } = render(<UnClosableModal onClose={onClose} />)

    const dialog = container.querySelector('dialog')
    expect(dialog).not.toBeNull()
  })

  test('shows modal on mount', () => {
    const onClose = vi.fn(() => true)

    render(<UnClosableModal onClose={onClose} />)

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })

  test('renders children content', () => {
    const onClose = vi.fn(() => true)

    const { container } = render(
      <UnClosableModal onClose={onClose}>
        <p>Test content</p>
      </UnClosableModal>,
    )

    expect(container.textContent).toContain('Test content')
  })

  test('renders button with custom text', () => {
    const onClose = vi.fn(() => true)

    const { container } = render(
      <UnClosableModal onClose={onClose} buttonText='Confirm'>
        Content
      </UnClosableModal>,
    )

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.textContent).toBe('Confirm')
  })

  test('clicking button closes the dialog', () => {
    const onClose = vi.fn(() => true)

    const { container } = render(
      <UnClosableModal onClose={onClose} buttonText='Close'>
        Content
      </UnClosableModal>,
    )

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    if (button === null) return

    fireEvent.click(button)

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
  })

  test('prevents cancel event', () => {
    const onClose = vi.fn(() => true)

    const { container } = render(<UnClosableModal onClose={onClose} />)

    const dialog = container.querySelector('dialog')
    expect(dialog).not.toBeNull()
    if (dialog === null) return

    const cancelEvent = new Event('cancel', { cancelable: true })
    dialog.dispatchEvent(cancelEvent)

    expect(cancelEvent.defaultPrevented).toBe(true)
  })

  test('calls onClose when dialog closes', () => {
    const onClose = vi.fn(() => true)

    const { container } = render(<UnClosableModal onClose={onClose} />)

    const dialog = container.querySelector('dialog')
    expect(dialog).not.toBeNull()
    if (dialog === null) return

    const closeEvent = new Event('close', { cancelable: true })
    dialog.dispatchEvent(closeEvent)

    expect(onClose).toHaveBeenCalled()
  })

  test('calls onDisappear when modal is removed from DOM manually', async () => {
    const onClose = vi.fn(() => true)
    const onDisappear = vi.fn()

    const { container } = render(
      <div id='wrapper'>
        <UnClosableModal onClose={onClose} onDisappear={onDisappear}>
          Content
        </UnClosableModal>
      </div>,
    )

    const wrapper = container.querySelector('#wrapper')
    expect(wrapper).not.toBeNull()

    const dialog = container.querySelector('dialog')
    expect(dialog).not.toBeNull()
    if (dialog === null) return

    // Manually remove the dialog element from the DOM
    dialog.remove()
    await (window as unknown as Window).happyDOM.waitUntilComplete();

    expect(onDisappear).toHaveBeenCalled()
  })

  test('does not call onDisappear when dialog is still in DOM', async () => {
    const onClose = vi.fn(() => true)
    const onDisappear = vi.fn()

    const { container } = render(
      <div id='wrapper'>
        <UnClosableModal onClose={onClose} onDisappear={onDisappear}>
          Content
        </UnClosableModal>
      </div>,
    )

    const dialog = container.querySelector('dialog')
    expect(dialog).not.toBeNull()
    expect(document.contains(dialog)).toBe(true)

    await (window as unknown as Window).happyDOM.waitUntilComplete();


    expect(onDisappear).not.toHaveBeenCalled()
  })

  test('does not throw when onDisappear is not provided', () => {
    const onClose = vi.fn(() => true)

    // Should not throw
    expect(() => {
      render(<UnClosableModal onClose={onClose}>Content</UnClosableModal>)
    }).not.toThrow()
  })
})
