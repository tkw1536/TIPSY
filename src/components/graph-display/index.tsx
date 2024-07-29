import { type ComponentType, type JSX } from 'preact'
import Kernel, {
  type KernelProps,
  type DriverLoader,
  type KernelController,
} from '../../lib/drivers'
import type Graph from '../../lib/graph'

import ErrorDisplay from '../error'
import { useState } from 'preact/hooks'
import { Panel } from '../layout/panel'
import { type Renderable } from '../../lib/graph/builders'
import useAsyncState, { reasonAsCause, type AsyncState } from '../hooks/async'
import { type Snapshot, type DriverClass } from '../../lib/drivers/impl'
import Spinner from '../spinner'

interface GraphProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  loader: DriverLoader<NodeLabel, EdgeLabel, Options, AttachmentKey>
  name: string

  makeGraph: () => Promise<Graph<NodeLabel, EdgeLabel>>

  snapshot: Snapshot | null
  setSnapshot: (value: Snapshot | null) => void

  // TODO: make this flags
  options: Options
  layout: string
  seed: number | null

  panel: ComponentType<PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>>
}

export interface PanelProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  controller: KernelController<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  > | null
}

export default function GraphDisplay<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: GraphProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const {
    loader,
    name,
    options,
    layout,
    seed,
    snapshot,
    setSnapshot,
    makeGraph,
    panel: GraphDisplayPanel,
  } = props
  const graph = useAsyncState(
    ticket => makeGraph,
    [makeGraph],
    reasonAsCause('failed to create graph'),
  )
  const driver = useAsyncState(
    ticket => async () => await loader.get(name),
    [name, loader],
    reasonAsCause('failed to load driver'),
  )

  const [open, setOpen] = useState(false)
  const [controller, setController] = useState<KernelController<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  > | null>(null)

  return (
    <Panel
      panel={<GraphDisplayPanel controller={controller} />}
      open={open}
      setOpen={setOpen}
    >
      <GraphDisplayMain
        graph={graph}
        driver={driver}
        snapshot={snapshot}
        setSnapshot={setSnapshot}
        controller={setController}
        options={options}
        layout={layout}
        seed={seed}
      />
    </Panel>
  )
}

interface GraphDisplayMainProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends Omit<
    KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
    'graph' | 'driver'
  > {
  driver: AsyncState<
    DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>,
    Error
  >
  graph: AsyncState<Graph<NodeLabel, EdgeLabel>, Error>
}

function GraphDisplayMain<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: GraphDisplayMainProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element | null {
  const { graph, driver, ...rest } = props

  if (graph.status === 'pending') {
    return <Spinner message='Building Graph'></Spinner>
  }
  if (graph.status === 'rejected') {
    return <ErrorDisplay error={graph.reason} />
  }
  if (driver.status === 'pending') {
    return <Spinner message='Loading Driver'></Spinner>
  }
  if (driver.status === 'rejected') {
    return <ErrorDisplay error={driver.reason} />
  }

  return <Kernel {...rest} graph={graph.value} driver={driver.value} />
}
