import {
  Children,
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
  useEffect,
  useRef,
} from 'preact/compat'
import { useCombine } from '../../../lib/utils/ref'
import type { ModifierKeys } from './modifiers'
import type { ComponentChildren } from 'preact'
import { classes } from '../../../lib/utils/classes'
import * as styles from './index.module.css'

export type InputLikeProps<T> = ValidationProps &
  Dataset & {
    /** the id of this element */
    id?: string

    /** the current value of this input */
    value?: T

    /** a function to call when the input is changed */
    onInput?: (value: T, dataset: DOMStringMap, modifiers: ModifierKeys) => void

    /** the form to link the input element to, if any */
    form?: string
  }

export interface ValidationProps {
  /** if true, disable the input, and prevent any actions from taking place */
  disabled?: boolean

  /**
   * A custom validity message to set for the element using {@link HTMLInputElement.setCustomValidity}
   * If the empty string, consider the element valid.
   * If undefined, leave it to native browser validation.
   */
  customValidity?: string

  /** should we report the validation message  */
  reportValidity?: boolean
}

type GenericInputProps = Omit<HTMLInputAttributes, keyof ValidationProps> &
  ValidationProps

export type HTMLInputAttributes = HTMLAttributes<HTMLInputElement> & {
  type?: string
  name?: string
  form?: string
  value?: string | number
  autoComplete?: 'off'
  checked?: boolean
}

const GenericInput = forwardRef(function GenericInputWithValidity(
  { customValidity, reportValidity, ...rest }: GenericInputProps,
  ref: ForwardedRef<HTMLInputElement>,
): JSX.Element {
  const ourRef = useRef<HTMLInputElement>(null)
  const combinedRef = useCombine(ourRef, ref)

  useEffect(() => {
    const { current: input } = ourRef
    if (input === null) return

    if (typeof customValidity !== 'string') return

    input.setCustomValidity(customValidity)

    // if reportValidity is given, report only if it's true
    // else report if we're the active element
    if (
      typeof reportValidity === 'boolean'
        ? reportValidity
        : document.activeElement === input
    ) {
      input.reportValidity()
    }

    return () => {
      input.setCustomValidity('')
      input.reportValidity()
    }
  }, [customValidity, reportValidity])

  return <input {...rest} ref={combinedRef} />
})
export default GenericInput

interface LabelProps {
  id: string
  title?: string
  children?: ComponentChildren
}

export const Label = forwardRef(function Label(
  props: LabelProps,
  ref: ForwardedRef<HTMLLabelElement>,
): JSX.Element {
  const { id, title, children } = props

  return (
    <label for={id} ref={ref} class={classes(styles.label)}>
      {typeof title === 'string' && (
        <span
          class={classes(
            // styles.title,
            Children.count(children) > 0 && styles.no_content_title,
          )}
        >
          {title}
        </span>
      )}
      {children}
    </label>
  )
})

type Dataset = Record<`data-${string}`, string | undefined>

export function datasetEntries(dataset: Dataset): Dataset {
  return Object.fromEntries(
    Object.entries(dataset).filter(
      ([k, v]) =>
        k.startsWith('data-') &&
        (typeof v === 'string' || typeof v === 'undefined'),
    ),
  )
}

type Aria = Record<`aria-${string}`, string | boolean | undefined>
export function ariaEntries(props: ValidationProps): Aria {
  const aria: Aria = {}
  if (typeof props.customValidity !== 'undefined') {
    aria['aria-invalid'] = props.customValidity !== ''
  }
  if (typeof props.disabled !== 'undefined') {
    aria['aria-disabled'] = props.disabled
  }
  return aria
}
