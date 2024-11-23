/* eslint-disable no-new-wrappers -- needed by the test cases */
import { describe, expect, test } from 'vitest'
import { sameValueZero } from './same-value-zero'

describe(sameValueZero, () => {
  test.each([
    [undefined, undefined, true],
    [null, null, true],
    [true, true, true],
    [false, false, true],
    [true, false, false],
    ['foo', 'foo', true],
    [0, 0, true],
    [+0, -0, true],
    [+0, 0, true],
    [-0, 0, true],
    [0n, -0n, true],
    [0, false, false],
    ['', false, false],
    [0, false, false],
    ['', 0, false],
    ['0', 0, false],
    ['17', 17, false],
    [[1, 2], '1,2', false],
    [new String('foo'), 'foo', false],
    [null, undefined, false],
    [null, false, false],
    [undefined, false, false],
    [{ foo: 'bar' }, { foo: 'bar' }, false],
    [new String('foo'), new String('foo'), false],
    [0, null, false],
    [0, NaN, false],
    ['foo', NaN, false],
    [NaN, NaN, true],
    [undefined, undefined, true],
    [null, null, true],
  ])('%s %s -> %j', (left, right, want) => {
    expect(sameValueZero(left, right)).toBe(want)
  })
})
