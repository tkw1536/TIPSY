import type { JSX } from 'preact'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  ControlGroup,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'
import RDFGraphBuilder, {
  type RDFOptions,
  type RDFEdge,
  type RDFNode,
} from '../../../lib/graph/builders/rdf'
import { triples } from '../../../lib/drivers/collection'
import useRDFStore from '../state'
import { useCallback, useMemo } from 'preact/hooks'
import type { ContextFlags } from '../../../lib/drivers/impl'

export default function VisualTab(): JSX.Element {
  const store = useRDFStore(s => s.store)
  const layout = useRDFStore(s => s.rdfGraphLayout)
  const driver = useRDFStore(s => s.rdfGraphDriver)
  const seed = useRDFStore(s => s.rdfGraphSeed)
  const snapshot = useRDFStore(s => s.rdfGraphSnapshot)
  const setSnapshot = useRDFStore(s => s.setRDFSnapshot)
  const ns = useRDFStore(s => s.ns)

  const makeVisual = useCallback(() => {
    const builder = new RDFGraphBuilder(store)
    return builder.build()
  }, [store])

  const flags = useMemo<ContextFlags<RDFOptions>>(
    () => ({ options: { ns }, layout, seed }),
    [layout, ns, seed],
  )

  return (
    <GraphDisplay
      loader={triples}
      name={driver}
      flags={flags}
      makeGraph={makeVisual}
      panel={VisualTabPanel}
      snapshot={snapshot}
      setSnapshot={setSnapshot}
    />
  )
}

function VisualTabPanel(
  props: PanelProps<RDFNode, RDFEdge, RDFOptions, never>,
): JSX.Element {
  const driver = useRDFStore(s => s.rdfGraphDriver)
  const setDriver = useRDFStore(s => s.setRDFDriver)

  const layout = useRDFStore(s => s.rdfGraphLayout)
  const setLayout = useRDFStore(s => s.setRDFLayout)

  const seed = useRDFStore(s => s.rdfGraphSeed)
  const setSeed = useRDFStore(s => s.setRDFSeed)

  return (
    <ControlGroup>
      <DriverControl
        driver={driver}
        driverNames={triples.names}
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
