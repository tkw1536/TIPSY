import { ContextFlags, defaultLayout, DriverImpl, MountFlags, Size } from '.'
import { Data, Network, Options } from 'vis-network'
import { DataSet } from 'vis-data'
import { ModelEdge, ModelNode, modelNodeLabel } from '../../graph/builders/model'
import { BundleEdge, BundleNode } from '../../graph/builders/bundle'
import * as styles from './vis-network.module.css'
import { Type } from '../../utils/media'

abstract class VisNetworkDriver<NodeLabel, EdgeLabel> extends DriverImpl<NodeLabel, EdgeLabel, Dataset, Network> {
  protected abstract addNodeImpl (dataset: Dataset, flags: ContextFlags, id: string, node: NodeLabel): Promise<undefined>
  protected abstract addEdgeImpl (dataset: Dataset, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<undefined>

  readonly driverName = 'vis-network'
  readonly supportedLayouts = [defaultLayout, 'hierarchical', 'force2atlas']

  protected options (layout: string, definitelyAcyclic: boolean): Options {
    const hierarchical = layout === defaultLayout ? definitelyAcyclic : layout === 'hierarchical'

    return hierarchical
      ? {
          layout: {
            hierarchical: {
              direction: 'UD',
              sortMethod: 'directed',
              shakeTowards: 'roots'
            }
          },
          physics: {
            hierarchicalRepulsion: {
              avoidOverlap: 10
            }
          }
        }
      : {
          physics: {
            barnesHut: {
              springConstant: 0,
              avoidOverlap: 10,
              damping: 0.09
            }
          },
          edges: {
            smooth: {
              enabled: true,
              type: 'continuous',
              forceDirection: 'none',
              roundness: 0.6
            }
          }
        }
  }

  protected async newContextImpl (): Promise<Dataset> {
    return new Dataset()
  }

  protected async finalizeContextImpl (ctx: Dataset): Promise<undefined> {
    return undefined
  }

  protected mountImpl (dataset: Dataset, { container, layout, definitelyAcyclic }: MountFlags): Network {
    container.classList.add(styles.container)

    const options = this.options(layout, definitelyAcyclic)
    options.autoResize = false
    return new Network(container, dataset.toData(), options)
  }

  protected resizeMountImpl (network: Network, dataset: Dataset, flags: MountFlags, { width, height }: Size): undefined {
    network.setSize(`${width}px`, `${height}px`)
    network.redraw()
  }

  protected unmountImpl (network: Network, dataset: Dataset, { container }: MountFlags): void {
    container.classList.remove(styles.container)
    network.destroy()
  }

  readonly supportedExportFormats = ['png']
  protected async objectToBlobImpl (network: Network, dataset: Dataset, flags: MountFlags, format: string): Promise<Blob> {
    return await dataset.drawNetworkClone(network, 1000, 1000, Type.PNG, 1)
  }
}

export class VisNetworkBundleDriver extends VisNetworkDriver<BundleNode, BundleEdge> {
  private static _instance: VisNetworkBundleDriver | null = null
  static get instance (): VisNetworkBundleDriver {
    if (this._instance === null) {
      this._instance = new VisNetworkBundleDriver()
    }
    return this._instance
  }

  protected async addNodeImpl (dataset: Dataset, { cm }: ContextFlags, id: string, node: BundleNode): Promise<undefined> {
    if (node.type === 'bundle') {
      dataset.addNode({ id, label: 'Bundle\n' + node.bundle.path.name, color: cm.get(node.bundle), level: node.level })
      return
    }
    if (node.type === 'field') {
      dataset.addNode({ id, label: node.field.path.name, color: cm.get(node.field), level: node.level })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl (dataset: Dataset, flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): Promise<undefined> {
    if (edge.type === 'child_bundle') {
      dataset.addEdge({ from, to, arrows: 'to' })
      return
    }
    if (edge.type === 'field') {
      dataset.addEdge({ from, to, arrows: 'to' })
      return
    }
    throw new Error('never reached')
  }
}

export class VisNetworkModelDriver extends VisNetworkDriver<ModelNode, ModelEdge> {
  private static _instance: VisNetworkModelDriver | null = null
  static get instance (): VisNetworkModelDriver {
    if (this._instance === null) {
      this._instance = new VisNetworkModelDriver()
    }
    return this._instance
  }

  protected async addNodeImpl (dataset: Dataset, { ns, cm }: ContextFlags, id: string, node: ModelNode): Promise<undefined> {
    const label = modelNodeLabel(node, ns)
    if (node.type === 'field') {
      dataset.addNode({
        id,
        label,

        shape: 'box',
        color: cm.get(...node.fields)
      })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      dataset.addNode({
        id,
        label,
        color: {
          background: cm.defaultColor,
          border: 'black'
        }
      })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      dataset.addNode({
        id,
        label,
        color: cm.get(...node.bundles)
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl (dataset: Dataset, { ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): Promise<undefined> {
    if (edge.type === 'data') {
      dataset.addEdge({
        from,
        to,
        arrows: 'to',

        label: ns.apply(edge.property)
      })
      return
    }
    if (edge.type === 'property') {
      dataset.addEdge({
        from,
        to,
        arrows: 'to',

        label: ns.apply(edge.property)
      })
      return
    }
    throw new Error('never reached')
  }
}

type VisNode<T extends string | number> = {
  id?: T
  shape?: Shape
  level?: number
  x?: number
  y?: number
} & VisCommon

type Shape = 'ellipse' | 'circle' | 'database' | 'box' | 'text' | 'image' | 'circularImage' | 'diamond' | 'dot' | 'star' | 'triangle' | 'triangleDown' | 'hexagon' | 'square' | 'icon'

type VisEdge<T extends string | number> = {
  from: T
  to: T
  arrows?: 'to'
  id?: never // needed by dataset api
} & VisCommon

interface VisCommon {
  label?: string
  color?: string | { background: string, border: string }
  font?: string
}

class Dataset {
  private readonly nodes = new DataSet<VisNode<string | number>>()
  private readonly edges = new DataSet<VisEdge<string | number>>()

  addNode (node: VisNode<string | number>): string {
    const id = this.nodes.add(node)[0] as string
    return id
  }

  addEdge (edge: VisEdge<string | number>): string {
    return this.edges.add(edge)[0] as string
  }

  toData (): Data {
    return { nodes: this.nodes, edges: this.edges } as unknown as Data
  }

  /** drawNetworkClone draws a clone of this dataset from the given network */
  async drawNetworkClone (network: Network, width: number, height: number, type?: string, quality?: number): Promise<Blob> {
    // get the original canvas size
    const orgCanvas = (await draw(network)).canvas

    // copy nodes, edges, positions
    const nodes = this.nodes.get()
    const edges = this.edges.get()
    const positions = network.getPositions()

    // create a new set of nodes
    const nodeSet = new DataSet<VisNode<string | number>>()
    nodes.forEach(node => {
      const { x, y } = positions[node.id]
      nodeSet.add({ ...node, x, y })
    })

    // create a new set of edges
    const edgeSet = new DataSet<VisEdge<string>>()
    edges.forEach(edge => edgeSet.add(edge))

    // create a temporary container with the original size
    const container = document.createElement('div')
    container.style.boxSizing = 'border-box'
    container.style.width = `${orgCanvas.width}px`
    container.style.height = `${orgCanvas.height}px`
    document.body.append(container)

    // create a clone of the network
    const networkClone = new Network(container, { nodes: nodeSet, edges: edgeSet } as unknown as any, {
      autoResize: false,
      physics: false,
      layout: {
        randomSeed: network.getSeed()
      }
    })

    // reset the size and fit all the nodes on it
    networkClone.setSize(`${width}px`, `${height}px`)
    networkClone.moveTo({ scale: Math.max(width / orgCanvas.width, height / orgCanvas.height) })
    networkClone.fit({ animation: false })

    return await draw(networkClone)
      .then(async ({ canvas }) => await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob == null) {
            reject(new Error('no blob'))
            return
          }
          resolve(blob)
        }, type, quality)
      })

      ).finally(() => {
        networkClone.destroy()
        document.body.removeChild(container)
      })
  }
}

async function draw (network: Network): Promise<CanvasRenderingContext2D> {
  return await new Promise((resolve) => {
    network.once('afterDrawing', (ctx) => resolve(ctx))
    network.redraw()
  })
}