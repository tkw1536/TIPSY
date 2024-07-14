import { type Store } from 'rdflib'
import { type RReducer, type RState } from '..'
import { NamespaceMap } from '../../../../lib/pathbuilder/namespace'

export function newNamespaceMap(store: Store): NamespaceMap {
  const specials = Object.entries(store.namespaces).sort(
    ([s1, l1], [s2, l2]) => {
      if (s1 < s2) return -1
      if (s2 > s1) return 1
      return 0
    },
  )

  /*
  const uris = new Set<string>()
  const addTerm = (term: Term): void => {
    if (term.termType === 'NamedNode') return
    uris.add(term.value)
  }
  store.statements.forEach(value => {
    addTerm(value.subject)
    addTerm(value.predicate)
    addTerm(value.object)
  })
  */

  return NamespaceMap.fromMap(specials)
}
export function resetNamespaceMap(): RReducer {
  return ({ namespaceVersion, store }: RState): Partial<RState> => ({
    ns: newNamespaceMap(store),
    namespaceVersion: namespaceVersion + 1,
  })
}

export function setNamespaceMap(ns: NamespaceMap): RReducer {
  return ({ namespaceVersion }: RState): Partial<RState> => ({
    ns,
    namespaceVersion: namespaceVersion + 1,
  })
}
