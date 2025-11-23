import { describe, expect, test } from 'vitest'
import RDFGraphBuilder from './rdf'
import { graph, Literal, NamedNode, BlankNode } from 'rdflib'
import type { Store } from 'rdflib'
import { NamespaceMap } from '../../pathbuilder/namespace'

describe(RDFGraphBuilder, () => {
  const store: Store = graph()

  const exNS = 'http://example.org/'
  const foafNS = 'http://xmlns.com/foaf/0.1/'

  const alice = new NamedNode(exNS + 'alice')
  const bob = new NamedNode(exNS + 'bob')
  const charlie = new NamedNode(exNS + 'charlie')

  const name = new NamedNode(foafNS + 'name')
  const knows = new NamedNode(foafNS + 'knows')
  const age = new NamedNode(foafNS + 'age')

  const aliceName = new Literal('Alice')
  const bobName = new Literal('Bob')
  const aliceAge = new Literal('30')

  const blank1 = new BlankNode('b1')

  store.add(alice, name, aliceName)
  store.add(alice, knows, bob)
  store.add(bob, name, bobName)
  store.add(alice, age, aliceAge)
  store.add(bob, knows, charlie)
  store.add(blank1, name, new Literal('Anonymous'))

  const ns = NamespaceMap.empty().add('ex', exNS).add('foaf', foafNS)

  const options = { ns }

  describe('build', () => {
    test('creates a graph with correct number of nodes', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      expect(nodes.length).toBe(8)
    })

    test('creates nodes for subjects and objects', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      const bobId = g.getNode('n//' + bob.uri)

      expect(aliceId).not.toBeNull()
      expect(bobId).not.toBeNull()
    })

    test('creates edges between nodes', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      const bobId = g.getNode('n//' + bob.uri)

      expect(aliceId).not.toBeNull()
      expect(bobId).not.toBeNull()

      if (aliceId === null || bobId === null) return
      expect(g.hasEdge(aliceId, bobId)).toBe(true)
    })

    test('build is idempotent', () => {
      const builder = new RDFGraphBuilder(store)
      const g1 = builder.build()
      const g2 = builder.build()

      expect(g1).toBe(g2)
    })

    test('creates correct number of edges', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const edges = g.getEdges()
      expect(edges.length).toBe(6)
    })
  })

  describe('node rendering', () => {
    test('NamedNode renders with namespace prefix', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      expect(aliceId).not.toBeNull()
      if (aliceId === null) return

      const nodeLabel = g.getNodeLabel(aliceId)
      expect(nodeLabel).not.toBeNull()
      if (nodeLabel === null) return

      const element = nodeLabel.render('test-id', options)
      expect(element).not.toBeNull()

      expect(element.label).toBe('ex:alice')
      expect(element.tooltip).toBe(alice.uri)
      expect(element.color).toBe('green')
      expect(element.shape).toBe('ellipse')
    })

    test('Literal renders with value', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      const literalNode = nodes.find(([, label]) => {
        const element = label.render('test', options)
        return element.label === 'Alice'
      })

      expect(literalNode).toBeDefined()
      if (literalNode === undefined) return

      const [, label] = literalNode
      const element = label.render('test-id', options)

      expect(element).not.toBeNull()

      expect(element.label).toBe('Alice')
      expect(element.tooltip).toBe('Literal')
      expect(element.color).toBe('blue')
      expect(element.shape).toBe('box')
    })

    test('BlankNode renders with id', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const blankId = g.getNode('b//' + blank1.id)
      expect(blankId).not.toBeNull()
      if (blankId === null) return

      const nodeLabel = g.getNodeLabel(blankId)
      expect(nodeLabel).not.toBeNull()
      if (nodeLabel === null) return

      const element = nodeLabel.render('test-id', options)
      expect(element).not.toBeNull()

      expect(element.label).toBe(blank1.id)
      expect(element.tooltip).toBe(blank1.id)
      expect(element.color).toBe('yellow')
      expect(element.shape).toBe('ellipse')
    })
  })

  describe('edge rendering', () => {
    test('edge renders with namespace prefix and no shape', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      const bobId = g.getNode('n//' + bob.uri)

      expect(aliceId).not.toBeNull()
      expect(bobId).not.toBeNull()
      if (aliceId === null || bobId === null) return

      const edgeLabel = g.getEdgeLabel(aliceId, bobId)
      expect(edgeLabel).not.toBeNull()
      if (edgeLabel === null) return

      const element = edgeLabel.render('test-edge-id', options)
      expect(element).not.toBeNull()

      expect(element.label).toBe('foaf:knows')
      expect(element.tooltip).toBe(knows.uri)
      expect(element.color).toBe('green')
      expect(element.shape).toBeNull()
    })

    test('all edges have null shape', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const edges = g.getEdges()

      edges.forEach(([, from, to]) => {
        const edgeLabel = g.getEdgeLabel(from, to)
        expect(edgeLabel).not.toBeNull()
        if (edgeLabel === null) return

        const element = edgeLabel.render('test-id', options)
        expect(element).not.toBeNull()
        expect(element.shape).toBeNull()
      })
    })
  })

  describe('node ID generation', () => {
    test('NamedNode uses n// prefix', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      expect(aliceId).not.toBeNull()
      if (aliceId === null) return

      const stringId = g.getNodeString(aliceId)
      expect(stringId).toBe('n//' + alice.uri)
    })

    test('BlankNode uses b// prefix', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const blankId = g.getNode('b//' + blank1.id)
      expect(blankId).not.toBeNull()
      if (blankId === null) return

      const stringId = g.getNodeString(blankId)
      expect(stringId).toBe('b//' + blank1.id)
    })

    test('Literal nodes have no string ID', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      const literalNodes = nodes.filter(([id]) => {
        const stringId = g.getNodeString(id)
        return stringId === null
      })

      expect(literalNodes.length).toBe(4)
    })
  })

  describe('graph structure', () => {
    test('alice knows bob', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      const bobId = g.getNode('n//' + bob.uri)

      expect(aliceId).not.toBeNull()
      expect(bobId).not.toBeNull()
      if (aliceId === null || bobId === null) return

      expect(g.hasEdge(aliceId, bobId)).toBe(true)
    })

    test('bob knows charlie', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const bobId = g.getNode('n//' + bob.uri)
      const charlieId = g.getNode('n//' + charlie.uri)

      expect(bobId).not.toBeNull()
      expect(charlieId).not.toBeNull()

      if (bobId === null || charlieId === null) return
      expect(g.hasEdge(bobId, charlieId)).toBe(true)
    })

    test('alice has name literal', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      expect(aliceId).not.toBeNull()
      if (aliceId === null) return

      const edges = g.getEdges()
      const aliceNameEdge = edges.find(
        ([, from, to]) =>
          from === aliceId &&
          g.getNodeLabel(to)?.node.termType === 'Literal' &&
          g.getNodeLabel(to)?.node.value === 'Alice',
      )

      expect(aliceNameEdge).toBeDefined()
    })

    test('alice has two outgoing edges to literals', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      expect(aliceId).not.toBeNull()

      if (aliceId === null) return
      const edges = g.getEdges()
      const aliceLiteralEdges = edges.filter(
        ([, from, to]) =>
          from === aliceId && g.getNodeLabel(to)?.node.termType === 'Literal',
      )

      expect(aliceLiteralEdges.length).toBe(2)
    })
  })

  describe('namespace application', () => {
    test('applies namespace to NamedNode URIs', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      expect(aliceId).not.toBeNull()
      if (aliceId === null) return

      const nodeLabel = g.getNodeLabel(aliceId)
      expect(nodeLabel).not.toBeNull()
      if (nodeLabel === null) return

      const element = nodeLabel.render('test-id', options)
      expect(element).not.toBeNull()

      expect(element.label).toContain(':')
      expect(element.label).not.toContain('http://')
    })

    test('renders full URI when namespace not in map', () => {
      const emptyNs = NamespaceMap.empty()
      const emptyOptions = { ns: emptyNs }

      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const aliceId = g.getNode('n//' + alice.uri)
      expect(aliceId).not.toBeNull()
      if (aliceId === null) return

      const nodeLabel = g.getNodeLabel(aliceId)
      expect(nodeLabel).not.toBeNull()
      if (nodeLabel === null) return

      const element = nodeLabel.render('test-id', emptyOptions)
      expect(element).not.toBeNull()

      expect(element.label).toBe(alice.uri)
    })
  })

  describe('element properties', () => {
    test('all elements have non-null id', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      nodes.forEach(([, label]) => {
        const element = label.render('test-id', options)
        expect(element).not.toBeNull()

        expect(element.id).toBe('test-id')
      })
    })

    test('all elements have non-null label', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      nodes.forEach(([, label]) => {
        const element = label.render('test-id', options)
        expect(element).not.toBeNull()

        expect(element.label).not.toBeNull()
        expect(typeof element.label).toBe('string')
      })
    })

    test('all elements have non-null tooltip', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      nodes.forEach(([, label]) => {
        const element = label.render('test-id', options)
        expect(element).not.toBeNull()

        expect(element.tooltip).not.toBeNull()
        expect(typeof element.tooltip).toBe('string')
      })
    })

    test('all elements have non-null color', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      nodes.forEach(([, label]) => {
        const element = label.render('test-id', options)
        expect(element).not.toBeNull()

        expect(element.color).not.toBeNull()
        expect(typeof element.color).toBe('string')
      })
    })

    test('node elements have non-null shape', () => {
      const builder = new RDFGraphBuilder(store)
      const g = builder.build()

      const nodes = g.getNodes()
      nodes.forEach(([, label]) => {
        const element = label.render('test-id', options)
        expect(element).not.toBeNull()

        expect(element.shape).not.toBeNull()
        expect(['ellipse', 'box', 'diamond']).toContain(element.shape)
      })
    })
  })
})
