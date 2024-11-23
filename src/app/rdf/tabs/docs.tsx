import type { VNode } from 'preact'
import HTML from '../../../components/html'
import markdownDocument from '../../../../macros/markdown' with { type: 'macro' }

const html = markdownDocument('rdf.md')

export default function DocsTab(): VNode<any> {
  return <HTML narrow html={html} trim={false} />
}
