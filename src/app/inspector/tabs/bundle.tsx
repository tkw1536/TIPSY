import type { JSX } from 'preact'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  ControlGroup,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'
import BundleGraphBuilder, {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../../lib/graph/builders/bundle'
import { bundles } from '../../../lib/drivers/collection'

import { useCallback, useMemo } from 'preact/hooks'
import useInspectorStore from '../state'
import type { ContextFlags } from '../../../lib/drivers/impl'

export default function BundleGraphTab(): JSX.Element {
  const tree = useInspectorStore(s => s.pathtree)
  const selection = useInspectorStore(s => s.selection)
  const driver = useInspectorStore(s => s.bundleDriver)
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleSeed)
  const ns = useInspectorStore(s => s.ns)
  const cm = useInspectorStore(s => s.cm)

  const snapshot = useInspectorStore(s => s.bundleSnapshot)
  const setSnapshot = useInspectorStore(s => s.setBundleSnapshot)

  const makeGraph = useCallback(() => {
    const builder = new BundleGraphBuilder(tree, selection)
    return builder.build()
  }, [tree, selection])

  const flags = useMemo<ContextFlags<BundleOptions>>(
    () => ({ options: { ns, cm }, layout, seed }),
    [cm, layout, ns, seed],
  )

  return (
    <GraphDisplay
      loader={bundles}
      name={driver}
      makeGraph={makeGraph}
      flags={flags}
      panel={BundleGraphPanel}
      handle='Customize'
      snapshot={snapshot}
      setSnapshot={setSnapshot}
    />
  )
}

function BundleGraphPanel(
  props: PanelProps<BundleNode, BundleEdge, BundleOptions, never>,
): JSX.Element {
  const driver = useInspectorStore(s => s.bundleDriver)
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleSeed)

  const setDriver = useInspectorStore(s => s.setBundleDriver)
  const setLayout = useInspectorStore(s => s.setBundleLayout)
  const setSeed = useInspectorStore(s => s.setBundleSeed)

  return (
    <ControlGroup>
      <DriverControl
        driverNames={bundles.names}
        driver={driver}
        layout={layout}
        seed={seed}
        onChangeDriver={setDriver}
        onChangeLayout={setLayout}
        onChangeSeed={setSeed}
        {...props}
      />
      <ExportControl {...props} />
    </ControlGroup>
  )
}
