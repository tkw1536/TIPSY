import type { JSX, Ref, ComponentChildren } from 'preact'
import type Graph from '../graph'
import * as styles from './index.module.css'
import type Driver from './impl'
import ErrorDisplay from '../../components/error'
import type { DriverClass, ContextFlags, Snapshot } from './impl'
import Spinner from '../../components/spinner'
import type { Renderable } from '../graph/builders'
import { setRef } from '../utils/ref'
import useVisibleSize, { type Size } from '../../components/hooks/observer'
import { useEffect, useRef } from 'preact/hooks'
import useAsyncState, { reasonAsError } from '../../components/hooks/async'
import useEffectWithSnapshot from '../../components/hooks/effect'
import { useComponentWillUnmount } from '../../components/hooks/unmount'

/** KernelProps are props for the current kernel */
export interface KernelProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  driver: DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>

  graph: Graph<NodeLabel, EdgeLabel>
  flags: ContextFlags<Options>

  snapshot: Snapshot | null
  setSnapshot: (value: Snapshot | null) => void

  controllerRef: Ref<KernelController<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  > | null>
}

interface KernelMountProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey> {
  instance: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey>
  size: Size
}

export interface DriverLoader<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  get: (
    name: string,
  ) => Promise<DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>>
}

export default function Kernel<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const { graph, flags, driver: DriverClass } = props

  const instance = useAsyncState(
    ticket => async () => {
      const instance = new DriverClass(graph, flags)
      if (instance.driver !== DriverClass) {
        throw new Error(
          `${DriverClass.id}: instance has incorrect driver attribute`,
        )
      }
      await instance.initialize(ticket)
      return instance
    },
    [DriverClass, flags, graph],
    reasonAsError,
  )

  const [size, ref] = useVisibleSize<HTMLDivElement>()

  let body: ComponentChildren
  switch (instance.status) {
    case 'pending':
      body = (
        <Spinner
          message={'Loading is taking a bit longer, please be patient. '}
        />
      )
      break
    case 'fulfilled':
      body = size !== null && (
        <KernelMount {...props} size={size} instance={instance.value} />
      )
      break
    case 'rejected':
      body = <ErrorDisplay error={instance.reason} />
      break
  }

  return (
    <div ref={ref} class={styles.wrapper}>
      {size !== null && body}
    </div>
  )
}

interface KernelMountSnapshot<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  driver: DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>
  graph: Graph<NodeLabel, EdgeLabel>
  seed: number
  flags: ContextFlags<Options>
  snapshot: Snapshot | null
}

/** MountedKernel mounts a kernel with a driver */
function KernelMount<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: KernelMountProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const {
    instance,
    controllerRef: controller,
    size,
    setSnapshot,
    snapshot,
  } = props
  const container = useRef<HTMLDivElement>(null)

  // mount the instance
  const snapshotRef = useEffectWithSnapshot<
    KernelMountSnapshot<NodeLabel, EdgeLabel, Options, AttachmentKey>
  >(
    prev => {
      const { current } = container
      if (current === null) {
        throw new Error(
          'never reached: current ref MUST BE mounted during useEffect',
        )
      }

      let _controller = new KernelController<
        NodeLabel,
        EdgeLabel,
        Options,
        AttachmentKey
      >(instance, null)
      setRef(controller, _controller)

      instance.mount(current, {
        animating: (newAnimating: boolean | null) => {
          _controller = new KernelController(_controller.instance, newAnimating)
          setRef(controller, _controller)
        },
      })

      // apply the snapshot (if any)
      if (
        prev !== null &&
        prev.graph === instance.graph &&
        prev.driver === instance.driver &&
        prev.seed === instance.flags.seed &&
        prev.flags.layout === instance.flags.layout &&
        prev.snapshot !== null
      ) {
        instance.applySnapshot(prev.snapshot)
      }

      return (
        makeSnapshot: (
          snapshot: KernelMountSnapshot<
            NodeLabel,
            EdgeLabel,
            Options,
            AttachmentKey
          >,
        ) => void,
      ) => {
        makeSnapshot({
          driver: instance.driver,
          graph: instance.graph,
          snapshot: instance.takeSnapshot(),
          seed: instance.flags.seed,
          flags: instance.flags,
        })
        setRef(controller, null)
        instance.unmount()
      }
    },
    [controller, instance],
    {
      driver: instance.driver,
      graph: instance.graph,
      seed: instance.flags.seed,
      flags: instance.flags,
      snapshot,
    },
  )

  // on the final unmount, store the snapshot into the state
  // this is to prevent storing every time we re-mount
  useComponentWillUnmount(() => {
    setSnapshot(snapshotRef.current?.snapshot ?? null)
  }, [setSnapshot, snapshotRef])

  // resize the instance whenever possible
  useEffect(() => {
    instance.resize(size)
  }, [instance, size])

  return (
    <div
      style={{ width: size.width, height: size.height }}
      ref={container}
    ></div>
  )
}

/** encapsulates bi-directional controls for the browser */
export class KernelController<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  constructor(
    public readonly instance: Driver<
      NodeLabel,
      EdgeLabel,
      Options,
      AttachmentKey
    >,
    public animating: boolean | null,
  ) {}
}
