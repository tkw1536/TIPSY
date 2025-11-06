import { type BoundState, resetters } from '.'

import type { StateCreator } from 'zustand'
export type Slice = State & Actions

interface State {
  uriSearch: string
  uriUseNamespaces: boolean
  uriSort: URISort
}

export interface URISort {
  column: 'uri' | 'concept' | 'property' | 'datatype'
  direction: 'asc' | 'desc'
}

interface Actions {
  setURISearch: (search: string) => void
  setURIUseNamespaces: (enabled: boolean) => void
  setURISort: (sort: URISort) => void
}

const initialState: State = {
  uriSearch: '',
  uriUseNamespaces: false,
  uriSort: {
    column: 'uri',
    direction: 'asc',
  },
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = (set, get) => {
  resetters.add(() => {
    set(resetState)
  })

  return {
    ...initialState,

    setURISearch: (search: string) => {
      set({ uriSearch: search })
    },

    setURIUseNamespaces: (enabled: boolean): void => {
      set({ uriUseNamespaces: enabled })
    },
    setURISort: (sort: URISort) => {
      set({ uriSort: sort })
    },
  }
}
