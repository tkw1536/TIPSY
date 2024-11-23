import { type JSX, useCallback } from 'preact/compat'
import GenericInput, {
  ariaEntries,
  datasetEntries,
  Label,
  type ValidationProps,
  type InputLikeProps,
  type HTMLInputAttributes,
} from './generic'
import useModifierRef from './generic/modifiers'
import type { ComponentChildren } from 'preact'
import { useOptionalId } from '../hooks/id'
import * as styles from './checkbox.module.css'

interface BooleanInputProps extends InputLikeProps<boolean> {
  title?: string
  children?: ComponentChildren
}

export default function Checkbox(props: BooleanInputProps): JSX.Element {
  return <BooleanInput {...props} switch={false} />
}

export function Switch(props: BooleanInputProps): JSX.Element {
  return <BooleanInput {...props} switch={true} />
}

function BooleanInput({
  value,
  disabled,
  onInput,
  id: userId,
  customValidity,
  reportValidity,
  form,
  title,
  children,
  switch: asSwitch,
  ...rest
}: BooleanInputProps & { switch: boolean }): JSX.Element {
  const modifiers = useModifierRef()

  const handleChange = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }) => {
      event.preventDefault()

      if (disabled === true || typeof onInput !== 'function') return

      const { checked, dataset } = event.currentTarget
      onInput(checked, dataset, modifiers.current)
    },
    [disabled, modifiers, onInput],
  )

  const ariaRoleThings: Partial<
    Omit<HTMLInputAttributes, keyof ValidationProps>
  > = asSwitch
    ? { 'role': 'switch', 'aria-checked': value === true }
    : {
        'role': 'checkbox',
        'aria-checked': value ?? 'mixed',
      }

  const id = useOptionalId(userId)

  return (
    <>
      <GenericInput
        type='checkbox'
        id={id}
        class={asSwitch ? styles.toggle : styles.checkbox}
        form={form}
        checked={value}
        disabled={disabled}
        onInput={handleChange}
        customValidity={customValidity}
        reportValidity={reportValidity}
        {...datasetEntries(rest)}
        {...ariaEntries({ disabled, customValidity, reportValidity })}
        {...ariaRoleThings}
      />
      {(typeof title !== 'undefined' || typeof children !== 'undefined') && (
        <Label id={id} title={title}>
          {children}
        </Label>
      )}
    </>
  )
}
