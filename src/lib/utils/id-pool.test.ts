import { describe, expect, test } from 'vitest'
import { IDPool } from './id-pool'

describe(IDPool, () => {
  test('next() and nextInt() returns ids in the designated format', () => {
    const pool = new IDPool<never>()

    // check that the first ID is correct
    expect(pool.next()).toBe('I000000000000001')
    expect(pool.nextInt()).toBe(2)

    for (let i = 0; i < 1000; i += 1) {
      pool.next()
    }

    // check that these ids are still correct
    expect(pool.nextInt()).toBe(1003)
    expect(pool.next()).toBe('I0000000000003EC')
  })

  test('for() and forInt() share and maintain ids', () => {
    const pool = new IDPool<string>()

    // generate a couple of IDs
    expect(pool.for('hello world')).toBe('I000000000000001')
    expect(pool.intFor('bye')).toBe(2)
    expect(pool.for('hi')).toBe('I000000000000003')

    // generate more (unused IDs)
    for (let i = 0; i < 1000; i += 1) {
      pool.next()
    }

    // check that old ids are maintained
    expect(pool.for('hello world')).toBe('I000000000000001')
    expect(pool.for('bye')).toBe('I000000000000002')
    expect(pool.intFor('bye')).toBe(2)
    expect(pool.for('hi')).toBe('I000000000000003')
  })

  test('of() and ofInt() returns stored ids', () => {
    const pool = new IDPool<string>()

    // generate a couple of IDs
    expect(pool.for('hello world')).toBe('I000000000000001')
    expect(pool.for('bye')).toBe('I000000000000002')
    expect(pool.for('hi')).toBe('I000000000000003')

    // generate more (unused IDs)
    for (let i = 0; i < 1000; i += 1) {
      pool.nextInt()
    }

    // check string ids
    expect(pool.of('I000000000000001')).toBe('hello world')
    expect(pool.of('I000000000000002')).toBe('bye')
    expect(pool.of('I000000000000003')).toBe('hi')
    expect(pool.of('I000000000000004')).toBeNull()
    expect(pool.of('some-non-id-format')).toBeNull()

    // check int ids
    expect(pool.ofInt(1)).toBe('hello world')
    expect(pool.ofInt(2)).toBe('bye')
    expect(pool.ofInt(3)).toBe('hi')
    expect(pool.ofInt(4)).toBeNull()
    expect(pool.ofInt(-10)).toBeNull()
  })

  test('remove() and removeInt() remove the underlying map', () => {
    const pool = new IDPool<string>()

    // generate a couple of IDs
    expect(pool.for('hello world')).toBe('I000000000000001')
    expect(pool.for('bye')).toBe('I000000000000002')
    expect(pool.for('hi')).toBe('I000000000000003')

    pool.delete('I000000000000002')
    pool.deleteInt(3)

    // 2 was deleted
    expect(pool.ofInt(2)).toBeNull()
    expect(pool.of('I000000000000002')).toBeNull()

    // 3 was deleted
    expect(pool.ofInt(3)).toBeNull()
    expect(pool.of('I000000000000003')).toBeNull()

    // 1 wa snot deleted
    expect(pool.ofInt(1)).toBe('hello world')
  })
})
