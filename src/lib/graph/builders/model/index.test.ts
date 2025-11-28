import { describe, expect, test } from 'vitest'
import ModelGraphBuilder, { type Options } from './index'
import { PathTree } from '../../../pathbuilder/pathtree'
import {
  Path,
  Pathbuilder,
  type PathParams,
} from '../../../pathbuilder/pathbuilder'
import NodeSelection from '../../../pathbuilder/annotations/selection'
import { InverseMap } from '../../../pathbuilder/inversemap'
import { readFixtureJSON } from '../../../utils/test/fixture'
import Deduplication from '../../../../app/inspector/state/datatypes/deduplication'

const sampleJSON = await readFixtureJSON<PathParams[]>(
  'pathbuilder',
  'sample.json',
)
const samplePB = new Pathbuilder(sampleJSON.map(p => new Path(p)))
const [sampleTree] = PathTree.fromPathbuilder(samplePB)

const emptyInverses = new InverseMap([])

function buildGraphJSON(
  tree: PathTree,
  deduplication: Deduplication,
  selection: NodeSelection,
  inverses: InverseMap,
): unknown {
  const options: Options = {
    deduplication,
    inverses,
    include: node => selection.includes(node),
  }
  const builder = new ModelGraphBuilder(tree, options)
  return builder.build().toJSON()
}

// Common test structure for all deduplication modes
const testCases = [
  ['builds graph with all nodes selected', NodeSelection.all(), emptyInverses],
  [
    'builds graph with single top-level bundle',
    NodeSelection.these(['publication']),
    emptyInverses,
  ],
  [
    'builds graph with multiple top-level bundles',
    NodeSelection.these(['publication', 'person']),
    emptyInverses,
  ],
  [
    'builds graph with bundle and its fields',
    NodeSelection.these(['publication', 'title']),
    emptyInverses,
  ],
  [
    'builds graph with nested bundle structure',
    NodeSelection.these(['publication', 'creation', 'date_of_writing']),
    emptyInverses,
  ],
  [
    'builds graph with deeply nested field',
    NodeSelection.these([
      'publication',
      'scientific_publication',
      'figure_image',
    ]),
    emptyInverses,
  ],
  [
    'builds graph with entity reference field (author)',
    NodeSelection.these(['publication', 'creation', 'author']),
    emptyInverses,
  ],
  [
    'builds graph with field without parent bundle',
    NodeSelection.these(['title']),
    emptyInverses,
  ],
  [
    'handles gaps in hierarchy',
    NodeSelection.these(['publication', 'figure_image']),
    emptyInverses,
  ],
  [
    'handles mixed bundles and fields across hierarchy',
    NodeSelection.these([
      'publication',
      'title',
      'creation',
      'date_of_writing',
      'author',
    ]),
    emptyInverses,
  ],
  [
    'handles all top-level bundles with their fields',
    NodeSelection.these([
      'publication',
      'title',
      'scientific_figure',
      'image',
      'person',
      'name',
    ]),
    emptyInverses,
  ],
  [
    'handles disambiguation fields (same datatype property)',
    NodeSelection.these([
      'scientific_figure',
      'image',
      'scientific_publication',
      'figure_image',
    ]),
    emptyInverses,
  ],
  [
    'builds graph with inverse relationships',
    NodeSelection.all(),
    new InverseMap([['author', 'authored_by']]),
  ],
  [
    'builds graph with multiple inverses',
    NodeSelection.these(['publication', 'creation', 'author']),
    new InverseMap([
      ['author', 'authored_by'],
      ['creation', 'created'],
    ]),
  ],
  [
    'handles inverses with partial selection',
    NodeSelection.these(['publication', 'author']),
    new InverseMap([['author', 'authored_by']]),
  ],
] satisfies Array<[string, NodeSelection, InverseMap]>

describe(ModelGraphBuilder, () => {
  const testCasesWithDeduplication: Array<
    [string, Deduplication, NodeSelection, InverseMap]
  > = []
  for (const [name, selection, inverses] of testCases) {
    for (const deduplication of [
      Deduplication.None,
      Deduplication.Bundle,
      Deduplication.Full,
    ]) {
      testCasesWithDeduplication.push([
        name,
        deduplication,
        selection,
        inverses,
      ])
    }
  }

  test.each(testCasesWithDeduplication)(
    '%s %s',
    (_, deduplication, selection, inverses) => {
      const result = buildGraphJSON(
        sampleTree,
        deduplication,
        selection,
        inverses,
      )
      expect(result).toMatchSnapshot()
    },
  )
})
