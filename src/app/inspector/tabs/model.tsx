import { type JSX, type RefObject } from 'preact'
import ModelGraphBuilder from '../../../lib/graph/builders/model'
import type Deduplication from '../state/state/deduplication'
import { explanations, names, values } from '../state/state/deduplication'
import { models } from '../../../lib/drivers/collection'
import type Driver from '../../../lib/drivers/impl'
import GraphDisplay, {
  Control,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display'
import {
  setModelDeduplication,
  setModelDisplay,
  setModelDriver,
  setModelLayout,
  setModelSeed,
} from '../state/reducers/model'
import type Graph from '../../../lib/graph'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelDisplay,
  type ModelAttachmentKey,
} from '../../../lib/graph/builders/model/labels'
import { useCallback, useId, useMemo, useRef } from 'preact/hooks'
import { useInspectorStore } from '../state'

export default function ModelGraphView(): JSX.Element {
  const tree = useInspectorStore(s => s.tree)
  const pbVersion = useInspectorStore(s => s.pathbuilderVersion)

  const selection = useInspectorStore(s => s.selection)
  const selectionVersion = useInspectorStore(s => s.selectionVersion)
  const deduplication = useInspectorStore(s => s.modelDeduplication)

  const display = useInspectorStore(s => s.modelDisplay)
  const optionVersion = useInspectorStore(s => s.modelGraphOptionVersion)

  const cm = useInspectorStore(s => s.cm)
  const cmVersion = useInspectorStore(s => s.colorVersion)

  const driver = useInspectorStore(s => s.modelGraphDriver)
  const seed = useInspectorStore(s => s.modelGraphSeed)
  const layout = useInspectorStore(s => s.modelGraphLayout)

  const ns = useInspectorStore(s => s.ns)

  const displayRef =
    useRef<
      GraphDisplay<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>
    >(null)

  const builder = useMemo(() => {
    return async (): Promise<Graph<ModelNode, ModelEdge>> => {
      const builder = new ModelGraphBuilder(tree, {
        include: selection.includes.bind(selection),
        deduplication,
      })
      return await builder.build()
    }
  }, [ModelGraphBuilder, tree, selection, deduplication])

  const builderKey = `${pbVersion}-${selectionVersion}-${optionVersion}-${cmVersion}`

  const renderPanel = useMemo(() => {
    return (
      driver: ModelGraphPanelProps['driver'],
      animating: ModelGraphPanelProps['animating'],
    ) => {
      return (
        <ModelGraphPanel
          displayRef={displayRef}
          driver={driver}
          animating={animating}
        />
      )
    }
  }, [ModelGraphPanel, displayRef])

  const options = useMemo(() => ({ ns, cm, display }), [ns, cm, display])

  return (
    <GraphDisplay
      ref={displayRef}
      loader={models}
      builderKey={builderKey}
      makeGraph={builder}
      driver={driver}
      seed={seed}
      options={options}
      layout={layout}
      panel={renderPanel}
    />
  )
}

interface ModelGraphPanelProps {
  driver: Driver<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey> | null
  animating: boolean | null
  displayRef: RefObject<
    GraphDisplay<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>
  >
}
function ModelGraphPanel(props: ModelGraphPanelProps): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const seed = useInspectorStore(s => s.modelGraphSeed)
  const layout = useInspectorStore(s => s.modelGraphLayout)
  const deduplication = useInspectorStore(s => s.modelDeduplication)
  const display = useInspectorStore(s => s.modelDisplay)

  const id = useId()
  const { driver, animating, displayRef } = props

  const handleChangeMode = useCallback(
    (evt: Event): void => {
      apply(
        setModelDeduplication(
          (evt.target as HTMLInputElement).value as Deduplication,
        ),
      )
    },
    [apply, setModelDeduplication],
  )

  const handleChangeModelRenderer = useCallback(
    (value: string): void => {
      apply(setModelDriver(value))
    },
    [apply, setModelDriver],
  )

  const handleChangeDisplay = useCallback(
    (display: ModelDisplay): void => {
      apply(setModelDisplay(display))
    },
    [apply, setModelDisplay],
  )

  const handleChangeModelLayout = useCallback(
    (value: string): void => {
      apply(setModelLayout(value))
    },
    [apply, setModelLayout],
  )

  const handleChangeModelSeed = useCallback(
    (seed: number | null): void => {
      apply(setModelSeed(seed))
    },
    [apply, setModelSeed],
  )

  const handleResetDriver = useCallback((): void => {
    const { current: display } = displayRef
    display?.remount()
  }, [displayRef])

  return (
    <>
      <DriverControl
        driverNames={models.names}
        driver={driver}
        currentLayout={layout}
        seed={seed}
        onChangeDriver={handleChangeModelRenderer}
        onChangeLayout={handleChangeModelLayout}
        onChangeSeed={handleChangeModelSeed}
        onResetDriver={handleResetDriver}
        animating={animating}
      />
      <ModelGraphDisplayControl
        display={display}
        onUpdate={handleChangeDisplay}
      />
      <Control name='Deduplication'>
        <p>
          Classes may occur in the pathbuilder more than once. Usually, each
          class would be shown as many times as each occurs. Instead, it might
          make sense to deduplicate nodes and only show classes fewer times.
        </p>
        <p>Changing this value will re-render the graph.</p>

        <div onInput={handleChangeMode}>
          {values.map(v => (
            <p key={v}>
              <input
                name={`${id}-dedup-mode`}
                id={`${id}-dedup-mode-${v}`}
                type='radio'
                checked={deduplication === v}
                value={v}
              />
              <label for={`${id}-dedup-mode-${v}`}>
                <em>{names[v]}.</em>
                &nbsp;
                {explanations[v]}
              </label>
            </p>
          ))}
        </div>
      </Control>
      <ExportControl driver={driver} display={displayRef.current} />
    </>
  )
}

interface ModelDisplayControlProps {
  display: ModelDisplay
  onUpdate: (display: ModelDisplay) => void
}
function ModelGraphDisplayControl(
  props: ModelDisplayControlProps,
): JSX.Element {
  return (
    <Control name='Display'>
      <p>Changing this value will re-render the graph.</p>

      <table>
        <tbody>
          <tr>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.ComplexConceptNodes}
                set={(display, ComplexConceptNodes) => ({
                  ...display,
                  ComplexConceptNodes,
                })}
                label='Complex Concept Nodes'
              />
            </td>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.ComplexLiteralNodes}
                set={(display, ComplexLiteralNodes) => ({
                  ...display,
                  ComplexLiteralNodes,
                })}
                label='Complex Literal Nodes'
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              Disabling these will render appropriate bundle and field labels
              directly at the respective nodes.
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <br />
            </td>
          </tr>

          <tr>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Property}
                set={(display, PropertyLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Property: PropertyLabels,
                  },
                })}
                label='Property Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.ConceptField}
                set={(display, ConceptFieldLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    ConceptField: ConceptFieldLabels,
                  },
                })}
                label='Field Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.ConceptFieldType}
                set={(display, ConceptFieldTypes) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    ConceptFieldType: ConceptFieldTypes,
                  },
                })}
                label='Field Types'
              />
            </td>

            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeProperty}
                set={(display, DatatypePropertyLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeProperty: DatatypePropertyLabels,
                  },
                })}
                label='Datatype Property Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeField}
                set={(display, DatatypeFieldLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeField: DatatypeFieldLabels,
                  },
                })}
                label='Datatype Field Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeFieldType}
                set={(display, DatatypeFieldTypes) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeFieldType: DatatypeFieldTypes,
                  },
                })}
                label='Datatype Field Types'
              />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <br />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Concept}
                set={(display, ConceptLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Concept: ConceptLabels,
                  },
                })}
                label='Concept Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Bundle}
                set={(display, BundleLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Bundle: BundleLabels,
                  },
                })}
                label='Bundle Labels'
              />
            </td>
          </tr>
        </tbody>
      </table>
    </Control>
  )
}

interface ComponentCheckboxProps extends ModelDisplayControlProps {
  value: boolean
  set: (display: ModelDisplay, checked: boolean) => ModelDisplay
  label: string
}

function ComponentCheckbox(props: ComponentCheckboxProps): JSX.Element {
  const handleInput = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      event.preventDefault()
      const { checked } = event.currentTarget
      props.onUpdate(props.set(props.display, checked))
    },
    [props.onUpdate, props.set, props.display],
  )
  const id = useId()
  return (
    <>
      <input
        type='checkbox'
        id={id}
        checked={props.value}
        onInput={handleInput}
      ></input>
      <label for={id}>
        <em>{props.label}</em>
      </label>
    </>
  )
}

// spellchecker:words dedup Renderable
