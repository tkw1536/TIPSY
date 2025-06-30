import type { ComponentChildren, JSX } from 'preact'
import type { NamespaceMap } from '../../../lib/pathbuilder/namespace'
import {
  Bundle,
  Field,
  type PathElement as PathElementT,
} from '../../../lib/pathbuilder/pathtree'
import * as styles from './tree.module.css'
import { classes } from '../../../lib/utils/classes'
import { type ColorPreset, colorPresets } from '../state/datatypes/color'
import DropArea from '../../../components/form/drop-area'
import download from '../../../lib/utils/download'
import { Type } from '../../../lib/utils/media'
import { Panel } from '../../../components/layout/panel'
import { useCallback, useMemo } from 'preact/hooks'
import useInspectorStore from '../state'
import Button, {
  ButtonGroup,
  ButtonGroupText,
} from '../../../components/form/button'
import { reasonAsError, useAsyncLoad } from '../../../components/hooks/async'
import ColorMap from '../../../lib/pathbuilder/annotations/colormap'
import ErrorDisplay from '../../../components/error'
import {
  Control,
  ControlGroup,
} from '../../../components/graph-display/controls'
import Checkbox, { Switch } from '../../../components/form/checkbox'
import Text, { Color } from '../../../components/form/value'
import React, { memo } from 'preact/compat'
import { useShallow } from 'zustand/react/shallow'
import type { ModifierKeys } from '../../../components/form/generic/modifiers'

export default function TreeTab(): JSX.Element {
  const tree = useInspectorStore(s => s.pathtree)
  const search = useInspectorStore(s => s.search)
  const setSearch = useInspectorStore(s => s.setSearch)
  const children = useMemo(() => Array.from(tree.children()), [tree])

  const { maxDepth } = tree

  return (
    <Panel panel={<TreeTabPanel />} margin={5}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th colSpan={4} />
            <th colSpan={1 + maxDepth}>Title</th>
            <th>ID</th>
            <th>Path</th>
            <th>Field Type</th>
            <th>Cardinality</th>
          </tr>
          <tr>
            <td colSpan={4} />
            <td colSpan={2 + maxDepth}>
              <Text value={search} onInput={setSearch} />
            </td>
            <td colSpan={3}></td>
          </tr>
        </thead>
        <tbody>
          {children.map(b => (
            <BundleNode bundle={b} maxDepth={maxDepth} key={b.path.id} />
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

function TreeTabPanel(): JSX.Element {
  return (
    <ControlGroup>
      <OverviewControl />
      <SelectionControl />
      <ColorMapControl />
    </ControlGroup>
  )
}

function OverviewControl(): JSX.Element {
  const hideParents = useInspectorStore(s => s.collapseParentPaths)

  const expandAll = useInspectorStore(s => s.expandAll)
  const collapseAll = useInspectorStore(s => s.collapseAll)

  const setCollapseParentPaths = useInspectorStore(
    s => s.setCollapseParentPaths,
  )

  return (
    <Control name='Overview'>
      <p>
        This page displays the pathbuilder as a hierarchical structure. It is
        similar to the WissKI Interface, except read-only.
      </p>

      <ButtonGroup>
        <Button onInput={collapseAll}>Collapse All</Button>
        <Button onInput={expandAll}>Expand All</Button>
      </ButtonGroup>

      <p>
        <span class={classes(styles.display_path, styles.path_concept)}>
          Concept
        </span>
        <span
          class={classes(
            styles.display_path,
            styles.path_concept,
            styles.path_shared,
          )}
        >
          Concept (shared with parent)
        </span>
        <span
          class={classes(
            styles.display_path,
            styles.path_concept,
            styles.path_disambiguation,
          )}
        >
          Disambiguated Concept
        </span>
        <span class={classes(styles.display_path, styles.path_predicate)}>
          Predicate
        </span>
        <span
          class={classes(
            styles.display_path,
            styles.path_shared,
            styles.path_predicate,
          )}
        >
          Predicate (shared with parent)
        </span>
        <span class={classes(styles.display_path, styles.path_datatype)}>
          Datatype Property
        </span>
      </p>
      <p>
        <Switch value={hideParents} onInput={setCollapseParentPaths}>
          Collapse shared paths into ellipses
        </Switch>
      </p>
    </Control>
  )
}

function SelectionControl(): JSX.Element {
  const search = useInspectorStore(s => s.search)
  const selectAll = useInspectorStore(s => s.selectAll)
  const selectNone = useInspectorStore(s => s.selectNone)

  const selectPredicate = useInspectorStore(s => s.selectPredicate)
  const selectBundles = useCallback(() => {
    selectPredicate(x => x instanceof Bundle)
  }, [selectPredicate])
  const selectFields = useCallback(() => {
    selectPredicate(x => x instanceof Field)
  }, [selectPredicate])
  const selectMatched = useCallback(() => {
    selectPredicate(x => x.path?.matches(search) ?? false)
  }, [selectPredicate, search])

  return (
    <Control name='Selection'>
      <p>
        The checkboxes here are used to include the paths in the graph displays.
        Use the shift key to update the all child values recursively.
      </p>

      <ButtonGroup>
        <Button onInput={selectAll}>Select All</Button>
        <Button onInput={selectNone}>Select None</Button>
        <Button onInput={selectBundles}>Select Bundles</Button>
        <Button onInput={selectFields}>Select Fields</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button onInput={selectMatched} disabled={search === ''}>
          Selected Matched
        </Button>
      </ButtonGroup>
    </Control>
  )
}

function ColorMapControl(): JSX.Element {
  const cm = useInspectorStore(s => s.cm)

  const setColorMap = useInspectorStore(s => s.setColorMap)
  const [cmLoading, cmLoad, cmClear] = useAsyncLoad(
    setColorMap,
    1000,
    10 * 1000,
    reasonAsError,
  )

  const applyColorPreset = useInspectorStore(s => s.applyColorPreset)
  const handleColorPreset = useCallback(
    (preset: ColorPreset): void => {
      cmClear()
      applyColorPreset(preset)
    },
    [cmClear, applyColorPreset],
  )

  const handleColorMapExport = useCallback((): void => {
    cmClear()
    const data = JSON.stringify(cm.toJSON(), null, 2)
    const blob = new Blob([data], { type: Type.JSON })
    download(blob, 'colors.json', 'json')
  }, [cmClear, cm])

  const loadColorMap = useCallback(
    (file: File) => {
      cmLoad(async () => {
        const text = JSON.parse(await file.text())
        const cm = ColorMap.fromJSON(text)
        if (cm === null) throw new Error('invalid ColorMap')
        return cm
      })
    },
    [cmLoad],
  )

  return (
    <Control name='Color Map'>
      <p>
        The color boxes are used to change the color of the fields in the graph
        displays. If a single node includes multiple colors, the color of the
        most important item will be used. Parent-paths are more important than
        sub-paths; if two paths are of the same priority the one higher in the
        list of paths is used.
      </p>

      <p>
        Use the below presets to assign colors to all nodes or manually pick on
        the right.{' '}
      </p>

      <p>
        <ButtonGroup>
          {colorPresets.map(preset => (
            <Button value={preset} key={preset} onInput={handleColorPreset}>
              {preset}
            </Button>
          ))}
        </ButtonGroup>
      </p>

      <ButtonGroup>
        <Button value={undefined} onInput={handleColorMapExport}>
          Export
        </Button>
        <DropArea
          types={[Type.JSON]}
          onInput={loadColorMap}
          compact
          disabled={cmLoading?.status === 'pending'}
        >
          Import
        </DropArea>
        <ButtonGroupText>
          {cmLoading?.status === 'rejected' && (
            <small>&nbsp; Import failed</small>
          )}
          {cmLoading?.status === 'fulfilled' && (
            <small>&nbsp; Import successful</small>
          )}
          {cmLoading?.status === 'pending' && <small>&nbsp; Loading</small>}
        </ButtonGroupText>
      </ButtonGroup>

      {cmLoading?.status === 'rejected' && (
        <p>
          <ErrorDisplay error={cmLoading.reason} />
        </p>
      )}
    </Control>
  )
}

function BundleNode(props: { bundle: Bundle; maxDepth: number }): JSX.Element {
  const { bundle, maxDepth } = props

  const expanded = useInspectorStore(
    useShallow(s => !s.collapse.includes(bundle)),
  )
  const control = useMemo(() => <BundleControl bundle={bundle} />, [bundle])

  return (
    <>
      <PathRow noChildren={false} node={bundle} maxDepth={maxDepth}>
        {control}
      </PathRow>

      {expanded &&
        Array.from(bundle.children()).map(node => {
          if (node instanceof Bundle) {
            return (
              <BundleNode
                maxDepth={maxDepth}
                bundle={node}
                key={node.path.id}
              />
            )
          }
          if (node instanceof Field) {
            return (
              <FieldRow maxDepth={maxDepth} field={node} key={node.path.id} />
            )
          }
          return null
        })}
    </>
  )
}

interface BundleControlProps {
  bundle: Bundle
}

function BundleControl(props: BundleControlProps): JSX.Element {
  const { bundle } = props

  const toggleNode = useInspectorStore(s => s.toggleNode)

  const handleClick = useCallback((): void => {
    toggleNode(bundle)
  }, [bundle, toggleNode])

  const expanded = useInspectorStore(
    useShallow(s => !s.collapse.includes(bundle)),
  )

  return (
    <Button onInput={handleClick} disabled={bundle.childCount === 0}>
      {expanded ? '∨' : '>'}
    </Button>
  )
}

function FieldRow(props: { field: Field; maxDepth: number }): JSX.Element {
  return (
    <PathRow node={props.field} maxDepth={props.maxDepth} noChildren={true} />
  )
}

interface PathRowProps {
  node: Bundle | Field
  maxDepth: number
  noChildren: boolean
  children?: ComponentChildren
}

const PathRow = memo(function PathRow(props: PathRowProps): JSX.Element {
  const { node, maxDepth } = props

  const matched = useInspectorStore(
    useShallow(s => (s.search === '' ? null : node.path.matches(s.search))),
  )
  const matchCount = useInspectorStore(
    useShallow(s => node.count(n => n.path?.matches(s.search) ?? false, false)),
  )
  const ns = useInspectorStore(s => s.ns)

  const hideParents = useInspectorStore(s => s.collapseParentPaths)

  const updateSelection = useInspectorStore(s => s.updateSelection)
  const handleSelectionChange = useCallback(
    (
      checked: boolean,
      dataset: DOMStringMap,
      modifiers: ModifierKeys,
    ): void => {
      const keys = modifiers.shift ? Array.from(node.walk()) : [node]
      updateSelection(keys.map(k => [k, checked]))
    },
    [node, updateSelection],
  )

  const setColor = useInspectorStore(s => s.setColor)
  const handleColorChange = useCallback(
    (color: string): void => {
      setColor(node, color)
    },
    [node, setColor],
  )

  const selected = useInspectorStore(
    useShallow(s => s.selection.includes(node)),
  )
  const count = useInspectorStore(
    useShallow(s => s.selection.count(node, false)),
  )
  const color = useInspectorStore(useShallow(c => c.cm.getDefault(node)))

  const { path, depth } = node

  const treeLevels = Array(Math.max(depth - 1, 0)).fill(
    <td class={styles.tree_level}></td>,
  )

  const isMainBundle = node instanceof Bundle && node.isMain

  return (
    <tr
      class={classes(
        isMainBundle && styles.main_bundle,
        matched === true && styles.path_matched,
        matched === false && styles.path_not_matched,
      )}
    >
      <td>
        <Checkbox value={selected} onInput={handleSelectionChange} />
      </td>
      <>
        <td>
          <SelectCountBadge count={count} />
        </td>
        <td class={styles.match_spacing}>
          {typeof matched === 'boolean' && <CountBadge count={matchCount} />}
        </td>
      </>
      <td>
        <Color value={color} onInput={handleColorChange} />
      </td>
      {treeLevels}
      <td class={styles.tree_level}>{props.children}</td>
      <td
        colSpan={1 + maxDepth - node.depth}
        class={classes(
          node instanceof Bundle && styles.bundle_name,
          node instanceof Field && styles.field_name,
        )}
      >
        {path.name}
      </td>
      <td>
        <code>{path.id}</code>
      </td>
      <td>
        <Path hideEqualParentPaths={hideParents} node={node} ns={ns} />
      </td>
      <td>{path.informativeFieldType}</td>
      <td>{path.cardinality > 0 ? path.cardinality : 'unlimited'}</td>
    </tr>
  )
})

function SelectCountBadge({ count }: { count: number }): JSX.Element | null {
  if (count === 0) {
    return null
  }
  return (
    <span className={classes(styles.badge, styles.select_badge)}>{count}</span>
  )
}

function CountBadge({ count }: { count: number }): JSX.Element | null {
  return <span className={classes(styles.badge)}>{count}</span>
}

/** renders a single Path */
const Path = memo(function Path(props: {
  hideEqualParentPaths: boolean
  node: Bundle | Field
  ns: NamespaceMap
}): JSX.Element {
  const { hideEqualParentPaths, node, ns } = props
  const elements = Array.from(node.elements())

  const hasCommonElement = elements.some(
    ({ common }) => typeof common === 'number' && common < 0,
  )

  return (
    <>
      {hideEqualParentPaths && hasCommonElement && (
        <span class={classes(styles.path, styles.path_skip)} />
      )}
      {elements.map(element => (
        <PathElement
          element={element}
          key={element.index}
          hideCommon={hideEqualParentPaths}
          ns={ns}
        />
      ))}
    </>
  )
})

function PathElement({
  element,
  hideCommon,
  ns,
}: {
  element: PathElementT
  hideCommon: boolean
  ns: NamespaceMap
}): JSX.Element | null {
  if (hideCommon && typeof element.common === 'number' && element.common < 0) {
    return null
  }

  return (
    <span
      class={classes(
        styles.path,
        ...elementClass(element).map(clz => styles[clz]),
        (element.common ?? 0) < 0 && styles.path_shared,
      )}
    >
      {ns.apply(element.uri)}
    </span>
  )
}

function elementClass(element: PathElementT): string[] {
  if (element.type === 'concept') {
    if (element.disambiguation === 0)
      return ['path_concept', 'path_disambiguation']
    return ['path_concept']
  }
  // element.type === 'property'
  if (element.role === 'datatype') {
    return ['path_datatype']
  }
  return ['path_predicate']
}
