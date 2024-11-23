import type { Store } from 'rdflib'
import { type BoundState, loaders, resetters } from '.'
import { NamespaceMap } from '../../../lib/pathbuilder/namespace'

import type { StateCreator } from 'zustand'
export type Slice = State & Actions

interface State {
  ns: NamespaceMap
}

interface Actions {
  resetNamespaceMap: () => void
  setNamespaceMap: (ns: NamespaceMap) => void
}

const initialState: State = {
  ns: NamespaceMap.empty(),
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = (set, get) => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(
    async (store: Store): Promise<Partial<State>> => ({
      ns: newNamespaceMap(store),
    }),
  )

  return {
    ...initialState,

    resetNamespaceMap: () => {
      const { store, setNamespaceMap } = get()
      setNamespaceMap(newNamespaceMap(store))
    },

    setNamespaceMap: (ns: NamespaceMap): void => {
      set({ ns })
    },
  }
}

function newNamespaceMap(store: Store): NamespaceMap {
  const specials = Object.entries(store.namespaces).sort(
    ([s1, l1], [s2, l2]) => {
      if (s1 < s2) return -1
      if (s2 > s1) return 1
      return 0
    },
  )

  // and do the set
  return NamespaceMap.fromMap(specials)
}
