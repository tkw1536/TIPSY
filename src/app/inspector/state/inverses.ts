import { type BoundState, loaders, resetters } from '.'

import type { StateCreator } from 'zustand'
import { InverseMap } from '../../../lib/pathbuilder/inversemap'
import type { InverseMapExport } from '../../../lib/pathbuilder/inversemap'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'
import type { PathTree } from '../../../lib/pathbuilder/pathtree'
export type Slice = State & Actions

interface State {
  inverses: InverseMap
}

interface Actions {
  resetInverseMap: () => void
  setInverseMap: (inverses: InverseMap) => void
}

const initialState: State = {
  inverses: new InverseMap([]),
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
      const inverses =
        InverseMap.fromJSON(
          pathbuilder.getSnapshotData(snapshotKey, validate),
        ) ?? new InverseMap([])
      return {
        inverses,
      }
    },
  )

  return {
    ...initialState,

    resetInverseMap: () => {
      const { setInverseMap } = get()
      setInverseMap(new InverseMap([]))
    },

    setInverseMap: (inverses: InverseMap): void => {
      set({ inverses })
    },
  }
}

export const snapshotKey = 'v1/inverses'
export function snapshot(state: State): InverseMapExport {
  return state.inverses.toJSON()
}
function validate(data: any): data is InverseMapExport {
  return InverseMap.isValidInverseMap(data)
}
