import {
  type JSX,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from 'preact'
import * as styles from './tabs.module.css'
import { classes } from '../lib/utils/classes'
import { useCallback, useId, useMemo } from 'preact/hooks'
import { Suspense } from 'preact/compat'
import Spinner from './spinner'

interface TabProps {
  title: string
  id: string
  disabled?: boolean
  children: ComponentChildren
}
export function Tab(props: TabProps): JSX.Element {
  return <>{props.children}</>
}

interface LabelProps {
  children?: ComponentChildren
}
export function TabLabel(props: LabelProps): JSX.Element {
  return <>{props.children}</>
}

type TabChild = ({ type: 'label' } & LabelProps) | ({ type: 'tab' } & TabProps)

interface TabsProps {
  active: string
  onChangeTab: (id: string) => void
  children: ComponentChildren
}
export default function Tabs(props: TabsProps): JSX.Element {
  const children = useMemo((): TabChild[] => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we want it explicitly here
    return toChildArray(props.children)
      .filter(
        (child): child is VNode<any> =>
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed by type inference
          child !== null &&
          typeof child === 'object' &&
          Object.prototype.hasOwnProperty.call(child, 'type') &&
          typeof child.type !== 'undefined',
      )
      .map(c => {
        if (c.type === Tab) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- this is fine
          return { type: 'tab', ...c.props }
        }
        if (c.type === TabLabel) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- this is fine
          return { type: 'label', ...c.props }
        }
        return null
      })
      .filter(c => c !== null)
  }, [props.children])

  const { active, onChangeTab } = props
  return (
    <TabInterface active={active} onChangeTab={onChangeTab}>
      {children}
    </TabInterface>
  )
}

type TabInterfaceProps = { children: TabChild[] } & TabsProps

function findTab(
  id: string,
  children: TabInterfaceProps['children'],
): TabProps | null {
  return (
    children.find((child): child is TabChild & { type: 'tab' } => {
      return child.type === 'tab' && id === child.id
    }) ?? null
  )
}

export function TabInterface(props: TabInterfaceProps): JSX.Element {
  const { active, children, onChangeTab } = props

  const handleTabClick = useCallback(
    (event: MouseEvent & { currentTarget: HTMLLIElement }): void => {
      event.preventDefault()

      const { id } = event.currentTarget.dataset
      if (typeof id !== 'string') return

      const tab = findTab(id, children)
      if (tab === null || (tab.disabled ?? false)) return

      onChangeTab(id)
    },
    [children, onChangeTab],
  )

  const id = useId()

  return (
    <div class={styles.container}>
      <ul role='tablist' class={styles.list}>
        {children.map((child, index) => {
          if (child.type === 'label') {
            return (
              <li key={index} class={styles.label}>
                <TabLabel {...child} />
              </li>
            )
          }

          const { disabled, title, id: childID } = child
          const selected = childID === active
          const clz = classes(
            styles.tab,
            (disabled ?? false) && styles.disabled,
            selected && styles.selected,
          )

          const tabID = `${id}-${childID}-tab-${index}`
          const panelID = `${id}-${childID}-panel-${index}`

          return (
            <li
              role='tab'
              data-id={childID}
              onClick={handleTabClick}
              id={tabID}
              tabindex={0}
              key={index}
              aria-selected={selected}
              aria-disabled={disabled}
              class={clz}
              aria-controls={panelID}
            >
              {title}
            </li>
          )
        })}
      </ul>

      {children.map((child, index) => {
        if (child.type === 'label') return null

        const { disabled, children, id: childID } = child

        const selected = childID === active
        const visible = selected && !(disabled ?? false)

        const clz = classes(styles.panel, visible && styles.selected)
        const childNodes = visible ? children : null

        const tabID = `${id}-${childID}-tab-${index}`
        const panelID = `${id}-${childID}-panel-${index}`

        return (
          <div
            role='tabpanel'
            key={index}
            id={panelID}
            aria-labelledby={tabID}
            class={clz}
          >
            <Suspense fallback={<Spinner />}>{childNodes}</Suspense>
          </div>
        )
      })}
    </div>
  )
}
