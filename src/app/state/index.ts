import ColorMap from '../../lib/colormap'
import { NamespaceMap } from '../../lib/namespace'
import { Pathbuilder } from '../../lib/pathbuilder'
import { PathTree } from '../../lib/pathtree'
import NodeSelection from '../../lib/selection'
import Deduplication from './state/deduplication'

export interface State {
  activeTab: string // the active tab

  loaded: boolean | { error: unknown } // boolean indicating if file has been loaded, string for error
  filename: string

  pathbuilderVersion: number
  pathbuilder: Pathbuilder
  tree: PathTree

  namespaceVersion: number
  ns: NamespaceMap
  nsLoadError?: string

  colorVersion: number
  cm: ColorMap
  cmLoadError?: string

  selectionVersion: number
  selection: NodeSelection // the selection

  optionVersion: number
  modelDeduplication: Deduplication

  // renders for the graphs
  bundleGraphDriver: string
  bundleGraphLayout: string

  modelGraphDriver: string
  modelGraphLayout: string

  collapsed: NodeSelection
}

/** A reducer updates state */
export type Reducer = (state: State) => Partial<State> | Promise<Partial<State> | null> | null

export interface ReducerProps {
  state: State
  apply: (reducer: Reducer) => void
}
