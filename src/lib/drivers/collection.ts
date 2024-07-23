import { type Renderable } from '../graph/builders'
import {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../graph/builders/bundle'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelAttachmentKey,
} from '../graph/builders/model/labels'
import {
  type RDFOptions,
  type RDFEdge,
  type RDFNode,
} from '../graph/builders/rdf'
import { Lazy } from '../utils/once'
import { type DriverClass } from './impl'

class DriverCollection<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  constructor(
    public readonly defaultDriver: string,
    ...loaders: Array<
      [
        string,
        () => Promise<
          DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>
        >,
      ]
    >
  ) {
    this.#loaders = new Map(loaders)
    if (!this.#loaders.has(this.defaultDriver))
      throw new Error('defaultDriver not contained in loaders')

    // setup lazy values
    for (const key of this.#loaders.keys()) {
      this.#values.set(key, new Lazy())
    }
  }

  readonly #values = new Map<
    string,
    Lazy<DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>>
  >()
  readonly #loaders = new Map<
    string,
    () => Promise<DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>>
  >()

  public async get(
    name: string,
  ): Promise<DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>> {
    const lazy = this.#values.get(name)
    if (typeof lazy === 'undefined') {
      throw new Error('unknown renderer ' + JSON.stringify(name))
    }

    return await lazy.Get(async () => {
      const loader = this.#loaders.get(name)
      if (typeof loader === 'undefined') {
        throw new Error('implementation error: loaders missing loader')
      }

      return await loader()
    })
  }

  get names(): string[] {
    return Array.from(this.#loaders.keys())
  }
}

export const models = new DriverCollection<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
>(
  'GraphViz',
  [
    'GraphViz',
    async () =>
      await import('./impl/graphviz').then(m => m.GraphVizModelDriver),
  ],
  [
    'vis-network',
    async () =>
      await import('./impl/vis-network').then(m => m.VisNetworkModelDriver),
  ],
  [
    'Sigma.js',
    async () => await import('./impl/sigma').then(m => m.SigmaModelDriver),
  ],
  [
    'Cytoscape',
    async () => await import('./impl/cytoscape').then(m => m.CytoModelDriver),
  ],
)

export const bundles = new DriverCollection<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
>(
  'GraphViz',
  [
    'GraphViz',
    async () =>
      await import('./impl/graphviz').then(m => m.GraphVizBundleDriver),
  ],
  [
    'vis-network',
    async () =>
      await import('./impl/vis-network').then(m => m.VisNetworkBundleDriver),
  ],
  [
    'Sigma.js',
    async () => await import('./impl/sigma').then(m => m.SigmaBundleDriver),
  ],
  [
    'Cytoscape',
    async () => await import('./impl/cytoscape').then(m => m.CytoBundleDriver),
  ],
)

export const triples = new DriverCollection<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
>(
  'GraphViz',
  [
    'GraphViz',
    async () => await import('./impl/graphviz').then(m => m.GraphVizRDFDriver),
  ],
  [
    'vis-network',
    async () =>
      await import('./impl/vis-network').then(m => m.VisNetworkRDFDriver),
  ],
  [
    'Sigma.js',
    async () => await import('./impl/sigma').then(m => m.SigmaRDFDriver),
  ],
  [
    'Cytoscape',
    async () => await import('./impl/cytoscape').then(m => m.CytoRDFDriver),
  ],
)
