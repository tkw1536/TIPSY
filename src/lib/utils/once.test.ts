import { describe, expect, test, vi } from 'vitest'
import Once, { Lazy, LazyValue } from './once'

vi.useFakeTimers()

describe(Once, () => {
  const THE_TIMEOUT = 1000

  test('resolves in concurrent mode', async () => {
    const once = new Once()

    const p1 = once.Do(async () => {
      await new Promise(resolve => {
        setTimeout(resolve, THE_TIMEOUT)
      })
    })
    const p2 = once.Do(async () => {
      throw new Error('this should never be called')
    })
    vi.runAllTimers()

    await expect(p1).resolves.toBeUndefined()
    await expect(p2).resolves.toBeUndefined()
  })

  test('resolves in sequential mode', async () => {
    const once = new Once()

    const p1 = once.Do(async () => {
      await new Promise(resolve => {
        setTimeout(resolve, THE_TIMEOUT)
      })
    })
    vi.runAllTimers()
    await expect(p1).resolves.toBeUndefined()

    const p2 = once.Do(async () => {
      throw new Error('this should never be called')
    })
    await expect(p2).resolves.toBeUndefined()
  })

  test('rejection in concurrent mode', async () => {
    const once = new Once()
    const p1 = once.Do(async () => {
      await new Promise(resolve => {
        setTimeout(resolve, THE_TIMEOUT)
      })
      throw new Error('debug rejection')
    })
    const p2 = once.Do(async () => {})

    vi.runAllTimers()

    await expect(p1).rejects.toThrow('debug rejection')
    await expect(p2).rejects.toThrow('debug rejection')
  })

  test('rejection in sequential mode', async () => {
    const once = new Once()
    const p1 = once.Do(async () => {
      await new Promise(resolve => {
        setTimeout(resolve, THE_TIMEOUT)
      })
      throw new Error('debug rejection')
    })
    vi.runAllTimers()
    await expect(p1).rejects.toThrow('debug rejection')

    const p2 = once.Do(async () => {})
    await expect(p2).rejects.toThrow('debug rejection')
  })
})

describe(Lazy, () => {
  test('Get() executes only once', async () => {
    const lazy = new Lazy()

    const firstValue = await lazy.Get(async () => 1)
    expect(firstValue).toBe(1)

    const secondValue = await lazy.Get(async () => 2)
    expect(secondValue).toBe(1)
  })

  test('value holds the value after being loaded', async () => {
    const lazy = new Lazy()

    // no value before the first call
    expect(() => lazy.value).toThrow()

    // value after the first call
    await lazy.Get(async () => 1)
    expect(lazy.value).toBe(1)

    // same value after the second call
    await lazy.Get(async () => 2)
    expect(lazy.value).toBe(1)
  })
})

describe(LazyValue, () => {
  test('lazyValue calls the getter only once', async () => {
    let counter = 0
    const lazy = new LazyValue(async () => {
      counter += 1
      return counter
    })

    const first = await lazy.lazyValue
    const second = await lazy.lazyValue

    expect(first).toBe(1)
    expect(second).toBe(1)
  })

  test('value holds the value after load', async () => {
    let counter = 0
    const lazy = new LazyValue(async () => {
      counter += 1
      return counter
    })

    // no value before the first call
    expect(() => lazy.value).toThrow()

    await lazy.load()
    expect(lazy.value).toBe(1)
    expect(lazy.value).toBe(1) // intentionally check twice!
  })
})
