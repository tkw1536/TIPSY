import { graph, parse, Store } from 'rdflib'
import { resetters, type BoundState, loaders } from '.'

import type { StateCreator } from 'zustand'
import {
  contentTypeToExtension,
  guessContentType,
} from '../../../lib/rdf/guesser'

export type Slice = State & Actions

interface State {
  loadStage: false | 'loading' | true | { error: unknown } // boolean indicating if file has been loaded, string for error
  filename: string

  /** in embed mode it is not permitted to close the current pathbuilder */
  embed: boolean

  store: Store
}

interface Actions {
  loadFile: (file: File) => void
  closeFile: () => void
}

const initialState: State = {
  loadStage: false,
  filename: '',
  store: new Store(),
  embed: false,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (store: Store): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    loadFile: (file: File) => {
      // tell the caller that we're loading
      set({ loadStage: 'loading' })

      void (async () => {
        // parse the graph
        const store: Store = graph()
        let states: Array<Partial<BoundState>>
        let filename: string
        try {
          const source = await file.text()
          const contentType = guessContentType(file)
          filename =
            file.name !== ''
              ? file.name
              : 'upload.' + contentTypeToExtension(contentType)
          const base = 'file://' + filename

          // parse in the graph
          parse(source, store, base, contentType)

          // load the entire initial state
          states = await Promise.all(
            Array.from(loaders).map(async load => await load(store)),
          )
        } catch (error: unknown) {
          set({ loadStage: { error } })
          return
        }

        // and finally combine the state
        const state: Partial<State> = Object.assign({}, ...states, {
          store,
          loadStage: true,
          filename,
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
