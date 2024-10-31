import { type JSX } from 'preact'
import { BannerContents } from '../../../components/legal'

import HTML from '../../../components/html'
import markdownDocument from '../../../../macros/markdown' with { type: 'macro' }

const html = markdownDocument('inspector.md')

export default function DocsTab(): JSX.Element {
  return (
    <HTML
      narrow
      html={html}
      trim={false}
      components={{ Banner: BannerContents }}
    />
  )
}
