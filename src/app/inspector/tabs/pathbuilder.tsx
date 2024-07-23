import { type JSX } from 'preact'
import { StyledDropArea } from '../../../components/drop-area'
import { useInspectorStore } from '../state'
import {
  loadPathbuilder,
  resetInspector,
  setPathbuilderLoading,
} from '../state/reducers'
import ErrorDisplay from '../../../components/error'
import download from '../../../lib/utils/download'
import { Type } from '../../../lib/utils/media'
import Spinner from '../../../components/spinner'
import { useCallback } from 'preact/hooks'

export default function PathbuilderTab(): JSX.Element {
  const loadStage = useInspectorStore(s => s.loadStage)
  return loadStage === true ? <InfoView /> : <WelcomeView />
}

function dragContent(active: boolean, valid: boolean): JSX.Element {
  switch (true) {
    case active && valid:
      return (
        <>
          <b>Release</b> to load <em>Pathbuilder</em>
        </>
      )
    case active && !valid:
      return (
        <>
          Invalid{` `}
          <em>Pathbuilder</em>: Must be a <b>xml</b> file
        </>
      )
    default:
      return (
        <>
          <b>Select</b> or <b>Drop</b> a <em>Pathbuilder</em> here
        </>
      )
  }
}

function WelcomeView(): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const loadStage = useInspectorStore(s => s.loadStage)

  const handleLoadPathbuilder = useCallback(
    (file: File): void => {
      apply([setPathbuilderLoading, loadPathbuilder(file)])
    },
    [apply, setPathbuilderLoading, loadPathbuilder],
  )

  if (loadStage === 'loading') {
    return <Spinner message='Loading pathbuilder' />
  }

  return (
    <>
      <p>
        This tool provides an interface for inspecting <code>Pathbuilders</code>{' '}
        created by the{' '}
        <a href='https://wiss-ki.eu' target='_blank' rel='noopener noreferrer'>
          WissKI
        </a>{' '}
        software. Click below to load a pathbuilder.
      </p>
      <p>
        All processing happens on-device, meaning the server host can not access
        any data contained within your pathbuilder.
      </p>
      <StyledDropArea onDropFile={handleLoadPathbuilder} types={[Type.XML]}>
        {dragContent}
      </StyledDropArea>
      {typeof loadStage === 'object' && loadStage.error instanceof Error && (
        <>
          <p>
            <b>Unable to load pathbuilder: </b>
          </p>
          <ErrorDisplay error={loadStage.error} />
        </>
      )}
    </>
  )
}

function InfoView(): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const pathbuilder = useInspectorStore(s => s.pathbuilder)
  const filename = useInspectorStore(s => s.filename)

  const handleExport = useCallback(
    (evt: MouseEvent): void => {
      evt.preventDefault()

      const file = new Blob([pathbuilder.toXML()], { type: 'application/xml' })
      download(file, filename)
    },
    [pathbuilder, download, filename],
  )

  const handleClosePathbuilder = useCallback(
    (evt: MouseEvent): void => {
      evt.preventDefault()

      apply(resetInspector(false))
    },
    [apply, resetInspector],
  )

  const theFilename = filename !== '' ? filename : 'pathbuilder.xml'

  return (
    <>
      <p>
        Pathbuilder <button onClick={handleExport}>{theFilename}</button>{' '}
        successfully loaded. You can use the other tabs to inspect the
        pathbuilder.
      </p>
      <p>
        You can also close{' '}
        <button onClick={handleClosePathbuilder}>Close</button> this
        pathbuilder.
      </p>
    </>
  )
}
