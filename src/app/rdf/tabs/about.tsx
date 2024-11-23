import type { VNode } from 'preact'
import Legal from '../../../components/legal'

export default function AboutTab(): VNode<any> {
  return (
    <>
      <h2>About</h2>

      <p>
        This tool provides an interface for visualizing rdf files. It exists to
        re-use the TIPSY codebase and create RDF visualizations in the same
        style.
      </p>

      <h3>License</h3>
      <Legal />
    </>
  )
}
