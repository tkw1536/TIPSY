import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { Store } from 'rdflib'

export type Slice = State & Actions

interface State {
  activeTab: string
}

interface Actions {
  setActiveTab: (name: string) => void
}

const initialState: State = {
  activeTab: '',
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (store: Store): Promise<Partial<State>> => ({}))

  return {
    ...initialState,
    setActiveTab: (id: string) => {
      set({ activeTab: id })
    },
  }
}
