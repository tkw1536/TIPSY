import { describe, expect, test } from 'vitest'
import BundleGraphBuilder, { type BundleOptions } from './bundle'
import { PathTree, type PathTreeNode } from '../../pathbuilder/pathtree'
import {
  Path,
  Pathbuilder,
  type PathParams,
} from '../../pathbuilder/pathbuilder'
import NodeSelection from '../../pathbuilder/annotations/selection'
import ColorMap from '../../pathbuilder/annotations/colormap'
import { NamespaceMap } from '../../pathbuilder/namespace'
import { readFixtureJSON } from '../../utils/test/fixture'

const sampleJSON = await readFixtureJSON<PathParams[]>(
  'pathbuilder',
  'sample.json',
)
const samplePB = new Pathbuilder(
  sampleJSON.map(p => new Path(p)),
  sampleJSON.map(_ => null),
)
const [sampleTree] = PathTree.fromPathbuilder(samplePB)

function mustGetNode(id: string): PathTreeNode {
  const node = sampleTree.find(id)
  if (node === null) throw new Error(`${id} not found`)
  return node
}

// Get real nodes from the sample tree
const publicationBundle = mustGetNode('publication')
const titleField = mustGetNode('title')

describe(BundleGraphBuilder, () => {
  describe('complex graph structures', () => {
    test('builds graph with multiple top-level bundles', () => {
      const selection = NodeSelection.these(['publication', 'person'])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.toJSON()).toMatchSnapshot()
    })

    test('builds graph with mixed selection of bundles and fields', () => {
      const selection = NodeSelection.these([
        'publication',
        'title',
        'creation',
        'date_of_writing',
      ])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.toJSON()).toMatchSnapshot()
    })

    test('builds graph with deeply nested structure', () => {
      const selection = NodeSelection.these([
        'publication',
        'scientific_publication',
        'figure_image',
      ])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.toJSON()).toMatchSnapshot()
    })

    test('handles selection with gaps in hierarchy', () => {
      const selection = NodeSelection.these(['publication', 'figure_image'])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.toJSON()).toMatchSnapshot()
    })

    test('handles field without parent bundle selected', () => {
      const selection = NodeSelection.these(['title'])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.toJSON()).toMatchSnapshot()
    })

    test('build is idempotent', () => {
      const selection = NodeSelection.all()
      const builder = new BundleGraphBuilder(sampleTree, selection)

      const graph1 = builder.build()
      const graph2 = builder.build()

      expect(graph1).toBe(graph2)
    })
  })

  describe('graph build edge cases', () => {
    test('handles empty tree', () => {
      const emptyPB = new Pathbuilder([], [])
      const [emptyTree] = PathTree.fromPathbuilder(emptyPB)
      const selection = NodeSelection.all()

      const builder = new BundleGraphBuilder(emptyTree, selection)
      const graph = builder.build()

      expect(graph.toJSON()).toMatchSnapshot()
    })

    test('selection with defaultValue true excludes specific nodes', () => {
      const selection = NodeSelection.all().toggle(publicationBundle)
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.toJSON()).toMatchSnapshot()
    })
  })
})

describe('render methods', () => {
  test('bundle render method produces correct element', () => {
    const selection = NodeSelection.these(['publication'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const label = graph.getNodeLabel('publication')
    if (label?.type !== 'bundle') {
      throw new Error('Expected bundle label')
    }

    const options: BundleOptions = {
      ns: NamespaceMap.empty(),
      cm: ColorMap.empty('#ffffff'),
    }

    const element = label.render('test-id', options)
    expect(element).toMatchSnapshot()
  })

  test('field render method produces correct element', () => {
    const selection = NodeSelection.these(['publication', 'title'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const label = graph.getNodeLabel('title')
    if (label?.type !== 'field') {
      throw new Error('Expected field label')
    }

    const options: BundleOptions = {
      ns: NamespaceMap.empty(),
      cm: ColorMap.empty('#ffffff'),
    }

    const element = label.render('test-id', options)
    expect(element).toMatchSnapshot()
  })

  test('bundle render method uses color from colormap', () => {
    const selection = NodeSelection.these(['publication'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const label = graph.getNodeLabel('publication')
    if (label?.type !== 'bundle') {
      throw new Error('Expected bundle label')
    }

    const cm = ColorMap.empty('#ffffff').set(publicationBundle, '#ff0000')
    const options: BundleOptions = {
      ns: NamespaceMap.empty(),
      cm,
    }

    const element = label.render('test-id', options)
    expect(element.color).toBe('#FF0000')
  })

  test('field render method uses color from colormap', () => {
    const selection = NodeSelection.these(['publication', 'title'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const label = graph.getNodeLabel('title')
    if (label?.type !== 'field') {
      throw new Error('Expected field label')
    }

    const cm = ColorMap.empty('#ffffff').set(titleField, '#00ff00')
    const options: BundleOptions = {
      ns: NamespaceMap.empty(),
      cm,
    }

    const element = label.render('test-id', options)
    expect(element.color).toBe('#00FF00')
  })

  test('child_bundle edge render method produces correct element', () => {
    const selection = NodeSelection.these(['publication', 'creation'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const edgeLabel = graph.getEdgeLabel('publication', 'creation')
    if (edgeLabel?.type !== 'child_bundle') {
      throw new Error('Expected child_bundle edge label')
    }

    const options: BundleOptions = {
      ns: NamespaceMap.empty(),
      cm: ColorMap.empty('#ffffff'),
    }

    const element = edgeLabel.render('test-edge-id', options)
    expect(element).toMatchSnapshot()
  })

  test('field edge render method produces correct element', () => {
    const selection = NodeSelection.these(['publication', 'title'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const edgeLabel = graph.getEdgeLabel('publication', 'title')
    if (edgeLabel?.type !== 'field') {
      throw new Error('Expected field edge label')
    }

    const options: BundleOptions = {
      ns: NamespaceMap.empty(),
      cm: ColorMap.empty('#ffffff'),
    }

    const element = edgeLabel.render('test-edge-id', options)
    expect(element).toMatchSnapshot()
  })
})
