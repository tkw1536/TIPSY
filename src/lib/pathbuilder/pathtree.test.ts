import { describe, expect, test } from 'vitest'
import { Pathbuilder } from './pathbuilder'
import { readFixture } from '../utils/test/fixture'
import { Bundle, type PathElement, PathTree, PathTreeNode } from './pathtree'

const samplePB = Pathbuilder.parse(
  await readFixture('pathbuilder', 'sample.xml'),
)

const sampleTree = new PathTree([
  {
    type: 'bundle',
    path: samplePB.paths[0],
    index: 0,
    children: [
      {
        type: 'field',
        id: 'f5125ed9c39b9e25742c6496b8fceead',
        index: 1,
        path: samplePB.paths[1],
      },
      {
        type: 'bundle',
        path: samplePB.paths[8],
        index: 8,
        children: [
          {
            type: 'field',
            id: 'f656b0be125190ac4f0ace586b097653',
            index: 2,
            path: samplePB.paths[2],
          },
          {
            type: 'field',
            id: 'fd0587b2561c7f2ee4d68e91da9641c9',
            index: 7,
            path: samplePB.paths[7],
          },
        ],
      },
      {
        type: 'bundle',
        path: samplePB.paths[9],
        index: 9,
        children: [
          {
            type: 'field',
            id: 'ea6cd7a9428f121a9a042fe66de406eb',
            index: 10,
            path: samplePB.paths[10],
          },
        ],
      },
    ],
  },
  {
    type: 'bundle',
    path: samplePB.paths[3],
    index: 3,
    children: [
      {
        type: 'field',
        id: 'f25b780a7baa987e05a48b2050a48937',
        index: 4,
        path: samplePB.paths[4],
      },
    ],
  },
  {
    type: 'bundle',
    path: samplePB.paths[5],
    index: 5,
    children: [
      {
        type: 'field',
        id: 'fb04c30bbbcd629a0ddea44d4a6b3408',
        index: 6,
        path: samplePB.paths[6],
      },
    ],
  },
])

describe(PathTree, async () => {
  test('parses the sample pathbuilder correctly', async () => {
    const [tree, diagnostics] = PathTree.fromPathbuilder(samplePB)
    expect(tree.equals(sampleTree)).toBe(true)
    expect(diagnostics.length).toBe(0)
  })

  test('walk iterates over all children in order', () => {
    const descendants = Array.from(sampleTree.walk())
    const indexes = descendants.map(d => d.index)

    expect(descendants.length).toEqual(12)
    expect(indexes).toEqual([-1, 0, 1, 8, 2, 7, 9, 10, 3, 4, 5, 6])
  })

  test('paths iterates over the paths in order', () => {
    expect(Array.from(sampleTree.paths())).toEqual(
      [0, 1, 8, 2, 7, 9, 10, 3, 4, 5, 6].map(i => samplePB.paths[i]),
    )
  })

  test('walkIDs iterates over all children in the right order', () => {
    expect(Array.from(sampleTree.walkIDs())).toEqual([
      'publication',
      'title',
      'creation',
      'date_of_writing',
      'author',
      'scientific_publication',
      'figure_image',
      'scientific_figure',
      'image',
      'person',
      'name',
    ])
  })

  test('equals actually checks equality', async () => {
    const descendants = Array.from(sampleTree.walk())
    descendants.forEach((outer, i) => {
      descendants.forEach((inner, j) => {
        expect(outer.equals(inner)).toEqual(i === j)
        expect(inner.equals(outer)).toEqual(i === j)
      })
    })
  })

  test.each([
    ['i_do_not_exist', null],
    ['publication', 'publication'],
    ['creation', 'creation'],
    ['date_of_writing', 'date_of_writing'],
    ['author', 'author'],
    ['scientific_publication', 'scientific_publication'],
    ['figure_image', 'figure_image'],
    ['title', 'title'],
    ['scientific_figure', 'scientific_figure'],
    ['image', 'image'],
    ['person', 'person'],
    ['name', 'name'],
  ])('find(%1) === %2', (query, wantID) => {
    const got = sampleTree.find(query)?.path ?? null
    const want = samplePB.paths.find(p => p.id === wantID) ?? null
    expect(got).toBe(want)
  })

  test('uris', async () => {
    const got = sampleTree.uris
    const want = new Set([
      'http://erlangen-crm.org/240307/E31_Document',
      'http://erlangen-crm.org/240307/P102_has_title',
      'http://erlangen-crm.org/240307/E35_Title',
      'http://erlangen-crm.org/240307/P3_has_note',
      'http://erlangen-crm.org/240307/P94i_was_created_by',
      'http://erlangen-crm.org/240307/E65_Creation',
      'http://erlangen-crm.org/240307/P4_has_time-span',
      'http://erlangen-crm.org/240307/E52_Time-Span',
      'http://erlangen-crm.org/240307/P82_at_some_time_within',
      'http://erlangen-crm.org/240307/P14_carried_out_by',
      'http://erlangen-crm.org/240307/E21_Person',
      'http://erlangen-crm.org/240307/P165_incorporates',
      'http://erlangen-crm.org/240307/E90_Symbolic_Object',
      'http://erlangen-crm.org/240307/P138i_has_representation',
      'http://erlangen-crm.org/240307/E36_Visual_Item',
      'http://erlangen-crm.org/240307/P48_has_preferred_identifier',
      'http://erlangen-crm.org/240307/E42_Identifier',
      'http://erlangen-crm.org/240307/P1_is_identified_by',
    ])
    expect(Array.from(got)).toEqual(Array.from(want))
  })
  test('tree navigation works', () => {
    const checkParentRelation = (
      node: PathTreeNode,
      wantParent: PathTreeNode | null,
      wantParentIndex: number,
    ): void => {
      if (wantParentIndex < 0 || wantParent === null) {
        expect(node.parent).toBe(null)
        return
      }

      // check that we have the right parent
      const { parent } = node
      expect(parent).toBe(wantParent)

      // and the right index
      const gotParentIndex = Array.from(parent?.children() ?? []).findIndex(
        c => c === node,
      )
      expect(gotParentIndex).toBe(wantParentIndex)
    }

    const checkNode = (node: PathTreeNode): void => {
      const children = Array.from(node.children())
      expect(node.childCount).toBe(children.length)

      children.forEach((child, index) => {
        checkParentRelation(child, node, index)
        checkNode(child)
      })
    }

    checkParentRelation(sampleTree, null, -1)
    checkNode(sampleTree)
  })

  test.each([
    ['publication', true],
    ['creation', false],
    ['scientific_figure', true],
    ['person', true],
  ])('isMainBundle(%1) === %2', (tBundle, want) => {
    const bundle = sampleTree.find(tBundle)
    if (!(bundle instanceof Bundle)) {
      throw new Error('test case: missing bundle ' + tBundle)
    }

    expect(bundle.isMain).toBe(want)
  })

  test.each([
    [null, null],
    ['publication', 'publication'],
    ['title', 'publication'],
    ['creation', 'publication'],
    ['date_of_writing', 'publication'],
    ['author', 'publication'],
    ['scientific_publication', 'publication'],
    ['figure_image', 'publication'],
    ['scientific_figure', 'scientific_figure'],
    ['image', 'scientific_figure'],
    ['person', 'person'],
    ['name', 'person'],
  ])('mainBundle(%1) === %2', (tNode, tMain) => {
    const node = typeof tNode === 'string' ? sampleTree.find(tNode) : sampleTree
    if (node === null) {
      throw new Error('test case: missing node ' + tNode)
    }

    const want = typeof tMain === 'string' ? sampleTree.find(tMain) : null
    if (typeof tMain === 'string' && want === null) {
      throw new Error('test case: missing main bundle')
    }

    // ensure that the main bundle resolves correctly
    expect(node.mainBundle).toBe(want)
  })

  test.each([
    [
      'publication',
      [
        {
          common: null,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
      ] as PathElement[],
    ],
    [
      'publication',
      [
        {
          common: null,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
      ] as PathElement[],
    ],
    [
      'title',
      [
        {
          common: -1,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
        {
          common: 0,
          disambiguation: null,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P102_has_title',
        },
        {
          common: 1,
          conceptIndex: 1,
          disambiguation: null,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E35_Title',
        },
        {
          common: 2,
          disambiguation: null,
          index: 3,
          propertyIndex: 1,
          role: 'datatype',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P3_has_note',
        },
      ] as PathElement[],
    ],
    [
      'creation',
      [
        {
          common: -1,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
        {
          common: 0,
          disambiguation: null,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P94i_was_created_by',
        },
        {
          common: 1,
          conceptIndex: 1,
          disambiguation: null,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E65_Creation',
        },
      ] as PathElement[],
    ],
    [
      'date_of_writing',
      [
        {
          common: -3,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
        {
          common: -2,
          disambiguation: null,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P94i_was_created_by',
        },
        {
          common: -1,
          conceptIndex: 1,
          disambiguation: null,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E65_Creation',
        },
        {
          common: 0,
          disambiguation: null,
          index: 3,
          propertyIndex: 1,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P4_has_time-span',
        },
        {
          common: 1,
          conceptIndex: 2,
          disambiguation: null,
          index: 4,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E52_Time-Span',
        },
        {
          common: 2,
          disambiguation: null,
          index: 5,
          propertyIndex: 2,
          role: 'datatype',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P82_at_some_time_within',
        },
      ] as PathElement[],
    ],
    [
      'author',
      [
        {
          common: -3,
          conceptIndex: 0,
          disambiguation: -4,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
        {
          common: -2,
          disambiguation: -3,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P94i_was_created_by',
        },
        {
          common: -1,
          conceptIndex: 1,
          disambiguation: -2,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E65_Creation',
        },
        {
          common: 0,
          disambiguation: -1,
          index: 3,
          propertyIndex: 1,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P14_carried_out_by',
        },
        {
          common: 1,
          conceptIndex: 2,
          disambiguation: 0,
          index: 4,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E21_Person',
        },
      ] as PathElement[],
    ],
    [
      'scientific_publication',
      [
        {
          common: -1,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
        {
          common: 0,
          disambiguation: null,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P165_incorporates',
        },
        {
          common: 1,
          conceptIndex: 1,
          disambiguation: null,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E90_Symbolic_Object',
        },
      ] as PathElement[],
    ],
    [
      'figure_image',
      [
        {
          common: -3,
          conceptIndex: 0,
          disambiguation: -2,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E31_Document',
        },
        {
          common: -2,
          disambiguation: -1,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P165_incorporates',
        },
        {
          common: -1,
          conceptIndex: 1,
          disambiguation: 0,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E90_Symbolic_Object',
        },
        {
          common: 0,
          disambiguation: 1,
          index: 3,
          propertyIndex: 1,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P138i_has_representation',
        },
        {
          common: 1,
          conceptIndex: 2,
          disambiguation: 2,
          index: 4,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E36_Visual_Item',
        },
        {
          common: 2,
          disambiguation: 3,
          index: 5,
          propertyIndex: 2,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P48_has_preferred_identifier',
        },
        {
          common: 3,
          conceptIndex: 3,
          disambiguation: 4,
          index: 6,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E42_Identifier',
        },
        {
          common: 4,
          disambiguation: 5,
          index: 7,
          propertyIndex: 3,
          role: 'datatype',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P3_has_note',
        },
      ] as PathElement[],
    ],
    [
      'scientific_figure',
      [
        {
          common: null,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E90_Symbolic_Object',
        },
      ] as PathElement[],
    ],
    [
      'image',
      [
        {
          common: -1,
          conceptIndex: 0,
          disambiguation: -2,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E90_Symbolic_Object',
        },
        {
          common: 0,
          disambiguation: -1,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P138i_has_representation',
        },
        {
          common: 1,
          conceptIndex: 1,
          disambiguation: 0,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E36_Visual_Item',
        },
        {
          common: 2,
          disambiguation: 1,
          index: 3,
          propertyIndex: 1,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P48_has_preferred_identifier',
        },
        {
          common: 3,
          conceptIndex: 2,
          disambiguation: 2,
          index: 4,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E42_Identifier',
        },
        {
          common: 4,
          disambiguation: 3,
          index: 5,
          propertyIndex: 2,
          role: 'datatype',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P3_has_note',
        },
      ] as PathElement[],
    ],
    [
      'person',
      [
        {
          common: null,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E21_Person',
        },
      ] as PathElement[],
    ],
    [
      'name',
      [
        {
          common: -1,
          conceptIndex: 0,
          disambiguation: null,
          index: 0,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E21_Person',
        },
        {
          common: 0,
          disambiguation: null,
          index: 1,
          propertyIndex: 0,
          role: 'relation',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P1_is_identified_by',
        },
        {
          common: 1,
          conceptIndex: 1,
          disambiguation: null,
          index: 2,
          type: 'concept',
          uri: 'http://erlangen-crm.org/240307/E35_Title',
        },
        {
          common: 2,
          disambiguation: null,
          index: 3,
          propertyIndex: 1,
          role: 'datatype',
          type: 'property',
          uri: 'http://erlangen-crm.org/240307/P3_has_note',
        },
      ] as PathElement[],
    ],
  ])('elements(%1) -> %2', (tNode: string, wantElements: PathElement[]) => {
    const node = typeof tNode === 'string' ? sampleTree.find(tNode) : sampleTree

    if (!(node instanceof PathTreeNode)) {
      throw new Error('test case: no such node')
    }

    const elements = Array.from(node.elements())
    expect(elements).toStrictEqual(wantElements)
  })
})
