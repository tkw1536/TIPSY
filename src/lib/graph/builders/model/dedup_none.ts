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

/** NoneBuilder doesn't deduplicate */
export default class NoneBuilder extends DeduplicatingBuilder {
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