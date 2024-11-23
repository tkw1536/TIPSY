import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { Store } from 'rdflib'

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

  loaders.add(async (store: Store): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    closeModal: () => {
      set({ modal: false })
    },
  }
}
