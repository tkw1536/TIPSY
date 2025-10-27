import type { BoundState } from '..'
import type { Pathbuilder } from '../../../../lib/pathbuilder/pathbuilder'

import * as Bundle from '../bundle'
import * as Color from '../cm'
import * as Model from '../model'
import * as NS from '../ns'
import * as Inverses from '../inverses'
import * as Selection from '../selection'
import * as Tree from '../tree'

export default function SnapshotIntoPathbuilder(
  state: BoundState,
): Pathbuilder {
  const data = new Map<string, any>()
  data.set(Bundle.snapshotKey, Bundle.snapshot(state))
  data.set(Color.snapshotKey, Color.snapshot(state))
  data.set(Model.snapshotKey, Model.snapshot(state))
  data.set(NS.snapshotKey, NS.snapshot(state))
  data.set(Inverses.snapshotKey, Inverses.snapshot(state))
  data.set(Selection.snapshotKey, Selection.snapshot(state))
  data.set(Tree.snapshotKey, Tree.snapshot(state))
  return state.pathbuilder.withSnapshot(data)
}
