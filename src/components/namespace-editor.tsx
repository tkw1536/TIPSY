import type { JSX } from 'preact'
import { NamespaceMap } from '../lib/pathbuilder/namespace'
import { Type } from '../lib/utils/media'
import download from '../lib/utils/download'
import DropArea from './form/drop-area'
import ErrorDisplay from './error'
import * as styles from './namespace-editor.module.css'
import { classes } from '../lib/utils/classes'
import { useCallback, useId, useMemo, useState } from 'preact/hooks'
import { type AsyncLoadState, reasonAsError, useAsyncLoad } from './hooks/async'
import Button, { ButtonGroup, ButtonGroupText } from './form/button'
import Text from './form/value'

interface NamespaceEditorProps {
  ns: NamespaceMap
  onReset: () => void
  onUpdate: (ns: NamespaceMap) => void
}

export default function NamespaceEditor(
  props: NamespaceEditorProps,
): JSX.Element {
  const { onUpdate, ns, onReset } = props
  const [loading, load, clearLoading] = useAsyncLoad(
    onUpdate,
    2000,
    undefined,
    reasonAsError,
  )
  const doUpdate = useCallback(
    (ns: NamespaceMap) => {
      clearLoading()
      onUpdate(ns)
    },
    [clearLoading, onUpdate],
  )

  const handleUpdate = useCallback(
    (
      short: string,
      newShort: string | undefined,
      newLong: string | undefined,
    ): void => {
      let newNS = ns
      if (typeof newLong === 'string') {
        newNS = newNS.update(short, newLong)
      }
      if (typeof newShort === 'string') {
        newNS = newNS.rename(short, newShort)
      }
      doUpdate(newNS)
    },
    [doUpdate, ns],
  )

  const handleAdd = useCallback(
    (short: string, long: string): void => {
      clearLoading()
      doUpdate(ns.add(short, long))
    },
    [clearLoading, doUpdate, ns],
  )

  const handleDelete = useCallback(
    (long: string): void => {
      doUpdate(ns.remove(long))
    },
    [doUpdate, ns],
  )

  const loadNS = useCallback(
    (file: File) => {
      load(async () => {
        const data = JSON.parse(await file.text())
        const ns = NamespaceMap.fromJSON(data)
        if (ns === null) throw new Error('not a valid namespace map')
        return ns
      })
    },
    [load],
  )

  return (
    <>
      <table class={classes(styles.table)}>
        <thead>
          <tr>
            <th>NS</th>
            <th>URI</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {Array.from(ns).map(([short, long]) => (
            <MappingRow
              ns={ns}
              long={long}
              short={short}
              key={short}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
          <AddRow ns={ns} onAdd={handleAdd} />
          <ControlsRow
            loading={loading}
            clearLoading={clearLoading}
            ns={ns}
            onReset={onReset}
            onLoad={loadNS}
          />
        </tbody>
      </table>
      {loading?.status === 'rejected' && (
        <ErrorDisplay error={loading.reason} />
      )}
    </>
  )
}

interface AddRowProps {
  ns: NamespaceMap
  onAdd: (long: string, short: string) => void
}

function AddRow(props: AddRowProps): JSX.Element {
  const { ns, onAdd } = props

  const [shortValue, setShort] = useState('')
  const shortValidity = useMemo(
    () => isShortValid(shortValue, ns),
    [shortValue, ns],
  )
  const shortValid = typeof shortValidity === 'undefined'

  const [longValue, setLong] = useState('')
  const longValidity = useMemo(
    () => isLongValid(longValue, ns),
    [longValue, ns],
  )
  const longValid = typeof longValidity === 'undefined'

  const handleSubmit = useCallback(
    (evt?: SubmitEvent): void => {
      evt?.preventDefault()

      if (!shortValid || !longValid) return

      onAdd(shortValue, longValue)
      setShort('')
      setLong('')
    },
    [shortValid, longValid, onAdd, shortValue, longValue],
  )

  const id = useId()
  return (
    <tr>
      <td>
        <Text
          form={id}
          value={shortValue}
          placeholder='rdf'
          onInput={setShort}
          customValidity={shortValidity ?? ''}
        />
      </td>
      <td>
        <Text
          form={id}
          value={longValue}
          placeholder='http://www.w3.org/1999/02/22-rdf-syntax-ns#'
          onInput={setLong}
          customValidity={longValidity ?? ''}
        />
      </td>
      <td>
        <form id={id} onSubmit={handleSubmit}>
          <Button disabled={!(longValid && shortValid)}>Add</Button>
        </form>
      </td>
    </tr>
  )
}

function ControlsRow(props: {
  ns: NamespaceMap
  loading: AsyncLoadState<NamespaceMap, Error>
  clearLoading: () => void
  onReset: () => void
  onLoad: (file: File) => void
}): JSX.Element {
  const { loading, clearLoading, onReset, onLoad, ns } = props

  const handleSubmit = useCallback(
    (event: SubmitEvent): void => {
      event.preventDefault()
      onReset()
    },
    [onReset],
  )

  const handleNamespaceMapExport = useCallback((): void => {
    clearLoading()
    const data = JSON.stringify(ns.toJSON(), null, 2)
    const blob = new Blob([data], { type: Type.JSON })
    download(blob, 'namespaces.json', 'json')
  }, [clearLoading, ns])

  const handleNamespaceMapImport = useCallback(
    (file: File): void => {
      onLoad(file)
    },
    [onLoad],
  )

  return (
    <tr>
      <td colspan={2}>
        <ButtonGroup inline>
          <Button onInput={handleNamespaceMapExport}>Export</Button>
          <DropArea
            types={[Type.JSON]}
            onInput={handleNamespaceMapImport}
            compact
            disabled={loading?.status === 'pending'}
          >
            Import
          </DropArea>
          <ButtonGroupText>
            {loading?.status === 'pending' && <>loading</>}
            {loading?.status === 'fulfilled' && (
              <>loaded NamespaceMap of size {loading.value.size}</>
            )}
            {loading?.status === 'rejected' && <>failed to load NamespaceMap</>}
          </ButtonGroupText>
        </ButtonGroup>
      </td>
      <td>
        <form onSubmit={handleSubmit}>
          <Button>Reset To Default</Button>
        </form>
      </td>
    </tr>
  )
}

interface MappingRowProps {
  ns: NamespaceMap
  long: string
  short: string
  onUpdate: (
    myShort: string,
    newShort: string | undefined,
    newLong: string | undefined,
  ) => void
  onDelete: (myShort: string) => void
}

function MappingRow(props: MappingRowProps): JSX.Element {
  const { short, long, ns, onUpdate, onDelete } = props

  const [shortValue, setShort] = useState(short)
  const shortValidity = useMemo(
    () => isShortValid(shortValue, ns, short),
    [ns, short, shortValue],
  )
  const shortValid = typeof shortValidity === 'undefined'

  const [longValue, setLong] = useState(long)
  const longValidity = useMemo(
    () => isLongValid(longValue, ns, long),
    [long, longValue, ns],
  )
  const longValid = typeof longValidity === 'undefined'

  const handleApply = useCallback((): void => {
    const newShort = short !== shortValue ? shortValue : undefined
    const newLong = long !== longValue ? longValue : undefined

    // ensure that something has changed
    if (typeof newShort === 'undefined' && typeof newLong === 'undefined') {
      return
    }

    // ensure that both elements are valid
    if (!shortValid || !longValid) return

    onUpdate(short, newShort, newLong)
  }, [long, longValid, longValue, onUpdate, short, shortValid, shortValue])

  const handleDelete = useCallback((): void => {
    onDelete(short)
  }, [onDelete, short])

  const valid = longValid && shortValid
  const dirty = longValue !== long || shortValue !== short
  const enabled = valid && dirty

  return (
    <tr>
      <td>
        <form onSubmit={handleApply}>
          <Text
            value={shortValue}
            customValidity={shortValidity}
            onInput={setShort}
          />
        </form>
      </td>
      <td>
        <form onSubmit={handleApply}>
          <Text
            value={longValue}
            customValidity={longValidity}
            onInput={setLong}
          />
        </form>
      </td>
      <td>
        <ButtonGroup inline>
          <Button onInput={handleApply} disabled={!enabled}>
            Apply
          </Button>
          <Button onInput={handleDelete}>Delete</Button>
        </ButtonGroup>
      </td>
    </tr>
  )
}

function isShortValid(
  short: string,
  ns: NamespaceMap,
  oldShort?: string,
): string | undefined {
  if (!NamespaceMap.validKey.test(short)) {
    return 'invalid characters in key'
  }
  if (typeof oldShort === 'string' && short === oldShort) {
    return undefined
  }

  if (short.startsWith('^')) {
    return 'invalid characters in value'
  }

  if (ns.has(short)) {
    return 'duplicate namespace'
  }

  return undefined
}

function isLongValid(
  long: string,
  ns: NamespaceMap,
  oldLong?: string,
): string | undefined {
  if (long === '') {
    return 'URI is empty'
  }
  if (long.startsWith('^')) {
    return 'invalid characters in value'
  }
  return undefined
}
