import { useCallback, useState } from 'preact/hooks'
import type { JSX } from 'preact/jsx-runtime'
import * as styles from './panel.module.css'
import { classes } from '../../lib/utils/classes'
import type { ComponentChildren } from 'preact'

interface PanelProps {
  /** current state of the panel (only respected if controlled) */
  open?: boolean

  /** set to make this a controlled component */
  setOpen?: (open: boolean) => void

  /** main content */
  children: ComponentChildren

  /** contents of the panel */
  panel: ComponentChildren

  /** the text of the handle (if any) */
  handle?: string

  /** the width of the panel when opened */
  width?: number | string

  /** the margin between the handle and the beginning of the content */
  margin?: number | string
}

type ControlKeys = 'open' | 'setOpen'
type UnPanelProps = Omit<PanelProps, ControlKeys>
type ConPanelProps = UnPanelProps & Required<Pick<PanelProps, ControlKeys>>

export function Panel(props: PanelProps): JSX.Element {
  const { open, setOpen, ...rest } = props
  if (typeof setOpen !== 'undefined') {
    return <ControlledPanel open={open ?? false} setOpen={setOpen} {...rest} />
  }
  return <UncontrolledPanel {...rest}></UncontrolledPanel>
}

function UncontrolledPanel(props: UnPanelProps): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <ControlledPanel {...props} open={open} setOpen={setOpen}></ControlledPanel>
  )
}

function ControlledPanel(props: ConPanelProps): JSX.Element {
  const {
    open,
    setOpen,
    panel,
    children,
    width,
    margin: padding,
    handle,
  } = props
  const toggle = useCallback(
    (event: Event) => {
      event.preventDefault()
      setOpen(!open)
    },
    [open, setOpen],
  )

  const style = {
    '--panel-margin': addUnit(padding ?? 0, 'px'),
    '--panel-width': addUnit(width ?? 500, 'px'),
  }

  return (
    <div
      class={classes(styles.panel, open ? styles.open : styles.closed)}
      style={style}
    >
      <aside class={classes(styles.sidebar)} role='complementary'>
        {panel}
      </aside>
      <button
        class={classes(styles.handle)}
        onClick={toggle}
        role='button'
        title={open ? 'Close Sidebar' : 'Open Sidebar'}
      >
        {typeof handle === 'string' && <span>{handle}</span>}
      </button>
      <div class={classes(styles.main)}>{children}</div>
    </div>
  )
}

function addUnit(value: number | string, unit: string): string {
  if (typeof value === 'string') return value
  return value.toString() + unit
}
