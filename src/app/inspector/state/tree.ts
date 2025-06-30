import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { PathTreeNode, PathTree } from '../../../lib/pathbuilder/pathtree'
import NodeSelection, {
  type NodeSelectionExport,
} from '../../../lib/pathbuilder/annotations/selection'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'

export type Slice = State & Actions

interface State {
  search: string
  collapse: NodeSelection
  collapseParentPaths: boolean
}

interface Actions {
  setSearch: (value: string) => void
  setCollapseParentPaths: (value: boolean) => void

  toggleNode: (node: PathTreeNode) => void
  collapseAll: () => void
  expandAll: () => void
}

const initialState: State = {
  search: '',
  collapse: NodeSelection.all(),
  collapseParentPaths: false,
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
      const snapshot = pathbuilder.getSnapshotData(snapshotKey, validate)
      if (snapshot === null) return {}

      const { collapse, collapseParentPaths } = snapshot
      const collapseParse = NodeSelection.fromJSON(collapse)
      if (collapseParse === null) return {}

      return { collapseParentPaths, collapse: collapseParse }
    },
  )
  return {
    ...initialState,

    setSearch: (value: string) => {
      set({ search: value })
    },

    setCollapseParentPaths: (value: boolean) => {
      set({ collapseParentPaths: value })
    },

    toggleNode(node) {
      set(({ collapse }) => ({ collapse: collapse.toggle(node) }))
    },

    collapseAll() {
      set({ collapse: NodeSelection.all() })
    },
    expandAll() {
      set({ collapse: NodeSelection.none() })
    },
  }
}

interface TreeExport {
  type: 'tree'
  collapse: NodeSelectionExport
  collapseParentPaths: boolean
}

export const snapshotKey = 'v1/tree'
export function snapshot(state: State): TreeExport {
  const { collapse, collapseParentPaths } = state
  return {
    type: 'tree',
    collapse: collapse.toJSON(),
    collapseParentPaths,
  }
}
function validate(data: any): data is TreeExport {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    data.type === 'tree' &&
    'search' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.search === 'string' &&
    'collapse' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    NodeSelection.isValidNodeSelection(data.collapse) &&
    'collapseParentPaths' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.collapseParentPaths === 'boolean'
  )
}
