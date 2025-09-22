import { ArgumentParser } from 'argparse'
import { readFile } from 'node:fs/promises'
import { Pathbuilder } from '../src/lib/pathbuilder/pathbuilder'
import { PathTree } from '../src/lib/pathbuilder/pathtree'
import { NamespaceMap } from '../src/lib/pathbuilder/namespace'
import ColorMap from '../src/lib/pathbuilder/annotations/colormap'
import ModelGraphBuilder from '../src/lib/graph/builders/model'
import Deduplication from '../src/app/inspector/state/datatypes/deduplication'
import { GraphVizModelDriver } from '../src/lib/drivers/impl/graphviz'
import { nextInt } from '../src/lib/utils/prng'
import type { ModelDisplay } from '../src/lib/graph/builders/model/labels'

// Usage: node node_modules/vite-node/vite-node.mjs ./scripts/render-model-graphviz.ts -p pathbuilder

async function main(): Promise<void> {
  const parser = new ArgumentParser()

  parser.add_argument('--pathbuilder', '-p', { required: true })

  const config = parser.parse_args() as { pathbuilder: string }

  // parse the pathbuilder as xml
  const pbXML = await readFile(config.pathbuilder)
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
  const graph = new ModelGraphBuilder(tree, {
    deduplication: Deduplication.Full,
  }).build()

  const display: ModelDisplay = {
    Compounds: {
      Bundles: true,
      ConceptFields: true,
      DataFields: true,
    },
    Concept: {
      complex: true,
      boxed: true,
    },
    Literal: {
      complex: true,
      boxed: true,
    },
    Labels: {
      Concept: true,
      Property: true,

      Bundle: true,
      ConceptField: true,
      ConceptFieldType: true,

      DatatypeFieldType: true,
      DatatypeField: true,
      DatatypeProperty: true,
    },
  }

  const format = GraphVizModelDriver.formats.keys().next().value
  if (typeof format !== 'string') {
    throw new Error('No format found')
  }

  // load the driver and setup flags to use
  const driver = new GraphVizModelDriver(graph, {
    options: { ns, cm, display },
    layout: format,
    seed: nextInt(),
  })
  // initialize and create blob
  await driver.initialize(() => true)
  const blob = await driver.export('svg')

  // write the actual blob to the console
  process.stdout.write(await blob.text())
}
main().catch((err: unknown) => {
  console.log(err)
})

// spellchecker:words argparse
