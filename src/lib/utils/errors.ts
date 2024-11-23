/** formatError formats an error message as a string */
export function formatError(err: unknown): string {
  if (Object.hasOwn(err as object, 'message')) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded by 'hasOwn'
    return String((err as any).message)
  }
  return String(err)
}
