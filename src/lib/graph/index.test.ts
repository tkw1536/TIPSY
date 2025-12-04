import { describe, expect, test, vi } from 'vitest'
import Graph from './index'

describe(Graph, () => {
  describe('node operations', () => {
    test('addNode adds a node and returns its id', () => {
      const graph = new Graph<string, never>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      expect(typeof id1).toBe('number')
      expect(typeof id2).toBe('number')
      expect(id1).not.toBe(id2)
    })

    test('addNode with string id creates a consistent id', () => {
      const graph = new Graph<string, never>(false)

      const id1 = graph.addNode('node1', 'my-id')
      const id2 = graph.addNode('node2', 'my-id')

      expect(id1).toBe(id2)
      expect(graph.getNodeLabel(id1)).toBe('node2')
    })

    test('hasNode returns true for existing nodes', () => {
      const graph = new Graph<string, never>(false)

      const id = graph.addNode('node1')

      expect(graph.hasNode(id)).toBe(true)
      expect(graph.hasNode(999999)).toBe(false)
    })

    test('hasNode works with string ids', () => {
      const graph = new Graph<string, never>(false)

      graph.addNode('node1', 'my-id')

      expect(graph.hasNode('my-id')).toBe(true)
      expect(graph.hasNode('other-id')).toBe(false)
    })

    test('getNode returns node id or null', () => {
      const graph = new Graph<string, never>(false)

      const id = graph.addNode('node1', 'my-id')

      expect(graph.getNode(id)).toBe(id)
      expect(graph.getNode('my-id')).toBe(id)
      expect(graph.getNode(999999)).toBeNull()
      expect(graph.getNode('other-id')).toBeNull()
    })

    test('getNodeLabel returns the label or null', () => {
      const graph = new Graph<string, never>(false)

      const id = graph.addNode('node1', 'my-id')

      expect(graph.getNodeLabel(id)).toBe('node1')
      expect(graph.getNodeLabel('my-id')).toBe('node1')
      expect(graph.getNodeLabel(999999)).toBeNull()
      expect(graph.getNodeLabel('other-id')).toBeNull()
    })

    test('getNodeString returns the string id or null', () => {
      const graph = new Graph<string, never>(false)

      const id = graph.addNode('node1', 'my-id')

      expect(graph.getNodeString(id)).toBe('my-id')
      expect(graph.getNodeString(999999)).toBeNull()
    })

    test('getNodes returns all nodes', () => {
      const graph = new Graph<string, never>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')

      const nodes = graph.getNodes()

      expect(nodes).toHaveLength(3)
      expect(nodes).toContainEqual([id1, 'node1'])
      expect(nodes).toContainEqual([id2, 'node2'])
      expect(nodes).toContainEqual([id3, 'node3'])
    })

    test('deleteNode removes a node', () => {
      const graph = new Graph<string, never>(false)

      const id = graph.addNode('node1', 'my-id')

      expect(graph.hasNode(id)).toBe(true)

      graph.deleteNode(id)

      expect(graph.hasNode(id)).toBe(false)
      expect(graph.hasNode('my-id')).toBe(false)
      expect(graph.getNodeLabel(id)).toBeNull()
    })

    test('deleteNode works with string ids', () => {
      const graph = new Graph<string, never>(false)

      graph.addNode('node1', 'my-id')

      expect(graph.hasNode('my-id')).toBe(true)

      graph.deleteNode('my-id')

      expect(graph.hasNode('my-id')).toBe(false)
    })

    test('addOrUpdateNode creates a new node if it does not exist', () => {
      const graph = new Graph<string, never>(false)

      const id = graph.addOrUpdateNode('my-id', () => 'new-node')

      expect(graph.hasNode(id)).toBe(true)
      expect(graph.getNodeLabel(id)).toBe('new-node')
    })

    test('addOrUpdateNode updates an existing node with string id', () => {
      const graph = new Graph<string, never>(false)

      const id1 = graph.addNode('node1', 'my-id')
      const id2 = graph.addOrUpdateNode('my-id', old => {
        expect(old).toBe('node1')
        return 'updated-node'
      })

      expect(id1).toBe(id2)
      expect(graph.getNodeLabel(id2)).toBe('updated-node')
    })

    test('addOrUpdateNode updates an existing node with numeric id', () => {
      const graph = new Graph<string, never>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addOrUpdateNode(id1, old => {
        expect(old).toBe('node1')
        return 'updated-node'
      })

      expect(id1).toBe(id2)
      expect(graph.getNodeLabel(id2)).toBe('updated-node')
    })

    test('addOrUpdateNode with numeric id that does not exist creates a new node', () => {
      const graph = new Graph<string, never>(false)

      const id = graph.addOrUpdateNode(999999, () => 'new-node')

      expect(graph.hasNode(id)).toBe(true)
      expect(graph.getNodeLabel(id)).toBe('new-node')
    })
  })

  describe('edge operations', () => {
    test('addEdge adds an edge between two nodes', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      const result = graph.addEdge(id1, id2, 'edge-label')

      expect(result).toBe(true)
      expect(graph.hasEdge(id1, id2)).toBe(true)
    })

    test('addEdge works with string ids', () => {
      const graph = new Graph<string, string>(false)

      graph.addNode('node1', 'id1')
      graph.addNode('node2', 'id2')

      const result = graph.addEdge('id1', 'id2', 'edge-label')

      expect(result).toBe(true)
      expect(graph.hasEdge('id1', 'id2')).toBe(true)
    })

    test('addEdge returns false for non-existent from node', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const graph = new Graph<string, string>(false)

      const id2 = graph.addNode('node2')

      const result = graph.addEdge(999999, id2, 'edge-label')
      expect(result).toBe(false)
      expect(warnSpy).toHaveBeenCalledWith('unknown from', 999999)

      warnSpy.mockRestore()
    })

    test('addEdge returns false for non-existent to node', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')

      const result = graph.addEdge(id1, 999999, 'edge-label')

      expect(result).toBe(false)
      expect(warnSpy).toHaveBeenCalledWith('unknown to', 999999)

      warnSpy.mockRestore()
    })

    test('hasEdge returns false for non-existent edges', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      expect(graph.hasEdge(id1, id2)).toBe(false)
    })

    test('hasEdge returns false for non-existent nodes', () => {
      const graph = new Graph<string, string>(false)

      expect(graph.hasEdge(999999, 888888)).toBe(false)
    })

    test('getEdgeLabel returns the edge label', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      graph.addEdge(id1, id2, 'edge-label')

      expect(graph.getEdgeLabel(id1, id2)).toBe('edge-label')
    })

    test('getEdgeLabel returns null for non-existent edges', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      expect(graph.getEdgeLabel(id1, id2)).toBeNull()
    })

    test('getEdgeLabel returns null for non-existent nodes', () => {
      const graph = new Graph<string, string>(false)

      expect(graph.getEdgeLabel(999999, 888888)).toBeNull()
    })

    test('getEdges returns all edges', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')

      graph.addEdge(id1, id2, 'edge1')
      graph.addEdge(id2, id3, 'edge2')
      graph.addEdge(id1, id3, 'edge3')

      const edges = graph.getEdges()

      expect(edges).toHaveLength(3)

      const edgesByLabel = edges.map(([, from, to, label]) => ({
        from,
        to,
        label,
      }))
      expect(edgesByLabel).toContainEqual({
        from: id1,
        to: id2,
        label: 'edge1',
      })
      expect(edgesByLabel).toContainEqual({
        from: id2,
        to: id3,
        label: 'edge2',
      })
      expect(edgesByLabel).toContainEqual({
        from: id1,
        to: id3,
        label: 'edge3',
      })
    })

    test('getEdges returns unique edge ids', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')

      graph.addEdge(id1, id2, 'edge1')
      graph.addEdge(id2, id3, 'edge2')
      graph.addEdge(id1, id3, 'edge3')

      const edges = graph.getEdges()
      const edgeIds = edges.map(([id]) => id)

      expect(new Set(edgeIds).size).toBe(3)
    })

    test('deleteEdge removes an edge', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      graph.addEdge(id1, id2, 'edge-label')

      expect(graph.hasEdge(id1, id2)).toBe(true)

      graph.deleteEdge(id1, id2)

      expect(graph.hasEdge(id1, id2)).toBe(false)
    })

    test('deleteEdge works with string ids', () => {
      const graph = new Graph<string, string>(false)

      graph.addNode('node1', 'id1')
      graph.addNode('node2', 'id2')

      graph.addEdge('id1', 'id2', 'edge-label')

      expect(graph.hasEdge('id1', 'id2')).toBe(true)

      graph.deleteEdge('id1', 'id2')

      expect(graph.hasEdge('id1', 'id2')).toBe(false)
    })

    test('deleteEdge does nothing for non-existent edges', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      graph.deleteEdge(id1, id2)

      expect(graph.hasEdge(id1, id2)).toBe(false)
    })

    test('deleteEdge does nothing for non-existent nodes', () => {
      const graph = new Graph<string, string>(false)

      graph.deleteEdge(999999, 888888)
    })

    test('addEdge overwrites existing edge label', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      graph.addEdge(id1, id2, 'label1')
      graph.addEdge(id1, id2, 'label2')

      expect(graph.getEdgeLabel(id1, id2)).toBe('label2')
      expect(graph.getEdges()).toHaveLength(1)
    })
  })

  describe('node deletion cascades to edges', () => {
    test('deleteNode removes all edges from the node', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')

      graph.addEdge(id1, id2, 'edge1')
      graph.addEdge(id1, id3, 'edge2')

      graph.deleteNode(id1)

      expect(graph.hasEdge(id1, id2)).toBe(false)
      expect(graph.hasEdge(id1, id3)).toBe(false)
      expect(graph.getEdges()).toHaveLength(0)
    })

    test('deleteNode removes all edges to the node', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')

      graph.addEdge(id1, id2, 'edge1')
      graph.addEdge(id3, id2, 'edge2')

      graph.deleteNode(id2)

      expect(graph.hasEdge(id1, id2)).toBe(false)
      expect(graph.hasEdge(id3, id2)).toBe(false)
      expect(graph.getEdges()).toHaveLength(0)
    })

    test('deleteNode preserves unrelated edges', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')

      graph.addEdge(id1, id2, 'edge1')
      graph.addEdge(id2, id3, 'edge2')

      graph.deleteNode(id1)

      expect(graph.hasEdge(id2, id3)).toBe(true)
      expect(graph.getEdges()).toHaveLength(1)
    })
  })

  describe('definitelyAcyclic property', () => {
    test('constructor sets definitelyAcyclic to false', () => {
      const graph = new Graph<string, string>(false)

      expect(graph.definitelyAcyclic).toBe(false)
    })

    test('constructor sets definitelyAcyclic to true', () => {
      const graph = new Graph<string, string>(true)

      expect(graph.definitelyAcyclic).toBe(true)
    })
  })

  describe('complex scenarios', () => {
    test('multiple edges from the same node', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')
      const id4 = graph.addNode('node4')

      graph.addEdge(id1, id2, 'edge1')
      graph.addEdge(id1, id3, 'edge2')
      graph.addEdge(id1, id4, 'edge3')

      expect(graph.hasEdge(id1, id2)).toBe(true)
      expect(graph.hasEdge(id1, id3)).toBe(true)
      expect(graph.hasEdge(id1, id4)).toBe(true)
      expect(graph.getEdges()).toHaveLength(3)
    })

    test('multiple edges to the same node', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')
      const id3 = graph.addNode('node3')
      const id4 = graph.addNode('node4')

      graph.addEdge(id1, id4, 'edge1')
      graph.addEdge(id2, id4, 'edge2')
      graph.addEdge(id3, id4, 'edge3')

      expect(graph.hasEdge(id1, id4)).toBe(true)
      expect(graph.hasEdge(id2, id4)).toBe(true)
      expect(graph.hasEdge(id3, id4)).toBe(true)
      expect(graph.getEdges()).toHaveLength(3)
    })

    test('self-loop edge', () => {
      const graph = new Graph<string, string>(false)

      const id = graph.addNode('node1')

      graph.addEdge(id, id, 'self-loop')

      expect(graph.hasEdge(id, id)).toBe(true)
      expect(graph.getEdgeLabel(id, id)).toBe('self-loop')
    })

    test('bidirectional edges', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      graph.addEdge(id1, id2, 'forward')
      graph.addEdge(id2, id1, 'backward')

      expect(graph.hasEdge(id1, id2)).toBe(true)
      expect(graph.hasEdge(id2, id1)).toBe(true)
      expect(graph.getEdgeLabel(id1, id2)).toBe('forward')
      expect(graph.getEdgeLabel(id2, id1)).toBe('backward')
      expect(graph.getEdges()).toHaveLength(2)
    })

    test('empty graph operations', () => {
      const graph = new Graph<string, string>(false)

      expect(graph.getNodes()).toHaveLength(0)
      expect(graph.getEdges()).toHaveLength(0)
      expect(graph.hasNode(1)).toBe(false)
      expect(graph.hasEdge(1, 2)).toBe(false)
      expect(graph.getNodeLabel(1)).toBeNull()
      expect(graph.getEdgeLabel(1, 2)).toBeNull()
    })

    test('complex graph with mixed operations', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('A', 'node-a')
      const id2 = graph.addNode('B', 'node-b')
      const id3 = graph.addNode('C', 'node-c')

      graph.addEdge(id1, id2, 'A->B')
      graph.addEdge(id2, id3, 'B->C')
      graph.addEdge(id1, id3, 'A->C')

      expect(graph.getNodes()).toHaveLength(3)
      expect(graph.getEdges()).toHaveLength(3)

      graph.deleteEdge('node-a', 'node-b')

      expect(graph.getEdges()).toHaveLength(2)
      expect(graph.hasEdge('node-a', 'node-b')).toBe(false)
      expect(graph.hasEdge('node-b', 'node-c')).toBe(true)
      expect(graph.hasEdge('node-a', 'node-c')).toBe(true)

      graph.addOrUpdateNode('node-b', () => 'B-updated')

      expect(graph.getNodeLabel('node-b')).toBe('B-updated')

      graph.deleteNode(id3)

      expect(graph.getNodes()).toHaveLength(2)
      expect(graph.getEdges()).toHaveLength(0)
    })
  })

  describe('node label types', () => {
    test('works with object labels', () => {
      interface NodeData {
        name: string
        value: number
      }

      const graph = new Graph<NodeData, string>(false)

      const id = graph.addNode({ name: 'test', value: 42 })

      const label = graph.getNodeLabel(id)
      expect(label).toEqual({ name: 'test', value: 42 })
    })

    test('works with number labels', () => {
      const graph = new Graph<number, string>(false)

      const id1 = graph.addNode(100)
      const id2 = graph.addNode(200)

      expect(graph.getNodeLabel(id1)).toBe(100)
      expect(graph.getNodeLabel(id2)).toBe(200)
    })
  })

  describe('edge label types', () => {
    test('works with object labels', () => {
      interface EdgeData {
        weight: number
        type: string
      }

      const graph = new Graph<string, EdgeData>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      graph.addEdge(id1, id2, { weight: 10, type: 'strong' })

      const label = graph.getEdgeLabel(id1, id2)
      expect(label).toEqual({ weight: 10, type: 'strong' })
    })

    test('works with number labels', () => {
      const graph = new Graph<string, number>(false)

      const id1 = graph.addNode('node1')
      const id2 = graph.addNode('node2')

      graph.addEdge(id1, id2, 42)

      expect(graph.getEdgeLabel(id1, id2)).toBe(42)
    })
  })

  describe('toJSON', () => {
    test('empty graph', () => {
      const graph = new Graph<string, string>(false)

      const json = graph.toJSON()

      expect(json).toMatchSnapshot()
    })

    test('graph with nodes only', () => {
      const graph = new Graph<string, string>(false)

      graph.addNode('node1', 'id1')
      graph.addNode('node2', 'id2')
      graph.addNode('node3', 'id3')

      const json = graph.toJSON()

      expect(json).toMatchSnapshot()
    })

    test('graph with nodes and edges', () => {
      const graph = new Graph<string, string>(false)

      const id1 = graph.addNode('A', 'node-a')
      const id2 = graph.addNode('B', 'node-b')
      const id3 = graph.addNode('C', 'node-c')

      graph.addEdge(id1, id2, 'A->B')
      graph.addEdge(id2, id3, 'B->C')
      graph.addEdge(id1, id3, 'A->C')

      const json = graph.toJSON()

      expect(json).toMatchSnapshot()
    })

    test('complex graph with object labels', () => {
      interface NodeData {
        name: string
        value: number
      }

      interface EdgeData {
        weight: number
        type: string
      }

      const graph = new Graph<NodeData, EdgeData>(false)

      const id1 = graph.addNode({ name: 'alpha', value: 1 }, 'node1')
      const id2 = graph.addNode({ name: 'beta', value: 2 }, 'node2')
      const id3 = graph.addNode({ name: 'gamma', value: 3 }, 'node3')

      graph.addEdge(id1, id2, { weight: 5, type: 'strong' })
      graph.addEdge(id2, id3, { weight: 3, type: 'weak' })
      graph.addEdge(id1, id1, { weight: 1, type: 'self' })

      const json = graph.toJSON()

      expect(json).toMatchSnapshot()
    })
  })
})
