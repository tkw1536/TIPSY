import { describe, expect, test } from 'vitest'
import NodeSelection, { type NodeSelectionExport } from './selection'
import { Path, Pathbuilder, type PathParams } from '../pathbuilder'
import { PathTree, type PathTreeNode } from '../pathtree'
import { readFixtureJSON } from '../../utils/test/fixture'

const sampleJSON = await readFixtureJSON<PathParams[]>(
  'pathbuilder',
  'sample.json',
)
const samplePB = new Pathbuilder(
  sampleJSON.map(p => new Path(p)),
  sampleJSON.map(_ => null),
)
const sampleTree = PathTree.fromPathbuilder(samplePB)

function mustGetNode(id: string): PathTreeNode {
  const node = sampleTree.find(id)
  if (node === null) throw new Error(`${id} not found`)
  return node
}
function mustGetPath(node: PathTreeNode): Path {
  const path = node.path
  if (path === null) throw new Error(`node missing path`)
  return path
}

// get real nodes from the sample tree
const publicationBundle = mustGetNode('publication')
const publicationPath = mustGetPath(publicationBundle)
const titleField = mustGetNode('title')
const scientificFigureBundle = mustGetNode('scientific_figure')
const creationBundle = mustGetNode('creation')

describe(NodeSelection, () => {
  describe('static constructors', () => {
    test('none creates empty selection with defaultValue false', () => {
      const ns = NodeSelection.none()
      expect(ns.defaultValue).toBe(false)
      expect(ns.toJSON().values).toEqual([])
    })

    test('all creates empty selection with defaultValue true', () => {
      const ns = NodeSelection.all()
      expect(ns.defaultValue).toBe(true)
      expect(ns.toJSON().values).toEqual([])
    })

    test('these creates selection with specific elements', () => {
      const ns = NodeSelection.these(['publication', 'title'])
      expect(ns.defaultValue).toBe(false)
      expect(ns.toJSON().values).toEqual(['publication', 'title'])
    })
  })

  describe('toJSON and fromJSON', () => {
    test('serializes empty selection', () => {
      const ns = NodeSelection.none()
      const json = ns.toJSON()

      expect(json).toEqual({
        type: 'node-selection',
        defaultValue: false,
        values: [],
      })
    })

    test('serializes selection with values', () => {
      const ns = NodeSelection.these(['publication', 'title', 'person'])
      const json = ns.toJSON()

      expect(json).toEqual({
        type: 'node-selection',
        defaultValue: false,
        values: ['publication', 'title', 'person'],
      })
    })

    test('round-trips through JSON', () => {
      const ns = NodeSelection.these(['publication', 'title'])
      const json = ns.toJSON()
      const restored = NodeSelection.fromJSON(json)

      expect(restored).not.toBeNull()
      expect(restored?.defaultValue).toBe(ns.defaultValue)
      expect(restored?.toJSON()).toEqual(json)
    })

    test.each([
      ['null', null],
      ['undefined', undefined],
      ['string', 'string'],
      ['number', 123],
      ['empty object', {}],
      ['wrong type', { type: 'wrong' }],
      ['missing defaultValue', { type: 'node-selection', values: [] }],
      [
        'non-boolean defaultValue',
        { type: 'node-selection', defaultValue: 'true', values: [] },
      ],
      ['missing values', { type: 'node-selection', defaultValue: false }],
      [
        'non-array values',
        { type: 'node-selection', defaultValue: false, values: 'not-array' },
      ],
      [
        'non-string values',
        { type: 'node-selection', defaultValue: false, values: [1, 2, 3] },
      ],
    ])('fromJSON returns null for invalid data: %s', (_, data) => {
      expect(NodeSelection.fromJSON(data)).toBeNull()
    })
  })

  describe('isValidNodeSelection', () => {
    test('validates correct node selection', () => {
      const data: NodeSelectionExport = {
        type: 'node-selection',
        defaultValue: false,
        values: ['publication', 'title'],
      }
      expect(NodeSelection.isValidNodeSelection(data)).toBe(true)
    })

    test.each([
      ['invalid type', { type: 'wrong', defaultValue: false, values: [] }],
      ['missing defaultValue', { type: 'node-selection', values: [] }],
      [
        'non-boolean defaultValue',
        { type: 'node-selection', defaultValue: 'false', values: [] },
      ],
      ['missing values', { type: 'node-selection', defaultValue: false }],
      [
        'non-array values',
        { type: 'node-selection', defaultValue: false, values: {} },
      ],
      [
        'values with non-strings',
        { type: 'node-selection', defaultValue: false, values: ['a', 1] },
      ],
      ['null', null],
      ['string primitive', 'string'],
      ['number primitive', 123],
      ['boolean primitive', true],
    ])('rejects %s', (_, data) => {
      expect(NodeSelection.isValidNodeSelection(data)).toBe(false)
    })
  })

  describe('includes', () => {
    test('none includes no nodes', () => {
      const ns = NodeSelection.none()
      expect(ns.includes(publicationBundle)).toBe(false)
      expect(ns.includes(titleField)).toBe(false)
    })

    test('all includes all nodes', () => {
      const ns = NodeSelection.all()
      expect(ns.includes(publicationBundle)).toBe(true)
      expect(ns.includes(titleField)).toBe(true)
    })

    test('these includes only specified nodes', () => {
      const ns = NodeSelection.these(['publication', 'title'])
      expect(ns.includes(publicationBundle)).toBe(true)
      expect(ns.includes(titleField)).toBe(true)
      expect(ns.includes(scientificFigureBundle)).toBe(false)
    })

    test('includes works with Path objects', () => {
      const ns = NodeSelection.these(['publication'])
      expect(ns.includes(publicationPath)).toBe(true)
    })

    test('includes returns false for undefined', () => {
      const ns = NodeSelection.these(['publication'])
      expect(ns.includes(undefined)).toBe(false)
    })
  })

  describe('count', () => {
    test('counts selected children', () => {
      // Select only title and creation which are children of publication
      const ns = NodeSelection.these(['title', 'creation'])
      const count = ns.count(publicationBundle, false)

      // Should count title and creation (both are children of publication)
      expect(count).toBe(2)
    })

    test('count includes self when includeSelf is true', () => {
      const ns = NodeSelection.these(['publication', 'title'])
      const countWithSelf = ns.count(publicationBundle, true)
      const countWithoutSelf = ns.count(publicationBundle, false)

      expect(countWithSelf).toBe(2) // publication + title
      expect(countWithoutSelf).toBe(1) // only title
    })

    test('count returns 0 when nothing is selected', () => {
      const ns = NodeSelection.none()
      const count = ns.count(publicationBundle, false)

      expect(count).toBe(0)
    })
  })

  describe('with', () => {
    test('with adds nodes to selection', () => {
      const ns = NodeSelection.none()
      const updated = ns.with([
        [publicationBundle, true],
        [titleField, true],
      ])

      expect(updated.includes(publicationBundle)).toBe(true)
      expect(updated.includes(titleField)).toBe(true)
    })

    test('with removes nodes from selection', () => {
      const ns = NodeSelection.these(['publication', 'title'])
      const updated = ns.with([[publicationBundle, false]])

      expect(updated.includes(publicationBundle)).toBe(false)
      expect(updated.includes(titleField)).toBe(true)
    })

    test('with returns same instance if no changes', () => {
      const ns = NodeSelection.these(['publication'])
      const updated = ns.with([[publicationBundle, true]])

      expect(updated).toBe(ns)
    })

    test('with works with Path objects', () => {
      const ns = NodeSelection.none()
      const updated = ns.with([[publicationPath, true]])

      expect(updated.includes(publicationBundle)).toBe(true)
    })

    test('with ignores undefined keys', () => {
      const ns = NodeSelection.none()
      const updated = ns.with([[undefined, true]])

      expect(updated).toBe(ns)
    })

    test('with does not mutate original selection', () => {
      const ns = NodeSelection.none()
      const updated = ns.with([[publicationBundle, true]])

      expect(ns.includes(publicationBundle)).toBe(false)
      expect(updated.includes(publicationBundle)).toBe(true)
    })
  })

  describe('toggle', () => {
    test('toggle adds node when not selected', () => {
      const ns = NodeSelection.none()
      const updated = ns.toggle(publicationBundle)

      expect(updated.includes(publicationBundle)).toBe(true)
    })

    test('toggle removes node when selected', () => {
      const ns = NodeSelection.these(['publication'])
      const updated = ns.toggle(publicationBundle)

      expect(updated.includes(publicationBundle)).toBe(false)
    })

    test('toggle works with Path objects', () => {
      const ns = NodeSelection.none()
      const updated = ns.toggle(publicationPath)

      expect(updated.includes(publicationBundle)).toBe(true)
    })

    test('toggle returns same instance for undefined', () => {
      const ns = NodeSelection.none()
      const updated = ns.toggle(undefined)

      expect(updated).toBe(ns)
    })

    test('toggle does not mutate original selection', () => {
      const ns = NodeSelection.none()
      const updated = ns.toggle(publicationBundle)

      expect(ns.includes(publicationBundle)).toBe(false)
      expect(updated.includes(publicationBundle)).toBe(true)
    })
  })

  describe('closure', () => {
    test('closure includes parent of selected node', () => {
      // Select only title field
      const ns = NodeSelection.these(['title'])
      const closure = ns.closure(sampleTree)

      // Closure should include both title and its parent publication
      expect(closure.includes(titleField)).toBe(true)
      expect(closure.includes(publicationBundle)).toBe(true)
    })

    test('closure of already closed selection returns equivalent selection', () => {
      // Select both parent and child
      const ns = NodeSelection.these(['publication', 'title'])
      const closure = ns.closure(sampleTree)

      expect(closure.includes(publicationBundle)).toBe(true)
      expect(closure.includes(titleField)).toBe(true)
    })

    test('closure of root node includes only root', () => {
      // Select a root bundle
      const ns = NodeSelection.these(['publication'])
      const closure = ns.closure(sampleTree)

      expect(closure.includes(publicationBundle)).toBe(true)
    })

    test('closure works with nested nodes', () => {
      // creation is a child of publication
      const ns = NodeSelection.these(['creation'])
      const closure = ns.closure(sampleTree)

      // Should include both creation and publication
      expect(closure.includes(creationBundle)).toBe(true)
      expect(closure.includes(publicationBundle)).toBe(true)
    })

    test('closure of empty selection returns empty selection', () => {
      const ns = NodeSelection.none()
      const closure = ns.closure(sampleTree)

      expect(closure.toJSON().values).toEqual([])
    })
  })

  describe('toPathbuilder', () => {
    test('toPathbuilder returns pathbuilder with selected paths', () => {
      const ns = NodeSelection.these(['publication', 'title'])
      const pb = ns.toPathbuilder(sampleTree)

      expect(pb.paths.length).toBeGreaterThanOrEqual(2)
      expect(pb.paths.some(p => p.id === 'publication')).toBe(true)
      expect(pb.paths.some(p => p.id === 'title')).toBe(true)
    })

    test('toPathbuilder with none returns empty pathbuilder', () => {
      const ns = NodeSelection.none()
      const pb = ns.toPathbuilder(sampleTree)

      expect(pb.paths.length).toBe(0)
    })

    test('toPathbuilder with all returns all paths', () => {
      const ns = NodeSelection.all()
      const pb = ns.toPathbuilder(sampleTree)

      expect(pb.paths.length).toBe(samplePB.paths.length)
    })

    test('toPathbuilder filters out non-selected paths', () => {
      const ns = NodeSelection.these(['publication'])
      const pb = ns.toPathbuilder(sampleTree)

      expect(pb.paths.some(p => p.id === 'publication')).toBe(true)
      expect(pb.paths.some(p => p.id === 'scientific_figure')).toBe(false)
    })
  })

  describe('immutability', () => {
    test('with returns new instance', () => {
      const ns = NodeSelection.none()
      const updated = ns.with([[publicationBundle, true]])

      expect(updated).not.toBe(ns)
    })

    test('toggle returns new instance', () => {
      const ns = NodeSelection.none()
      const updated = ns.toggle(publicationBundle)

      expect(updated).not.toBe(ns)
    })

    test('closure returns new instance when changes are made', () => {
      const ns = NodeSelection.these(['title'])
      const closure = ns.closure(sampleTree)

      expect(closure).not.toBe(ns)
    })
  })
})
