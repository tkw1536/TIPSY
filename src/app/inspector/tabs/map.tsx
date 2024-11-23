import type { JSX } from 'preact'
import NamespaceEditor from '../../../components/namespace-editor'
import useInspectorStore from '../state'

export default function MapTab(): JSX.Element {
  const ns = useInspectorStore(s => s.ns)
  const resetNamespaceMap = useInspectorStore(s => s.resetNamespaceMap)
  const setNamespaceMap = useInspectorStore(s => s.setNamespaceMap)

  return (
    <>
      <p>
        The Namespace Map is used to shorten URIs for display within the
        inspector. The underlying pathbuilder always contains the full URIs, and
        namespaces are not saved across reloads.
        <br />
        The initial version is generated automatically from all URIs found in
        the pathbuilder. You can manually adjust it here, by adding, removing or
        editing abbreviations.
      </p>
      <NamespaceEditor
        ns={ns}
        onReset={resetNamespaceMap}
        onUpdate={setNamespaceMap}
      />
    </>
  )
}
