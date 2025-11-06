import { describe, expect, test } from 'vitest'
import { InverseMap } from './inversemap'

describe(InverseMap, () => {
  test.each<[string, InverseMap, Array<[string, string]>, number]>([
    ['empty map', new InverseMap([]), [], 0],
    [
      'single pair',
      new InverseMap([
        ['https://example.com/parent', 'https://example.com/child'],
      ]),
      [['https://example.com/parent', 'https://example.com/child']],
      1,
    ],
    [
      'multiple disjoint pairs',
      new InverseMap([
        ['https://a.com/p', 'https://a.com/c'],
        ['https://b.com/p', 'https://b.com/c'],
      ]),
      [
        ['https://a.com/p', 'https://a.com/c'],
        ['https://b.com/p', 'https://b.com/c'],
      ],
      2,
    ],
    [
      'conflict on canonical removes previous',
      new InverseMap([
        ['https://conflict.com/p', 'https://conflict.com/c1'],
        ['https://conflict.com/p', 'https://conflict.com/c2'],
      ]),
      [['https://conflict.com/p', 'https://conflict.com/c2']],
      1,
    ],
    [
      'conflict on inverse removes previous',
      new InverseMap([
        ['https://conflict.com/p1', 'https://conflict.com/i'],
        ['https://conflict.com/p2', 'https://conflict.com/i'],
      ]),
      [['https://conflict.com/p2', 'https://conflict.com/i']],
      1,
    ],
  ])('constructor / iterator / size (%1)', (_, mp, ary, sz) => {
    expect(Array.from(mp)).toEqual(ary)
    expect(mp.size).toBe(sz)
  })

  test('has/check semantics', () => {
    const p = 'https://example.com/parent'
    const i = 'https://example.com/child'
    const mp = new InverseMap([[p, i]])

    expect(mp.has(p)).toBe(true)
    expect(mp.has(i)).toBe(true)
    expect(mp.has('https://unrelated.example.com/x')).toBe(false)

    const infoP = mp.check(p)
    expect(infoP).toBeDefined()
    expect(infoP?.canonical).toBe(p)
    expect(infoP?.inverse).toBe(i)
    expect(infoP?.is_inverted).toBe(false)

    const infoI = mp.check(i)
    expect(infoI).toBeDefined()
    expect(infoI?.canonical).toBe(p)
    expect(infoI?.inverse).toBe(i)
    expect(infoI?.is_inverted).toBe(true)
  })

  test.each([
    // uri not in the map: no swap, passthrough uri, no inverse
    [
      'passthrough when unknown',
      ['https://unknown/rel', 'S', 'T'],
      ['https://unknown/rel', null, 'S', 'T'],
      [['https://x/p', 'https://x/i']],
    ],
    // canonical: no swap, canonical+inverse returned
    [
      'canonical keeps order',
      ['https://x/p', 'A', 'B'],
      ['https://x/p', 'https://x/i', 'A', 'B'],
      [['https://x/p', 'https://x/i']],
    ],
    // inverse: swap, canonical+inverse returned
    [
      'inverse swaps order',
      ['https://x/i', 'A', 'B'],
      ['https://x/p', 'https://x/i', 'B', 'A'],
      [['https://x/p', 'https://x/i']],
    ],
  ])('canonicalizeEdge: %1', (_name, args, want, pairs) => {
    const mp = new InverseMap(pairs as Array<[string, string]>)
    const got = mp.canonicalizeEdge(args[0], args[1], args[2])
    expect(got).toEqual(want)
  })

  test('inverse lookup', () => {
    const mapWithInverse = new InverseMap([['https://a', 'https://b']])

    const lookup1 = mapWithInverse.check('^https://a')
    expect(lookup1).toBeDefined()
    expect(lookup1?.canonical).toBe('https://a')
    expect(lookup1?.inverse).toBe('https://b')
    expect(lookup1?.is_inverted).toBe(true)

    const lookup2 = mapWithInverse.check('^https://b')
    expect(lookup2).toBeDefined()
    expect(lookup2?.canonical).toBe('https://a')
    expect(lookup2?.inverse).toBe('https://b')
    expect(lookup2?.is_inverted).toBe(false)

    // synthesizing an entry which doesn't exist.
    const lookup3 = mapWithInverse.check('^https://c')
    expect(lookup3).toBeDefined()
    expect(lookup3?.canonical).toBe('https://c')
    expect(lookup3?.inverse).toBe('^https://c')
    expect(lookup3?.is_inverted).toBe(true)

    const contains = mapWithInverse.has('^https://a')
    expect(contains).toBe(true)
  })

  test.each([
    ['canonical A unchanged', 'https://a', 'https://a'],
    ['canonical B unchanged', 'https://b', 'https://b'],
    ['inverse A returns B', '^https://a', 'https://b'],
    ['inverse B returns A', '^https://b', 'https://a'],
    ['unknown inverse unchanged', '^https://c', '^https://c'],
  ])('canonicalize: %s', (_name, input, expected) => {
    const mp = new InverseMap([['https://a', 'https://b']])
    expect(mp.canonicalize(input)).toBe(expected)
  })

  test('add/remove idempotence and immutability', () => {
    const p = 'https://e/p'
    const i = 'https://e/i'
    const m0 = new InverseMap([])
    const m1 = m0.add(p, i)
    const m2 = m1.add(p, i) // no change
    expect(m1).not.toBe(m0)
    expect(m2).toBe(m1)
    expect(Array.from(m1)).toEqual([[p, i]])

    const m3 = m1.remove('https://unrelated') // no change
    expect(m3).toBe(m1)

    const m4 = m1.remove(p)
    expect(Array.from(m4)).toEqual([])
    expect(m4).not.toBe(m1)
  })

  test('serialization: toJSON / fromJSON / isValid', () => {
    const pairs: Array<[string, string]> = [
      ['https://a/p', 'https://a/i'],
      ['https://b/p', 'https://b/i'],
    ]
    const mp = new InverseMap(pairs)
    const json = mp.toJSON()

    expect(json.type).toBe('inverse-map')
    expect(json.pairs).toEqual(pairs)

    const roundTrip = InverseMap.fromJSON(json)
    expect(roundTrip).not.toBeNull()
    if (roundTrip === null) {
      throw new Error('roundTrip is null')
    }
    expect(Array.from(roundTrip)).toEqual(pairs)

    // invalid shapes
    expect(InverseMap.isValidInverseMap(null)).toBe(false)
    expect(InverseMap.isValidInverseMap({})).toBe(false)
    expect(
      InverseMap.isValidInverseMap({ type: 'inverse-map', pairs: 'nope' }),
    ).toBe(false)
    expect(
      InverseMap.isValidInverseMap({ type: 'inverse-map', pairs: [{}] }),
    ).toBe(false)
    expect(
      InverseMap.isValidInverseMap({ type: 'inverse-map', pairs: [['a']] }),
    ).toBe(false)
    expect(
      InverseMap.isValidInverseMap({ type: 'other', pairs: [['a', 'b']] }),
    ).toBe(false)
  })
})
