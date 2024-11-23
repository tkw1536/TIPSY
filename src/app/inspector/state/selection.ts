import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { PathTreeNode, PathTree } from '../../../lib/pathbuilder/pathtree'
import NodeSelection, {
  type NodeSelectionExport,
} from '../../../lib/pathbuilder/annotations/selection'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'

export type Slice = State & Actions

interface State {
  selection: NodeSelection
}

interface Actions {
  selectAll: () => void
  selectNone: () => void
  selectPredicate: (predicate: (node: PathTreeNode) => boolean) => void
  updateSelection: (pairs: Array<[PathTreeNode, boolean]>) => void
}

const initialState: State = {
  selection: NodeSelection.all(),
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(
    async (
      tree: PathTree,
      pathbuilder: Pathbuilder,
    ): Promise<Partial<State>> => {
      const selection = NodeSelection.fromJSON(
        pathbuilder.getSnapshotData(snapshotKey, validate),
      )
      if (selection === null) {
        return {}
      }
      return {
        selection,
      }
    },
  )

  return {
    ...initialState,

    selectAll() {
      set({ selection: NodeSelection.all() })
    },
    selectNone() {
      set({ selection: NodeSelection.none() })
    },
    selectPredicate(predicate) {
      set(({ pathtree }) => ({
        selection: NodeSelection.these(
          Array.from(pathtree.walk())
            .filter(predicate)
            .map(node => node.path?.id)
            .filter(x => typeof x === 'string'),
        ),
      }))
    },
    updateSelection(pairs) {
      set(({ selection }) => ({ selection: selection.with(pairs) }))
    },
  }
}

export const snapshotKey = 'v1/selection'
export function snapshot(state: State): NodeSelectionExport {
  return state.selection.toJSON()
}
function validate(data: any): data is NodeSelectionExport {
  return NodeSelection.isValidNodeSelection(data)
}
