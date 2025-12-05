import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/preact'
import VersionInfo, { testVersionInfo } from './version'

describe('VersionInfo', () => {
  test('renders correctly', async () => {
    const { container } = render(<VersionInfo />)

    const codeElement = container.querySelector('code')
    expect(codeElement).not.toBeNull()

    const content = codeElement?.textContent
    const parsed = JSON.parse(content ?? '')
    expect(parsed).toStrictEqual(testVersionInfo)
  })
})
