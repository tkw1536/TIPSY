import type { JSX } from 'preact'
import ModelGraphBuilder from '../../../lib/graph/builders/model'
import { explanations, names, values } from '../state/datatypes/deduplication'
import { models } from '../../../lib/drivers/collection'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  Control,
  ControlGroup,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'

import type {
  ModelOptions,
  ModelEdge,
  ModelNode,
  ModelDisplay,
  ModelAttachmentKey,
} from '../../../lib/graph/builders/model/labels'
import { useCallback, useMemo } from 'preact/hooks'
import useInspectorStore from '../state'
import { Radio } from '../../../components/form/dropdown'
import { Switch } from '../../../components/form/checkbox'
import type { ContextFlags } from '../../../lib/drivers/impl'
import * as styles from './model.module.css'

export default function ModelGraphView(): JSX.Element {
  const tree = useInspectorStore(s => s.pathtree)
  const selection = useInspectorStore(s => s.selection)
  const deduplication = useInspectorStore(s => s.modelDeduplication)
  const display = useInspectorStore(s => s.modelDisplay)
  const cm = useInspectorStore(s => s.cm)
  const driver = useInspectorStore(s => s.modelDriver)
  const seed = useInspectorStore(s => s.modelSeed)
  const layout = useInspectorStore(s => s.modelLayout)

  const snapshot = useInspectorStore(s => s.modelSnapshot)
  const setSnapshot = useInspectorStore(s => s.setModelSnapshot)

  const size = useInspectorStore(s => s.modelSize)
  const setSize = useInspectorStore(s => s.setModelSize)

  const ns = useInspectorStore(s => s.ns)

  const builder = useCallback(() => {
    const builder = new ModelGraphBuilder(tree, {
      include: selection.includes.bind(selection),
      deduplication,
    })
    return builder.build()
  }, [tree, selection, deduplication])

  const flags = useMemo<ContextFlags<ModelOptions>>(
    () => ({ options: { ns, cm, display }, layout, seed }),
    [cm, display, layout, ns, seed],
  )

  return (
    <GraphDisplay
      loader={models}
      makeGraph={builder}
      name={driver}
      flags={flags}
      panel={ModelGraphPanel}
      handle='Customize'
      snapshot={snapshot}
      setSnapshot={setSnapshot}
      size={size}
      onChangeSize={setSize}
    />
  )
}

function ModelGraphPanel(
  props: PanelProps<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>,
): JSX.Element {
  const driver = useInspectorStore(s => s.modelDriver)

  const seed = useInspectorStore(s => s.modelSeed)
  const layout = useInspectorStore(s => s.modelLayout)
  const deduplication = useInspectorStore(s => s.modelDeduplication)
  const display = useInspectorStore(s => s.modelDisplay)

  const setModelDeduplication = useInspectorStore(s => s.setModelDeduplication)
  const setModelDriver = useInspectorStore(s => s.setModelDriver)
  const setModelDisplay = useInspectorStore(s => s.setModelDisplay)
  const setModelLayout = useInspectorStore(s => s.setModelLayout)
  const setModelSeed = useInspectorStore(s => s.setModelSeed)

  return (
    <ControlGroup>
      <DriverControl
        driverNames={models.names}
        driver={driver}
        layout={layout}
        seed={seed}
        onChangeDriver={setModelDriver}
        onChangeLayout={setModelLayout}
        onChangeSeed={setModelSeed}
        {...props}
      />
      <ModelGraphDisplayControl display={display} onUpdate={setModelDisplay} />
      <Control name='Deduplication'>
        <p>
          Classes may occur in the pathbuilder more than once. Usually, each
          class would be shown as many times as each occurs. Instead, it might
          make sense to deduplicate nodes and only show classes fewer times.
        </p>
        <p>Changing this value will re-render the graph.</p>

        <Radio
          value={deduplication}
          values={values}
          onInput={setModelDeduplication}
          titles={names}
          descriptions={explanations}
        />
      </Control>
      <ExportControl {...props} />
    </ControlGroup>
  )
}

interface ModelDisplayControlProps {
  display: ModelDisplay
  onUpdate: (display: ModelDisplay) => void
}
function ModelGraphDisplayControl(
  props: ModelDisplayControlProps,
): JSX.Element {
  const showLiterals = props.display.Compounds.DataFields
  const complexLiterals = showLiterals && props.display.Literal.complex

  const showBundles = props.display.Compounds.Bundles

  const showFields = props.display.Compounds.ConceptFields
  const complexFields = showFields && props.display.Concept.complex

  const showConcepts = showBundles || showFields
  const complexConcepts = showConcepts && props.display.Concept.complex

  return (
    <Control name='Display' class={styles.duals}>
      <Control name='Paths' nested>
        <table>
          <tbody>
            <tr>
              <td>
                <DisplayCheckbox
                  a='Labels'
                  b='Concept'
                  {...props}
                  label='Concept URIs'
                />
              </td>
              <td>
                <DisplayCheckbox
                  a='Labels'
                  b='Property'
                  {...props}
                  label='Property URIs'
                />
              </td>
            </tr>

            <tr>
              <td colSpan={2}>
                The following switches control if these are shown in addition to
                the pure concept / predicate structure.
              </td>
            </tr>

            <tr>
              <td colspan={2}>
                <DisplayCheckbox
                  a='Compounds'
                  b='Bundles'
                  {...props}
                  label='Bundles'
                />
              </td>
            </tr>

            <tr>
              <td>
                <DisplayCheckbox
                  a='Compounds'
                  b='DataFields'
                  {...props}
                  label='Data Fields'
                />
              </td>
              <td>
                <DisplayCheckbox
                  a='Compounds'
                  b='ConceptFields'
                  {...props}
                  label='Concept Fields'
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Control>

      <Control name='Concepts' nested>
        <table>
          <tbody>
            <tr>
              <td>
                <DisplayCheckbox
                  a='Concept'
                  b='complex'
                  {...props}
                  disabled={!showConcepts}
                  label='Complex'
                />
              </td>
              <td>
                <DisplayCheckbox
                  a='Concept'
                  b='boxed'
                  {...props}
                  disabled={!complexConcepts}
                  label='Boxed'
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                Complex bundle and field nodes show the attached bundles and
                fields as separate nodes.
              </td>
            </tr>
            <tr>
              <td>
                <DisplayCheckbox
                  a='Labels'
                  b='Bundle'
                  {...props}
                  disabled={!showBundles}
                  label='Bundle Names'
                />
              </td>
              <td></td>
            </tr>

            <tr>
              <td>
                <DisplayCheckbox
                  {...props}
                  a='Labels'
                  b='ConceptField'
                  disabled={!showFields}
                  label='Field Names'
                />
              </td>
              <td>
                <DisplayCheckbox
                  a='Labels'
                  b='ConceptFieldType'
                  {...props}
                  disabled={!complexFields}
                  label='Field Types'
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Control>

      <Control name='Literals' nested>
        <table>
          <tbody>
            <tr>
              <td>
                <DisplayCheckbox
                  a='Literal'
                  b='complex'
                  {...props}
                  disabled={!showLiterals}
                  label='Complex'
                />
              </td>
              <td>
                <DisplayCheckbox
                  a='Literal'
                  b='boxed'
                  {...props}
                  disabled={!complexLiterals}
                  label='Boxed'
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                Complex literal nodes show the attached field literals as
                separate nodes.
              </td>
            </tr>
            <tr>
              <td>
                <DisplayCheckbox
                  a='Labels'
                  b='DatatypeProperty'
                  {...props}
                  label='Datatype URIs'
                />
              </td>
              <td></td>
            </tr>

            <tr>
              <td>
                <DisplayCheckbox
                  a='Labels'
                  b='DatatypeField'
                  {...props}
                  disabled={!showLiterals}
                  label='Field Names'
                />
              </td>
              <td>
                <DisplayCheckbox
                  a='Labels'
                  b='DatatypeFieldType'
                  {...props}
                  disabled={!complexLiterals}
                  label='Field Types'
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Control>
    </Control>
  )
}

interface DisplayCheckboxProps<
  A extends keyof ModelDisplay,
  B extends keyof ModelDisplay[A],
> extends ModelDisplayControlProps {
  a: A
  b: B
  disabled?: boolean
  label: string
}

function DisplayCheckbox<
  A extends keyof ModelDisplay,
  B extends keyof ModelDisplay[A],
>(props: DisplayCheckboxProps<A, B>): JSX.Element {
  const { a, b, display, ...rest } = props

  const value = display[a][b]
  const set = useCallback(
    (display: ModelDisplay, checked: boolean): ModelDisplay => {
      return {
        ...display,
        [a]: {
          ...display[a],
          [b]: checked,
        },
      }
    },
    [a, b],
  )

  return (
    <ComponentCheckbox
      value={value as boolean}
      set={set}
      display={display}
      {...rest}
    />
  )
}

interface ComponentCheckboxProps extends ModelDisplayControlProps {
  value: boolean
  disabled?: boolean
  set: (display: ModelDisplay, checked: boolean) => ModelDisplay
  label: string
}

function ComponentCheckbox(props: ComponentCheckboxProps): JSX.Element {
  const { onUpdate, set, display, value, disabled, label } = props
  const handleInput = useCallback(
    (checked: boolean) => {
      onUpdate(set(display, checked))
    },
    [display, onUpdate, set],
  )

  return (
    <Switch
      title={label}
      value={value}
      onInput={handleInput}
      disabled={disabled}
    />
  )
}
