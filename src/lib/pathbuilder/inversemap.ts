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
    return this.#entries.size / 2
  }

  constructor(pairs: Iterable<[string, string]>) {
    const mp = new Map<string, InverseInfo>()
    for (const [canonical, inverse] of pairs) {
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
    }

    this.#entries = new ImmutableMap(mp)
  }

  /**
   * Checks if the given URI is contained in the inverse map.
   */
  check(uri: string): InverseInfo | undefined {
    return this.#entries.get(uri)
  }

  /**
   * Checks if the given URI is contained in the inverse map.
   *
   * @param uri uri to check
   * @returns if the uri was inverted
   */
  has(uri: string): boolean {
    return this.#entries.has(uri)
  }

  /**
   * Canonicalizes an edge labeled by an URI handled in this map.
   *
   * The function looks up the given URI in this map and returns a quadruple of (canon_uri, inverse_uri, source, target), along with appropriate semantics.
   *
   * If the URI is not contained in this map, returns source and target as is, along with the passed URI and no inverse.
   *
   * If the URI is an inverse URI within the map, returns source and target (inverted if the URI is an inverse URI), along with the canonical and inverse URIs.
   */
  canonicalizeEdge<T>(
    uri: string,
    source: T,
    target: T,
  ): [string, string | null, T, T] {
    const info = this.check(uri)
    if (typeof info === 'undefined') {
      return [uri, null, source, target]
    }

    // swap source and target if we are inverted
    let theSource, theTarget
    if (info.is_inverted) {
      theSource = target
      theTarget = source
    } else {
      theSource = source
      theTarget = target
    }

    // and return them in the right order.
    return [info.canonical, info.inverse, theSource, theTarget]
  }

  /** iterates over all values [canonical, inverse] of this map */
  *[Symbol.iterator](): IterableIterator<[string, string]> {
    for (const [, p] of this.#entries) {
      if (p.is_inverted) {
        continue
      }
      yield [p.canonical, p.inverse]
    }
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

    const pairs = Array.from(this)
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
    const oldPairs = Array.from(this)
    const pairs = oldPairs.filter(([x, y]) => x !== canonical)
    if (pairs.length === oldPairs.length) {
      return this
    }
    return new InverseMap(pairs)
  }

  toJSON(): InverseMapExport {
    return {
      type: 'inverse-map',
      pairs: Array.from(this),
    }
  }

  /** parses an inverse map from json */
  static fromJSON(data: any): InverseMap | null {
    if (!this.isValidInverseMap(data)) {
      return null
    }

    return new InverseMap(data.pairs)
  }

  /** checks if the given data is a valid inverse map */
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
