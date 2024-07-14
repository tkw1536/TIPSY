import { type IReducer, type IState } from '../..'
import { triples } from '../../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../../lib/drivers/impl'
import { type PathTree } from '../../../../../lib/pathbuilder/pathtree'

export function newRDFDriver(tree: PathTree): string {
  return triples.defaultDriver
}

export function setRDFDriver(name: string): IReducer {
  return ({ tree }: IState): Partial<IState> => ({
    rdfGraphDriver: name,
    rdfGraphLayout: defaultLayout,
  })
}

export function setRDFLayout(layout: string): IReducer {
  return ({ tree }: IState): Partial<IState> => ({
    rdfGraphLayout: layout,
  })
}
