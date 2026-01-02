import type { JSX } from 'preact'
import Tabs, { TabLabel, Tab } from '../../components/tabs'
import DebugTab from './tabs/debug'
import useInspectorStore from './state'
import { lazy } from 'preact/compat'
import { LegalModal } from '../../components/legal'

const PathbuilderTab = lazy(async () => await import('./tabs/pathbuilder'))
const TreeTab = lazy(async () => await import('./tabs/tree'))
const BundleGraphTab = lazy(async () => await import('./tabs/bundle'))
const ModelGraphTab = lazy(async () => await import('./tabs/model'))
const URIConfigTab = lazy(async () => await import('./tabs/uri_config'))
const AboutTab = lazy(async () => await import('./tabs/about'))
const URIsTab = lazy(async () => await import('./tabs/uris'))
const DiagTab = lazy(async () => await import('./tabs/diag'))

export default function InspectorApp(): JSX.Element {
  const activeTab = useInspectorStore(s => s.activeTab)
  const loadStage = useInspectorStore(s => s.loadStage)
  const isEmbedded = useInspectorStore(s => s.embed)
  const modal = useInspectorStore(s => s.modal)
  const setActiveTab = useInspectorStore(s => s.setActiveTab)
  const closeModal = useInspectorStore(s => s.closeModal)

  const loaded = loadStage === true

  return (
    <>
      <LegalModal open={modal} onClose={closeModal} isEmbedded={isEmbedded} />
      <Tabs onChangeTab={setActiveTab} active={activeTab}>
        <TabLabel>
          <b>
            Tom's Inspector for Pathbuilders <sub>Yaaaaaahs!</sub>
          </b>
        </TabLabel>

        <Tab title='Pathbuilder' id=''>
          <PathbuilderTab />
        </Tab>
        <Tab title='Tree' disabled={!loaded} id='tree'>
          <TreeTab />
        </Tab>
        {import.meta.env.DEV && (
          <Tab title='Diagnostics' id='diag'>
            <DiagTab />
          </Tab>
        )}
        <Tab title='Bundle Graph' disabled={!loaded} id='bundle'>
          <BundleGraphTab />
        </Tab>
        <Tab title='Model Graph' disabled={!loaded} id='model'>
          <ModelGraphTab />
        </Tab>
        <Tab title='URI List' id='uris' disabled={!loaded}>
          <URIsTab />
        </Tab>
        <Tab
          title='URI Config &#9881;&#65039;'
          disabled={!loaded}
          id='uris_config'
        >
          <URIConfigTab />
        </Tab>
        <Tab title='About' id='about'>
          <AboutTab />
        </Tab>
        {import.meta.env.DEV && (
          <Tab title='Debug' id='debug'>
            <DebugTab />
          </Tab>
        )}
      </Tabs>
    </>
  )
}
