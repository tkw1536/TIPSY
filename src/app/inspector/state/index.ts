import { create } from 'zustand'
import * as Bundle from './bundle'
import * as Color from './cm'
import * as File from './file'
import * as Modal from './modal'
import * as Model from './model'
import * as NS from './ns'
import * as Selection from './selection'
import * as Tab from './tab'
import * as Tree from './tree'

import type { PathTree } from '../../../lib/pathbuilder/pathtree'
import type { Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'

/** the set of all states */
export type BoundState = Bundle.Slice &
  Color.Slice &
  File.Slice &
  Modal.Slice &
  Model.Slice &
  NS.Slice &
  Selection.Slice &
  Tab.Slice &
  Tree.Slice

/** contains all functions that reset the state */
export const resetters = new Set<() => void>()

/** contains all functions that load some state */
export const loaders = new Set<
  (tree: PathTree, pb: Pathbuilder) => Promise<Partial<BoundState>>
>()

/** the store for rdf */
const useInspectorStore = create<BoundState>()((...a) => ({
  ...Bundle.create(...a),
  ...Color.create(...a),
  ...File.create(...a),
  ...Modal.create(...a),
  ...Model.create(...a),
  ...NS.create(...a),
  ...Selection.create(...a),
  ...Tab.create(...a),
  ...Tree.create(...a),
}))

export default useInspectorStore
