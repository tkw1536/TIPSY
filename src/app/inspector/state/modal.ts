import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { PathTree } from '../../../lib/pathbuilder/pathtree'

export type Slice = State & Actions

interface State {
  modal: boolean
}

interface Actions {
  closeModal: () => void
}

const initialState: State = {
  modal: true,
}
const resetState: State = { ...initialState, modal: false }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (tree: PathTree): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    closeModal: (): void => {
      set({ modal: false })
    },
  }
}
