import {
  type Bundle,
  type Field,
  type ConceptPathElement,
  type PropertyPathElement,
} from '../../../pathbuilder/pathtree'
import {
  type NodeContext,
  type NodeContextSpec,
  DeduplicatingBuilder,
} from './dedup'

/** ParentsBuilder deduplicates only shared parent paths */
export default class ParentsBuilder extends DeduplicatingBuilder {
  prepare(): void {
    this.graph.definitelyAcyclic = true
  }
  protected getConceptContext(
    elem: ConceptPathElement,
    omitted: boolean,
    previous: NodeContext,
    node: Bundle | Field,
    parent: NodeContext,
  ): NodeContextSpec {
    // if we have a common element with the parent, use that
    const { common } = elem
    if (common !== null && common < 0 && parent !== false) {
      return parent
    }

    // else make a new node
    return true
  }

  protected getDatatypeContext(
    elem: PropertyPathElement & { role: 'datatype' },
    omitted: boolean,
    node: Field,
    parent: NodeContext,
  ): NodeContextSpec {
    return true
  }
}
