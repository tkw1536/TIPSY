import { DOMImplementation, DOMParser, XMLSerializer } from '@xmldom/xmldom'
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

  /** returns a copy of this pathbuilder that can be modified without changing the original */
  clone(): Pathbuilder {
    return new Pathbuilder(
      this.paths.map(path => path.clone()),
      this.#nodes,
    )
  }

  static parse(source: string): Pathbuilder {
    const parser = new DOMParser()
    const result = parser.parseFromString(source, 'text/xml')

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
        paths.push(Path.fromNode(node as Element))
        return null
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
    xml: XMLDocument,
    path: Element,
    name: string,
    serializer: (value: T) => string,
    value: T,
  ): void {
    const element = xml.createElement(name)
    element.appendChild(xml.createTextNode(serializer(value)))
    path.appendChild(element)
  }

  toXML(xml: XMLDocument): Element {
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

function cloneNodeInDocument(document: Document, node: Node): Node {
  // if we already own the node, we can just do a plain clone!
  if (document === node.ownerDocument) {
    return node.cloneNode(true)
  }

  // if the document can adopt nodes, we can just adopt the clone
  if (typeof document.adoptNode === 'function') {
    const clone = node.cloneNode(true)
    document.adoptNode(clone)
    return clone
  }

  switch (node.nodeType) {
    case document.ELEMENT_NODE: {
      const origElement = node as Element

      const element = document.createElement(origElement.nodeName)
      for (let i = 0; i < origElement.attributes.length; i++) {
        const attribute = origElement.attributes[i]
        element.setAttribute(attribute.name, attribute.value)
      }
      for (let i = 0; i < origElement.childNodes.length; i++) {
        const child = origElement.childNodes[i]
        element.appendChild(cloneNodeInDocument(document, child))
      }
      return element
    }
    case document.TEXT_NODE:
      return document.createTextNode((node as Text).data)
    case document.CDATA_SECTION_NODE:
      return document.createCDATASection((node as CDATASection).data)
    case document.PROCESSING_INSTRUCTION_NODE:
      return document.createProcessingInstruction(
        (node as ProcessingInstruction).target,
        (node as ProcessingInstruction).data,
      )
    case document.COMMENT_NODE:
      return document.createComment((node as Comment).data)
  }

  console.warn('cloneNodeInDocument: falling back to native implementation')
  return node.cloneNode(true)
}

// spellchecker:words disamb pathbuilderinterface fieldtype displaywidget formatterwidget
