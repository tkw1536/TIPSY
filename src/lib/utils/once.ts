enum State {
  Init,
  Pending,
  Fulfilled,
  Rejected,
}

/** Once calls the underlying function once  */
export default class Once {
  #state: State = State.Init
  #rejectReason: any = null
  #waiters: Array<{ resolve: () => void; reject: (err: any) => void }> = []
  async Do(func: () => Promise<void>): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const state = this.#state
      // everything is done already => don't do anything
      if (state === State.Fulfilled) {
        resolve()
        return
      }
      if (state === State.Rejected) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- must forward caught reason
        reject(this.#rejectReason)
        return
      }

      // add a waiter to the front
      this.#waiters.unshift({ resolve, reject })

      // if we're pending already, we should not start again
      if (this.#state === State.Pending) {
        return
      }

      this.#state = State.Pending
      func()
        .then(
          () => {
            this.#state = State.Fulfilled
            this.#waiters.forEach(({ resolve }) => {
              resolve()
            })
          },
          (err: unknown) => {
            this.#state = State.Rejected
            this.#rejectReason = err
            this.#waiters.forEach(({ reject }) => {
              reject(err)
            })
          },
        )
        .finally(() => {
          this.#waiters = [] // prevent memory leaks for the resolve/reject
        })
    })
  }
}

/** Lazy computes a specific value once */
export class Lazy<T> {
  readonly #once = new Once()
  #stored: T | null = null
  async Get(getter: () => Promise<T>): Promise<T> {
    await this.#once.Do(async () => {
      this.#stored = await getter()
    })

    if (this.#stored === null) {
      throw new Error('internal error: value not stored')
    }

    return this.#stored
  }

  get value(): T {
    if (this.#stored === null) throw new Error('Lazy: Value not loaded')
    return this.#stored
  }
}

export class LazyValue<T> {
  readonly #lazy = new Lazy<T>()
  readonly #getter: () => Promise<T>
  constructor(getter: () => Promise<T>) {
    this.#getter = getter
  }

  get value(): T {
    return this.#lazy.value
  }

  async load(): Promise<void> {
    await this.lazyValue
  }

  get lazyValue(): Promise<T> {
    return this.#lazy.Get(this.#getter)
  }
}
