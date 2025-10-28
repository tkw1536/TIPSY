import type { JSX } from 'preact'
import InverseEditor from '../../../components/inverse-editor'
import useInspectorStore from '../state'

export default function InverseTab(): JSX.Element {
  const inverses = useInspectorStore(s => s.inverses)
  const ns = useInspectorStore(s => s.ns)
  const resetInverseMap = useInspectorStore(s => s.resetInverseMap)
  const setInverseMap = useInspectorStore(s => s.setInverseMap)

  return (
    <>
      <p>
        The inverse map can be used to declare two URIs to be inverses of each
        This feature is currently undergoing testing.
      </p>
      <InverseEditor
        inverses={inverses}
        ns={ns}
        onReset={resetInverseMap}
        onUpdate={setInverseMap}
      />
    </>
  )
}
