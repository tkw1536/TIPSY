import { describe, expect, test } from 'vitest'
import ColorMap, { type ColorMapExport } from './colormap'
import { PathTree, type PathTreeNode } from '../pathtree'
import { Path, Pathbuilder, type PathParams } from '../pathbuilder'
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

// Get real nodes from the sample tree
const publicationBundle = mustGetNode('publication')
const titleField = mustGetNode('title')
const scientificFigureBundle = mustGetNode('scientific_figure')
const creationBundle = mustGetNode('creation')
const personBundle = mustGetNode('person')

describe(ColorMap, () => {
  describe('constructor and empty', () => {
    test.each([
      ['default color', undefined, '#FFFFFF'],
      ['custom default color', '#ff0000', '#FF0000'],
      [
        'invalid default color falls back to global default',
        'not-a-color',
        ColorMap.globalDefault,
      ],
    ])('creates empty colormap with %s', (_, input, expected) => {
      const cm = ColorMap.empty(input)
      expect(cm.defaultColor).toBe(expected)
    })

    test('constructor normalizes colors to hex', () => {
      const cm = new ColorMap('red', new Map())
      expect(cm.defaultColor).toBe('#FF0000')
    })
  })

  describe('parseColor', () => {
    test.each([
      ['#ffffff', '#FFFFFF'],
      ['#fff', '#FFFFFF'],
      ['#FF0000', '#FF0000'],
      ['red', '#FF0000'],
      ['blue', '#0000FF'],
      ['rgb(255, 0, 0)', '#FF0000'],
      ['hsl(0, 100%, 50%)', '#FF0000'],
    ])('parses valid color %s to %s', (input, expected) => {
      expect(ColorMap.parseColor(input)).toBe(expected)
    })

    test.each(['not-a-color', '', 'invalid', '#gggggg'])(
      'returns null for invalid color %s',
      input => {
        expect(ColorMap.parseColor(input)).toBe(null)
      },
    )
  })

  describe('toJSON and fromJSON', () => {
    test('serializes empty colormap', () => {
      const cm = ColorMap.empty('#ff0000')
      const json = cm.toJSON()

      expect(json).toEqual({
        type: 'colormap',
        defaultColor: '#FF0000',
        colors: {},
      })
    })

    test('serializes colormap with colors', () => {
      const colors = new Map([
        ['id1', '#ff0000'],
        ['id2', '#00ff00'],
      ])
      const cm = new ColorMap('#ffffff', colors)
      const json = cm.toJSON()

      expect(json).toEqual({
        type: 'colormap',
        defaultColor: '#FFFFFF',
        colors: {
          id1: '#ff0000',
          id2: '#00ff00',
        },
      })
    })

    test('round-trips through JSON', () => {
      const colors = new Map([
        ['id1', '#FF0000'],
        ['id2', '#00FF00'],
      ])
      const cm = new ColorMap('#0000FF', colors)
      const json = cm.toJSON()
      const restored = ColorMap.fromJSON(json)

      expect(restored).not.toBeNull()
      expect(restored?.defaultColor).toBe(cm.defaultColor)
      expect(restored?.toJSON()).toEqual(json)
    })

    test('fromJSON normalizes colors', () => {
      const json = {
        type: 'colormap' as const,
        defaultColor: 'red',
        colors: {
          id1: 'blue',
          id2: 'green',
        },
      }
      const cm = ColorMap.fromJSON(json)

      expect(cm).not.toBeNull()
      expect(cm?.defaultColor).toBe('#FF0000')
    })

    test('fromJSON filters out invalid colors', () => {
      const json = {
        type: 'colormap' as const,
        defaultColor: '#ffffff',
        colors: {
          id1: '#ff0000',
          id2: 'not-a-color',
          id3: '#00ff00',
        },
      }
      const cm = ColorMap.fromJSON(json)

      expect(cm).not.toBeNull()
      const serialized = cm?.toJSON()
      expect(serialized?.colors).toEqual({
        id1: '#FF0000',
        id3: '#00FF00',
      })
    })

    test.each([
      ['null', null],
      ['undefined', undefined],
      ['string', 'string'],
      ['number', 123],
      ['empty object', {}],
      ['wrong type', { type: 'wrong' }],
    ])('fromJSON returns null for invalid data: %s', (_, data) => {
      expect(ColorMap.fromJSON(data)).toBeNull()
    })
  })

  describe('isValidColorMap', () => {
    test('validates correct colormap', () => {
      const data: ColorMapExport = {
        type: 'colormap',
        defaultColor: '#ffffff',
        colors: { id1: '#ff0000' },
      }
      expect(ColorMap.isValidColorMap(data)).toBe(true)
    })

    test.each([
      ['invalid type', { type: 'wrong', defaultColor: '#ffffff', colors: {} }],
      ['missing defaultColor', { type: 'colormap', colors: {} }],
      [
        'non-string defaultColor',
        { type: 'colormap', defaultColor: 123, colors: {} },
      ],
      ['missing colors', { type: 'colormap', defaultColor: '#ffffff' }],
      [
        'non-object colors',
        { type: 'colormap', defaultColor: '#ffffff', colors: 'not-an-object' },
      ],
      [
        'colors with non-string values',
        { type: 'colormap', defaultColor: '#ffffff', colors: { id1: 123 } },
      ],
      ['null', null],
      ['string primitive', 'string'],
      ['number primitive', 123],
      ['boolean primitive', true],
    ])('rejects %s', (_, data) => {
      expect(ColorMap.isValidColorMap(data)).toBe(false)
    })
  })

  describe('get and getDefault', () => {
    test('get returns null for node not in map', () => {
      const cm = ColorMap.empty()
      expect(cm.get(publicationBundle)).toBeNull()
    })

    test('get returns color for node in map', () => {
      const colors = new Map([['publication', '#ff0000']])
      const cm = new ColorMap('#ffffff', colors)
      expect(cm.get(publicationBundle)).toBe('#ff0000')
    })

    test('get returns null for node not in color map', () => {
      // Use a real node that's not in the color map
      const colors = new Map([['publication', '#ff0000']])
      const cm = new ColorMap('#ffffff', colors)
      expect(cm.get(scientificFigureBundle)).toBeNull()
    })

    test('getDefault returns defaultColor for node not in map', () => {
      const cm = ColorMap.empty('#0000ff')
      expect(cm.getDefault(publicationBundle)).toBe('#0000FF')
    })

    test('getDefault returns color for node in map', () => {
      const colors = new Map([['publication', '#ff0000']])
      const cm = new ColorMap('#ffffff', colors)
      expect(cm.getDefault(publicationBundle)).toBe('#ff0000')
    })

    test('get selects node with lowest depth', () => {
      const colors = new Map([
        ['publication', '#ff0000'],
        ['title', '#00ff00'],
      ])
      const cm = new ColorMap('#ffffff', colors)

      // publicationBundle is at depth 1, titleField is at depth 2
      expect(cm.get(titleField, publicationBundle)).toBe('#ff0000')
      expect(cm.get(publicationBundle, titleField)).toBe('#ff0000')
    })

    test('get with multiple nodes returns color from node with lower index at same depth', () => {
      // Both nodes have colors at depth 2
      // titleField has index 1, creationBundle has index 8
      // titleField should be selected because it has a lower index
      const colors = new Map([
        ['title', '#ff0000'],
        ['creation', '#00ff00'],
      ])
      const cm = new ColorMap('#ffffff', colors)

      // titleField has a lower index than creationBundle at the same depth
      expect(cm.get(creationBundle, titleField)).toBe('#ff0000')
    })

    test('get returns null when no nodes are in the color map', () => {
      const cm = ColorMap.empty()

      // Neither node is in the empty color map
      expect(cm.get(scientificFigureBundle, personBundle)).toBeNull()
    })
  })

  describe('set', () => {
    test('set adds new color', () => {
      const cm = ColorMap.empty()
      const updated = cm.set(publicationBundle, '#ff0000')

      expect(updated.getDefault(publicationBundle)).toBe('#FF0000')
      expect(cm.getDefault(publicationBundle)).toBe('#FFFFFF') // original unchanged
    })

    test('set normalizes color to hex', () => {
      const cm = ColorMap.empty()
      const updated = cm.set(publicationBundle, 'red')

      expect(updated.getDefault(publicationBundle)).toBe('#FF0000')
    })

    test('set with invalid color uses global default', () => {
      const cm = ColorMap.empty('#0000ff')
      const updated = cm.set(publicationBundle, 'not-a-color')

      expect(updated.getDefault(publicationBundle)).toBe(ColorMap.globalDefault)
    })

    test('set returns same instance if color unchanged', () => {
      const colors = new Map([['publication', '#FF0000']])
      const cm = new ColorMap('#FFFFFF', colors)
      const updated = cm.set(publicationBundle, '#FF0000')

      expect(updated).toBe(cm)
    })

    test('set removes color when setting to default', () => {
      const colors = new Map([['publication', '#ff0000']])
      const cm = new ColorMap('#ffffff', colors)
      const updated = cm.set(publicationBundle, '#ffffff')

      expect(updated.get(publicationBundle)).toBeNull()
      expect(updated.getDefault(publicationBundle)).toBe('#FFFFFF')
    })

    test('set works with different nodes from tree', () => {
      const cm = ColorMap.empty()
      const updated1 = cm.set(publicationBundle, '#ff0000')
      const updated2 = updated1.set(scientificFigureBundle, '#00ff00')

      expect(updated2.get(publicationBundle)).toBe('#FF0000')
      expect(updated2.get(scientificFigureBundle)).toBe('#00FF00')
    })

    test('set does not mutate original colormap', () => {
      const colors = new Map([['publication', '#ff0000']])
      const cm = new ColorMap('#ffffff', colors)
      const updated = cm.set(publicationBundle, '#00ff00')

      expect(cm.getDefault(publicationBundle)).toBe('#ff0000')
      expect(updated.getDefault(publicationBundle)).toBe('#00FF00')
    })

    test('set updates existing color', () => {
      const colors = new Map([['publication', '#ff0000']])
      const cm = new ColorMap('#ffffff', colors)
      const updated = cm.set(publicationBundle, '#00ff00')

      expect(updated.getDefault(publicationBundle)).toBe('#00FF00')
    })
  })

  describe('generate', () => {
    test('generates colormap from sample tree', () => {
      const cm = ColorMap.generate(sampleTree, {
        bundle: '#ff0000',
        field: '#00ff00',
      })

      expect(cm.defaultColor).toBe('#FFFFFF')

      // Check that bundles get the bundle color
      expect(cm.get(publicationBundle)).toBe('#ff0000')
      expect(cm.get(scientificFigureBundle)).toBe('#ff0000')

      // Check that fields get the field color
      expect(cm.get(titleField)).toBe('#00ff00')
    })

    test('generates empty colormap for tree with no valid ids', () => {
      // Create a tree with nodes that don't have paths
      const pb = new Pathbuilder([], [])
      const tree = PathTree.fromPathbuilder(pb)

      const cm = ColorMap.generate(tree, {
        bundle: '#ff0000',
        field: '#00ff00',
      })

      expect(cm.toJSON().colors).toEqual({})
    })

    test('generates colormap with all nodes from sample tree', () => {
      const cm = ColorMap.generate(sampleTree, {
        bundle: '#aabbcc',
        field: '#ddeeff',
      })

      const json = cm.toJSON()

      // Verify some known bundles have the bundle color
      expect(json.colors.publication).toBe('#aabbcc')
      expect(json.colors.scientific_figure).toBe('#aabbcc')

      // Verify some known fields have the field color
      expect(json.colors.title).toBe('#ddeeff')
      expect(json.colors.date_of_writing).toBe('#ddeeff')
    })
  })

  describe('globalDefault', () => {
    test('globalDefault is white', () => {
      expect(ColorMap.globalDefault).toBe('#ffffff')
    })
  })

  describe('immutability', () => {
    test('set returns new instance', () => {
      const cm = ColorMap.empty()
      const updated = cm.set(publicationBundle, '#ff0000')

      expect(updated).not.toBe(cm)
    })

    test('original colormap unchanged after set', () => {
      const colors = new Map([
        ['publication', '#ff0000'],
        ['title', '#00ff00'],
      ])
      const cm = new ColorMap('#ffffff', colors)

      const updated = cm.set(scientificFigureBundle, '#0000ff')

      expect(cm.toJSON().colors).toEqual({
        publication: '#ff0000',
        title: '#00ff00',
      })
      expect(updated.toJSON().colors).toEqual({
        publication: '#ff0000',
        title: '#00ff00',
        scientific_figure: '#0000FF',
      })
    })
  })
})
