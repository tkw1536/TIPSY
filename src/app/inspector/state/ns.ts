import { type BoundState, loaders, resetters } from '.'

import type { StateCreator } from 'zustand'
import {
  NamespaceMap,
  type NamespaceMapExport,
} from '../../../lib/pathbuilder/namespace'
import type { PathTree } from '../../../lib/pathbuilder/pathtree'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'
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
    async (
      tree: PathTree,
      pathbuilder: Pathbuilder,
    ): Promise<Partial<State>> => {
      const ns =
        NamespaceMap.fromJSON(
          pathbuilder.getSnapshotData(snapshotKey, validate),
        ) ?? newNamespaceMap(tree)
      return {
        ns,
      }
    },
  )

  return {
    ...initialState,

    resetNamespaceMap: () => {
      const { pathtree, setNamespaceMap } = get()
      setNamespaceMap(newNamespaceMap(pathtree))
    },

    setNamespaceMap: (ns: NamespaceMap): void => {
      set({ ns })
    },
  }
}

function newNamespaceMap(tree: PathTree): NamespaceMap {
  return NamespaceMap.generate(tree.uris, undefined, NamespaceMap.KnownPrefixes)
}

export const snapshotKey = 'v1/ns'
export function snapshot(state: State): NamespaceMapExport {
  return state.ns.toJSON()
}
function validate(data: any): data is NamespaceMapExport {
  return NamespaceMap.isValidNamespaceMap(data)
}
