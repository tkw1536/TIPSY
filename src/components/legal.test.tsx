import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import Legal, {
  LegalDisclaimer,
  LegalModal,
  BannerContents,
  testDisclaimer,
} from './legal'

//spellchecker:words tipsy

vi.mock('../app/inspector/state', () => ({
  default: vi.fn((selector: (state: { embed: boolean }) => boolean) =>
    selector({ embed: false }),
  ),
}))

describe('Legal', () => {
  test('renders main content paragraphs', () => {
    const { container } = render(<Legal />)

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(2)
  })

  test('renders license notice text', () => {
    const { container } = render(<Legal />)

    expect(container.textContent).toContain('open source')
    expect(container.textContent).toContain('does not have a license')
  })

  test('renders attribution text', () => {
    const { container } = render(<Legal />)

    expect(container.textContent).toContain('JavaScript libraries')
    expect(container.textContent).toContain('attribution')
  })

  test('renders details element with Legal Notices summary', () => {
    const { container } = render(<Legal />)

    const details = container.querySelector('details')
    expect(details).not.toBeNull()

    const summary = container.querySelector('summary')
    expect(summary).not.toBeNull()
    expect(summary?.textContent).toBe('Legal Notices')
  })

  test('contains LegalDisclaimer within details', () => {
    const { container } = render(<Legal />)

    const details = container.querySelector('details')
    expect(details).not.toBeNull()

    const pre = details?.querySelector('pre')
    expect(pre).not.toBeNull()
  })
})

describe('LegalDisclaimer', () => {
  test('renders pre and code elements', () => {
    const { container } = render(<LegalDisclaimer />)

    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()

    const code = container.querySelector('code')
    expect(code).not.toBeNull()
  })

  test('displays the test disclaimer content', () => {
    const { container } = render(<LegalDisclaimer />)

    const code = container.querySelector('code')
    expect(code?.textContent).toBe(testDisclaimer)
  })
})

describe('LegalModal', () => {
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
    // Mock alert since it's not available in test environment
    vi.stubGlobal('alert', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('returns null when open is false', () => {
    const onClose = vi.fn()

    const { container } = render(<LegalModal open={false} onClose={onClose} isEmbedded={false} />)

    expect(container.innerHTML).toBe('')
  })

  test('renders dialog when open is true', () => {
    const onClose = vi.fn()

    const { container } = render(<LegalModal open={true} onClose={onClose} isEmbedded={false} />)

    const dialog = container.querySelector('dialog')
    expect(dialog).not.toBeNull()
  })

  test('renders title with TIPSY heading', () => {
    const onClose = vi.fn()

    const { container } = render(<LegalModal open={true} onClose={onClose} isEmbedded={false} />)

    const heading = container.querySelector('h1')
    expect(heading).not.toBeNull()
    expect(heading?.textContent).toContain('TIPSY')
  })

  test('renders button with agreement text', () => {
    const onClose = vi.fn()

    const { container } = render(<LegalModal open={true} onClose={onClose} isEmbedded={false} />)

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.textContent).toBe('I Understand And Agree To These Terms')
  })

  test('shows alert when TIPSY is not available and button is clicked', () => {
    const onClose = vi.fn()

    const { container } = render(<LegalModal open={true} onClose={onClose} isEmbedded={false} />)

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    if (button === null) return

    fireEvent.click(button)

    // In test mode, tipsyIsAvailable is false, so alert should be shown
    expect(alert).toHaveBeenCalledWith('TIPSY IS NO LONGER AVAILABLE.')
    // onClose should not be called when TIPSY is not available
    expect(onClose).not.toHaveBeenCalled()
  })

  test('shows modal on mount', () => {
    const onClose = vi.fn()

    render(<LegalModal open={true} onClose={onClose} isEmbedded={false} />)

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })
})

describe('BannerContents', () => {
  test('renders without crashing', () => {
    expect(() => render(<BannerContents isEmbedded={false} />)).not.toThrow()
  })
})
