import {
  DOMImplementation,
  DOMParser,
  type Element,
  MIME_TYPE,
  type Node,
  XMLSerializer,
  type Document,
} from '@xmldom/xmldom'
import { cloneNodeInDocument, isTag } from '../utils/fakedom'

export class Pathbuilder {
  readonly #nodes: Array<Node | null>
  constructor(
    public paths: Path[],

    /** nodes are the non-path nodes contained in the pathbuilder xml */
    nodes: Array<Node | null> = [],
  ) {
    // own all of the nodes
    this.#nodes = nodes.map(node => {
      if (node === null) return null
      return cloneNodeInDocument(this.#document, node)
    })
  }

  static readonly #dom = new DOMImplementation()
  static readonly #serializer = new XMLSerializer()

  /** the document that owns all nodes created within this context */
  readonly #document = Pathbuilder.#dom.createDocument(
    null,
    'pathbuilderinterface',
  )

  /** gets an element with the given name, or null if it does not exist */
  #getElement(tagName: string): Element | null {
    const node =
      this.#nodes.find((n): n is Element => n !== null && isTag(n, tagName)) ??
      null
    if (node === null) {
      return null
    }
    return node
  }

  static readonly snapshotRoot = 'tipsy'
  static readonly snapshotElement = 'snapshot'

  getSnapshotData<T>(
    name: string,
    validator: (data: unknown) => data is T,
  ): T | null {
    // find the root element for snapshots
    const root = this.#getElement(Pathbuilder.snapshotRoot)
    if (root === null) return null

    // find the snapshot element
    const snapshot: Element | undefined = Array.from(root.childNodes).find(
      (n): n is Element =>
        isTag(n, Pathbuilder.snapshotElement) &&
        n.getAttribute('name') === name,
    )
    if (typeof snapshot === 'undefined') {
      return null
    }

    // parse it as json
    let data: unknown
    try {
      data = JSON.parse(snapshot.textContent ?? '')
    } catch (err: unknown) {
      console.warn('unable to read snapshot data', name, err)
      return null
    }

    // ensure it is actually valid
    if (!validator(data)) {
      console.warn('snapshot data is invalid: ', name, data)
      return null
    }

    // and return it!
    return data
  }

  /** onlyPaths returns a new pathbuilder containing only the paths in this node */
  onlyPaths(): Pathbuilder {
    return new Pathbuilder(
      this.paths,
      this.paths.map(() => null),
    )
  }

  /** sets the snapshot data for a given node */
  withSnapshot(values: Map<string, any>): Pathbuilder {
    const clone = this.clone()
    clone.#setSnapshot(values)
    return clone
  }
  #setSnapshot(values: Map<string, any>): void {
    // create a root element if it doesn't exist
    const root =
      this.#getElement(Pathbuilder.snapshotRoot) ??
      this.#document.createElement(Pathbuilder.snapshotRoot)
    if (!this.#nodes.includes(root)) {
      this.#nodes.push(root)
    }

    // remove old nodes
    Array.from(root.childNodes)
      .filter(
        n =>
          isTag(n, Pathbuilder.snapshotElement) &&
          values.has(n.getAttribute('name') ?? ''),
      )
      .forEach(t => t.parentNode?.removeChild(t))

    // set the new values
    values.forEach((data, name) => {
      // create a new snapshot element
      const snapshot = this.#document.createElement(Pathbuilder.snapshotElement)
      snapshot.setAttribute('name', name)
      snapshot.appendChild(this.#document.createTextNode(JSON.stringify(data)))

      // append this child
      root.appendChild(snapshot)
    })
  }

  /** returns a copy of this pathbuilder that can be modified without changing the original */
  clone(): Pathbuilder {
    return new Pathbuilder(
      this.paths.map(path => path.clone()),
      this.#nodes,
    )
  }

  static parse(source: string): Pathbuilder {
    const parser = new DOMParser({ onError: () => {} })
    const result = parser.parseFromString(source, MIME_TYPE.XML_TEXT)

    // find the top level node
    const pbInterface = Array.from(result.childNodes).filter(
      x => x.nodeType === result.ELEMENT_NODE,
    )
    if (pbInterface.length !== 1) {
      throw new Error('expected exactly one child element in top-level xml')
    }
    return this.fromNode(pbInterface[0])
  }

  static fromNode(node: Node): Pathbuilder {
    if (node.nodeName !== 'pathbuilderinterface') {
      throw new Error(
        `expected a <pathbuilderinterface>, but got a <${node.nodeName}>`,
      )
    }

    // parse all the paths

    const paths: Path[] = []
    const extraNodes = Array.from(node.childNodes).map((node, index) => {
      if (node.nodeType === node.ELEMENT_NODE && node.nodeName === 'path') {
        try {
          paths.push(Path.fromNode(node as Element))
          return null
        } catch (err: unknown) {
          const xml = new XMLSerializer().serializeToString(node)
          console.warn(
            'unable to parse <path> node, treating as transparent node',
            err,
            xml,
          )
        }
      }
      return node.cloneNode(true)
    })
    return new Pathbuilder(paths, extraNodes)
  }

  toXML(): string {
    const xml = Pathbuilder.#dom.createDocument(null, 'pathbuilderinterface')

    // create the common xml pi
    const header = xml.createProcessingInstruction('xml', 'version="1.0"')
    xml.insertBefore(header, xml.firstChild)

    // turn all the path nodes into xml
    const paths = this.paths.map(path => path.toXML(xml))

    // add all the paths and extra nodes to the pb interface
    const pathbuilderinterface = xml.documentElement
    if (pathbuilderinterface === null) {
      throw new Error('Pathbuilder: returned invalid document element')
    }

    this.#nodes
      .map(node => {
        // a gap is replaced by the appropriate path
        if (node === null) {
          return paths.shift() ?? null
        }

        return node.cloneNode(true)
      })
      .concat(paths)
      .forEach(node => {
        if (node === null) return
        pathbuilderinterface.appendChild(node)
      })

    // and serialize
    return Pathbuilder.#serializer.serializeToString(xml)
  }
}

export interface PathParams {
  id: string
  weight: number
  enabled: boolean
  groupId: string
  bundle: string
  field: string
  fieldType: string
  displayWidget: string
  formatterWidget: string
  cardinality: number
  fieldTypeInformative: string
  pathArray: string[]
  datatypeProperty: string
  shortName: string
  disambiguation: number
  description: string
  uuid: string
  isGroup: boolean
  name: string
}

/** a single element of the {@link Pathbuilder} */
export class Path {
  constructor(params: PathParams) {
    this.id = params.id
    this.weight = params.weight
    this.enabled = params.enabled
    this.groupId = params.groupId
    this.bundle = params.bundle
    this.field = params.field
    this.fieldType = params.fieldType
    this.displayWidget = params.displayWidget
    this.formatterWidget = params.formatterWidget
    this.cardinality = params.cardinality
    this.fieldTypeInformative = params.fieldTypeInformative
    this.pathArray = params.pathArray
    this.datatypeProperty = params.datatypeProperty
    this.shortName = params.shortName
    this.disambiguation = params.disambiguation
    this.description = params.description
    this.uuid = params.uuid
    this.isGroup = params.isGroup
    this.name = params.name
  }

  /** matches this path against a search query */
  matches(search: string): boolean {
    if (search === '') {
      return false
    }

    const query = search.toLowerCase()
    for (const datum of [this.id.toLowerCase(), this.name.toLowerCase()]) {
      if (Path.#match(query, datum)) {
        return true
      }
    }

    return false
  }

  static #match(needle: string, haystack: string): boolean {
    if (needle.length === 0) {
      return false
    }
    let needleIndex = 0
    for (const char of haystack) {
      if (needle[needleIndex] === char) {
        needleIndex += 1
        if (needleIndex >= needle.length) {
          return true
        }
      }
    }
    return false
  }

  /** returns a clone of this path that can be modified without having to worry about the original */
  clone(): Path {
    return new Path(this.params)
  }

  /** an object that can be used to construct an equivalent path */
  get params(): PathParams {
    return {
      id: this.id,
      weight: this.weight,
      enabled: this.enabled,
      groupId: this.groupId,
      bundle: this.bundle,
      field: this.field,
      fieldType: this.fieldType,
      displayWidget: this.displayWidget,
      formatterWidget: this.formatterWidget,
      cardinality: this.cardinality,
      fieldTypeInformative: this.fieldTypeInformative,
      pathArray: this.pathArray,
      datatypeProperty: this.datatypeProperty,
      shortName: this.shortName,
      disambiguation: this.disambiguation,
      description: this.description,
      uuid: this.uuid,
      isGroup: this.isGroup,
      name: this.name,
    }
  }

  public readonly id: string
  public readonly weight: number
  public readonly enabled: boolean
  public readonly groupId: string
  public readonly bundle: string
  public readonly field: string
  public readonly fieldType: string
  public readonly fieldTypeInformative: string
  public readonly displayWidget: string
  public readonly formatterWidget: string
  public readonly cardinality: number
  public readonly pathArray: string[]
  public readonly datatypeProperty: string
  public readonly shortName: string
  public readonly disambiguation: number
  public readonly description: string
  public readonly uuid: string

  /** is the path a group */
  public readonly isGroup: boolean

  /** human-readable name */
  public readonly name: string

  equals(other: Path): boolean {
    return (
      this.id === other.id &&
      this.weight === other.weight &&
      this.enabled === other.enabled &&
      this.groupId === other.groupId &&
      this.bundle === other.bundle &&
      this.field === other.field &&
      this.fieldType === other.fieldType &&
      this.displayWidget === other.displayWidget &&
      this.formatterWidget === other.formatterWidget &&
      this.cardinality === other.cardinality &&
      this.fieldTypeInformative === other.fieldTypeInformative &&
      this.datatypeProperty === other.datatypeProperty &&
      this.shortName === other.shortName &&
      this.disambiguation === other.disambiguation &&
      this.description === other.description &&
      this.uuid === other.uuid &&
      this.isGroup === other.isGroup &&
      this.name === other.name &&
      this.pathArray.length === other.pathArray.length &&
      this.pathArray.every(
        (element, index) => element === other.pathArray[index],
      )
    )
  }

  /** gets the number of concepts in this path */
  get conceptCount(): number {
    return Math.ceil(this.pathArray.length / 2)
  }

  /** all uris referenced by this path including concepts, (object) properties, and datatype property  */
  *uris(): IterableIterator<string> {
    for (const uri of this.pathArray) {
      yield uri
    }
    if (this.datatypeProperty !== '') {
      yield this.datatypeProperty
    }
  }

  /** the informative field type, or the field type */
  get informativeFieldType(): string | null {
    if (this.fieldTypeInformative !== '') {
      return this.fieldTypeInformative
    }
    if (this.fieldType === '') return null
    return this.fieldType
  }

  /** the index of the disambiguated concept in the pathArray, or null */
  get disambiguationIndex(): number | null {
    const index = 2 * this.disambiguation - 2
    if (index < 0 || index >= this.pathArray.length) return null
    return index
  }

  /** the concept that is disambiguated by this pathbuilder, if any */
  get disambiguatedConcept(): string | null {
    const index = this.disambiguationIndex
    if (index === null) return null
    return this.pathArray[index]
  }

  static #parseValue<T>(
    element: Element,
    name: string,
    parser: (value: string) => T,
  ): T {
    const children = Array.from(element.childNodes).filter(
      node => node.nodeName === name,
    )
    if (children.length > 1) {
      throw new Error(
        `expected exactly one <${name}> child, but got ${children.length}`,
      )
    }

    // if there are no children, pretend it is empty
    if (children.length === 0) {
      return parser('')
    }

    return parser(
      Array.from(children[0].childNodes)
        .map(e => (e.nodeType === e.TEXT_NODE ? e.textContent : ''))
        .join(''),
    )
  }

  static #parsePathArray(element: Element): string[] {
    const children = Array.from(element.childNodes).filter(
      node => node.nodeName === 'path_array',
    )
    if (children.length === 0) {
      throw new Error('expected exactly one <path_array> child')
    }
    return Array.from(children[0].childNodes)
      .filter(node => node.nodeType === node.ELEMENT_NODE)
      .map((p, i) => {
        const want = i % 2 === 0 ? 'x' : 'y'
        const got = p.nodeName[0].toLowerCase()
        if (got !== want) {
          throw new Error(`expected a <${want}>, but got a <${got}>`)
        }
        return p.textContent ?? ''
      })
  }

  static fromNode(node: Element): Path {
    if (node.nodeName !== 'path') {
      throw new Error(`expected a <path>, but got a <${node.nodeName}>`)
    }

    const p = this.#parseValue.bind(this, node) as <T>(
      f: string,
      p: (v: string) => T,
    ) => T

    const str = (value: string): string => value
    const str0 = (value: string): string => {
      if (value === '0') return ''
      return value
    }
    const strEmpty = (value: string): string => {
      if (value === 'empty') return ''
      return value
    }
    const int = (value: string): number => {
      if (value.trim() === '') {
        return 0
      }

      const i = parseInt(value, 10)
      if (isNaN(i)) {
        throw new Error(`expected an integer, but got ${value}`)
      }
      return i
    }
    const bool = (value: string): boolean => {
      const b = int(value)
      return b !== 0
    }

    return new Path({
      id: p('id', str),
      weight: p('weight', int),
      enabled: p('enabled', bool),
      groupId: p('group_id', str0),

      bundle: p('bundle', str),
      field: p('field', str),
      fieldType: p('fieldtype', str),
      displayWidget: p('displaywidget', str),
      formatterWidget: p('formatterwidget', str),
      cardinality: p('cardinality', int),
      fieldTypeInformative: p('field_type_informative', str),

      pathArray: this.#parsePathArray(node),
      datatypeProperty: p('datatype_property', strEmpty),
      shortName: p('short_name', str),
      disambiguation: p('disamb', int),
      description: p('description', str),
      uuid: p('uuid', str),
      isGroup: p('is_group', bool),
      name: p('name', str),
    })
  }

  static #serializeElement<T>(
    xml: Document,
    path: Element,
    name: string,
    serializer: (value: T) => string,
    value: T,
  ): void {
    const element = xml.createElement(name)
    element.appendChild(xml.createTextNode(serializer(value)))
    path.appendChild(element)
  }

  toXML(xml: Document): Element {
    const path = xml.createElement('path')

    const str = (value: string): string => value
    const str0 = (value: string): string => {
      if (value === '') return '0'
      return value
    }
    const strEmpty = (value: string): string => {
      if (value === '') return 'empty'
      return value
    }
    const int = (value: number): string => {
      return value.toString()
    }
    const bool = (value: boolean): string => {
      return value ? '1' : '0'
    }

    const s = Path.#serializeElement.bind(Path, xml, path) as <T>(
      f: string,
      s: (v: T) => string,
      v: T,
    ) => void

    s('id', str, this.id)
    s('weight', int, this.weight)
    s('enabled', bool, this.enabled)
    s('group_id', str0, this.groupId)

    s('bundle', str, this.bundle)
    s('field', str, this.field)
    s('fieldtype', str, this.fieldType)
    s('displaywidget', str, this.displayWidget)
    s('formatterwidget', str, this.formatterWidget)
    s('cardinality', int, this.cardinality)
    s('field_type_informative', str, this.fieldTypeInformative)

    const pathArray = xml.createElement('path_array')
    path.appendChild(pathArray)

    this.pathArray.forEach((p, i) => {
      const xy = xml.createElement(i % 2 === 0 ? 'x' : 'y')
      xy.appendChild(xml.createTextNode(p))
      pathArray.appendChild(xy)
    })

    s('datatype_property', strEmpty, this.datatypeProperty)
    s('short_name', str, this.shortName)
    s('disamb', int, this.disambiguation)
    s('description', str, this.description)
    s('uuid', str, this.uuid)
    s('is_group', bool, this.isGroup)
    s('name', str, this.name)

    return path
  }
}

// spellchecker:words disamb pathbuilderinterface fieldtype displaywidget formatterwidget
