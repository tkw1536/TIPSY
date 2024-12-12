import type { JSX } from 'preact'
import DropArea from '../../../components/form/drop-area'

import ErrorDisplay from '../../../components/error'
import download from '../../../lib/utils/download'
import { Type } from '../../../lib/utils/media'
import Spinner from '../../../components/spinner'
import { useCallback, useEffect } from 'preact/hooks'
import useInspectorStore from '../state'
import Button from '../../../components/form/button'
import SnapshotIntoPathbuilder from '../state/datatypes/snapshot'
import receiveFileFromParent from '../../../lib/utils/receive-file'

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
  const loadStage = useInspectorStore(s => s.loadStage)
  const loadFile = useInspectorStore(s => s.loadFile)

  const loadSampleFile = useCallback(() => {
    loadFile(async (): Promise<File> => {
      const text = await import(
        '../../../../fixtures/pathbuilder/example_file_in_ui.xml?raw'
      ).then(m => m.default)
      return new File([text], 'sample.xml', { type: Type.XML })
    }, false)
  }, [loadFile])

  useEffect(() => {
    return receiveFileFromParent(file => {
      loadFile(file, true)
    })
  }, [loadFile])

  const loadUserFile = useCallback(
    (file: File) => {
      loadFile(file, false)
    },
    [loadFile],
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
        software. Click below to load a pathbuilder or{' '}
        <Button onInput={loadSampleFile}>Use An Example</Button>.
      </p>
      <p>
        All processing happens on-device, meaning the server host can not access
        any data contained within your pathbuilder.
      </p>
      <DropArea onInput={loadUserFile} types={[Type.XML]}>
        {dragContent}
      </DropArea>
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
  const pathbuilder = useInspectorStore(s => s.pathbuilder)
  const filename = useInspectorStore(s => s.filename)
  const embed = useInspectorStore(s => s.embed)

  const loadFile = useInspectorStore(s => s.loadFile)
  const closeFile = useInspectorStore(s => s.closeFile)

  const handleExport = useCallback((): void => {
    const pathbuilder = SnapshotIntoPathbuilder(useInspectorStore.getState())
    const file = new Blob([pathbuilder.toXML()], { type: 'application/xml' })
    download(file, filename)
  }, [filename])

  const handleReset = useCallback((): void => {
    // re-create the file
    const file = new File([pathbuilder.onlyPaths().toXML()], filename, {
      type: Type.XML,
    })

    // close, then reload the file
    closeFile()
    loadFile(file, embed)
  }, [closeFile, embed, filename, loadFile, pathbuilder])

  const theFilename = filename !== '' ? filename : 'pathbuilder.xml'

  return (
    <>
      <p>
        Pathbuilder <Button onInput={handleExport}>{theFilename}</Button>{' '}
        successfully loaded. Click the button to export it, along with any TIPSY
        settings you have made. You can use the other tabs to inspect the
        pathbuilder.
      </p>
      {embed && (
        <p>
          This file was provided to TIPSY by embedding the interface into a
          different website. TIPSY neither controls nor endorses{' '}
          <code>{theFilename}</code>, its' contents, or the embedding website.
        </p>
      )}
      <p>
        Click to <Button onInput={handleReset}>Reset The Interface</Button>.
        This will forget any interface state, acting as if you had freshly
        exported the Pathbuilder from your WissKI.
      </p>

      {!embed && (
        <p>
          You can also close <Button onInput={closeFile}>Close</Button> this
          pathbuilder.
        </p>
      )}
    </>
  )
}
