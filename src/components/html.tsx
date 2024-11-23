import type { ComponentProps, VNode } from 'preact'

import * as styles from './html.module.css'
import Markup from 'preact-markup'
import { classes } from '../lib/utils/classes'

type MarkupProps = ComponentProps<typeof Markup>
type HTMLProps = Omit<MarkupProps, 'type' | 'markup'> & { html: string } & {
  narrow?: boolean
  noContainer?: boolean
}
export default function HTML({
  html,
  noContainer,
  narrow,
  ...rest
}: HTMLProps): VNode<any> {
  const markup = (
    <Markup
      markup={html}
      type='html'
      {...rest}
      wrap={(noContainer ?? false) ? false : undefined}
    />
  )
  if (noContainer ?? false) {
    return markup
  }
  return (
    <div class={classes(styles.container, narrow === true && styles.narrow)}>
      {markup}
    </div>
  )
}
