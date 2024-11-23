import { type BoundState, loaders, resetters } from '.'

import type { StateCreator } from 'zustand'
import type { PathTreeNode, PathTree } from '../../../lib/pathbuilder/pathtree'
import ColorMap, {
  type ColorMapExport,
} from '../../../lib/pathbuilder/annotations/colormap'
import { applyColorPreset, ColorPreset } from './datatypes/color'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'
export type Slice = State & Actions

interface State {
  cm: ColorMap
}

interface Actions {
  applyColorPreset: (preset: ColorPreset) => void
  setColor: (node: PathTreeNode, color: string) => void
  setColorMap: (map: ColorMap) => void
}

const initialState: State = {
  cm: ColorMap.empty(),
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
      const cm =
        ColorMap.fromJSON(pathbuilder.getSnapshotData(snapshotKey, validate)) ??
        applyColorPreset(tree, ColorPreset.OrangeAndGray)
      return {
        cm,
      }
    },
  )

  return {
    ...initialState,

    applyColorPreset(preset) {
      set(({ pathtree }) => ({
        cm: applyColorPreset(pathtree, preset),
      }))
    },

    setColor(node: PathTreeNode, color: string) {
      set(({ cm }) => ({ cm: cm.set(node, color), cmLoadError: undefined }))
    },

    setColorMap(cm: ColorMap) {
      set({ cm })
    },
  }
}

export const snapshotKey = 'v1/cm'
export function snapshot(state: State): ColorMapExport {
  return state.cm.toJSON()
}
function validate(data: any): data is ColorMapExport {
  return ColorMap.isValidColorMap(data)
}
