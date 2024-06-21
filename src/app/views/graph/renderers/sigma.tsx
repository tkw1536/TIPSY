import { ComponentChild, Ref, h } from 'preact'
import { assertGraphRendererClass, LibraryBasedRenderer, Size } from '.'
import Sigma from 'sigma'
import Graph from 'graphology'
import { Settings } from 'sigma/dist/declarations/src/settings'
import { BundleEdge, BundleNode } from '../../../../lib/graph/builders/bundle'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import circular from 'graphology-layout/circular'
import circlepack from 'graphology-layout/circlepack'
import { ModelEdge, ModelNode } from '../../../../lib/graph/builders/model'

abstract class SigmaRenderer<NodeLabel, EdgeLabel> extends LibraryBasedRenderer<NodeLabel, EdgeLabel, Sigma, Graph> {
  protected abstract addNode (graph: Graph, id: number, node: NodeLabel): undefined
  protected abstract addEdge (graph: Graph, from: number, to: number, edge: EdgeLabel): undefined

  static readonly rendererName = 'Sigma.js'
  static readonly supportedLayouts = ['auto', 'force2atlas', 'circular', 'circlepack']

  protected settings (): Partial<Settings> {
    return {
    }
  }

  protected beginSetup (container: HTMLElement, size: Size): Graph {
    return new Graph()
  }

  protected endSetup (graph: Graph, container: HTMLElement, size: Size): Sigma {
    switch (this.props.layout) {
      case 'auto': /* fallthrough */
      case 'force2atlas':
        circular.assign(graph, { scale: 100 })
        forceAtlas2.assign(graph, {
          iterations: 500,
          settings: forceAtlas2.inferSettings(graph)
        })
        break
      case 'circlepack':
        circlepack.assign(graph)
        break
      case 'circular': /* fallthrough */
      default:
        circular.assign(graph, { scale: 100 })
    }
    // setup an initial layout

    const settings = this.settings()
    return new Sigma(graph, container, settings)
  }

  protected resizeObject (sigma: Sigma, graph: Graph, { width, height }: Size): undefined {
    sigma.resize()
    // automatically resized ?
  }

  protected destroyObject (sigma: Sigma, graph: Graph): void {
    sigma.kill()
  }

  static readonly supportedExportFormats = []
  protected async objectToBlob (sigma: Sigma, graph: Graph, format: string): Promise<Blob> {
    return await Promise.reject(new Error('never reached'))
  }

  protected renderDiv ({ width, height }: Size, ref: Ref<HTMLDivElement>): ComponentChild {
    return <div ref={ref} style={{ width, height }} />
  }
}

@assertGraphRendererClass<BundleNode, BundleEdge>()
export class SigmaBundleRenderer extends SigmaRenderer<BundleNode, BundleEdge> {
  protected addNode (graph: Graph, id: number, node: BundleNode): undefined {
    if (node.type === 'bundle') {
      graph.addNode(id, { label: 'Bundle\n' + node.bundle.path().name, color: 'blue', size: 20 })
      return
    }
    if (node.type === 'field') {
      graph.addNode(id, { label: node.field.path().name, color: 'orange', size: 10 })
      return
    }
    throw new Error('never reached')
  }

  protected addEdge (graph: Graph, from: number, to: number, edge: BundleEdge): undefined {
    if (edge.type === 'child_bundle') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    if (edge.type === 'field') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    throw new Error('never reached')
  }
}

@assertGraphRendererClass<ModelNode, ModelEdge>()
export class SigmaModelRenderer extends SigmaRenderer<ModelNode, ModelEdge> {
  protected addNode (graph: Graph, id: number, node: ModelNode): undefined {
    const { ns } = this.props
    if (node.type === 'field') {
      graph.addNode(id, {
        label: node.field.path().name,

        color: 'orange',
        size: 10
      })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      graph.addNode(id, {
        label: ns.apply(node.clz),

        color: 'blue',
        size: 10
      })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      const names = Array.from(node.bundles).map((bundle) => 'Bundle ' + bundle.path().name).join('\n\n')
      const label = ns.apply(node.clz) + '\n\n' + names

      graph.addNode(id, {
        label,

        color: 'blue',
        size: 10
      })
    }
  }

  protected addEdge (graph: Graph, from: number, to: number, edge: ModelEdge): undefined {
    if (edge.type === 'data') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    if (edge.type === 'property') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    throw new Error('never reached')
  }
}

// spellchecker:words forceatlas circlepack
