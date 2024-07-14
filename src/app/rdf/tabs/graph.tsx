import { Component, type ComponentChildren, createRef } from 'preact'
import { type RReducerProps } from '../state'
import GraphDisplay, {
  DriverControl,
  ExportControl,
} from '../../inspector/tabs/inspector/graph'
import ColorMap from '../../../lib/pathbuilder/annotations/colormap'
import RDFGraphBuilder, {
  type RDFEdge,
  type RDFNode,
} from '../../../lib/graph/builders/rdf'
import { setRDFDriver, setRDFLayout } from '../state/reducers/rdf'
import type Graph from '../../../lib/graph'
import type Driver from '../../../lib/drivers/impl'
import { triples } from '../../../lib/drivers/collection'

const BLANK_COLORMAP = ColorMap.empty()

export default class GraphTab extends Component<RReducerProps> {
  readonly buildGraph = async (): Promise<Graph<RDFNode, RDFEdge>> => {
    const builder = new RDFGraphBuilder(this.props.state.store)
    return await builder.build()
  }

  readonly #handleChangeRDFRenderer = (value: string): void => {
    this.props.apply(setRDFDriver(value))
  }

  readonly #handleChangeRDFLayout = (value: string): void => {
    this.props.apply(setRDFLayout(value))
  }

  readonly #displayRef = createRef<GraphDisplay<RDFNode, RDFEdge>>()

  render(): ComponentChildren {
    const { rdfGraphLayout, rdfGraphDriver, ns, namespaceVersion } =
      this.props.state

    return (
      <GraphDisplay
        ref={this.#displayRef}
        loader={triples}
        driver={rdfGraphDriver}
        builderKey={namespaceVersion.toString()}
        makeGraph={this.buildGraph}
        ns={ns}
        cm={BLANK_COLORMAP}
        layout={rdfGraphLayout}
        panel={this.#renderPanel}
      />
    )
  }

  readonly #renderPanel = (
    driver: Driver<RDFNode, RDFEdge> | null,
  ): ComponentChildren => {
    const {
      state: { rdfGraphLayout },
    } = this.props

    return (
      <>
        <DriverControl
          driverNames={triples.names}
          driver={driver}
          currentLayout={rdfGraphLayout}
          onChangeDriver={this.#handleChangeRDFRenderer}
          onChangeLayout={this.#handleChangeRDFLayout}
        />
        <ExportControl driver={driver} display={this.#displayRef.current} />
      </>
    )
  }
}