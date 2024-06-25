import { Reducer, State } from '../..'
import { NodeLike, PathTree } from '../../../../lib/pathtree'
import NodeSelection from '../../../../lib/selection'

export function newSelection (tree: PathTree): NodeSelection {
  return NodeSelection.all()
}

/** selects all items */
export function selectAll (): Reducer {
  return ({ selectionVersion }: State): Partial<State> => ({
    selection: NodeSelection.all(),
    selectionVersion: selectionVersion + 1
  })
}

/** makes sure that the selected items are applied */
export function updateSelection (pairs: Array<[NodeLike, boolean]>): Reducer {
  return ({ selection, selectionVersion }: State): Partial<State> => ({
    selection: selection.with(pairs),
    selectionVersion: selectionVersion + 1
  })
}

/** selects none of the item */
export function selectNone (): Reducer {
  return ({ selection, selectionVersion }: State): Partial<State> => ({
    selection: NodeSelection.none(),
    selectionVersion: selectionVersion + 1
  })
}