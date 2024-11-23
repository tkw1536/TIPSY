import type {
  Bundle,
  Field,
  ConceptPathElement,
  PropertyPathElement,
  PathElement,
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
    elements: PathElement[],
    omitted: boolean,
    previous: NodeContext,
    node: Bundle | Field,
    parent: NodeContext,
  ): NodeContextSpec {
    return true
  }

  protected getDatatypeContext(
    elem: PropertyPathElement & { role: 'datatype' },
    elements: PathElement[],
    omitted: boolean,
    node: Field,
    parent: NodeContext,
  ): NodeContextSpec {
    return true
  }
}
