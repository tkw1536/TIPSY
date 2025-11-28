import type { JSX } from 'preact'
import useInspectorStore from '../state'
import type { Diagnostic } from '../../../lib/pathbuilder/diagnostics'

export default function DiagTab(): JSX.Element {
  const diagnostics = useInspectorStore(state => state.diagnostics)
  return (
    <>
      <p>
        This tab contains diagnostics about the pathbuilder. There are a total
        of <code>{diagnostics.length}</code> diagnostic(s).
      </p>
      <table>
        <thead>
          <tr>
            <th>Kind</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {diagnostics.map((diagnostic, index) => (
            <DiagnosticRow key={index} diagnostic={diagnostic} />
          ))}
        </tbody>
      </table>
    </>
  )
}

function DiagnosticRow({
  diagnostic,
}: {
  diagnostic: Diagnostic
}): JSX.Element {
  const { kind, ...rest } = diagnostic
  return (
    <tr>
      <td>{diagnostic.kind}</td>
      <td>
        <pre>{JSON.stringify(rest, null, 2)}</pre>
      </td>
    </tr>
  )
}
