import { resetters, type BoundState, loaders } from '.'

import { type StateCreator } from 'zustand'
import { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'
import { PathTree } from '../../../lib/pathbuilder/pathtree'

export type Slice = State & Actions

interface State {
  loadStage: false | 'loading' | true | { error: unknown } // boolean indicating if file has been loaded, string for error
  filename: string

  pathbuilder: Pathbuilder
  pathtree: PathTree
}

interface Actions {
  loadFile: (source: File | (() => Promise<File>)) => void
  closeFile: () => void
}

const initialState: State = {
  loadStage: false,
  filename: '',
  pathbuilder: new Pathbuilder([]),
  pathtree: new PathTree([]),
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (pathtree: PathTree): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    loadFile: (source: File | (() => Promise<File>)) => {
      // tell the caller that we're loading
      set({ loadStage: 'loading' })

      void (async () => {
        // parse the graph
        let states: Array<Partial<BoundState>>

        let pathbuilder: Pathbuilder
        let tree: PathTree

        let file: File
        try {
          file = typeof source === 'function' ? await source() : source
          const fileText = await file.text()

          pathbuilder = Pathbuilder.parse(fileText)
          tree = PathTree.fromPathbuilder(pathbuilder)

          // load the entire initial state
          states = await Promise.all(
            Array.from(loaders).map(async load => await load(tree)),
          )
          states.push({})
        } catch (error: unknown) {
          set({ loadStage: { error } })
          return
        }

        // and finally combine the state
        const state: Partial<State> = Object.assign({}, ...states, {
          loadStage: true,

          filename: file.name !== '' ? file.name : 'pathbuilder.xml',
          pathbuilder,
          pathtree: tree,
        })
        set(state)
      })()
    },

    closeFile: () => {
      resetters.forEach(reset => {
        reset()
      })
    },
  }
}
