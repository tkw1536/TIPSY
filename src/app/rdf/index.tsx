import type { JSX } from 'preact'
import useRDFStore from './state'
import Tabs, { TabLabel, Tab } from '../../components/tabs'
import { lazy } from 'preact/compat'
import { LegalModal } from '../../components/legal'

const RDFTab = lazy(async () => await import('./tabs/rdf'))
const MapTab = lazy(async () => await import('./tabs/map'))
const VisualTab = lazy(async () => await import('./tabs/visual'))
const DocsTab = lazy(async () => await import('./tabs/docs'))
const AboutTab = lazy(async () => await import('./tabs/about'))

export default function RDFViewerApp(): JSX.Element {
  const activeTab = useRDFStore(s => s.activeTab)
  const setActiveTab = useRDFStore(s => s.setActiveTab)

  const modal = useRDFStore(s => s.modal)
  const closeModal = useRDFStore(s => s.closeModal)

  const loadStage = useRDFStore(s => s.loadStage)
  const loaded = loadStage === true

  return (
    <>
      <LegalModal open={modal} onClose={closeModal} isEmbedded={false} />
      <Tabs onChangeTab={setActiveTab} active={activeTab}>
        <TabLabel>
          <b>RDF Viewer</b>
        </TabLabel>
        <Tab title='RDF File' id=''>
          <RDFTab />
        </Tab>
        <Tab title='Visual' disabled={!loaded} id='visual'>
          <VisualTab />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <MapTab />
        </Tab>
        <Tab title='Docs' id='docs'>
          <DocsTab />
        </Tab>
        <Tab title='About' id='about'>
          <AboutTab />
        </Tab>
      </Tabs>
    </>
  )
}
