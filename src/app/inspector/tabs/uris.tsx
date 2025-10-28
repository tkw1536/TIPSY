import type { JSX } from 'preact'
import NamespaceEditor from '../../../components/namespace-editor'
import InverseEditor from '../../../components/inverse-editor'
import useInspectorStore from '../state'

export default function MapTab(): JSX.Element {
  const ns = useInspectorStore(s => s.ns)
  const inverses = useInspectorStore(s => s.inverses)
  const resetNamespaceMap = useInspectorStore(s => s.resetNamespaceMap)
  const setNamespaceMap = useInspectorStore(s => s.setNamespaceMap)
  const resetInverseMap = useInspectorStore(s => s.resetInverseMap)
  const setInverseMap = useInspectorStore(s => s.setInverseMap)

  return (
    <>
      <h2>Namespace Map</h2>
      <section>
        <p>
          The Namespace Map is used to shorten URIs for display within the
          inspector. The underlying pathbuilder always contains the full URIs,
          and namespaces are not saved across reloads.
          <br />
          The initial version is generated automatically from all URIs found in
          the pathbuilder. You can manually adjust it here, by adding, removing
          or editing abbreviations.
        </p>
        <NamespaceEditor
          ns={ns}
          onReset={resetNamespaceMap}
          onUpdate={setNamespaceMap}
        />
      </section>
      <h2>Inverse Map</h2>
      <section>
        <p>
          The inverse map can be used to declare two URIs to be inverses of each
          other. When the graph tabs display an edge labeled with an inverse
          URI, it's direction is reversed, and it is labeled with the canonical
          URI instead. Some renderers also display the inverted URI.
        </p>
        <InverseEditor
          inverses={inverses}
          ns={ns}
          onReset={resetInverseMap}
          onUpdate={setInverseMap}
        />
      </section>
    </>
  )
}
