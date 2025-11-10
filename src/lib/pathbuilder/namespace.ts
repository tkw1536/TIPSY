import ImmutableMap from '../utils/immutable-map'
import { filter, map } from '../utils/iterable'

export interface NamespaceMapExport {
  type: 'namespace-map'
  namespaces: Array<[string, string]>
}

/**
 * NamespaceMap represents an immutable namespace map
 */
export class NamespaceMap {
  static readonly validKey = /^[a-zA-Z0-9_-]+$/

  /** maps short to long */
  readonly #entries: ImmutableMap<string, string>

  private constructor(entries: ImmutableMap<string, string>) {
    this.#entries = entries
  }

  /** iterates over all values [short, long] of this map */
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.#entries.entries()
  }

  /** the number of entries in this map */
  get size(): number {
    return this.#entries.size
  }

  /** turns a map into a json map */
  toJSON(): NamespaceMapExport {
    return {
      type: 'namespace-map',
      namespaces: Array.from(this.#entries),
    }
  }

  static isValidNamespaceMap(data: any): data is NamespaceMapExport {
    if (typeof data !== 'object' || data === null) {
      return false
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    if (!('type' in data && data.type === 'namespace-map')) {
      return false
    }
    if (!('namespaces' in data)) {
      return false
    }

    const { namespaces } = data
    if (!Array.isArray(namespaces)) {
      return false
    }
    return namespaces.every(
      (v: any) =>
        Array.isArray(v) &&
        v.length === 2 &&
        typeof v[0] === 'string' &&
        typeof v[1] === 'string',
    )
  }

  static fromJSON(data: any): NamespaceMap | null {
    if (!this.isValidNamespaceMap(data)) {
      return null
    }

    return NamespaceMap.fromMap(data.namespaces)
  }

  /** does this namespace map know the given has? */
  has(short: string): boolean {
    return this.#entries.has(short)
  }

  /** add creates a new namespace map with long set to short */
  add(short: string, long: string): NamespaceMap {
    // skip invalid shorts
    if (!NamespaceMap.validKey.test(short)) {
      return this
    }

    return new NamespaceMap(this.#entries.set(short, long))
  }

  /**
   * Sets an existing entry for short to expand to long.
   * Order of entries is maintained.
   * If short does not exist with this NamespaceMap, returns the map as is.
   */
  update(short: string, long: string): NamespaceMap {
    // check if the current value exists and if it is actually being changed
    const oldLong = this.#entries.get(short)
    if (typeof oldLong === 'undefined' || oldLong === long) {
      return this
    }

    return new NamespaceMap(
      new ImmutableMap(
        map(this.#entries, ([s, l]) => (s === short ? [s, long] : [s, l])),
      ),
    )
  }

  /**
   * Renames the entry for short to newShort.
   * Order of entries is maintained.
   *
   * If short does not exist with this NamespaceMap, returns the map as is.
   * If an entry for newShort already exists, returns the map as is.
   */
  rename(short: string, newShort: string): NamespaceMap {
    if (
      short === newShort ||
      !this.has(short) ||
      this.has(newShort) ||
      !NamespaceMap.validKey.test(newShort)
    ) {
      return this
    }

    return new NamespaceMap(
      new ImmutableMap(
        map(this.#entries, ([s, l]) => (s === short ? [newShort, l] : [s, l])),
      ),
    )
  }

  /** remove removes a long url from this ns-map */
  remove(ns: string): NamespaceMap {
    if (!this.has(ns)) {
      return this
    }

    return new NamespaceMap(this.#entries.delete(ns))
  }

  /** apply applies this namespace-map to a string */
  apply(uri: string): string {
    const [ns, prefix, inverse] = this.#match(uri)
    if (ns === null) return uri
    return (
      (inverse ? '^' : '') +
      ns +
      ':' +
      uri.substring(prefix.length + (inverse ? 1 : 0))
    )
  }
  /** Applies the reverse of this namespace-map to a string, that is it replaces and shortened namespace with the long-form version */
  applyReverse(uri: string): string {
    let inverse: boolean
    let theURI: string
    if (uri.startsWith('^')) {
      inverse = true
      theURI = uri.slice(1)
    } else {
      inverse = false
      theURI = uri
    }
    for (const [s, l] of this.#entries) {
      if (theURI.startsWith(s + ':')) {
        return (inverse ? '^' : '') + l + theURI.substring(s.length + 1)
      }
    }

    // return URL unchanged
    return uri
  }

  /** match matches the given uri against the prefixes known to this NamespaceMap */
  #match(uri: string): [string, string, boolean] | [null, null, null] {
    let prefix = ''
    let ns: string | null = null

    let inverse: boolean
    let theURI: string
    if (uri.startsWith('^')) {
      inverse = true
      theURI = uri.slice(1)
    } else {
      inverse = false
      theURI = uri
    }

    this.#entries.forEach((l, s) => {
      // must actually be a prefix
      if (!theURI.startsWith(l)) {
        return
      }

      // if we already have a shorter prefix
      // then don't apply it at all!
      if (prefix !== '' && l <= prefix) {
        return
      }
      prefix = l
      ns = s
    })
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive because closure
    if (ns === null) {
      return [null, null, null]
    }
    return [ns, prefix, inverse]
  }

  /** empty returns an empty NamespaceMap */
  static empty(): NamespaceMap {
    return new NamespaceMap(new ImmutableMap())
  }

  /** creates a new namespace map from the given map */
  static fromMap(elements: Iterable<[string, string]>): NamespaceMap {
    return new NamespaceMap(
      new ImmutableMap<string, string>(
        filter(elements, ([short, long]) => NamespaceMap.validKey.test(short)),
      ),
    )
  }

  /** generate automatically generates a prefix map */
  static generate(
    uris: Set<string>,
    separators = '/#',
    specials: Array<[string, string]> | undefined = undefined,
    len = 30,
  ): NamespaceMap {
    const prefixes = new Set<string>()
    uris.forEach(uri => {
      if (uri === '') {
        return
      }
      const theURI = uri.startsWith('^') ? uri.substring(1) : uri

      const until = Math.max(
        ...Array.from(separators).map(c => theURI.lastIndexOf(c)),
      )
      // no valid prefix
      if (until === -1) {
        return
      }

      // compute the prefix
      const prefix = theURI.substring(0, until + 1)

      // we already have a prefix
      if (prefixes.has(prefix)) {
        return
      }

      let hadPrefix = false
      prefixes.forEach(old => {
        // we have a prefix that is longer
        // so delete it
        if (old.startsWith(prefix)) {
          prefixes.delete(old)
        }

        // we had a subset of this one already
        // so don't add it!
        if (prefix.startsWith(old)) {
          hadPrefix = true
        }
      })

      // don't add the prefix
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive, changed with closure above
      if (hadPrefix) {
        return
      }
      prefixes.add(prefix)
    })

    const ns = new Map<string, string>()

    const seen = new Map<string, number>()
    prefixes.forEach(prefix => {
      let theName = this.getNamespacePrefix(prefix, specials).substring(0, len)
      const counter = seen.get(theName)
      if (typeof counter === 'number') {
        seen.set(theName, counter + 1)
        theName = `${theName}_${counter}`
      } else {
        seen.set(theName, 1)
      }

      ns.set(theName, prefix)
    })
    return this.fromMap(ns)
  }

  /**
   * Given a long URI, generate a namespace prefix to use.
   * @param long Long URL to use
   * @param specials A set of special;
   * @returns
   */
  static getNamespacePrefix(
    long: string,
    specials?: Array<[string, string]>,
  ): string {
    // trim off the header
    const index = long.indexOf('://')
    const name = index >= 0 ? long.substring(index + '://'.length) : long

    // check if we have a special prefix
    const special = (specials ?? [])
      .filter(([s, l]) => name.startsWith(l) || long.startsWith(l))
      .sort((l, r) => r[1].length - l[1].length)[0]
    if (typeof special !== 'undefined') {
      return special[0]
    }

    // guesstimate a special prefix
    return (
      (name.match(/([a-zA-Z0-9]+)/g) ?? []).find(v => v !== 'www') ?? 'prefix'
    )
  }

  /** a list of known special prefixes */
  static readonly KnownPrefixes = Array.from(
    Object.entries({
      // spellchecker:disable
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#',
      dc: 'http://purl.org/dc/elements/1.1/',

      ecrm: 'http://erlangen-crm.org/',
      crm: 'http://www.cidoc-crm.org/',
      crme: 'http://www.cidoc-crm.org/extensions/',
      // spellchecker:enable
    }),
  )
}
