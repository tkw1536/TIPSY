import type { ComponentChildren, VNode, JSX } from 'preact'
import * as styles from './index.module.css'
import { useEffect, useState } from 'preact/hooks'

interface LoaderProps {
  message?: ComponentChildren
}
export default function Spinner({ message }: LoaderProps): VNode<any> {
  return (
    <AvoidFlicker>
      <div class={styles.spinner}>
        <div class={styles.icon} role='progressbar'></div>
        {typeof message !== 'undefined' && (
          <div class={styles.message}>{message}</div>
        )}
      </div>
    </AvoidFlicker>
  )
}

function AvoidFlicker(props: {
  delayMS?: number
  children: JSX.Element | null
}): JSX.Element | null {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true)
    }, props.delayMS ?? 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [props.delayMS])

  if (!visible) return null
  return props.children
}
