import { execSync } from 'node:child_process'
import { join } from 'node:path'

const PACKAGE_JSON = join(__dirname, '..', 'package.json')
const YARN_LOCK = join(__dirname, '..', 'yarn.lock')

/** generates a legal disclaimer to include */
export default function generateDisclaimer(this: MacroContext | void): string {
  this?.invalidateOnFileChange(PACKAGE_JSON)
  this?.invalidateOnFileChange(YARN_LOCK)
  const buffer = execSync('yarn licenses generate-disclaimer --production', {
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return buffer.toString()
}
