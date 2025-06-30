import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGE_JSON = join(__dirname, '..', 'package.json')
const YARN_LOCK = join(__dirname, '..', 'yarn.lock')

export interface VersionInfo {
  version: string
  git: string
  compileTime: string
}

/** returns the current version */
export default function getVersionInfo(this: MacroContext | void): VersionInfo {
  this?.invalidateOnFileChange(PACKAGE_JSON)
  this?.invalidateOnFileChange(YARN_LOCK)

  const version: string = JSON.parse(
    readFileSync(PACKAGE_JSON).toString(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- type is known
  ).version
  const compileTime = new Date().toISOString()
  const git = execSync('git rev-parse HEAD', {
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString()
  return { version, compileTime, git }
}
