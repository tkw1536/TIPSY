import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import { type PathTree } from '../../../lib/pathbuilder/pathtree'
import Deduplication from './datatypes/deduplication'
import { type ModelDisplay } from '../../../lib/graph/builders/model/labels'
import { models } from '../../../lib/drivers/collection'
import { defaultLayout } from '../../../lib/drivers/impl'

export type Slice = State & Actions

interface State {
  modelGraphDriver: string
  modelGraphLayout: string
  modelSeed: number | null
  modelDeduplication: Deduplication
  modelDisplay: ModelDisplay
}

interface Actions {
  setModelDriver: (driver: string) => void
  setModelLayout: (layout: string) => void
  setModelSeed: (seed: number | null) => void
  setModelDeduplication: (deduplication: Deduplication) => void
  setModelDisplay: (display: ModelDisplay) => void
}

const initialState: State = {
  modelGraphDriver: models.defaultDriver,
  modelGraphLayout: defaultLayout,
  modelSeed: null,
  modelDeduplication: Deduplication.Bundle,
  modelDisplay: {
    ComplexConceptNodes: true,
    ComplexLiteralNodes: true,
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
      set({ modelGraphDriver: driver })
    },
    setModelLayout(layout) {
      set({ modelGraphLayout: layout })
    },
    setModelDeduplication(deduplication) {
      set({ modelDeduplication: deduplication })
    },
    setModelDisplay(display) {
      set({ modelDisplay: display })
    },
    setModelSeed(seed) {
      set({ modelSeed: seed })
    },
  }
}