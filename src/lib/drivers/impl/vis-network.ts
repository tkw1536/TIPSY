import {
  type ContextDetails,
  type ContextFlags,
  DriverImpl,
  ErrorUnsupported,
  type MountInfo,
  type Refs,
  type Size,
  defaultLayout,
} from '.'
import {
  type Data,
  type Network,
  type Options as VisOptions,
} from 'vis-network'
import { type DataSet } from 'vis-data'
import {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../graph/builders/bundle'
import { Type } from '../../utils/media'
import { LazyValue } from '../../utils/once'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  ConceptModelNode,
  LiteralModelNode,
  type Element,
} from '../../graph/builders/model/labels'

const Vis = new LazyValue(async () => await import('vis-network'))

abstract class VisNetworkDriver<
  NodeLabel,
  EdgeLabel,
  Options,
> extends DriverImpl<NodeLabel, EdgeLabel, Options, Dataset, Network> {
  protected abstract addNodeImpl(
    dataset: Dataset,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
  ): Promise<undefined>
  protected abstract addEdgeImpl(
    dataset: Dataset,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
  ): Promise<undefined>

  readonly driverName = 'vis-network'
  readonly layouts = [defaultLayout, 'hierarchical', 'force2atlas']

  protected options(
    seed: number,
    layout: string,
    definitelyAcyclic: boolean,
  ): VisOptions {
    const hierarchical =
      layout === defaultLayout ? definitelyAcyclic : layout === 'hierarchical'

    return hierarchical
      ? {
          layout: {
            randomSeed: seed,
            hierarchical: {
              direction: 'UD',
              sortMethod: 'directed',
              shakeTowards: 'roots',
            },
          },
          physics: {
            hierarchicalRepulsion: {
              avoidOverlap: 10,
            },
          },
        }
      : {
          layout: {
            randomSeed: seed,
          },
          physics: {
            barnesHut: {
              springConstant: 0,
              avoidOverlap: 10,
              damping: 0.09,
            },
          },
          edges: {
            smooth: {
              enabled: true,
              type: 'continuous',
              forceDirection: 'none',
              roundness: 0.6,
            },
          },
        }
  }

  protected async newContextImpl(): Promise<Dataset> {
    if (Object.hasOwn(globalThis, 'window')) {
      await Vis.load()
    }
    const { DataSet } = await import('vis-data')
    return new Dataset(new DataSet(), new DataSet())
  }

  protected async finalizeContextImpl(ctx: Dataset): Promise<Dataset> {
    return ctx
  }

  protected mountImpl(
    {
      context: dataset,
      flags: { layout, definitelyAcyclic },
      seed,
    }: ContextDetails<Dataset, Options>,
    element: HTMLElement,
    refs: Refs,
  ): Network {
    const options = this.options(seed, layout, definitelyAcyclic)
    options.autoResize = false

    const network = new Vis.value.Network(element, dataset.toData(), options)
    network.on('startStabilizing', () => {
      refs.animating(true)
    })
    network.on('stabilized', () => {
      refs.animating(false)
    })
    return network
  }

  protected resizeMountImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: network }: MountInfo<Network>,
    { width, height }: Size,
  ): void {
    network.setSize(`${width}px`, `${height}px`)
    network.redraw()
  }

  protected unmountImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: network, element }: MountInfo<Network>,
  ): void {
    network.destroy()
  }

  readonly exportFormats = ['png']
  protected async exportImpl(
    { context: dataset }: ContextDetails<Dataset, Options>,
    info: MountInfo<Network> | null,
    format: string,
  ): Promise<Blob> {
    if (info === null) throw ErrorUnsupported
    return await dataset.drawNetworkClone(info.mount, 1000, 1000, Type.PNG, 1)
  }

  protected getSeedImpl(
    details: ContextDetails<Dataset, Options>,
    info: MountInfo<Network> | null,
  ): number | null {
    if (info === null) {
      return null
    }
    const seed = info.mount.getSeed()
    if (typeof seed === 'number') {
      return seed
    }

    return null
  }

  protected startSimulationImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: network, refs }: MountInfo<Network>,
  ): void {
    network.startSimulation()
  }

  protected stopSimulationImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: network, refs }: MountInfo<Network>,
  ): void {
    network.stopSimulation()
  }
}

export class VisNetworkBundleDriver extends VisNetworkDriver<
  BundleNode,
  BundleEdge,
  BundleOptions
> {
  protected async addNodeImpl(
    dataset: Dataset,
    { options: { cm } }: ContextFlags<BundleOptions>,
    id: string,
    node: BundleNode,
  ): Promise<undefined> {
    if (node.type === 'bundle') {
      dataset.addNode({
        id,
        label: 'Bundle\n' + node.bundle.path.name,
        color: cm.getDefault(node.bundle),
        level: node.level,
      })
      return
    }
    if (node.type === 'field') {
      dataset.addNode({
        id,
        label: node.field.path.name,
        color: cm.getDefault(node.field),
        level: node.level,
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl(
    dataset: Dataset,
    flags: ContextFlags<BundleOptions>,
    id: string,
    from: string,
    to: string,
    edge: BundleEdge,
  ): Promise<undefined> {
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

export class VisNetworkModelDriver extends VisNetworkDriver<
  ModelNode,
  ModelEdge,
  ModelOptions
> {
  protected async addNodeImpl(
    dataset: Dataset,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    node: ModelNode,
  ): Promise<undefined> {
    if (node instanceof LiteralModelNode) {
      this.#addLiteralNode(dataset, options, id, node)
      return
    }
    if (node instanceof ConceptModelNode) {
      this.#addConceptNode(dataset, options, id, node)
      return
    }
    throw new Error('never reached')
  }

  #addLiteralNode(
    dataset: Dataset,
    options: ModelOptions,
    id: string,
    node: LiteralModelNode,
  ): void {
    const element = node.render(id, options)

    dataset.addNode({
      id: element.id,
      ...VisNetworkModelDriver.#nodeData(element),
    })

    if (typeof element.attached === 'undefined') {
      return
    }

    element.attached.fields.forEach(({ node, edge }) => {
      dataset.addNode({
        id: node.id,
        ...VisNetworkModelDriver.#nodeData(node),
      })

      dataset.addEdge({
        from: node.id,
        to: element.id,
        ...VisNetworkModelDriver.#edgeData(edge),
      })
    })
  }

  #addConceptNode(
    dataset: Dataset,
    options: ModelOptions,
    id: string,
    node: ConceptModelNode,
  ): void {
    const element = node.render(id, options)

    dataset.addNode({
      id: element.id,
      ...VisNetworkModelDriver.#nodeData(element),
    })

    if (typeof element.attached === 'undefined') {
      return
    }

    element.attached.fields.forEach(({ node, edge }) => {
      dataset.addNode({
        id: node.id,
        ...VisNetworkModelDriver.#nodeData(node),
      })

      dataset.addEdge({
        from: node.id,
        to: element.id,
        ...VisNetworkModelDriver.#edgeData(edge),
      })
    })

    element.attached.bundles.forEach(({ node, edge }) => {
      dataset.addNode({
        id: node.id,
        ...VisNetworkModelDriver.#nodeData(node),
      })

      dataset.addEdge({
        from: node.id,
        to: element.id,
        ...VisNetworkModelDriver.#edgeData(edge),
      })
    })
  }

  protected async addEdgeImpl(
    dataset: Dataset,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    from: string,
    to: string,
    edge: ModelEdge,
  ): Promise<undefined> {
    const element = edge.render(id, options)
    dataset.addEdge({
      from,
      to,
      ...VisNetworkModelDriver.#edgeData(element),
    })
  }

  static readonly #defaultNodeColor = 'white'
  static readonly #defaultEdgeColor = 'black'

  static #nodeData(
    element: Element,
    extra?: VisCommon,
  ): Omit<VisNode<string | number>, 'id'> {
    return {
      color: {
        background: element.color ?? this.#defaultNodeColor,
        border: this.#defaultEdgeColor,
      },
      label: element.label ?? undefined,

      ...extra,
    }
  }

  static #edgeData(
    element: Element,
    extra?: VisCommon,
  ): Omit<VisEdge<string | number>, 'from' | 'to'> {
    return {
      color: element.color ?? this.#defaultEdgeColor,
      label: element.label ?? undefined,

      arrows: 'to',

      ...(extra ?? {}),
    }
  }
}

type VisNode<T extends string | number> = {
  id?: T
  shape?: Shape
  level?: number
  x?: number
  y?: number
} & VisCommon

type Shape =
  | 'ellipse'
  | 'circle'
  | 'database'
  | 'box'
  | 'text'
  | 'image'
  | 'circularImage'
  | 'diamond'
  | 'dot'
  | 'star'
  | 'triangle'
  | 'triangleDown'
  | 'hexagon'
  | 'square'
  | 'icon'

type VisEdge<T extends string | number> = {
  from: T
  to: T
  arrows?: 'to'
  id?: never // needed by dataset api
} & VisCommon

interface VisCommon {
  label?: string
  color?: string | { background: string; border: string }
  font?: string
}

class Dataset {
  readonly #nodes: DataSet<VisNode<string | number>>
  readonly #edges: DataSet<VisEdge<string | number>>

  constructor(
    nodes: DataSet<VisNode<string | number>>,
    edges: DataSet<VisEdge<string | number>>,
  ) {
    this.#nodes = nodes
    this.#edges = edges
  }

  addNode(node: VisNode<string | number>): string {
    const id = this.#nodes.add(node)[0] as string
    return id
  }

  addEdge(edge: VisEdge<string | number>): string {
    return this.#edges.add(edge)[0] as string
  }

  toData(): Data {
    return { nodes: this.#nodes, edges: this.#edges } as unknown as Data
  }

  /** drawNetworkClone draws a clone of this dataset from the given network */
  async drawNetworkClone(
    network: Network,
    width: number,
    height: number,
    type?: string,
    quality?: number,
  ): Promise<Blob> {
    const { DataSet } = await import('vis-data')

    // get the original canvas size
    const orgCanvas = (await draw(network)).canvas

    // copy nodes, edges, positions
    const nodes = this.#nodes.get()
    const edges = this.#edges.get()
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
    const networkClone = new Vis.value.Network(
      container,
      { nodes: nodeSet, edges: edgeSet } as unknown as Data,
      {
        autoResize: false,
        physics: false,
        layout: {
          randomSeed: network.getSeed(),
        },
      },
    )

    // reset the size and fit all the nodes on it
    networkClone.setSize(`${width}px`, `${height}px`)
    networkClone.moveTo({
      scale: Math.max(width / orgCanvas.width, height / orgCanvas.height),
    })
    networkClone.fit({ animation: false })

    return await draw(networkClone)
      .then(
        async ({ canvas }) =>
          await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              blob => {
                if (blob == null) {
                  reject(new Error('no blob'))
                  return
                }
                resolve(blob)
              },
              type,
              quality,
            )
          }),
      )
      .finally(() => {
        networkClone.destroy()
        document.body.removeChild(container)
      })
  }
}

async function draw(network: Network): Promise<CanvasRenderingContext2D> {
  return await new Promise(resolve => {
    network.once('afterDrawing', (ctx: CanvasRenderingContext2D) => {
      resolve(ctx)
    })
    network.redraw()
  })
}
