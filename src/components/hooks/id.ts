import { useId } from 'preact/hooks'

/**
 * useOptionalID is like {@link useId}, but uses the user-supplied id if set.
 */
export function useOptionalId(id?: string): string {
  // By the [rules of hooks], we need to call hooks at the top level.
  // We are explicitly forbidden from calling it inside an if statement.
  //
  // This custom hook works around that restriction by
  // always calling useId, but discarding its result if not needed.
  //
  // [rules of hooks]: https://react.dev/reference/rules/rules-of-hooks
  const theID = useId()
  return typeof id === 'string' ? id : theID
}
