import type { JSX } from 'preact'
import { Type } from '../lib/utils/media'
import download from '../lib/utils/download'
import DropArea from './form/drop-area'
import ErrorDisplay from './error'
import * as styles from './inverse-editor.module.css'
import { classes } from '../lib/utils/classes'
import { useCallback, useId, useMemo, useState } from 'preact/hooks'
import { type AsyncLoadState, reasonAsError, useAsyncLoad } from './hooks/async'
import Button, { ButtonGroup, ButtonGroupText } from './form/button'
import Text from './form/value'
import { InverseMap } from '../lib/pathbuilder/inversemap'

interface InverseEditorProps {
  inverses: InverseMap
  onReset: () => void
  onUpdate: (inverses: InverseMap) => void
}

export default function InverseEditor(props: InverseEditorProps): JSX.Element {
  const { onUpdate, inverses, onReset } = props
  const [loading, load, clearLoading] = useAsyncLoad(
    onUpdate,
    2000,
    undefined,
    reasonAsError,
  )
  const doUpdate = useCallback(
    (inverses: InverseMap) => {
      clearLoading()
      onUpdate(inverses)
    },
    [clearLoading, onUpdate],
  )

  const handleUpdate = useCallback(
    (oldCanon: string | undefined, canon: string, inverse: string): void => {
      let newInverses = inverses
      if (typeof oldCanon === 'string') {
        newInverses = newInverses.remove(oldCanon)
      }
      doUpdate(newInverses.add(canon, inverse))
    },
    [doUpdate, inverses],
  )

  const handleAdd = useCallback(
    (canon: string, inverse: string): void => {
      clearLoading()
      doUpdate(inverses.add(canon, inverse))
    },
    [clearLoading, doUpdate, inverses],
  )

  const handleDelete = useCallback(
    (canon: string): void => {
      doUpdate(inverses.remove(canon))
    },
    [doUpdate, inverses],
  )

  const loadNS = useCallback(
    (file: File) => {
      load(async () => {
        const data = JSON.parse(await file.text())
        const ns = InverseMap.fromJSON(data)
        if (ns === null) throw new Error('not a valid inverse map')
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
            <th>Canonical</th>
            <th>Inverse</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {Array.from(inverses).map(([canon, inverse]) => (
            <MappingRow
              inverses={inverses}
              canon={canon}
              inverse={inverse}
              key={canon}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
          <AddRow inverses={inverses} onAdd={handleAdd} />
          <ControlsRow
            loading={loading}
            clearLoading={clearLoading}
            inverses={inverses}
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
  inverses: InverseMap
  onAdd: (canon: string, inverse: string) => void
}

function AddRow(props: AddRowProps): JSX.Element {
  const { inverses, onAdd } = props

  const [canonValue, setCanon] = useState('')
  const canonValidity = useMemo(
    () => isURLValid(canonValue, inverses),
    [canonValue, inverses],
  )
  const canonValid = typeof canonValidity === 'undefined'

  const [inverseValue, setInverse] = useState('')
  const inverseValidity = useMemo(
    () => isURLValid(inverseValue, inverses),
    [inverseValue, inverses],
  )
  const inverseValid = typeof inverseValidity === 'undefined'

  const handleSubmit = useCallback(
    (evt?: SubmitEvent): void => {
      evt?.preventDefault()

      if (!canonValid || !inverseValid) return

      onAdd(canonValue, inverseValue)
      setCanon('')
      setInverse('')
    },
    [canonValid, inverseValid, onAdd, canonValue, inverseValue],
  )

  const id = useId()
  return (
    <tr>
      <td>
        <Text
          form={id}
          value={canonValue}
          placeholder='http://example.org/ontology#parentOf'
          onInput={setCanon}
          customValidity={canonValidity ?? ''}
        />
      </td>
      <td>
        <Text
          form={id}
          value={inverseValue}
          placeholder='http://example.org/ontology#childOf'
          onInput={setInverse}
          customValidity={inverseValidity ?? ''}
        />
      </td>
      <td>
        <form id={id} onSubmit={handleSubmit}>
          <Button disabled={!(canonValid && inverseValid)}>Add</Button>
        </form>
      </td>
    </tr>
  )
}

function ControlsRow(props: {
  inverses: InverseMap
  loading: AsyncLoadState<InverseMap, Error>
  clearLoading: () => void
  onReset: () => void
  onLoad: (file: File) => void
}): JSX.Element {
  const { loading, clearLoading, onReset, onLoad, inverses } = props

  const handleSubmit = useCallback(
    (event: SubmitEvent): void => {
      event.preventDefault()
      onReset()
    },
    [onReset],
  )

  const handleNamespaceMapExport = useCallback((): void => {
    clearLoading()
    const data = JSON.stringify(inverses.toJSON(), null, 2)
    const blob = new Blob([data], { type: Type.JSON })
    download(blob, 'inverses.json', 'json')
  }, [clearLoading, inverses])

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
              <>loaded InverseMap of size {loading.value.size}</>
            )}
            {loading?.status === 'rejected' && <>failed to load InverseMap</>}
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
  inverses: InverseMap
  canon: string
  inverse: string
  onUpdate: (
    oldCanon: string | undefined,
    canon: string,
    inverse: string,
  ) => void
  onDelete: (myShort: string) => void
}

function MappingRow(props: MappingRowProps): JSX.Element {
  const { canon, inverse, inverses, onUpdate, onDelete } = props

  const [canonValue, setCanon] = useState(canon)
  const canonValidity = useMemo(
    () => isURLValid(canonValue, inverses, canon),
    [canonValue, inverses, canon],
  )
  const canonValid = typeof canonValidity === 'undefined'

  const [inverseValue, setInverse] = useState(inverse)
  const inverseValidity = useMemo(
    () => isURLValid(inverseValue, inverses, inverse),
    [inverseValue, inverses, inverse],
  )
  const inverseValid = typeof inverseValidity === 'undefined'

  const handleApply = useCallback((): void => {
    // nothing has changed
    if (canonValue === canon && inverseValue === inverse) {
      return
    }

    // ensure that both elements are valid
    if (!canonValid || !inverseValid) return

    onUpdate(canon, canonValue, inverseValue)
  }, [
    canon,
    canonValid,
    canonValue,
    inverse,
    inverseValid,
    inverseValue,
    onUpdate,
  ])

  const handleDelete = useCallback((): void => {
    onDelete(canon)
  }, [onDelete, canon])

  const valid = canonValid && inverseValid
  const dirty = canonValue !== canon || inverseValue !== inverse
  const enabled = valid && dirty

  return (
    <tr>
      <td>
        <form onSubmit={handleApply}>
          <Text
            value={canonValue}
            customValidity={canonValidity}
            onInput={setCanon}
          />
        </form>
      </td>
      <td>
        <form onSubmit={handleApply}>
          <Text
            value={inverseValue}
            customValidity={inverseValidity}
            onInput={setInverse}
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

function isURLValid(
  url: string,
  inverses: InverseMap,
  oldURL?: string,
): string | undefined {
  if (url === '') {
    return 'invalid characters in canonical URL'
  }
  if (typeof oldURL === 'string' && url === oldURL) {
    return undefined
  }

  if (inverses.has(url)) {
    return 'url already contained in inverse map'
  }

  return undefined
}
