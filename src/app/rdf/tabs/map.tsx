import type { JSX } from 'preact'

import useRDFStore from '../state'
import NamespaceEditor from '../../../components/namespace-editor'

export default function MapTab(): JSX.Element {
  const ns = useRDFStore(s => s.ns)

  const resetNamespaceMap = useRDFStore(s => s.resetNamespaceMap)
  const setNamespaceMap = useRDFStore(s => s.setNamespaceMap)

  return (
    <>
      <p>
        The Namespace Map is used to shorten URIs for display within the viewer.
      </p>
      <NamespaceEditor
        ns={ns}
        onReset={resetNamespaceMap}
        onUpdate={setNamespaceMap}
      />
    </>
  )
}
