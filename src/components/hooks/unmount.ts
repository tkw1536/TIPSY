import { useEffect, useRef, type Inputs } from 'preact/hooks'

export function useComponentWillUnmount(
  callback: () => void,
  inputs: Inputs,
): void {
  const callbackRef = useRef<() => void>(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    return () => {
      callbackRef.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is a custom hook
  }, inputs)
}
