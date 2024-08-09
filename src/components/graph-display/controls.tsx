import { type ComponentChildren, Fragment, type JSX, type VNode } from 'preact'
import download from '../../lib/utils/download'

import type Driver from '../../lib/drivers/impl'
import Dropdown from '../form/dropdown'
import { useCallback, useId } from 'preact/hooks'
import { type Renderable } from '../../lib/graph/builders'
import { type PanelProps } from '.'
import Button, { ButtonGroup } from '../form/button'
import { nextInt } from '../../lib/utils/prng'
import { Label } from '../form/generic'
import { Numeric } from '../form/value'

/** Control that provides only UI components */
export function Control(props: {
  name: string
  class?: string
  children?: ComponentChildren
}): JSX.Element {
  return (
    <fieldset class={props.class}>
      <legend>{props.name}</legend>
      {props.children}
    </fieldset>
  )
}

/** a group of multiple controls */
export function ControlGroup(props: {
  children: Array<VNode<any>>
}): JSX.Element {
  return (
    <>
      {props.children.map((child, idx) => (
        <Fragment key={idx}>
          {child}
          <br />
        </Fragment>
      ))}
    </>
  )
}

interface DriverControlProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey> {
  driverNames: string[]
  driver: string
  layout: string
  seed: number

  /** controls */
  onChangeDriver: (driver: string) => void
  onChangeLayout: (layout: string) => void
  onChangeSeed: (seed: number) => void
}

/**
 * A control to pick which driver to control.
 */
export function DriverControl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: DriverControlProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const {
    driver,
    driverNames,
    layout,
    onChangeDriver,
    onChangeLayout,
    onChangeSeed,
    seed,
    controller,
  } = props

  const id = useId()

  return (
    <Control name='Renderer'>
      <p>
        Show the graph using different renderers and layouts. Changing any value
        automatically re-renders the graph.
      </p>

      <table>
        <tbody>
          <tr>
            <td>
              <Label id={`${id}-renderer`}>Renderer</Label>
            </td>
            <td>
              <Dropdown
                values={driverNames}
                value={driver}
                onInput={onChangeDriver}
              />
            </td>

            <td></td>
            <td>
              <Label id={`${id}-layout`}>Layout</Label>
            </td>
            <td>
              <Dropdown
                disabled={controller === null}
                value={layout}
                values={controller?.instance?.driver?.layouts}
                onInput={onChangeLayout}
              />
            </td>
          </tr>

          <tr>
            <SeedControls
              driver={controller?.instance ?? null}
              seed={seed}
              onChangeSeed={onChangeSeed}
            />
          </tr>

          <tr>
            <SimulationControls {...props} />
          </tr>
        </tbody>
      </table>
    </Control>
  )
}

function SimulationControls<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const { controller } = props

  return (
    <>
      <td>Animation:</td>
      <td>
        <ButtonGroup inline>
          <Button
            disabled={controller?.animating !== false}
            onInput={controller?.instance?.startAnimation}
          >
            Start
          </Button>
          <Button
            disabled={controller?.animating !== true}
            onInput={controller?.instance?.stopAnimation}
          >
            Stop
          </Button>
        </ButtonGroup>
      </td>
      <td></td>

      <td>
        <ButtonGroup inline>
          <Button
            disabled={controller === null}
            onInput={controller?.instance?.remount}
          >
            Reset
          </Button>
        </ButtonGroup>
      </td>
      <td></td>
    </>
  )
}

function SeedControls<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(props: {
  driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null

  seed: number
  onChangeSeed: (seed: number) => void
}): JSX.Element {
  const { driver, seed, onChangeSeed } = props
  const id = useId()

  const handleChangeValue = useCallback(
    (value: number): void => {
      if (isNaN(value) || value < 0) {
        return
      }
      onChangeSeed(value)
    },
    [onChangeSeed],
  )

  const handleNextSeed = useCallback(() => {
    onChangeSeed(nextInt())
  }, [onChangeSeed])

  return (
    <>
      <td>
        <Label id={id}>Seed</Label>
      </td>
      <td colSpan={2}>
        <Numeric
          id={id}
          value={seed}
          disabled={driver === null}
          onInput={handleChangeValue}
        />
      </td>
      <td>
        <Button onInput={handleNextSeed}>Randomize</Button>
      </td>
      <td></td>
    </>
  )
}

export function ExportControl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element | null {
  const { controller } = props

  const handleExport = useCallback(
    (format: string): void => {
      if (controller === null) {
        console.warn('handleExport called without mounted display')
        return
      }

      const { instance } = controller
      if (!instance.driver.formats.includes(format)) {
        console.warn('handleExport clicked on invalid element')
        return
      }

      instance
        .export(format)
        .then(async (blob): Promise<void> => {
          download(blob, undefined, format)
        })
        .catch((e: unknown) => {
          console.error('failed to download: ', e)
          alert('Download has failed: ' + JSON.stringify(e))
        })
    },
    [controller],
  )

  // check that there are some export formats
  const exportFormats = controller?.instance?.driver?.formats
  if (typeof exportFormats === 'undefined' || exportFormats.length === 0) {
    return null
  }
  return (
    <Control name='Graph Export'>
      <p>
        Click the button below to export the graph. Depending on the format and
        graph size, this might take a few seconds to generate.
      </p>
      <p>
        <ButtonGroup inline>
          {exportFormats.map(format => (
            <Button key={format} value={format} onInput={handleExport}>
              {format}
            </Button>
          ))}
        </ButtonGroup>
      </p>
    </Control>
  )
}
