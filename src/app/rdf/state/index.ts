import { create } from 'zustand'
import * as File from './file'
import * as Modal from './modal'
import * as NS from './ns'
import * as RDF from './rdf'
import * as Tab from './tab'

import type { Store } from 'rdflib'

/** the set of all states */
export type BoundState = File.Slice &
  Modal.Slice &
  NS.Slice &
  Tab.Slice &
  RDF.Slice

/** contains all functions that reset the state */
export const resetters = new Set<() => void>()

/** contains all functions that load some state */
export const loaders = new Set<(store: Store) => Promise<Partial<BoundState>>>()

/** the store for rdf */
const useRDFStore = create<BoundState>()((...a) => ({
  ...File.create(...a),
  ...Modal.create(...a),
  ...NS.create(...a),
  ...RDF.create(...a),
  ...Tab.create(...a),
}))

export default useRDFStore
