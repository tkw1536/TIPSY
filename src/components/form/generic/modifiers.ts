import type { Ref } from 'preact'
import { setRef } from '../../../lib/utils/ref'
import { useEffect, useRef, type MutableRef } from 'preact/hooks'

export type ModifierKeys = Readonly<{
  shift: boolean
  control: boolean
  alt: boolean
  meta: boolean
}>

class ModifierKeyObserver {
  #nextID = Number.MIN_SAFE_INTEGER
  readonly #refs = new Map<number, Ref<Readonly<ModifierKeys>>>()

  /**
   * Adds a new ref to be notified upon change of modifier keys.
   * @returns an id to be passed to {@link remove} for removal of the ref.
   */
  add(ref: Ref<ModifierKeys> | undefined): number {
    if (ref === null || typeof ref === 'undefined') {
      return NaN
    }

    if (this.#nextID === Number.MAX_SAFE_INTEGER) {
      throw new Error(
        'ModifierKeyObserver: Too many refs: Reached Number.MAX_SAFE_INTEGER',
      )
    }

    // get the next id and add the ref
    const id = this.#nextID++
    this.#refs.set(id, ref)

    // if we have a current status, notify the listener now
    if (this.#current !== null) {
      setRef(ref, this.#current)
    }

    // if we just added the first ref, add a listener
    if (this.#refs.size === 1) {
      document.addEventListener('keyup', this.#listener)
      document.addEventListener('keydown', this.#listener)
    }

    return id
  }

  /**
   * Stop notifying a ref that was previously added with {@link add}.
   * The id must have been return from add; otherwise this function is a no-op.
   */
  remove(id: number): void {
    const deleted = this.#refs.delete(id)

    if (deleted && this.#refs.size === 0) {
      document.removeEventListener('keyup', this.#listener)
      document.removeEventListener('keydown', this.#listener)
      this.#current = null
    }
  }

  /* the current modifier keys (if known) */
  #current: ModifierKeys | null = null

  readonly #listener = (event: KeyboardEvent): void => {
    // if none of the keys have changed, bail out!
    if (
      this.#current !== null &&
      this.#current.shift === event.shiftKey &&
      this.#current.control === event.ctrlKey &&
      this.#current.alt === event.altKey &&
      this.#current.meta === event.metaKey
    ) {
      return
    }

    // update the keys
    this.#current = Object.freeze({
      shift: event.shiftKey,
      control: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    })

    // and notify the listeners
    this.#refs.forEach(ref => {
      setRef(ref, this.#current)
    })
  }
}

const observer = new ModifierKeyObserver()
const defaultKeys: ModifierKeys = Object.freeze({
  control: false,
  meta: false,
  shift: false,
  alt: false,
})

export default function useModifierRef(): MutableRef<ModifierKeys> {
  const modifiers = useRef<ModifierKeys>(defaultKeys)

  useEffect(() => {
    const id = observer.add(modifiers)
    return () => {
      observer.remove(id)
    }
  }, [])

  return modifiers
}
