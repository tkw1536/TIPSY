import GraphBuilder, { type Element } from '.'
import type { Bundle, Field, PathTree } from '../../pathbuilder/pathtree'
import type NodeSelection from '../../pathbuilder/annotations/selection'
import type { NamespaceMap } from '../../pathbuilder/namespace'
import type ColorMap from '../../pathbuilder/annotations/colormap'

type RenderMethod = (id: string, options: BundleOptions) => Element
export type BundleNode =
  | {
      type: 'bundle'
      level: number
      bundle: Bundle

      render: RenderMethod
    }
  | {
      type: 'field'
      level: number
      field: Field

      render: RenderMethod
    }

export type BundleEdge =
  | {
      type: 'field'

      render: RenderMethod
    }
  | {
      type: 'child_bundle'

      render: RenderMethod
    }

export interface BundleOptions {
  ns: NamespaceMap
  cm: ColorMap
}

export default class BundleGraphBuilder extends GraphBuilder<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {
  readonly #tree: PathTree
  readonly #selection: NodeSelection
  constructor(tree: PathTree, selection: NodeSelection) {
    super()

    this.#tree = tree
    this.#selection = selection
  }

  protected doBuild(): void {
    for (const bundle of this.#tree.children()) {
      this.#addBundle(bundle, 0)
    }
    this.graph.definitelyAcyclic = true
  }

  #addBundle(bundle: Bundle, level: number): boolean {
    const { id } = bundle.path

    // add the node for this bundle
    const includeSelf = this.#selection.includes(bundle)
    if (includeSelf) {
      this.graph.addNode(
        {
          type: 'bundle',
          level: 2 * level,
          bundle,
          render: (id: string, options: BundleOptions): Element => ({
            id,
            label: bundle.path.name,
            tooltip: bundle.path.id,
            color: options.cm.get(bundle),
            shape: 'ellipse',
          }),
        },
        id,
      )
    }

    // add all the child bundles
    for (const cb of bundle.bundles()) {
      const includeChild = this.#addBundle(cb, level + 1)
      if (!includeChild || !includeSelf) continue

      this.graph.addEdge(id, cb.path.id, {
        type: 'child_bundle',
        render: (id: string) => ({
          id,
          label: null,
          tooltip: null,
          color: null,
          shape: null,
        }),
      })
    }

    // add all the child fields
    for (const cf of bundle.fields()) {
      const fieldId = cf.path.id
      const includeField = this.#selection.includes(cf)
      if (!includeField) continue

      this.graph.addNode(
        {
          type: 'field',
          level: 2 * level + 1,
          field: cf,
          render: (id: string, options: BundleOptions): Element => ({
            id,
            label: cf.path.name,
            tooltip: cf.path.id,
            color: options.cm.get(cf),
            shape: 'ellipse',
          }),
        },
        fieldId,
      )
      if (!includeSelf) continue

      this.graph.addEdge(id, fieldId, {
        type: 'field',
        render: (id: string) => ({
          id,
          label: null,
          tooltip: null,
          color: null,
          shape: null,
        }),
      })
    }

    return includeSelf
  }
}
