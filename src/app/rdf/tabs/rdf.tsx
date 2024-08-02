import { type JSX } from 'preact'
import Spinner from '../../../components/spinner'
import { StyledDropArea } from '../../../components/form/drop-area'
import ErrorDisplay from '../../../components/error'
import useRDFStore from '../state'
import Button from '../../../components/form/button'

export default function RDFTab(): JSX.Element {
  const loadState = useRDFStore(s => s.loadStage)
  if (loadState === true) {
    return <InfoView />
  } else {
    return <WelcomeView />
  }
}

function WelcomeView(): JSX.Element {
  const loadStage = useRDFStore(s => s.loadStage)
  const openFile = useRDFStore(s => s.loadFile)

  if (loadStage === 'loading') {
    return <Spinner message='Loading RDF' />
  }

  return (
    <>
      <p>This tool provides an interface for visualizing rdf files.</p>
      <p>
        All processing happens on-device, meaning the server host can not access
        any data contained within your statements.
      </p>
      <StyledDropArea onInput={openFile}>
        Click or drag an <code>RDF/XML</code> file here
      </StyledDropArea>
      {typeof loadStage === 'object' && loadStage.error instanceof Error && (
        <>
          <p>
            <b>Unable to load rdf: </b>
          </p>
          <ErrorDisplay error={loadStage.error} />
        </>
      )}
    </>
  )
}

function InfoView(): JSX.Element {
  const closeFile = useRDFStore(s => s.closeFile)

  const filename = useRDFStore(s => s.filename)
  const theFilename = filename !== '' ? filename : 'statements.rdf'

  return (
    <>
      <p>
        RDF <code>{theFilename}</code> successfully loaded.
      </p>
      <p>
        You can also <Button onInput={closeFile}>Close</Button> this file.
      </p>
    </>
  )
}
