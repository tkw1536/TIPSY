/**
 * IDPool holds an internal mapping of objects of type T to IDs.
 *
 * It is fully deterministic (when called in the same order).
 *
 * IDs exist in two forms: as a running integer, and as a string.
 * See the next and nextInt methods, respectively.
 *
 * Note that an IDPool is always growing in size.
 *
 */
export class IDPool<T = any> {
  readonly #map = new Map<T, number>()
  readonly #imap = new Map<string, T>()

  #state = 0

  static #formatID(id: number): string {
    return 'I' + id.toString(16).toUpperCase().padStart(15, '0')
  }

  /**
   * Generates and returns a (previously unused) id.
   *
   * The format of IDs returned will be is a 16 digit hexadecimal number prefixed with the letter 'I'.
   * The ID only contains capital letters.
   */
  public next(): string {
    return IDPool.#formatID(this.nextInt())
  }

  /**
   * Same as next, but returns a numeric id instead of a string one.
   * Numerical ids are integers, starting at 1.
   */
  public nextInt(): number {
    this.#state += 1
    return this.#state
  }

  /**
   * Removes the data for the given id (if any).
   * The ID is not recycled, meaning future calls to of and ofInt will return null.
   * A future call to for may assign a new id for the underlying object.
   */
  public delete(id: string): void {
    const value = this.#imap.get(id)

    if (typeof value === 'undefined') {
      return
    }

    // delete from both mappings
    this.#imap.delete(id)
    this.#map.delete(value)
  }

  /** deleteInt is the same as delete, except for taking a numeric id */
  public deleteInt(id: number): void {
    if (id <= 0 || id > this.#state) return
    this.delete(IDPool.#formatID(id))
  }

  /**
   * Returns a consistent id for the given value.
   *
   * If the value was given an id before, returns that id.
   * Otherwise, it returns a new id, and associates that with value
   * permanently.
   *
   * value equality is equal to that of map keys.
   *
   * The id returned in the same for as in next.
   */
  public for(value: T): string {
    return this.#forImpl(value)[1]
  }

  /** Like for, but returns a numerical id instead of a string */
  public intFor(value: T): number {
    return this.#forImpl(value)[0]
  }

  #forImpl(value: T): [number, string] {
    const old = this.#map.get(value)
    if (typeof old !== 'undefined') {
      return [old, IDPool.#formatID(old)]
    }

    const id = this.nextInt()
    const sID = IDPool.#formatID(id)

    this.#map.set(value, id)
    this.#imap.set(sID, value)
    return [id, sID]
  }

  /**
   * Returns the the value belonging to the given id.
   * If no such value exists, returns null.
   */
  public of(id: string): T | null {
    return this.#imap.get(id) ?? null
  }

  public ofInt(id: number): T | null {
    if (id <= 0 || id > this.#state) return null // don't even bother checking for invalid ids
    return this.of(IDPool.#formatID(id))
  }
}
