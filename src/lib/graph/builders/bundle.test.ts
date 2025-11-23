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
const sampleTree = PathTree.fromPathbuilder(samplePB)

function mustGetNode(id: string): PathTreeNode {
  const node = sampleTree.find(id)
  if (node === null) throw new Error(`${id} not found`)
  return node
}

// Get real nodes from the sample tree
const publicationBundle = mustGetNode('publication')
const titleField = mustGetNode('title')

describe(BundleGraphBuilder, () => {
  describe('constructor and build', () => {
    test('builds empty graph with empty selection', () => {
      const selection = NodeSelection.none()
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.getNodes()).toHaveLength(0)
      expect(graph.getEdges()).toHaveLength(0)
      expect(graph.definitelyAcyclic).toBe(true)
    })

    test('builds graph with all nodes selected', () => {
      const selection = NodeSelection.all()
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      const nodes = graph.getNodes()
      expect(nodes.length).toBe(11)
      expect(graph.definitelyAcyclic).toBe(true)
    })

    test('build can be called multiple times', () => {
      const selection = NodeSelection.all()
      const builder = new BundleGraphBuilder(sampleTree, selection)

      const graph1 = builder.build()
      const graph2 = builder.build()

      expect(graph1).toBe(graph2)
    })
  })

  describe('node creation', () => {
    test('creates node for selected bundle', () => {
      const selection = NodeSelection.these(['publication'])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.hasNode('publication')).toBe(true)

      const label = graph.getNodeLabel('publication')
      expect(label).not.toBeNull()
      if (label === null) return

      expect(label.type).toBe('bundle')
      if (label.type !== 'bundle') return

      expect(label.bundle.path.id).toBe('publication')
      expect(label.level).toBe(0)
    })

    test('creates node for selected field', () => {
      const selection = NodeSelection.these(['publication', 'title'])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.hasNode('title')).toBe(true)
      const label = graph.getNodeLabel('title')
      expect(label).not.toBeNull()
      if (label === null) return

      expect(label.type).toBe('field')
      if (label.type !== 'field') return

      expect(label.field.path.id).toBe('title')
      expect(label.level).toBe(1)
    })

    test('does not create node for unselected bundle', () => {
      const selection = NodeSelection.these(['title'])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.hasNode('publication')).toBe(false)
    })

    test('does not create node for unselected field', () => {
      const selection = NodeSelection.these(['publication'])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      expect(graph.hasNode('title')).toBe(false)
    })

    test('creates nodes at correct levels for nested bundles', () => {
      const selection = NodeSelection.these([
        'publication',
        'creation',
        'scientific_publication',
      ])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      const pubLabel = graph.getNodeLabel('publication')
      expect(pubLabel).not.toBeNull()
      if (pubLabel === null) return
      expect(pubLabel.type).toBe('bundle')
      expect(pubLabel.level).toBe(0)

      const creationLabel = graph.getNodeLabel('creation')
      expect(creationLabel).not.toBeNull()
      if (creationLabel === null) return
      expect(creationLabel.type).toBe('bundle')
      expect(creationLabel.level).toBe(2)

      const sciPubLabel = graph.getNodeLabel('scientific_publication')
      expect(sciPubLabel).not.toBeNull()
      if (sciPubLabel === null) return
      expect(sciPubLabel.type).toBe('bundle')
      expect(sciPubLabel.level).toBe(2)
    })

    test('creates field nodes at correct levels', () => {
      const selection = NodeSelection.these([
        'publication',
        'title',
        'creation',
        'date_of_writing',
      ])
      const builder = new BundleGraphBuilder(sampleTree, selection)
      const graph = builder.build()

      const titleLabel = graph.getNodeLabel('title')
      expect(titleLabel).not.toBeNull()
      if (titleLabel === null) return
      expect(titleLabel.type).toBe('field')
      expect(titleLabel.level).toBe(1)

      const dateLabel = graph.getNodeLabel('date_of_writing')
      expect(dateLabel).not.toBeNull()
      if (dateLabel === null) return
      expect(dateLabel.type).toBe('field')
      expect(dateLabel.level).toBe(3)
    })
  })
})

describe('edge creation', () => {
  test('creates edge from bundle to child bundle', () => {
    const selection = NodeSelection.these(['publication', 'creation'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasEdge('publication', 'creation')).toBe(true)
    const edgeLabel = graph.getEdgeLabel('publication', 'creation')
    expect(edgeLabel).not.toBeNull()
    expect(edgeLabel?.type).toBe('child_bundle')
  })

  test('creates edge from bundle to field', () => {
    const selection = NodeSelection.these(['publication', 'title'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasEdge('publication', 'title')).toBe(true)
    const edgeLabel = graph.getEdgeLabel('publication', 'title')
    expect(edgeLabel).not.toBeNull()
    expect(edgeLabel?.type).toBe('field')
  })

  test('does not create edge when parent bundle not selected', () => {
    const selection = NodeSelection.these(['title'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasEdge('publication', 'title')).toBe(false)
  })

  test('does not create edge when child bundle not selected', () => {
    const selection = NodeSelection.these(['publication'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasEdge('publication', 'creation')).toBe(false)
  })

  test('does not create edge when child field not selected', () => {
    const selection = NodeSelection.these(['publication'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasEdge('publication', 'title')).toBe(false)
  })

  test('creates multiple edges from bundle to multiple children', () => {
    const selection = NodeSelection.these(['publication', 'title', 'creation'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasEdge('publication', 'title')).toBe(true)
    expect(graph.hasEdge('publication', 'creation')).toBe(true)
  })

  test('creates edges in nested structure', () => {
    const selection = NodeSelection.these([
      'publication',
      'creation',
      'scientific_publication',
    ])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasEdge('publication', 'creation')).toBe(true)
    expect(graph.hasEdge('publication', 'scientific_publication')).toBe(true)
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
    expect(element.id).toBe('test-id')
    expect(element.label).toBe(publicationBundle.path?.name)
    expect(element.tooltip).toBe('publication')
    expect(element.color).toBeNull()
    expect(element.shape).toBe('ellipse')
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
    expect(element.id).toBe('test-id')
    expect(element.label).toBe(titleField.path?.name)
    expect(element.tooltip).toBe('title')
    expect(element.color).toBeNull()
    expect(element.shape).toBe('ellipse')
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
    expect(element.id).toBe('test-edge-id')
    expect(element.label).toBeNull()
    expect(element.tooltip).toBeNull()
    expect(element.color).toBeNull()
    expect(element.shape).toBeNull()
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
    expect(element.id).toBe('test-edge-id')
    expect(element.label).toBeNull()
    expect(element.tooltip).toBeNull()
    expect(element.color).toBeNull()
    expect(element.shape).toBeNull()
  })
})

describe('complex graph structures', () => {
  test('builds graph with multiple top-level bundles', () => {
    const selection = NodeSelection.these(['publication', 'person'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasNode('publication')).toBe(true)
    expect(graph.hasNode('person')).toBe(true)
    expect(graph.hasEdge('publication', 'person')).toBe(false)
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

    const nodes = graph.getNodes()
    const bundles = nodes.filter(([, label]) => label.type === 'bundle')
    const fields = nodes.filter(([, label]) => label.type === 'field')

    expect(bundles).toHaveLength(2)
    expect(fields).toHaveLength(2)
  })

  test('builds graph with deeply nested structure', () => {
    const selection = NodeSelection.these([
      'publication',
      'scientific_publication',
      'figure_image',
    ])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasNode('publication')).toBe(true)
    expect(graph.hasNode('scientific_publication')).toBe(true)
    expect(graph.hasNode('figure_image')).toBe(true)

    expect(graph.hasEdge('publication', 'scientific_publication')).toBe(true)
    expect(graph.hasEdge('scientific_publication', 'figure_image')).toBe(true)
  })

  test('handles selection with gaps in hierarchy', () => {
    // Select parent and grandchild, but not the middle child
    const selection = NodeSelection.these(['publication', 'figure_image'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasNode('publication')).toBe(true)
    expect(graph.hasNode('scientific_publication')).toBe(false)
    expect(graph.hasNode('figure_image')).toBe(true)

    // No edge should exist because scientific_publication is not selected
    expect(graph.hasEdge('publication', 'figure_image')).toBe(false)
  })

  test('handles field without parent bundle selected', () => {
    const selection = NodeSelection.these(['title'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasNode('title')).toBe(true)
    expect(graph.hasNode('publication')).toBe(false)

    const nodes = graph.getNodes()
    expect(nodes).toHaveLength(1)

    const edges = graph.getEdges()
    expect(edges).toHaveLength(0)
  })
})

describe('graph properties', () => {
  test('graph is marked as definitely acyclic', () => {
    const selection = NodeSelection.all()
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.definitelyAcyclic).toBe(true)
  })

  test('empty graph is marked as definitely acyclic', () => {
    const selection = NodeSelection.none()
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.definitelyAcyclic).toBe(true)
  })
})

describe('edge cases', () => {
  test('handles empty tree', () => {
    const emptyPB = new Pathbuilder([], [])
    const emptyTree = PathTree.fromPathbuilder(emptyPB)
    const selection = NodeSelection.all()

    const builder = new BundleGraphBuilder(emptyTree, selection)
    const graph = builder.build()

    expect(graph.getNodes()).toHaveLength(0)
    expect(graph.getEdges()).toHaveLength(0)
  })

  test('selection with defaultValue true excludes specific nodes', () => {
    const selection = NodeSelection.all().toggle(publicationBundle)
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    expect(graph.hasNode('publication')).toBe(false)
    expect(graph.hasNode('title')).toBe(true)
    expect(graph.hasNode('scientific_figure')).toBe(true)
  })
})

describe('node and edge counts', () => {
  test('counts nodes correctly with selective selection', () => {
    const selection = NodeSelection.these([
      'publication',
      'title',
      'scientific_figure',
    ])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const nodes = graph.getNodes()
    expect(nodes).toHaveLength(3)
  })

  test('counts edges correctly with selective selection', () => {
    const selection = NodeSelection.these(['publication', 'title', 'creation'])
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const edges = graph.getEdges()
    expect(edges).toHaveLength(2)
  })

  test('all selected nodes produce correct counts', () => {
    const selection = NodeSelection.all()
    const builder = new BundleGraphBuilder(sampleTree, selection)
    const graph = builder.build()

    const nodes = graph.getNodes()
    const edges = graph.getEdges()

    expect(nodes.length).toBe(11)
    expect(edges.length).toBe(8)
    expect(edges.length).toBeLessThan(nodes.length * nodes.length)
  })
})
