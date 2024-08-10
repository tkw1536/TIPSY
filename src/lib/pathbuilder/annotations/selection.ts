import ImmutableSet from '../../utils/immutable-set'
import { Path, Pathbuilder } from '../pathbuilder'
import { type PathTreeNode } from '../pathtree'

type Key = PathTreeNode | Path | undefined

/** toID turns a Key into an actual id */
function toID(key: Key): string | null {
  if (typeof key === 'undefined') return null
  const path = key instanceof Path ? key : key.path
  return path?.id ?? null
}

export interface NodeSelectionExport {
  type: 'node-selection'
  defaultValue: boolean
  values: string[]
}

export default class NodeSelection {
  readonly #selection: ImmutableSet<string>
  private constructor(
    public readonly defaultValue: boolean,
    values: Iterable<string>,
  ) {
    this.#selection = new ImmutableSet(values)
  }

  toJSON(): NodeSelectionExport {
    return {
      type: 'node-selection',
      defaultValue: this.defaultValue,
      values: Array.from(this.#selection),
    }
  }

  static #isValidNodeSelection(data: any): data is NodeSelectionExport {
    if (!('type' in data && data.type === 'node-selection')) {
      return false
    }
    if (!('defaultValue' in data && typeof data.defaultValue === 'boolean')) {
      return false
    }
    if (!('values' in data)) {
      return false
    }
    const { values } = data
    return Array.isArray(values) && values.every(v => typeof v === 'string')
  }

  /** returns a new NodeSelection that selects only the provides elements */
  static these(elements: Iterable<string>): NodeSelection {
    return new NodeSelection(false, elements)
  }

  /** parses a colormap from json */
  static fromJSON(data: any): NodeSelection | null {
    if (!this.#isValidNodeSelection(data)) {
      return null
    }

    return new NodeSelection(data.defaultValue, data.values)
  }

  /** includes checks if the selection includes the given key */
  includes(key: Key): boolean {
    const id = toID(key)
    if (id === null) return false
    return this.#selection.has(id) !== this.defaultValue
  }

  /** with returns a new selection with the specified key set to the specified value */
  with(pairs: Iterable<[Key, boolean]>): NodeSelection {
    const selection = new Set(this.#selection)
    let updated = false
    for (const [key, value] of new Map(pairs).entries()) {
      const id = toID(key)
      if (id === null) continue

      if (value === this.defaultValue) {
        updated = selection.delete(id) || updated
      } else {
        updated = updated || !selection.has(id)
        selection.add(id)
      }
    }
    if (!updated) return this
    return new NodeSelection(this.defaultValue, selection)
  }

  toggle(key: Key): NodeSelection {
    const id = toID(key)
    if (id === null) return this

    // toggle the selection from the underlying array
    const newSelection = new Set(this.#selection)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }

    // and create a new selection with the given default
    return new NodeSelection(this.defaultValue, newSelection)
  }

  /** returns a new pathbuilder consisting of the paths of the given node */
  toPathbuilder(node: PathTreeNode): Pathbuilder {
    return new Pathbuilder(
      Array.from(node.paths()).filter(p => this.includes(p)),
    )
  }

  static none(): NodeSelection {
    return new NodeSelection(false, [])
  }

  static all(): NodeSelection {
    return new NodeSelection(true, [])
  }
}
