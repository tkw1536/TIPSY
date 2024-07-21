import GraphBuilder from '..'
import Deduplication from '../../../../app/inspector/state/state/deduplication'
import { type PathTree } from '../../../pathbuilder/pathtree'
import { type DeduplicatingBuilder, type DedupOptions } from './dedup'
import BundleBuilder from './dedup_bundle'
import FullBuilder from './dedup_full'
import NoneBuilder from './dedup_none'
import ParentsBuilder from './dedup_parents'
import { type ModelEdge, type ModelNode } from './labels'

export type Options = DedupOptions & {
  deduplication?: Deduplication
}

/** builds a new graph for a specific model */
export default class ModelGraphBuilder extends GraphBuilder<
  ModelNode,
  ModelEdge
> {
  readonly #specific: DeduplicatingBuilder
  constructor(tree: PathTree, options: Options) {
    super()

    const { deduplication, ...specificOptions } = options
    switch (options.deduplication) {
      case Deduplication.Full:
        this.#specific = new FullBuilder(tree, specificOptions, this.graph)
        break
      case Deduplication.Bundle:
        this.#specific = new BundleBuilder(tree, specificOptions, this.graph)
        break
      case Deduplication.Parents:
        this.#specific = new ParentsBuilder(tree, specificOptions, this.graph)
        break
      case Deduplication.None:
        this.#specific = new NoneBuilder(tree, specificOptions, this.graph)
        break

      default:
        throw new Error('unknown specific builder')
    }
  }

  protected async doBuild(): Promise<void> {
    this.#specific.build()
  }
}
