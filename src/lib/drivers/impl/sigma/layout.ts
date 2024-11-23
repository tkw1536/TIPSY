export class SigmaLayout {
  #layout: LayoutLike | null
  #animating: ((value: boolean | null) => void) | null
  constructor(
    layout: LayoutLike,
    animatingRef: (value: boolean | null) => void,
  ) {
    this.#layout = layout
    this.#animating = animatingRef
  }

  #poller: NodeJS.Timeout | null = null
  #running = false
  start = (): void => {
    if (this.#running || this.#layout === null) return
    this.#running = true
    if (this.#animating !== null) {
      this.#animating(true)
    }
    this.#layout.start()
    this.#startPolling()
  }
  stop = (): void => {
    if (!this.#running || this.#layout === null) return
    this.#stopPolling()
    this.#running = false
    if (this.#animating !== null) {
      this.#animating(false)
    }
    this.#layout.stop()
  }
  kill = (): void => {
    this.#running = false
    this.#stopPolling()

    if (this.#animating !== null) {
      this.#animating(null)
      this.#animating = null
    }

    if (this.#layout !== null) {
      this.#layout.kill()
      this.#layout = null
    }
  }

  #startPolling(): void {
    this.#stopPolling()

    this.#poller = setInterval(() => {
      if (this.#layout === null || !this.#layout.isRunning()) {
        this.stop()
      }
    }, 500)
  }
  #stopPolling(): void {
    if (this.#poller !== null) {
      clearInterval(this.#poller)
      this.#poller = null
    }
  }
}

interface LayoutLike {
  isRunning: () => boolean
  start: () => void
  stop: () => void
  kill: () => void
}
