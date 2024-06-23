import { Component, ComponentChild } from 'preact'
import type { ViewProps } from '../viewer'
import { NamespaceMap } from '../../lib/namespace'
import { Bundle, Field } from '../../lib/pathtree'
import * as styles from './list.module.css'
import { classes } from '../../lib/utils/classes'

export default class ListView extends Component<ViewProps> {
  private readonly handleSelectAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.selectAll()
  }

  private readonly handleSelectNone = (evt: Event): void => {
    evt.preventDefault()
    this.props.selectNone()
  }

  private readonly handleExpandAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.expandAll()
  }

  private readonly handleCollapseAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.collapseAll()
  }

  private readonly handleResetColor = (evt: Event): void => {
    evt.preventDefault()
    this.props.resetColorMap()
  }

  render (): ComponentChild {
    const { tree } = this.props
    return (
      <>
        <p>
          This page displays the pathbuilder  as a hierarchical structure.
          It is similar to the WissKI Interface, except read-only.
        </p>
        <p>
          The checkboxes here are used to include the paths in the graph displays.
          Use the shift key to update the all child values recursively.
        </p>
        <p>
          The color boxes are used to change the color of the fields in the graph displays.
          If a single node includes multiple colors, any of the colors may be used.
        </p>

        <table class={styles.table}>
          <thead>
            <tr>
              <th />
              <th>Title</th>
              <th>ID</th>
              <th>Path</th>
              <th>Field Type</th>
              <th>Cardinality</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6}>
                Select: &nbsp;
                <button onClick={this.handleSelectAll}>All</button> &nbsp;
                <button onClick={this.handleSelectNone}>None</button>
                &nbsp;
                Color: &nbsp;
                <button onClick={this.handleResetColor}>Reset</button> &nbsp;
              </td>
            </tr>
            <tr>
              <td colSpan={6}>
                <button onClick={this.handleCollapseAll}>Collapse All</button> &nbsp;
                <button onClick={this.handleExpandAll}>Expand All</button>
              </td>
            </tr>
            {tree.mainBundles.map(b => <BundleRows {...this.props} visible bundle={b} level={0} key={b.path().id} />)}
          </tbody>
        </table>
      </>
    )
  }
}

const INDENT_PER_LEVEL = 50

class BundleRows extends Component<ViewProps & { bundle: Bundle, level: number, visible: boolean }> {
  private readonly handleClick = (evt: Event): void => {
    evt.preventDefault()

    this.props.toggleCollapsed(this.props.bundle.path().id)
  }

  private shiftHeld = false
  private readonly handleKeydown = (evt: MouseEvent): void => {
    this.shiftHeld = evt.shiftKey
  }

  private readonly handleSelectionChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    evt.preventDefault()

    const { bundle, updateSelection } = this.props

    const keys = this.shiftHeld ? bundle.allChildren() : [bundle.path().id]
    const value = evt.currentTarget.checked

    updateSelection(keys.map(k => [k, value]))
  }

  private readonly handleColorChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    const { bundle, setColor } = this.props
    setColor(bundle.path().id, evt.currentTarget.value)
  }

  render (): ComponentChild {
    const { bundle, level, visible, ...props } = this.props
    const { ns, cm, selection, collapsed } = props

    const path = bundle.path()
    const expanded = !collapsed.includes(path.id)
    return (
      <>
        <tr class={!visible ? styles.hidden : ''}>
          <td>
            <input type='checkbox' checked={selection.includes(path.id)} onClick={this.handleKeydown} onInput={this.handleSelectionChange} />
            <input type='color' value={cm.get(path.id)} onInput={this.handleColorChange} />
          </td>
          <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
            <button onClick={this.handleClick} aria-role='toggle' disabled={bundle.childBundles.length === 0 && bundle.childFields.size === 0}>
              {expanded ? '∨' : '>'}
            </button>
                    &nbsp;
            {path.name}
          </td>
          <td>
            <code>{path.id}</code>
          </td>
          <td>
            {path.pathArray.map((p, i) => {
              let role: Role
              if (i === 2 * path.disambiguation - 2) {
                role = 'disambiguation'
              } else if (i % 2 === 0) {
                role = 'object'
              } else {
                role = 'predicate'
              }
              return <PathElement role={role} key={`${i}-${p}`} ns={ns} uri={p} />
            })}
          </td>
          <td />
          <td>
            {path.cardinality > 0 ? path.cardinality : 'unlimited'}
          </td>
        </tr>

        {Array.from(bundle.childFields.entries()).map(([id, field]) => <FieldRow {...props} visible={visible && expanded} level={level + 1} field={field} key={id} />)}
        {bundle.childBundles.map(bundle => <BundleRows {...props} visible={visible && expanded} level={level + 1} bundle={bundle} key={bundle.path().id} />)}
      </>
    )
  }
}

class FieldRow extends Component<ViewProps & { field: Field, level: number, visible: boolean }> {
  private readonly handleSelectionChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    this.props.updateSelection([[this.props.field.path().id, evt.currentTarget.checked]])
  }

  private readonly handleColorChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    const { field, setColor } = this.props
    setColor(field.path().id, evt.currentTarget.value)
  }

  render (): ComponentChild {
    const { ns, cm, field, level, visible, selection } = this.props
    const path = field.path()
    return (
      <tr class={!visible ? styles.hidden : ''}>
        <td>
          <input type='checkbox' checked={selection.includes(path.id)} onInput={this.handleSelectionChange} />
          <input type='color' value={cm.get(path.id)} onInput={this.handleColorChange} />
        </td>
        <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
          {path.name}
        </td>
        <td>
          <code>{path.id}</code>
        </td>
        <td>
          {path.pathArray.map((p, i) => {
            let role: Role
            if (i === 2 * path.disambiguation - 2) {
              role = 'disambiguation'
            } else if (i % 2 === 0) {
              role = 'object'
            } else {
              role = 'predicate'
            }
            return <PathElement role={role} key={`${i}-${p}`} ns={ns} uri={p} />
          })}
          {path.datatypeProperty !== '' && <PathElement role='datatype' ns={ns} uri={path.datatypeProperty} />}
        </td>
        <td>
          {path.informativeFieldType}
        </td>
        <td>
          {path.cardinality > 0 ? path.cardinality : 'unlimited'}
        </td>
      </tr>
    )
  }
}

type Role = 'datatype' | 'disambiguation' | 'object' | 'predicate'

class PathElement extends Component<{ uri: string, role: Role, ns: NamespaceMap }> {
  render (): ComponentChild {
    const { uri, ns, role } = this.props
    return <><span class={classes(styles.path, styles[`path_${role}`])}>{ns.apply(uri)}</span></>
  }
}
