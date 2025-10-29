import type { Ref } from 'preact'
import { useMemo, type ForwardedRef } from 'preact/compat'

type RefLike<T> = Ref<T> | ForwardedRef<T> | null | undefined

/** setRef sets the ref to a certain value */
export function setRef<T>(ref: RefLike<T>, value: T | null): void {
  if (ref === null) return
  switch (typeof ref) {
    case 'undefined':
      return
    case 'function':
      ref(value)
      return
    default:
      // eslint-disable-next-line no-param-reassign -- intentional side effect
      ref.current = value
  }
}

/** useCombine returns a new ref that combines the given refs */
export function useCombine<T>(...refs: Array<RefLike<T>>): Ref<T> {
  return useMemo(
    () => (value: T | null) => {
      refs.forEach(ref => {
        setRef(ref, value)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is a hook
    refs,
  )
}
