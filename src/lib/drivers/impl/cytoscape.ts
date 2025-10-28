import type {
  Core,
  CytoscapeOptions as _Options,
  ElementDefinition,
  Layouts,
} from 'cytoscape'
import {
  type ContextDetails,
  DriverImpl,
  ErrorUnsupported,
  type MountInfo,
  type Refs,
  type Snapshot,
  type View,
  defaultLayout,
} from '.'
import type {
  BundleOptions,
  BundleEdge,
  BundleNode,
} from '../../graph/builders/bundle'
import { LazyValue } from '../../utils/once'
import type {
  ModelOptions,
  ModelEdge,
  ModelNode,
  ModelAttachmentKey,
} from '../../graph/builders/model/labels'
import type { Renderable, Element } from '../../graph/builders'
import type { RDFEdge, RDFNode, RDFOptions } from '../../graph/builders/rdf'
import type { Size } from '../../../components/hooks/observer'

const Cytoscape = new LazyValue(async () => {
  const cytoscape = (await import('cytoscape')).default

  // load all the extensions
  await Promise.all(
    [
      import('cytoscape-cola'),
      import('cytoscape-dagre'),
      import('cytoscape-fcose'),
      import('cytoscape-avsdf'),
    ].map(async imp => {
      await imp.then(ext => {
        cytoscape.use(ext.default)
      })
    }),
  )

  return cytoscape
})

type Elements = ElementDefinition[]
interface CytoMount {
  c: Core
  l: Layouts | undefined
}
type CytoscapeOptions = Omit<_Options, 'container' | 'elements'>

type Attributes = Record<string, any>

abstract class CytoscapeDriver<
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
  string | null,
  Elements,
  CytoMount
> {
  static readonly id = 'Cytoscape'
  static readonly layouts = [
    defaultLayout,
    'grid',
    'circle',
    'concentric',
    'avsdf',
    'dagre',
    'breadthfirst',
    'fcose',
    'cola',
  ]
  protected layoutOptions(layout: string): CytoscapeOptions['layout'] {
    const maxSimulationTime = 365 * 24 * 60 * 60 * 1000 // 1 year
    switch (
      layout === defaultLayout
        ? this.graph.definitelyAcyclic
          ? 'dagre'
          : 'cola'
        : layout
    ) {
      case 'grid':
        return { name: 'grid' }
      case 'circle':
        return { name: 'circle' }
      case 'concentric':
        return { name: 'concentric' }
      case 'avsdf':
        return { name: 'avsdf' }
      case 'cola':
        return {
          name: 'cola',
          maxSimulationTime,
          nodeSpacing: () => 10,
        } as unknown as CytoscapeOptions['layout']
      case 'elk':
        return {
          name: 'elk',
          maxSimulationTime,
        } as unknown as CytoscapeOptions['layout']
      case 'fcose':
        return {
          name: 'fcose',
          maxSimulationTime,
        } as unknown as CytoscapeOptions['layout']
      case 'breadthfirst':
        return { name: 'breadthfirst' }
      case 'dagre': /* fallthrough */
      default:
        return {
          name: 'dagre',
          padding: 100,
        } as unknown as CytoscapeOptions['layout']
    }
  }

  protected options(layout: string): CytoscapeOptions {
    return {
      style: [
        {
          selector: 'node',
          style: {
            'text-wrap': 'wrap',
          },
        },
        {
          selector: 'node[label]',
          style: {
            label: 'data(label)',
          },
        },
        {
          selector: 'node[color]',
          style: {
            color: 'data(color)',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '5px',
            'text-border-color': '#888',
            'text-border-width': 1,
            'text-border-opacity': 1,
          },
        },
        {
          selector: 'node[color]:selected',
          style: {
            'background-color': 'data(color)',
          },
        },
        {
          selector: 'node[shape]',
          style: {
            // HACK: data(shape) is expected to be a literal
            // but we read it from data here
            shape: 'data(shape)' as any,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 3,

            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge[color]',
          style: {
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
          },
        },
        {
          selector: 'edge[label]',
          style: {
            label: 'data(label)',
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '5px',
            'text-border-color': '#888',
            'text-border-width': 1,
            'text-border-opacity': 1,
          },
        },
      ],
      layout: this.layoutOptions(layout),
    }
  }

  protected newContextImpl(): Elements {
    return []
  }

  protected async initializeImpl(elements: Elements): Promise<Elements> {
    await Cytoscape.load()
    return elements
  }

  protected mountImpl(
    { context: elements, flags: { layout } }: ContextDetails<Elements, Options>,
    element: HTMLElement,
    refs: Refs,
  ): CytoMount {
    const options = this.options(layout)
    const { layout: layoutOptions } = options
    options.layout = undefined

    const c = Cytoscape.value({
      container: element,
      elements,
      ...options,
    })

    const l =
      typeof layoutOptions !== 'undefined' ? c.layout(layoutOptions) : undefined

    // spellchecker:words layoutstart layoutstop
    c.on('layoutstart', () => {
      refs.animating(true)
    })
    c.on('layoutstop', () => {
      refs.animating(false)
    })
    if (typeof l !== 'undefined') {
      l.start()
    }

    return { c, l }
  }

  protected resizeMountImpl(
    details: ContextDetails<Elements, Options>,
    info: MountInfo<CytoMount>,
    size: Size,
  ): void {
    /* automatically resized */
  }

  protected unmountImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c, l } }: MountInfo<CytoMount>,
  ): void {
    l?.stop()
    l?.removeAllListeners()
    c.destroy()
  }

  static readonly formats = new Map<string, boolean>()
  protected async exportImpl(
    details: ContextDetails<Elements, Options>,
    info: MountInfo<CytoMount> | null,
    format: string,
    size?: number,
  ): Promise<Blob> {
    throw ErrorUnsupported
  }

  protected startSimulationImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c, l } }: MountInfo<CytoMount>,
  ): void {
    l?.start()
  }

  protected stopSimulationImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c, l }, refs }: MountInfo<CytoMount>,
  ): void {
    l?.stop()
    c.stop(true, true)
  }

  protected createCluster(
    context: Elements,
    id: string,
    boxed: boolean,
  ): string | null {
    if (!boxed) return null
    return id
  }
  protected placeCluster(
    elements: Elements,
    id: string,
    cluster: string | null,
  ): void {
    if (cluster === null) return
    elements.push({ data: { id: cluster } })
  }

  protected placeNode(
    elements: Elements,
    id: string,
    attributes: Attributes,
    cluster?: string | null,
  ): void {
    elements.push({
      data: {
        ...attributes,
        parent: cluster ?? undefined,
        id,
      },
    })
  }
  protected placeEdge(
    elements: Elements,
    id: string,
    from: string,
    to: string,
    attributes: Attributes,
    cluster?: string,
  ): void {
    elements.push({
      data: {
        ...attributes,
        id,
        source: from,
        target: to,
      },
    })
  }

  protected attributes(
    type: 'node' | 'edge',
    { color, label, inverseLabel, tooltip, shape }: Element,
  ): Attributes {
    const labels = [label, inverseLabel].filter(Boolean).join('\n')
    return {
      label: labels,
      color: color ?? 'black',
      shape: (shape === 'box' ? 'rectangle' : shape) ?? undefined,
    }
  }

  protected getPositionsImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c } }: MountInfo<CytoMount>,
  ): Snapshot['positions'] {
    const positions: Snapshot['positions'] = {}
    c.nodes().forEach(node => {
      positions[node.id()] = node.position()
    })
    return positions
  }
  protected setPositionsImpl(
    { context }: ContextDetails<Elements, Options>,
    { mount: { c }, animating }: MountInfo<CytoMount>,
    positions: Snapshot['positions'],
  ): void {
    Object.entries(positions).forEach(([id, { x, y }]) => {
      c.getElementById(id).position({ x, y }) // .lock()
    })
  }

  protected getViewImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c } }: MountInfo<CytoMount>,
  ): View | null {
    const { x, y } = c.pan()
    return {
      center: { x, y },
      zoom: c.zoom(),
    }
  }
  protected setViewImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c } }: MountInfo<CytoMount>,
    { zoom, center }: View,
  ): void {
    c.viewport({
      zoom,
      pan: center,
    })
  }
}

export class CytoBundleDriver extends CytoscapeDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {
  readonly driver = CytoBundleDriver
}
export class CytoModelDriver extends CytoscapeDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {
  readonly driver = CytoModelDriver
}
export class CytoRDFDriver extends CytoscapeDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {
  readonly driver = CytoRDFDriver
}

// spellchecker:words avsdf breadthfirst roundrectangle fcose dagre
