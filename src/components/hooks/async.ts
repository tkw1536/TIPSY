import { type Inputs, useCallback, useEffect, useState } from 'preact/hooks'

export type AsyncState<V, R = unknown> =
  | { status: 'pending' }
  | PromiseFulfilledResult<V>
  | (Omit<PromiseRejectedResult, 'reason'> & { reason: R })

function useAsyncState<V>(
  effect: (ticket: () => boolean) => () => Promise<V>,
  inputs: Inputs,
): AsyncState<V>
function useAsyncState<V, R>(
  effect: (ticket: () => boolean) => () => Promise<V>,
  inputs: Inputs,
  processReason: (reason: unknown) => R,
): AsyncState<V, R>
function useAsyncState<V, R>(
  effect: (ticket: () => boolean) => () => Promise<V>,
  inputs: Inputs,
  processReason?: (reason: unknown) => R,
): AsyncState<V, R> {
  const [state, setState] = useState<AsyncState<V, R>>({ status: 'pending' })

  useAsyncEffect(
    ticket => ({
      async promise() {
        return await effect(ticket)()
      },
      onFulfilled(value) {
        setState({ status: 'fulfilled', value })
      },
      onRejected(reason) {
        const theReason =
          typeof processReason === 'function'
            ? processReason(reason)
            : (reason as R)
        setState({ status: 'rejected', reason: theReason })
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is a custom hook
    inputs,
  )

  return state
}
export default useAsyncState

export function reasonAsError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason))
}
export function reasonAsCause(message?: string): (reason: unknown) => Error {
  return (cause: unknown) => {
    return new Error(message, { cause })
  }
}

/**
 * Like {@link useEffect}, but the effect function returns a promise.
 * Then either the onFulfilled or onRejected callback is executed, provided the effect has not already been cleaned up.
 * The cleanup function, if it is provided, is always executed, regardless if the promise itself is still pending or not.
 */
export function useAsyncEffect<T>(
  effect: (ticket: () => boolean) => {
    promise: () => Promise<T>
    onFulfilled?: (value: T) => (() => void) | void
    onRejected?: (reason: unknown) => (() => void) | void
    cleanup?: () => void
  },
  inputs: Inputs,
): void {
  useEffect(() => {
    let active = true
    let dynamicCleanup: (() => void) | void

    const { promise, onFulfilled, onRejected, cleanup } = effect(() => active)

    promise().then(
      value => {
        if (!active || typeof onFulfilled !== 'function') return
        dynamicCleanup = onFulfilled(value)
      },
      (reason: unknown) => {
        if (!active || typeof onRejected !== 'function') return
        dynamicCleanup = onRejected(reason)
      },
    )

    return () => {
      active = false
      if (typeof dynamicCleanup === 'function') {
        dynamicCleanup()
      }
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is a custom hook
  }, inputs)
}

export type AsyncLoadState<T, R = unknown> = AsyncState<T, R> | null

export function useAsyncLoad<T>(
  apply: (value: T) => void,
  fulfilledClear: number | undefined,
  rejectedClear: number | undefined,
): [AsyncLoadState<T>, (load: () => Promise<T>) => void, () => void]
export function useAsyncLoad<T, R>(
  apply: (value: T) => void,
  fulfilledClear: number | undefined,
  rejectedClear: number | undefined,
  processReason: (reason: unknown) => R,
): [AsyncLoadState<T, R> | null, (load: () => Promise<T>) => void, () => void]
/**
 * useAsyncLoad loads some data
 * @param apply function to apply the loaded data to the state
 * @param fulfilledClear timeout after which to automatically clear fulfilled state
 * @param rejectedClear timeout after which to automatically clear rejected state
 * @param processReason optional (pure) function to process the reason field before adding it to the state
 * @returns
 */
export function useAsyncLoad<T, R = unknown>(
  apply: (value: T) => void,
  fulfilledClear: number | undefined,
  rejectedClear: number | undefined,
  processReason?: (reason: unknown) => R,
): [AsyncLoadState<T, R>, (load: () => Promise<T>) => void, () => void] {
  const [loading, setLoading] = useState<AsyncLoadState<T, R>>(null)

  const load = useCallback(
    (elements: () => Promise<T>) => {
      // tell the component that we're pending
      setLoading({ status: 'pending' })

      elements().then(
        value => {
          apply(value)
          setLoading({ status: 'fulfilled', value })
        },
        (reason: unknown) => {
          const theReason =
            typeof processReason === 'function'
              ? processReason(reason)
              : (reason as R)
          setLoading({ status: 'rejected', reason: theReason })
        },
      )
    },
    [apply, processReason],
  )

  // function to apply a loading state
  const clearLoadingState = useCallback((): void => {
    setLoading(state =>
      state === null || state.status === 'pending' ? state : null,
    )
  }, [])

  // clear success state after a specific timeout
  useEffect(() => {
    if (
      loading?.status !== 'fulfilled' ||
      typeof fulfilledClear === 'undefined'
    ) {
      return
    }

    const timer = setTimeout(clearLoadingState, fulfilledClear)
    return () => {
      window.clearTimeout(timer)
    }
  }, [clearLoadingState, loading, fulfilledClear])

  // clear failure state after a specific timeout
  useEffect(() => {
    if (
      loading?.status !== 'rejected' ||
      typeof rejectedClear === 'undefined'
    ) {
      return
    }

    const timer = setTimeout(clearLoadingState, rejectedClear)
    return () => {
      window.clearTimeout(timer)
    }
  }, [clearLoadingState, loading, rejectedClear])

  return [loading, load, clearLoadingState]
}
