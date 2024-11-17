import { describe, expect, test } from 'vitest'
import { Path, Pathbuilder, type PathParams } from './pathbuilder'
import { readFixture, readFixtureJSON } from '../utils/test/fixture'
import { DOMImplementation, MIME_TYPE, DOMParser } from '@xmldom/xmldom'

const sampleJSON = await readFixtureJSON<PathParams[]>(
  'pathbuilder',
  'sample.json',
)
const samplePB = new Pathbuilder(
  sampleJSON.map(p => new Path(p)),
  sampleJSON.map(_ => null),
)

const aDocumentBundlePath = samplePB.paths[0] // path for a document group
const regularPropertyPath = samplePB.paths[1] // path with a regular property
const entityReferencePath = samplePB.paths[7] // path with disambiguation

describe(Pathbuilder, async () => {
  test('parses valid paths', async () => {
    const sampleXML = await readFixture('pathbuilder', 'sample.xml')
    const got = Pathbuilder.parse(sampleXML)
    expect(got.paths).toEqual(samplePB.paths)
  })

  test('does not parse invalid xml', async () => {
    const invalidXML = await readFixture('pathbuilder', 'invalid.xml')
    expect(() => Pathbuilder.parse(invalidXML)).toThrow()
  })

  test('round-trips parsing xml correctly', async () => {
    const roundTrip = Pathbuilder.parse(samplePB.toXML())
    expect(roundTrip).toEqual(samplePB)
  })

  test('parses xml with an empty <path /> node transparently', async () => {
    const xml = await readFixture('pathbuilder', 'empty_path.xml')

    // parse it into a pathbuilder
    const pb = Pathbuilder.parse(xml)
    expect(pb.paths.length).toEqual(1)

    // find the paths elements in the round tripped document
    const xmlRT = new DOMParser().parseFromString(
      pb.toXML(),
      MIME_TYPE.XML_TEXT,
    )
    const paths = xmlRT.childNodes.item(1).childNodes
    expect(paths.length).toEqual(5)

    // regular <path> node
    // (exactly tested in other code)
    expect(paths.item(1).nodeName).toBe('path')
    expect(paths.item(1).childNodes.length).toBe(19)

    // empty <path />
    // passed through from the input
    expect(paths.item(3).nodeName).toBe('path')
    expect(paths.item(3).childNodes.length).toBe(0)
  })
})

describe(Path, async () => {
  test.each([
    [aDocumentBundlePath, ['http://erlangen-crm.org/240307/E31_Document']],
    [
      regularPropertyPath,
      [
        'http://erlangen-crm.org/240307/E31_Document',
        'http://erlangen-crm.org/240307/P102_has_title',
        'http://erlangen-crm.org/240307/E35_Title',
        'http://erlangen-crm.org/240307/P3_has_note',
      ],
    ],
    [
      entityReferencePath,
      [
        'http://erlangen-crm.org/240307/E31_Document',
        'http://erlangen-crm.org/240307/P94i_was_created_by',
        'http://erlangen-crm.org/240307/E65_Creation',
        'http://erlangen-crm.org/240307/P14_carried_out_by',
        'http://erlangen-crm.org/240307/E21_Person',
      ],
    ],
  ])('uris $#', (path: Path, wantURIs: string[]) => {
    const got = new Set(path.uris())
    const want = new Set(wantURIs)
    expect(got).toEqual(want)
  })

  test.each([
    [aDocumentBundlePath, null],
    [regularPropertyPath, 'string'],
    [entityReferencePath, 'entity_reference'],
  ])('informativeFieldType $#', (path: Path, want: string | null) => {
    expect(path.informativeFieldType).toEqual(want)
  })

  test.each([
    [aDocumentBundlePath, null],
    [regularPropertyPath, null],
    [entityReferencePath, 'http://erlangen-crm.org/240307/E21_Person'],
  ])('disambiguatedConcept $#', (path: Path, want: string | null) => {
    expect(path.disambiguatedConcept).toEqual(want)
  })

  test.each([
    [aDocumentBundlePath, null],
    [regularPropertyPath, null],
    [entityReferencePath, 4],
  ])('disambiguationIndex $#', (path: Path, want: number | null) => {
    expect(path.disambiguationIndex).toEqual(want)
  })

  test('path clone equality', () => {
    const paths = samplePB.paths.slice(0)

    // clone all the paths
    const doc = new DOMImplementation().createDocument(null, null, null)
    const clones = paths.map(p => Path.fromNode(p.toXML(doc)))

    // expect clones to be equal to the original
    paths.forEach((path, i) => {
      clones.forEach((clone, j) => {
        expect(clone.equals(path)).toEqual(i === j)
        expect(path.equals(clone)).toEqual(i === j)
      })
    })
  })

  test('path self equality', () => {
    const paths = samplePB.paths.slice(0)
    paths.forEach((pathOuter, i) => {
      paths.forEach((pathInner, j) => {
        expect(pathInner.equals(pathOuter)).toEqual(i === j)
        expect(pathOuter.equals(pathInner)).toEqual(i === j)
      })
    })
  })
})
