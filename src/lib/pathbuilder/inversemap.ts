import ImmutableMap from '../utils/immutable-map'

export interface InverseMapExport {
  type: 'inverse-map'
  pairs: Array<[string, string]>
}

interface InverseInfo {
  canonical: string
  inverse: string
  is_inverted: boolean
}

/**
 * InverseMap represents an immutable inverse map.
 */
export class InverseMap {
  /** maps short to long */
  readonly #entries: ImmutableMap<string, InverseInfo>

  /** the number of entries in this map */
  get size(): number {
    return this.#entries.size
  }

  constructor(pairs: Array<[string, string]>) {
    const mp = new Map<string, InverseInfo>()
    pairs.forEach(([canonical, inverse]) => {
      const canonConflict = mp.get(canonical)
      if (typeof canonConflict !== 'undefined') {
        mp.delete(canonConflict.canonical)
        mp.delete(canonConflict.inverse)
      }

      const inverseConflict = mp.get(inverse)
      if (typeof inverseConflict !== 'undefined') {
        mp.delete(inverseConflict.canonical)
        mp.delete(inverseConflict.inverse)
      }

      mp.set(canonical, { canonical, inverse, is_inverted: false })
      mp.set(inverse, { canonical, inverse, is_inverted: true })
    })

    this.#entries = new ImmutableMap(mp)
  }

  /**
   * Checks if the given URI is contained in the inverse map.
   *
   * @param uri
   * @returns the information of the inverted iri, if any.
   */
  check(uri: string): InverseInfo | undefined {
    return this.#entries.get(uri)
  }

  /**
   * Returns the list of (canonical, inverse) pairs of this inverse map.
   */
  pairs(): Array<[string, string]> {
    return Array.from(this.#entries)
      .filter(([_, p]) => !p.is_inverted)
      .map(([_, p]) => [p.canonical, p.inverse])
  }

  /**
   * Creates a new inverse map with the given pair added.
   *
   * @param canonical The canonical IRI.
   * @param inverse The inverse IRI.
   * @returns
   */
  add(canonical: string, inverse: string): InverseMap {
    // nothing changed
    const theInverse = this.check(canonical)
    if (typeof theInverse !== 'undefined' && theInverse.inverse === inverse) {
      return this
    }

    // add the new pair
    const pairs = this.pairs()
    pairs.push([canonical, inverse])
    return new InverseMap(pairs)
  }

  /**
   * Creates a new inverse map with the given canonical pair removed.
   *
   * @param canonical The canonical IRI to remove.
   * @returns
   */
  remove(canonical: string): InverseMap {
    const oldPairs = this.pairs()
    const pairs = oldPairs.filter(([x, y]) => x !== canonical)
    if (pairs.length === oldPairs.length) {
      return this
    }
    return new InverseMap(pairs)
  }

  toJSON(): InverseMapExport {
    return {
      type: 'inverse-map',
      pairs: this.pairs(),
    }
  }

  static fromJSON(data: any): InverseMap | null {
    if (!this.isValidInverseMap(data)) {
      return null
    }

    return new InverseMap(data.pairs)
  }

  static isValidInverseMap(data: any): data is InverseMapExport {
    if (typeof data !== 'object' || data === null) {
      return false
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    if (!('type' in data && data.type === 'inverse-map')) {
      return false
    }
    if (!('pairs' in data)) {
      return false
    }

    const { pairs } = data
    if (!Array.isArray(pairs)) {
      return false
    }
    return pairs.every(
      (v: any) =>
        Array.isArray(v) &&
        v.length === 2 &&
        typeof v[0] === 'string' &&
        typeof v[1] === 'string',
    )
  }
}
