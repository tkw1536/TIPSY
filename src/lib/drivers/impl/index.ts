import type { Size } from '../../../components/hooks/observer'
import type Graph from '../../graph'
import type {
  Attachment,
  Element,
  ElementWithAttachments,
  Renderable,
} from '../../graph/builders'
import { IDPool } from '../../utils/id-pool'

export const defaultLayout = 'auto'

export type ContextFlags<Options> = Readonly<{
  options: Options
  layout: string
  seed: number
}>

export interface DriverClass<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  new (
    graph: Graph<NodeLabel, EdgeLabel>,
    flags: ContextFlags<Options>,
  ): Driver<NodeLabel, EdgeLabel, Options, AttachmentKey>

  /** the id of this driver class */
  readonly id: string

  /** list of supported layouts to be passed to {@link new} */
  readonly layouts: string[]

  /** list of formats allowed as an argument to {@link Driver.export} and if they need a size argument */
  readonly formats: Map<string, boolean>
}

export interface Refs {
  /** indicates if the driver is currently animating a simulation */
  animating: (animating: boolean | null) => void
}

/** driver renders a single instance on a page */
export default interface Driver<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  /** returns the class of this driver */
  readonly driver: DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>

  readonly graph: Graph<NodeLabel, EdgeLabel>
  readonly flags: ContextFlags<Options>

  /**
   * Creates and initializes this instance of the driver for the given graph.
   * It should perform potentially expensive computations in the background (e.g. using a webworker).
   *
   * Afterwards this instance may or may not be {@link mount}ed onto the page.
   * For this reason initialize should automatically remove any background jobs.
   *
   * @param flags Flags for the context to create
   * @param ticket Used for cancellation. Returns false if the result is known to be discarded. In this case makeContext may chose to throw {@link ErrorAborted}.
   */
  initialize: (ticket: () => boolean) => Promise<void>

  /** mounts this instance onto the page */
  mount: (element: HTMLElement, refs: Refs) => void

  /** resizes this instance which is already {@link mount}ed onto the page */
  resize: (size: Size) => void

  /** unmounts the {@link mount}ed instance from the page */
  unmount: () => void

  /** remount remounts this driver, discarding any current positions */
  remount: () => void

  startAnimation: () => void
  stopAnimation: () => void

  // take a snapshot of the current state or apply it
  takeSnapshot: () => Snapshot | null
  applySnapshot: (value: Snapshot) => void

  /**
   * Exports the rendered image into a blob.
   *
   * Export may be run in a browser context or a non-browser context.
   * @param ctx Context returned from {@link initialize} to be rendered into a blob
   * @param flags Flags used to create the context
   * @param format Format to be exported in. One of {@link exportFormats}.
   * @param size Size of the exported image.
   */
  export: (format: string, size?: number) => Promise<Blob>
}

interface Position {
  x: number
  y: number
}

export interface View {
  zoom: number
  center: Position
}

/** Snapshot holds the positions of all elements within this graph */
export interface Snapshot {
  animating: boolean | null
  view?: View
  positions: Record<string, Position>
}

/** indicates to the caller that the driver has aborted it's current operation */
export const ErrorAborted = new Error('Driver: aborted')

/** thrown if an operation is not supported */
export const ErrorUnsupported = new Error('Driver: Not supported')

/** ContextDetails holds information about an initialized {@link DriverImpl} */
export interface ContextDetails<Context, Options> {
  context: Context
  flags: ContextFlags<Options>
  seed: number
}

/** MountInfo holds information about a mounted DriverImpl */
export interface MountInfo<Mount> {
  /** the mount object */
  mount: Mount

  /** the element this instance is mounted to */
  element: HTMLElement

  /** refs set by this driver */
  refs: Refs

  /** if we're current animating */
  animating: boolean | null

  /** the current size of this mount (if known) */
  size?: Size
}

/** implements a driver */
export abstract class DriverImpl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
  NodeAttrs,
  EdgeAttrs,
  Cluster,
  Context,
  Mount,
  HotContext = Context,
> implements Driver<NodeLabel, EdgeLabel, Options, AttachmentKey>
{
  abstract readonly driver: DriverClass<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  >

  flags: ContextFlags<Options>
  constructor(
    public readonly graph: Graph<NodeLabel, EdgeLabel>,
    flags: ContextFlags<Options>,
  ) {
    this.flags = Object.freeze(flags)

    const ids = new IDPool()

    let hot: HotContext = this.newContextImpl(this.flags, this.flags.seed)

    // add all nodes and edges
    for (const [id, node] of this.graph.getNodes()) {
      const nodeID = ids.for(id)
      const element = node.render(nodeID, this.flags.options)
      hot = this.addNodeImpl(hot, this.flags, nodeID, node, element) ?? hot
    }
    for (const [id, from, to, edge] of this.graph.getEdges()) {
      const edgeID = ids.for(id)
      const element = edge.render(edgeID, this.flags.options)
      hot =
        this.addEdgeImpl(
          hot,
          this.flags,
          ids.for(id),
          ids.for(from),
          ids.for(to),
          edge,
          element,
        ) ?? hot
    }
    this.#hot = hot
  }

  readonly #hot: HotContext
  #context: ContextDetails<Context, Options> | null = null

  #mountData: { element: HTMLElement; refs: Refs; snapshot?: Snapshot } | null =
    null
  #mount: MountInfo<Mount> | null = null

  readonly initialize = async (ticket: () => boolean): Promise<void> => {
    if (this.#hot === null) {
      throw new Error('Driver error: initialize called out of order')
    }
    // finalize the context
    const ctx = await this.initializeImpl(
      this.#hot,
      this.flags,
      this.flags.seed,
    )
    if (!ticket()) throw ErrorAborted

    // get the seed of this mount (if any)
    this.#context = { context: ctx, flags: this.flags, seed: this.flags.seed }
  }

  protected abstract newContextImpl(
    flags: ContextFlags<Options>,
    seed: number,
  ): HotContext

  protected abstract initializeImpl(
    ctx: HotContext,
    flags: ContextFlags<Options>,
    seed: number,
  ): Promise<Context>

  #animating: boolean | null = null
  protected get animating(): boolean | null {
    return this.#animating
  }

  protected delayMountUntilAfterResize = false
  readonly mount = (element: HTMLElement, refs: Refs): void => {
    // wrap the refs
    const originalRef = refs.animating

    this.#animating = null
    const wrappedRefs: Refs = {
      animating: animating => {
        this.#animating = animating
        if (this.#mount !== null) {
          this.#mount.animating = animating
        }
        originalRef(animating)
      },
    }

    this.#mountData = { element, refs: wrappedRefs }
    if (this.delayMountUntilAfterResize) {
      return
    }

    this.#doMount(undefined)
  }

  #doMount(size?: Size): void {
    if (this.#mountData === null || this.#context === null) {
      throw new Error('Driver error: mount called out of order')
    }

    // extract and clear the mount data
    const { element, refs, snapshot } = this.#mountData
    this.#mountData = null

    // do the actual mount!
    this.#mount = {
      mount: this.mountImpl(this.#context, element, refs, size),
      element,
      refs,
      animating: this.#animating,
      size,
    }

    // apply the snapshot
    if (typeof snapshot !== 'undefined') {
      this.#doSnapshot(snapshot)
    }
  }

  protected abstract mountImpl(
    details: ContextDetails<Context, Options>,
    element: HTMLElement,
    refs: Refs,
    size?: Size,
  ): Mount

  readonly resize = (size: Size): void => {
    // if we haven't mounted yet => do it
    if (this.#mountData !== null) {
      this.#doMount(size)
    }

    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: resize called out of order')
    }

    this.#mount = {
      ...this.#mount,
      mount:
        this.resizeMountImpl(this.#context, this.#mount, size) ??
        this.#mount.mount,
    }
  }
  protected abstract resizeMountImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
    size: Size,
  ): Mount | void

  readonly unmount = (): void => {
    // delayed the mount, but we never did it!
    if (this.#mountData !== null) {
      this.#mountData = null
      return
    }

    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: unmount called out of order')
    }

    this.unmountImpl(this.#context, this.#mount)
    this.#mount = null
  }
  protected abstract unmountImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): void

  readonly remount = (): void => {
    // we're not actually mounted
    if (this.#mount === null) {
      if (this.#mountData !== null) {
        return
      }
      throw new Error('remount called out of order')
    }

    // store the mount data and unmount
    const { element, refs, size } = this.#mount
    const mountData = { element, refs }
    this.unmount()

    // store the old mount data, and do mounting
    this.#mountData = mountData
    if (!this.delayMountUntilAfterResize) {
      this.#doMount()
    }

    // if we had a resize, do it
    if (typeof size !== 'undefined') {
      this.resize(size)
    }
  }

  readonly export = async (format: string, size?: number): Promise<Blob> => {
    if (this.#mountData !== null) {
      throw new Error('Driver error: export called before initial resize')
    }
    if (this.#context === null) {
      throw new Error('Driver error: export called out of order')
    }

    const wantSize = this.driver.formats.get(format)
    if (typeof wantSize !== 'boolean') {
      throw new Error('Driver error: export called with invalid format')
    }

    const hasSize = typeof size !== 'undefined'
    if (wantSize && !hasSize) {
      throw new Error(
        `Driver error: missing size argument for format ${format}`,
      )
    }
    if (hasSize && !wantSize) {
      console.warn(
        `Driver warning: ignoring extra size argument for format ${format}`,
      )
      size = undefined
    }
    return await this.exportImpl(this.#context, this.#mount, format, size)
  }
  protected abstract exportImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
    format: string,
    size?: number,
  ): Promise<Blob>

  readonly startAnimation = (): void => {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: startSimulation called out of order')
    }

    this.startSimulationImpl(this.#context, this.#mount)
  }
  protected abstract startSimulationImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): void

  readonly stopAnimation = (): void => {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: startSimulation called out of order')
    }

    this.stopSimulationImpl(this.#context, this.#mount)
  }

  protected abstract stopSimulationImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): void

  /** creates a new cluster */
  protected abstract createCluster(
    context: HotContext,
    id: string,
    boxed: boolean,
  ): Cluster

  /** creates a new cluster with the given id */
  protected abstract placeCluster(
    context: HotContext,
    id: string,
    cluster: Cluster,
  ): HotContext | void

  /** places the node into the context */
  protected abstract placeNode(
    context: HotContext,
    id: string,
    attributes: NodeAttrs,
    cluster?: Cluster,
  ): HotContext | void

  /** places the edge into the context */
  protected abstract placeEdge(
    context: HotContext,
    id: string,
    from: string,
    to: string,
    attributes: EdgeAttrs,
    cluster?: Cluster,
  ): HotContext | void

  /** get the attributes for a node */
  protected abstract attributes(type: 'node', element: Element): NodeAttrs

  /** get the attributes for an edge */
  protected abstract attributes(type: 'edge', element: Element): EdgeAttrs

  protected addNodeImpl(
    context: HotContext,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): HotContext | void {
    const { attached } = element

    // no attachments => place a simple node
    if (typeof attached === 'undefined') {
      return this.placeNode(
        context,
        element.id,
        this.renderSimpleNode(node, element),
      )
    }

    let hot = context

    // complex node => create a cluster
    const clusterID = `${element.id}-cluster`
    const cluster = this.createCluster(hot, clusterID, attached.boxed)

    // add the node itself
    hot =
      this.placeNode(
        hot,
        element.id,
        this.renderComplexNode(node, element),
        cluster,
      ) ?? hot

    // add all the attachments
    Object.entries(attached.elements).forEach(([attachment, sElements]) => {
      ;(sElements as Attachment[]).forEach(({ node: aNode, edge: aEdge }) => {
        hot =
          this.placeNode(
            hot,
            aNode.id,
            this.renderAttachedNode(node, attachment as AttachmentKey, aNode),
            cluster,
          ) ?? hot

        hot =
          this.placeEdge(
            hot,
            aEdge.id,
            aNode.id,
            element.id,
            this.renderAttachedEdge(node, attachment as AttachmentKey, aEdge),
            cluster,
          ) ?? hot
      })
    })

    return this.placeCluster(hot, clusterID, cluster)
  }

  protected addEdgeImpl(
    context: HotContext,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): HotContext | void {
    return this.placeEdge(context, id, from, to, this.renderEdge(edge, element))
  }

  protected renderSimpleNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): NodeAttrs {
    return this.renderAnyNode(node, element)
  }

  protected renderComplexNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): NodeAttrs {
    return this.renderAnyNode(node, element)
  }

  protected renderAttachedNode(
    parent: NodeLabel,
    attachment: AttachmentKey,
    element: Element,
  ): NodeAttrs {
    return this.renderAnyNode(parent, element)
  }

  protected renderAnyNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): NodeAttrs {
    return this.attributes('node', element)
  }

  protected renderAttachedEdge(
    parent: NodeLabel,
    attachment: AttachmentKey,
    element: Element,
  ): EdgeAttrs {
    return this.attributes('edge', element)
  }

  protected renderEdge(
    edge: EdgeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): EdgeAttrs {
    return this.attributes('edge', element)
  }

  /** snapshot gets the current node positions */
  takeSnapshot(): Snapshot | null {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: snapshot called in wrong order')
    }
    const positions = this.getPositionsImpl(this.#context, this.#mount)
    if (positions === null) {
      return null
    }
    const view = this.getViewImpl(this.#context, this.#mount) ?? undefined
    return {
      animating: this.#mount.animating,
      positions,
      view,
    }
  }
  /** snapshot sets the current node positions */
  applySnapshot(snapshot: Snapshot): void {
    if (this.#mountData !== null) {
      this.#mountData.snapshot = snapshot
      return
    }
    this.#doSnapshot(snapshot)
  }

  /** if true, skip restarting the animation */
  protected readonly skipRestoreAnimating: boolean = false
  #doSnapshot(snapshot: Snapshot): void {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: snapshot called in wrong order')
    }

    // always stop the animation before a restore
    this.stopAnimation()

    const { view, positions } = snapshot

    // set the positions
    this.#mount = {
      ...this.#mount,
      mount:
        this.setPositionsImpl(this.#context, this.#mount, positions) ??
        this.#mount.mount,
    }

    // set the view
    if (typeof view !== 'undefined') {
      this.#mount = {
        ...this.#mount,
        mount:
          this.setViewImpl(this.#context, this.#mount, view) ??
          this.#mount.mount,
      }
    }
    // if we were running before, start the animation
    if (!this.skipRestoreAnimating && snapshot.animating === true) {
      this.startAnimation()
    }
  }

  protected abstract getPositionsImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
  ): Snapshot['positions'] | null

  protected abstract setPositionsImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
    positions: Snapshot['positions'],
  ): Mount | void

  protected abstract getViewImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
  ): View | null
  protected abstract setViewImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
    view: View,
  ): Mount | void
}
