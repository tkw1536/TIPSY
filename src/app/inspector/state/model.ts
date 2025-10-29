import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { PathTree } from '../../../lib/pathbuilder/pathtree'
import Deduplication from './datatypes/deduplication'
import {
  isModelDisplay,
  type ModelDisplay,
} from '../../../lib/graph/builders/model/labels'
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
    Inverses: {
      Show: true,
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
      let snapshot2 = pathbuilder.getSnapshotData<ModelExport>(
        snapshotKey,
        validateVersion2,
      )
      if (snapshot2 === null) {
        const snapshot1 = pathbuilder.getSnapshotData<ModelExportVersion1>(
          snapshotKeyVersion1,
          validateVersion1,
        )
        if (snapshot1 === null) return {}

        snapshot2 = {
          ...snapshot1,
          modelDisplay: {
            ...snapshot1.modelDisplay,
            Inverses: { Show: true },
          },
        }
      }

      const { type, ...rest } = snapshot2
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

interface ModelExportVersion1 extends Exclude<ModelExport, 'modelDisplay'> {
  modelDisplay: Exclude<ModelDisplay, 'Inverses'>
}

export const snapshotKey = 'v2/model'
const snapshotKeyVersion1 = 'v1/model'
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
function validateVersion1(data: any): data is ModelExportVersion1 {
  if (
    !(
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
  ) {
    return false
  }
  const { modelDisplay } = data as unknown as { modelDisplay: unknown }
  if (typeof modelDisplay !== 'object' || modelDisplay === null) {
    return false
  }
  return isModelDisplay({ ...modelDisplay, Inverses: { Show: true } })
}
function validateVersion2(data: any): data is ModelExport {
  return validateVersion1(data) && isModelDisplay(data.modelDisplay)
}
