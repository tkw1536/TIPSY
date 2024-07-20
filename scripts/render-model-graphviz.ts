import { ArgumentParser } from 'argparse'
import { readFile } from 'fs/promises'
import { Pathbuilder } from '../src/lib/pathbuilder/pathbuilder'
import { PathTree } from '../src/lib/pathbuilder/pathtree'
import { NamespaceMap } from '../src/lib/pathbuilder/namespace'
import ColorMap from '../src/lib/pathbuilder/annotations/colormap'
import ModelGraphBuilder from '../src/lib/graph/builders/model'
import Deduplication from '../src/app/inspector/state/state/deduplication'
import { RegularGraphVizModelDriver } from '../src/lib/drivers/impl/graphviz'
import { type ContextFlags } from '../src/lib/drivers/impl'
import { type ModelOptions } from '../src/lib/graph/builders/model/types'
import { newModelDisplay } from '../src/app/inspector/state/reducers/model'

// Usage: node node_modules/vite-node/vite-node.mjs ./scripts/render-model-graphviz.ts -p pathbuilder

async function main(): Promise<void> {
  const parser = new ArgumentParser()

  parser.add_argument('--pathbuilder', '-p', { required: true })

  const config = parser.parse_args()

  // parse the pathbuilder as xml
  const pbXML = await readFile(config.pathbuilder as string)
  const pb = Pathbuilder.parse(pbXML.toString())

  // create a tree
  const tree = PathTree.fromPathbuilder(pb)

  // generate a colormap
  const ns = NamespaceMap.generate(
    tree.uris,
    undefined,
    NamespaceMap.KnownPrefixes,
  )
  const cm = ColorMap.generate(tree, { field: '#f6b73c', bundle: '#add8e6' })

  // build the actual graph
  const graph = await new ModelGraphBuilder(tree, {
    deduplication: Deduplication.Full,
  }).build()

  // load the driver and setup flags to use
  const driver = new RegularGraphVizModelDriver()
  const flags: ContextFlags<ModelOptions> = {
    options: { ns, cm, display: newModelDisplay() },
    definitelyAcyclic: graph.definitelyAcyclic,
    layout: driver.supportedLayouts[0],
    initialSize: { width: 1000, height: 1000 },
  }

  // initialize and create blob
  await driver.initialize(flags, graph, () => true)
  const blob = await driver.export(flags, 'svg')

  // write the actual blob to the console
  process.stdout.write(await blob.text())
}
main().catch(err => {
  console.log(err)
})

// spellchecker:words argparse
