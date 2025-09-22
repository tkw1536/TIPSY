import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { PathTree } from '../../../lib/pathbuilder/pathtree'
import Deduplication from './datatypes/deduplication'
import type { ModelDisplay } from '../../../lib/graph/builders/model/labels'
import { models } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'
import { nextInt } from '../../../lib/utils/prng'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'

export type Slice = State & Actions

interface State {
  modelDriver: string
  modelSeed: number
  modelLayout: string
  modelDeduplication: Deduplication
  modelDisplay: ModelDisplay
  modelSnapshot: Snapshot | null
  modelSize: number
}

interface Actions {
  setModelDriver: (driver: string) => void
  setModelLayout: (layout: string) => void
  setModelSeed: (seed: number) => void
  setModelDeduplication: (deduplication: Deduplication) => void
  setModelDisplay: (display: ModelDisplay) => void
  setModelSnapshot: (snapshot: Snapshot | null) => void
  setModelSize: (size: number) => void
}

const initialState: State = {
  modelDriver: models.defaultDriver,
  modelLayout: defaultLayout,
  modelSeed: nextInt(),
  modelDeduplication: Deduplication.Bundle,
  modelDisplay: {
    Compounds: {
      Bundles: true,
      Datatypes: true,
      DataFields: true,
      ConceptFields: true,
    },
    Concept: {
      complex: true,
      boxed: true,
    },
    Literal: {
      complex: true,
      boxed: true,
    },
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
  modelSize: 0,
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

      const { type, ...rest } = snapshot
      return rest
    },
  )

  return {
    ...initialState,

    setModelDriver(driver) {
      set({
        modelDriver: driver,
        modelLayout: defaultLayout,
        modelSnapshot: null,
      })
    },
    setModelLayout(layout) {
      set({ modelLayout: layout, modelSnapshot: null })
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
    setModelSize(size) {
      set({ modelSize: size })
    },
  }
}

interface ModelExport extends State {
  type: 'model'
}

export const snapshotKey = 'v1/model'
export function snapshot(state: State): ModelExport {
  const {
    modelDriver,
    modelSeed,
    modelLayout,
    modelDeduplication,
    modelDisplay,
    modelSnapshot,
    modelSize,
  } = state
  return {
    type: 'model',
    modelDriver,
    modelSeed,
    modelLayout,
    modelDeduplication,
    modelDisplay,
    modelSnapshot,
    modelSize,
  }
}
function validate(data: any): data is ModelExport {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    data.type === 'model' &&
    'modelDriver' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.modelDriver === 'string' &&
    'modelSeed' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.modelSeed === 'number' &&
    'modelLayout' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.modelLayout === 'string' &&
    'modelDeduplication' in data &&
    'modelDisplay' in data &&
    'modelSnapshot' in data
  )
}
