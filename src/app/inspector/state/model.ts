import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import { type PathTree } from '../../../lib/pathbuilder/pathtree'
import Deduplication from './datatypes/deduplication'
import { type ModelDisplay } from '../../../lib/graph/builders/model/labels'
import { models } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'
import { nextInt } from '../../../lib/utils/prng'

export type Slice = State & Actions

interface State {
  modelGraphDriver: string
  modelSeed: number
  modelGraphLayout: string
  modelDeduplication: Deduplication
  modelDisplay: ModelDisplay
  modelSnapshot: Snapshot | null
}

interface Actions {
  setModelDriver: (driver: string) => void
  setModelLayout: (layout: string) => void
  setModelSeed: (seed: number) => void
  setModelDeduplication: (deduplication: Deduplication) => void
  setModelDisplay: (display: ModelDisplay) => void
  setModelSnapshot: (snapshot: Snapshot | null) => void
}

const initialState: State = {
  modelGraphDriver: models.defaultDriver,
  modelGraphLayout: defaultLayout,
  modelSeed: nextInt(),
  modelDeduplication: Deduplication.Bundle,
  modelDisplay: {
    ComplexConceptNodes: true,
    ComplexLiteralNodes: true,
    BoxCompoundNodes: true,
    Labels: {
      Concept: true,
      Property: true,

      Bundle: true,
      ConceptField: true,
      ConceptFieldType: true,

      DatatypeFieldType: true,
      DatatypeField: true,
      DatatypeProperty: true,
    },
  },
  modelSnapshot: null,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (tree: PathTree): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    setModelDriver(driver) {
      set({
        modelGraphDriver: driver,
        modelGraphLayout: defaultLayout,
        modelSnapshot: null,
      })
    },
    setModelLayout(layout) {
      set({ modelGraphLayout: layout, modelSnapshot: null })
    },
    setModelDeduplication(deduplication) {
      set({ modelDeduplication: deduplication })
    },
    setModelDisplay(display) {
      set({ modelDisplay: display })
    },
    setModelSeed(seed) {
      set({ modelSeed: seed, modelSnapshot: null })
    },
    setModelSnapshot(snapshot) {
      set({ modelSnapshot: snapshot })
    },
  }
}
