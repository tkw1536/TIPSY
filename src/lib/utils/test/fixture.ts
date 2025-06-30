import { join } from 'node:path'
import { Fixtures } from '.'
import { readFile } from 'node:fs/promises'

/** reads a fixture at the given path */
export async function readFixture(...elements: string[]): Promise<string> {
  const path = join(Fixtures, ...elements)

  const buffer = await readFile(path, { encoding: 'utf8' })
  return buffer
}

/** reads a fixture as JSON */
export async function readFixtureJSON<T>(...elements: string[]): Promise<T> {
  const src = await readFixture(...elements)
  return JSON.parse(src) as T
}
