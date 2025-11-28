import { type Diagnostic, PathbuilderDiagnostics } from './diagnostics'
import type { Pathbuilder, Path } from './pathbuilder'

interface MutableProtoBundle {
  type: 'bundle'
  id: string
  data: { index: number; path: Path } | null
  parent: MutableProtoBundle | null
  children: Array<MutableProtoBundle | ProtoField>
}
interface ProtoBundle {
  readonly type: 'bundle'
  readonly index: number
  readonly path: Path

  readonly children: Array<ProtoBundle | ProtoField>
}

interface ProtoField {
  readonly type: 'field'
  readonly index: number
  readonly id: string
  readonly path: Path
}

/** an element within the pathArray of this node */
export type PathElement = ConceptPathElement | PropertyPathElement

export interface ConceptPathElement extends CommonPathElement {
  /** @inheritdoc */
  type: 'concept'

  /** 0-based concept index */
  conceptIndex: number

  /** @inheritdoc */
  role?: never
}
export interface PropertyPathElement extends CommonPathElement {
  /** @inheritdoc */
  type: 'property'

  /** 0-based property index */
  propertyIndex: number

  /** @inheritdoc */
  role: 'relation' | 'datatype'
}

interface CommonPathElement {
  /** is this a concept or a property */
  type: string
  /** what role does this element play (if any?) */
  role?: string
  /** the uri of this path element */
  uri: string

  /** the index of this path element within the PathArray */
  index: number

  /**
   * How does this element relate to elements shared with the parent?
   * - a negative value indicates how many elements (including this one) will still appear before the first uncommon concept
   * - a `0` or positive value indicates how many elements have not been shared with the parent (not including this one)
   * - `null` indicates there are no shared concepts.
   */
  common: number | null

  /**
   * How does this element related to the disambiguated concept?
   * - a negative value indicates how many elements (including this one) will still appear before the disambiguated concept
   * - a `0` value indicates that this is the disambiguated concept
   * - a positive value indicates how many elements (including this one) have appeared after the disambiguated concept
   * - `null` indicates there is no disambiguation set on this path
   */
  disambiguation: number | null
}

export abstract class PathTreeNode {
  protected constructor(
    public readonly depth: number,
    public readonly index: number,
  ) {}

  #maxDepth: number | null = null
  get maxDepth(): number {
    // return cached max depth
    if (this.#maxDepth !== null) {
      return this.#maxDepth
    }

    // else cache the maximum depth
    this.#maxDepth = this.depth
    for (const node of this.walk()) {
      if (node.depth > this.#maxDepth) {
        this.#maxDepth = node.depth
      }
    }
    return this.#maxDepth
  }

  /** checks if this PathTreeNode equals another node */
  abstract equals(other: PathTreeNode): boolean

  /** returns the path that created this PathTreeNode */
  abstract get path(): Path | null

  /** iterates over the elements in the pathArray belonging to the path of this node (if any) */
  *elements(
    diagnostics?: PathbuilderDiagnostics,
  ): IterableIterator<PathElement> {
    // get the path
    const { path } = this
    const elements = path?.pathArray.slice(0)
    if (path === null || typeof elements === 'undefined') return

    // ensure that we have a valid path
    if (elements.length % 2 === 0) {
      diagnostics?.onPathOfEvenLength(this, elements.slice(0))
      elements.pop()
    }

    // figure out what the index within the path is
    const ownPathIndex = this.#ownPathIndex(elements, diagnostics)
    const { disambiguationIndex } = path

    // add the datatype property (if any)
    const datatypeIndex = elements.length
    if (this instanceof Field && path.datatypeProperty !== '') {
      elements.push(path.datatypeProperty)
    }

    // do the iteration
    let conceptIndex = 0
    let propertyIndex = 0
    for (const [index, uri] of elements.entries()) {
      const common = ownPathIndex !== null ? index - ownPathIndex : null
      const disambiguation =
        disambiguationIndex !== null ? index - disambiguationIndex : null

      switch (index % 2) {
        case 0:
          yield {
            type: 'concept',
            uri,
            index,
            conceptIndex,
            common,
            disambiguation,
          }
          conceptIndex += 1
          break
        case 1:
          yield {
            type: 'property',
            role: index !== datatypeIndex ? 'relation' : 'datatype',
            uri,
            index,
            propertyIndex,
            common,
            disambiguation,
          }
          propertyIndex += 1
          break
        default:
          throw new Error('never reached')
      }
    }
  }

  /**
   * The first index in the pathArray that is not shared with the parent.
   * The parent must have an odd-length pathArray (i.e. be a group) which is a prefix of this node's pathArray.
   * If either condition is not met, returns null.
   */
  #ownPathIndex(
    nodePath: string[] | undefined,
    diagnostics?: PathbuilderDiagnostics,
  ): number | null {
    if (!Array.isArray(nodePath)) {
      diagnostics?.onNodePathIsNotAnArray(this, nodePath)
      return null
    }

    // parent must have an odd length pathArray
    const parentPath = this.parent?.path?.pathArray
    if (!Array.isArray(parentPath)) {
      if (typeof parentPath !== 'undefined') {
        diagnostics?.onParentPathIsNotAnArray(this, parentPath)
      }
      return null
    }
    if (parentPath.length % 2 === 0) {
      diagnostics?.onParentPathIsOfOddLength(this, parentPath)
      return null
    }

    // pathArray must be a prefix of the parent's pathArray
    if (
      parentPath.length > nodePath.length ||
      parentPath.some((parentURI, index) => nodePath[index] !== parentURI)
    ) {
      diagnostics?.onParentPathIsNotAPrefixOfNodePath(
        this,
        parentPath,
        nodePath,
      )
      return null
    }

    return parentPath.length
  }

  /** returns the immediate children of this PathTreeNode */
  abstract children(): IterableIterator<PathTreeNode>

  /** the number of children */
  abstract get childCount(): number

  /** returns the parent of this PathTreeNode */
  abstract get parent(): PathTreeNode | null

  /** compares two nodes, first by depth, then by index */
  static compare(a: PathTreeNode, b: PathTreeNode): -1 | 1 | 0 {
    if (a.depth < b.depth) {
      return -1
    }
    if (a.depth > b.depth) {
      return 1
    }
    if (a.index < b.index) {
      return -1
    }
    if (a.index > b.index) {
      return 1
    }
    return 0
  }

  /** recursively walks over the tree of this NodeLike */
  *walk(): IterableIterator<PathTreeNode> {
    yield this

    for (const child of this.children()) {
      for (const relative of child.walk()) {
        yield relative
      }
    }
  }

  /** recursively walks over the children of this NodeLike */
  *walkIDs(): IterableIterator<string> {
    for (const child of this.walk()) {
      const id = child.path?.id
      if (typeof id === 'string') {
        yield id
      }
    }
  }

  /** finds a node within the current subtree that has the given id, if any */
  find(id: string): PathTreeNode | null {
    for (const node of this.walk()) {
      if (node.path?.id === id) {
        return node
      }
    }
    return null
  }

  /** paths returns the paths of this NodeLike */
  *paths(): IterableIterator<Path> {
    for (const child of this.walk()) {
      const { path } = child
      if (path === null) {
        continue
      }
      yield path
    }
  }

  /** returns the set of all known URIs */
  get uris(): Set<string> {
    const uris = new Set<string>()

    for (const path of this.paths()) {
      for (const uri of path.uris()) {
        uris.add(uri)
      }
    }

    return uris
  }

  get mainBundle(): Bundle | null {
    let current = this instanceof Bundle ? this : this.parent
    while (current instanceof Bundle) {
      if (current.isMain) {
        return current
      }
      current = current.parent
    }
    return null
  }

  /** counts all nodes matching a given predicate */
  count(
    predicate: (node: PathTreeNode) => boolean,
    includeSelf = false,
  ): number {
    let count = 0
    for (const elem of this.walk()) {
      if (!includeSelf && elem === this) {
        continue
      }
      if (predicate(elem)) {
        count += 1
      }
    }
    return count
  }
}

export class PathTree extends PathTreeNode {
  readonly #bundles: Bundle[]
  constructor(bundles: ProtoBundle[]) {
    super(0, -1)
    this.#bundles = bundles.map(bundle => new Bundle(this, bundle))
  }

  /** checks if this PathTreeNode equals another node */
  equals(other: PathTreeNode): boolean {
    return (
      other instanceof PathTree &&
      this.#bundles.length === other.#bundles.length &&
      this.#bundles.every((bundle, index) =>
        bundle.equals(other.#bundles[index]),
      )
    )
  }

  readonly path = null
  readonly parent = null;

  *children(): IterableIterator<Bundle> {
    for (const bundle of this.#bundles) {
      yield bundle
    }
  }

  get childCount(): number {
    return this.#bundles.length
  }

  static fromPathbuilder(pb: Pathbuilder): [PathTree, Diagnostic[]] {
    // log all the diagnostics
    const diagnostics = new PathbuilderDiagnostics()

    // Iterate over all tree nodes and collect all the diagnostics.
    const tree = this.#fromPathbuilder(pb, diagnostics)
    for (const node of tree.walk()) {
      Array.from(node.elements(diagnostics))
    }

    return [tree, diagnostics.diagnostics]
  }
  static #fromPathbuilder(
    pb: Pathbuilder,
    diagnostics?: PathbuilderDiagnostics,
  ): PathTree {
    const bundles = new Map<string, MutableProtoBundle>()
    const mainBundles: MutableProtoBundle[] = []

    const getOrCreateBundle = (id: string): MutableProtoBundle => {
      const get = bundles.get(id)
      if (typeof get !== 'undefined') {
        return get
      }

      const create: MutableProtoBundle = {
        type: 'bundle',
        id,
        data: null,
        parent: null,
        children: [],
      }
      bundles.set(id, create)
      return create
    }

    pb.paths.forEach((path, index) => {
      // path is disabled
      if (!path.enabled) {
        diagnostics?.onDisabledPath(path)
        return
      }

      const parent =
        path.groupId !== '' ? getOrCreateBundle(path.groupId) : null

      // not a group => it is just a field
      if (!path.isGroup) {
        const field: ProtoField = { type: 'field', id: path.field, index, path }

        if (parent === null) {
          diagnostics?.onOrphanedField(path.field, path)
          return
        }
        parent.children.push(field)
        return
      }

      const group = getOrCreateBundle(path.id)
      if (group.data !== null) {
        diagnostics?.onDuplicateBundle(path.id, path)
        return
      }
      group.data = { index, path }
      group.parent = parent

      if (parent !== null) {
        parent.children.push(group)
      } else {
        mainBundles.push(group)
      }
    })

    // check for data about missing bundles
    for (const [id, bundle] of bundles.entries()) {
      if (bundle.data === null) {
        diagnostics?.onOrphanedBundle(id)
      }
    }

    return new PathTree(
      mainBundles
        .map(bundle => this.#validateBundle(bundle))
        .filter(bundle => bundle !== null),
    )
  }

  static #validateBundle({
    id,
    data,
    children,
  }: MutableProtoBundle): ProtoBundle | null {
    if (data === null) {
      return null
    }

    const validatedChildren = children
      .map(child =>
        child.type === 'field' ? child : this.#validateBundle(child),
      )
      .filter(child => child !== null)
      .sort((l, r) => {
        const {
          path: { weight: lWeight },
          index: lIndex,
        } = l
        const {
          path: { weight: rWeight },
          index: rIndex,
        } = r

        // sort first by weight
        if (lWeight !== rWeight) {
          return lWeight - rWeight
        }

        // and then by index
        return lIndex - rIndex
      })

    return {
      type: 'bundle',
      path: data.path,
      index: data.index,
      children: validatedChildren,
    }
  }
}

export class Bundle extends PathTreeNode {
  constructor(
    public readonly parent: Bundle | PathTree,
    { index, path, children }: ProtoBundle,
  ) {
    // ensure that the proto bundle object is valid
    super(parent.depth + 1, index)
    this.path = path

    this.#children = children.map(child =>
      child.type === 'bundle'
        ? new Bundle(this, child)
        : new Field(this, child),
    )
  }

  equals(other: PathTreeNode): boolean {
    return (
      other instanceof Bundle &&
      this.path.equals(other.path) && // TODO: path equality
      this.#children.length === other.#children.length &&
      this.#children.every((child, index) =>
        child.equals(other.#children[index]),
      )
    )
  }

  public readonly path: Path
  readonly #children: Array<Bundle | Field> = [];
  *children(): IterableIterator<Bundle | Field> {
    for (const child of this.#children) {
      yield child
    }
  }

  /** checks if this bundle is a mainBundle */
  get isMain(): boolean {
    return this.depth === 1
  }

  get childCount(): number {
    return this.#children.length
  }

  /** the direct bundle descendants */
  *bundles(): IterableIterator<Bundle> {
    for (const child of this.#children) {
      if (child instanceof Bundle) {
        yield child
      }
    }
  }

  /** the direct field descendants */
  *fields(): IterableIterator<Field> {
    for (const child of this.#children) {
      if (child instanceof Field) {
        yield child
      }
    }
  }
}

export class Field extends PathTreeNode {
  constructor(
    public readonly parent: Bundle,
    field: ProtoField,
  ) {
    super(parent.depth + 1, field.index)
    this.path = field.path
  }

  equals(other: PathTreeNode): boolean {
    return other instanceof Field && this.path.equals(other.path)
  }

  public readonly path: Path;

  *children(): IterableIterator<never> {}

  public readonly childCount = 0
}
