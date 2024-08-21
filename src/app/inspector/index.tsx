import { type JSX } from 'preact'
import Tabs, { TabLabel, Tab } from '../../components/tabs'
import DebugTab from './tabs/debug'
import useInspectorStore from './state'
import { lazy } from 'preact/compat'
import { LegalModal } from '../../components/legal'

const PathbuilderTab = lazy(async () => await import('./tabs/pathbuilder'))
const TreeTab = lazy(async () => await import('./tabs/tree'))
const BundleGraphTab = lazy(async () => await import('./tabs/bundle'))
const ModelGraphTab = lazy(async () => await import('./tabs/model'))
const MapTab = lazy(async () => await import('./tabs/map'))
const AboutTab = lazy(async () => await import('./tabs/about'))

export default function InspectorApp(): JSX.Element {
  const activeTab = useInspectorStore(s => s.activeTab)
  const loadStage = useInspectorStore(s => s.loadStage)
  const modal = useInspectorStore(s => s.modal)
  const setActiveTab = useInspectorStore(s => s.setActiveTab)
  const closeModal = useInspectorStore(s => s.closeModal)

  const loaded = loadStage === true

  return (
    <>
      <LegalModal open={modal} onClose={closeModal} />
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
        <Tab title='Bundle Graph' disabled={!loaded} id='bundle'>
          <BundleGraphTab />
        </Tab>
        <Tab title='Model Graph' disabled={!loaded} id='model'>
          <ModelGraphTab />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <MapTab />
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
