import type { Store } from 'rdflib'
import { loaders, resetters, type BoundState } from '.'
import { triples } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'

import type { StateCreator } from 'zustand'
import { nextInt } from '../../../lib/utils/prng'

export type Slice = State & Actions

interface State {
  rdfGraphDriver: string
  rdfGraphSeed: number
  rdfGraphLayout: string
  rdfGraphSnapshot: Snapshot | null
  rdfGraphSize: number
}

interface Actions {
  setRDFDriver: (name: string) => void
  setRDFLayout: (name: string) => void
  setRDFSeed: (seed: number) => void
  setRDFSnapshot: (snapshot: Snapshot | null) => void
  setRDFSize: (size: number) => void
}

const initialState: State = {
  rdfGraphDriver: triples.defaultDriver,
  rdfGraphLayout: defaultLayout,
  rdfGraphSeed: nextInt(),
  rdfGraphSnapshot: null,
  rdfGraphSize: 0,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (store: Store): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    setRDFDriver(name) {
      set({
        rdfGraphDriver: name,
        rdfGraphLayout: defaultLayout,
        rdfGraphSnapshot: null,
      })
    },

    setRDFLayout(layout) {
      set({ rdfGraphLayout: layout, rdfGraphSnapshot: null })
    },

    setRDFSeed(seed) {
      set({ rdfGraphSeed: seed, rdfGraphSnapshot: null })
    },

    setRDFSnapshot(snapshot) {
      set({ rdfGraphSnapshot: snapshot })
    },

    setRDFSize(size) {
      set({ rdfGraphSize: size })
    },
  }
}
