import {
  type ContextDetails,
  DriverImpl,
  ErrorUnsupported,
  type MountInfo,
  type Refs,
  type Snapshot,
  type View,
  defaultLayout,
} from '..'
import Sigma from 'sigma'
import Graph from 'graphology'
import type { Settings } from 'sigma/dist/declarations/src/settings'
import type {
  BundleOptions,
  BundleEdge,
  BundleNode,
} from '../../../graph/builders/bundle'
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import { inferSettings } from 'graphology-layout-forceatlas2'
import circular from 'graphology-layout/circular'
import circlepack from 'graphology-layout/circlepack'
import random from 'graphology-layout/random'
import type {
  ModelOptions,
  ModelEdge,
  ModelNode,
  ModelAttachmentKey,
} from '../../../graph/builders/model/labels'
import type { Attributes } from 'graphology-types'
import { prng } from '../../../utils/prng'
import type { Element, Renderable } from '../../../graph/builders'
import type { RDFEdge, RDFNode, RDFOptions } from '../../../graph/builders/rdf'
import type { Size } from '../../../../components/hooks/observer'
import { SigmaLayout } from './layout'
import exportRaster from './export'
import { Type } from '../../../utils/media'

interface SigmaMount {
  layout?: SigmaLayout
  sigma: Sigma
}

abstract class SigmaDriver<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends DriverImpl<
  NodeLabel,
  EdgeLabel,
  Options,
  AttachmentKey,
  Attributes,
  Attributes,
  null,
  Graph,
  SigmaMount
> {
  static readonly id = 'Sigma.js'
  static readonly layouts = [
    defaultLayout,
    'force2atlas',
    'circular',
    'circlepack',
  ]

  protected settings(): Partial<Settings> {
    return {
      renderEdgeLabels: true,
    }
  }

  protected newContextImpl(): Graph {
    return new Graph()
  }

  protected async initializeImpl(ctx: Graph): Promise<Graph> {
    return ctx
  }

  protected mountImpl(
    { context: graph, flags: { layout }, seed }: ContextDetails<Graph, Options>,
    element: HTMLElement,
    refs: Refs,
  ): SigmaMount {
    let sigmaLayout: SigmaLayout | undefined
    switch (layout === defaultLayout ? 'force2atlas' : layout) {
      case 'force2atlas':
        {
          random.assign(graph, { rng: prng(seed) })
          const layout = new FA2Layout(graph, {
            settings: inferSettings(graph),
          })

          sigmaLayout = new SigmaLayout(layout, refs.animating)
        }

        break
      case 'circlepack':
        circlepack.assign(graph, { rng: prng(seed) })
        break
      case 'circular': /* fallthrough */
      default:
        circular.assign(graph, { scale: 100 })
    }
    // setup an initial layout

    // start the layout if we have it!
    if (typeof sigmaLayout !== 'undefined') {
      sigmaLayout.start()
    }

    const settings = this.settings()
    return {
      sigma: new Sigma(graph, element, settings),
      layout: sigmaLayout,
    }
  }

  protected resizeMountImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount>,
    size: Size,
  ): void {
    /* automatically resized */
  }

  protected unmountImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { sigma, layout } }: MountInfo<SigmaMount>,
  ): void {
    if (typeof layout !== 'undefined') {
      layout.kill()
    }
    sigma.kill()
  }

  static readonly formats = new Map<string, boolean>([['png', false]])
  protected async exportImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount> | null,
    format: string,
    size?: number,
  ): Promise<Blob> {
    if (info === null) {
      throw ErrorUnsupported
    }
    return await exportRaster(info.mount.sigma, Type.PNG)
  }

  protected startSimulationImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { layout } }: MountInfo<SigmaMount>,
  ): void {
    layout?.start()
  }

  protected stopSimulationImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { layout } }: MountInfo<SigmaMount>,
  ): void {
    layout?.stop()
  }

  protected createCluster(context: Graph, id: string): null {
    return null
  }

  protected placeCluster(
    context: Graph,
    id: string,
    cluster: null,
  ): Graph | void {}

  protected placeNode(
    graph: Graph,
    id: string,
    attributes: Attributes,
    cluster?: null,
  ): Graph | void {
    graph.addNode(id, attributes)
  }

  protected placeEdge(
    graph: Graph,
    id: string,
    from: string,
    to: string,
    attributes: Attributes,
    cluster?: null,
  ): void {
    graph.addDirectedEdge(from, to, attributes)
  }

  protected attributes(
    type: 'node' | 'edge',
    { color, label, inverseLabel, tooltip }: Element,
  ): Attributes {
    const labels = [label, inverseLabel].filter(Boolean).join('\n')
    return {
      label: labels,
      color: color ?? 'black',

      type: type === 'edge' ? 'arrow' : undefined,
      arrow: type === 'edge' ? 'target' : undefined,
      size: type === 'node' ? 10 : 5,
    }
  }

  protected getPositionsImpl(
    { context: graph }: ContextDetails<Graph, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
  ): Snapshot['positions'] | null {
    const positions: Snapshot['positions'] = {}
    graph.nodes().forEach(node => {
      const display = sigma.getNodeDisplayData(node)
      if (typeof display === 'undefined') return display
      positions[node] = { x: display.x, y: display.y }
    })
    return positions
  }

  protected readonly skipRestoreAnimating = true
  protected setPositionsImpl(
    { context: graph }: ContextDetails<Graph, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
    positions: Snapshot['positions'],
  ): SigmaMount | void {
    Object.entries(positions).forEach(([node, { x, y }]) => {
      if (!graph.hasNode(node)) return
      graph.setNodeAttribute(node, 'x', x)
      graph.setNodeAttribute(node, 'y', y)
    })
    sigma.refresh()
  }

  protected getViewImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
  ): View {
    const camera = sigma.getCamera().getState()
    return {
      zoom: camera.ratio,
      center: { x: camera.x, y: camera.y },
    }
  }
  protected setViewImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
    view: View,
  ): void {
    sigma
      .getCamera()
      .setState({ x: view.center.x, y: view.center.y, ratio: view.zoom })
  }
}

export class SigmaBundleDriver extends SigmaDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {
  readonly driver = SigmaBundleDriver
}

export class SigmaModelDriver extends SigmaDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {
  readonly driver = SigmaModelDriver
}

export class SigmaRDFDriver extends SigmaDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {
  readonly driver = SigmaRDFDriver
}

// spellchecker:words forceatlas circlepack
