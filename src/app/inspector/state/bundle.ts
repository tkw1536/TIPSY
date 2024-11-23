import type { StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import type { PathTree } from '../../../lib/pathbuilder/pathtree'
import { bundles } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'
import { nextInt } from '../../../lib/utils/prng'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'

export type Slice = State & Actions

interface State {
  bundleDriver: string
  bundleSeed: number
  bundleGraphLayout: string
  bundleSnapshot: Snapshot | null
}

interface Actions {
  setBundleDriver: (driver: string) => void
  setBundleLayout: (layout: string) => void
  setBundleSeed: (seed: number) => void
  setBundleSnapshot: (snapshot: Snapshot | null) => void
}

const initialState: State = {
  bundleDriver: bundles.defaultDriver,
  bundleGraphLayout: defaultLayout,
  bundleSeed: nextInt(),
  bundleSnapshot: null,
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

    setBundleDriver(driver) {
      set({
        bundleDriver: driver,
        bundleGraphLayout: defaultLayout,
      })
    },
    setBundleLayout(layout) {
      set({ bundleGraphLayout: layout })
    },
    setBundleSeed(seed) {
      set({ bundleSeed: seed })
    },
    setBundleSnapshot(snapshot) {
      set({ bundleSnapshot: snapshot })
    },
  }
}

interface BundleExport extends State {
  type: 'bundle'
}

export const snapshotKey = 'v1/bundle'
export function snapshot(state: State): BundleExport {
  const { bundleDriver, bundleSeed, bundleGraphLayout, bundleSnapshot } = state
  return {
    type: 'bundle',
    bundleDriver,
    bundleSeed,
    bundleGraphLayout,
    bundleSnapshot,
  }
}
function validate(data: any): data is BundleExport {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    data.type === 'bundle' &&
    'bundleDriver' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.bundleDriver === 'string' &&
    'bundleSeed' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.bundleSeed === 'number' &&
    'bundleGraphLayout' in data &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- guarded
    typeof data.bundleGraphLayout === 'string' &&
    'bundleSnapshot' in data
  )
}
