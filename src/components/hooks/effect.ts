import { type Inputs, type MutableRef, useEffect, useRef } from 'preact/hooks'

type EffectCallback<S, I extends S | null> = (
  snapshot: S | I,
) => void | ((makeSnapshot: (value: S) => void) => void)

export function useCurrent<V>(value: V): MutableRef<V> {
  const ref = useRef<V>(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

/**
 * useEffectWithSnapshot is like useEffect except that before
 * synchronizing a new effect, an optional snapshot is taken and passed to the next invocation
 */
export default function useEffectWithSnapshot<S, I extends S | null = S | null>(
  callback: EffectCallback<S, I>,
  inputs: Inputs,
  initialValue: I,
): MutableRef<S | I> {
  const initialValueRef = useCurrent(initialValue)

  const ref = useRef<S | I>(initialValueRef.current)

  useEffect(() => {
    const cleanup = callback(ref.current)

    return () => {
      // reset ref back to initial value
      // eslint-disable-next-line react-hooks/exhaustive-deps -- this is a custom hook
      ref.current = initialValueRef.current

      // no snapshot function => use nothing
      if (typeof cleanup !== 'function') {
        return
      }
      cleanup(snapshot => {
        ref.current = snapshot
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is a custom hook
  }, inputs)

  return ref
}
