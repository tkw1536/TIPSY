import Graph from '..'
import ArrayTracker from '../../utils/array-tracker'

export default abstract class GraphBuilder<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  protected readonly graph = new Graph<NodeLabel, EdgeLabel>(false)
  protected readonly tracker = new ArrayTracker<string>()

  #done = false
  build(): typeof this.graph {
    // TODO: in dev, always rebuild
    if (!this.#done) {
      this.doBuild()
      this.#done = true
    }
    return this.graph
  }

  /** doBuild builds the actual graph */
  protected abstract doBuild(): void
}

/** Something that can be rendered onto the page */
export interface Renderable<Options, Key extends string> {
  render: (id: string, options: Options) => ElementWithAttachments<Key> | null
}

/** A unit that can be rendered onto a page  */
export interface ElementWithAttachments<Key extends string> extends Element {
  attached?: {
    boxed: boolean
    elements: AttachedElements<Key>
  }
}

export type AttachedElements<Key extends string> = Record<Key, Attachment[]>

/** something that can be rendered onto the page */
export interface Element {
  /** globally unique id of this element */
  id: string

  /** rendered label attached to this element */
  label: string | null

  /** tooltip to be shown on hovering this element */
  tooltip: string | null

  /** color (hex) of this element */
  color: string | null

  /** shape of this element (always null for edges) */
  shape: Shape | null
}

type Shape = 'ellipse' | 'box' | 'diamond'

/** an element attached to an existing node */
export interface Attachment {
  node: Element
  edge: Element
}
