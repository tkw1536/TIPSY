import { describe, expect, test, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import NamespaceEditor from './namespace-editor'
import { NamespaceMap } from '../lib/pathbuilder/namespace'

//spellchecker:words newns validkey rdfs rdfnew

/** Helper to find a button by its text content */
function findButton(
  container: Element,
  text: string,
): HTMLButtonElement | undefined {
  const buttons = container.querySelectorAll('button')
  return Array.from(buttons).find(btn => btn.textContent === text)
}

describe('NamespaceEditor', () => {
  test('renders table with correct headers', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const headers = container.querySelectorAll('th')
    expect(headers.length).toBe(3)
    expect(headers[0].textContent).toBe('NS')
    expect(headers[1].textContent).toBe('URI')
  })

  test('renders existing namespace entries', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
      ['owl', 'http://www.w3.org/2002/07/owl#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    // 2 entries * 2 fields + 2 add fields = 6
    expect(inputs.length).toBe(6)
  })

  test('calls onUpdate when deleting a namespace', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const deleteButton = findButton(container, 'Delete')
    expect(deleteButton).toBeDefined()
    if (deleteButton === undefined) return

    fireEvent.click(deleteButton)
    expect(onUpdate).toHaveBeenCalled()
  })

  test('calls onReset when clicking reset button', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const resetButton = findButton(container, 'Reset To Default')
    expect(resetButton).toBeDefined()
    if (resetButton === undefined) return

    const form = resetButton.closest('form')
    expect(form).not.toBeNull()
    if (form === null) return

    fireEvent.submit(form)
    expect(onReset).toHaveBeenCalled()
  })

  test('add button is disabled when fields are empty', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    expect(addButton.disabled).toBe(true)
  })

  test('add button is enabled when valid values are entered', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement
    const longInput = inputs[1] as HTMLInputElement

    fireEvent.input(shortInput, { target: { value: 'test' } })
    fireEvent.input(longInput, {
      target: { value: 'http://example.org/test#' },
    })

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    expect(addButton.disabled).toBe(false)
  })

  test('calls onUpdate when adding a new namespace', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement
    const longInput = inputs[1] as HTMLInputElement

    fireEvent.input(shortInput, { target: { value: 'newns' } })
    fireEvent.input(longInput, {
      target: { value: 'http://example.org/newns#' },
    })

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    const form = addButton.closest('form')
    expect(form).not.toBeNull()
    if (form === null) return

    fireEvent.submit(form)

    expect(onUpdate).toHaveBeenCalled()
    const calledWith = onUpdate.mock.calls[0][0] as NamespaceMap
    expect(calledWith.has('newns')).toBe(true)
  })

  test('shows validation error for duplicate namespace key', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    // The add row inputs are the last 2 text inputs
    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[inputs.length - 2] as HTMLInputElement
    const longInput = inputs[inputs.length - 1] as HTMLInputElement

    fireEvent.input(shortInput, { target: { value: 'rdf' } })
    fireEvent.input(longInput, { target: { value: 'http://other.org/' } })

    // Add button should be disabled because of duplicate key
    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    expect(addButton.disabled).toBe(true)
  })

  test('shows validation error for invalid namespace key characters', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement
    const longInput = inputs[1] as HTMLInputElement

    // Invalid characters in namespace key
    fireEvent.input(shortInput, { target: { value: 'invalid key!' } })
    fireEvent.input(longInput, { target: { value: 'http://example.org/' } })

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    expect(addButton.disabled).toBe(true)
  })

  test('apply button is disabled when values have not changed', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const applyButton = findButton(container, 'Apply')
    expect(applyButton).toBeDefined()
    if (applyButton === undefined) return

    expect(applyButton.disabled).toBe(true)
  })

  test('apply button is enabled when values are modified', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    // First two inputs are for the existing entry
    const inputs = container.querySelectorAll('input[type="text"]')
    const longInput = inputs[1] as HTMLInputElement

    fireEvent.input(longInput, {
      target: { value: 'http://modified.example.org/' },
    })

    const applyButton = findButton(container, 'Apply')
    expect(applyButton).toBeDefined()
    if (applyButton === undefined) return

    expect(applyButton.disabled).toBe(false)
  })

  test('calls onUpdate when applying changes to existing entry', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    // First two inputs are for the existing entry
    const inputs = container.querySelectorAll('input[type="text"]')
    const longInput = inputs[1] as HTMLInputElement

    fireEvent.input(longInput, {
      target: { value: 'http://modified.example.org/' },
    })

    const applyButton = findButton(container, 'Apply')
    expect(applyButton).toBeDefined()
    if (applyButton === undefined) return

    fireEvent.click(applyButton)
    expect(onUpdate).toHaveBeenCalled()
  })

  test('renders export button', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const exportButton = findButton(container, 'Export')
    expect(exportButton).toBeDefined()
  })

  test('shows validation error for empty URI', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement

    // Valid key but empty URI
    fireEvent.input(shortInput, { target: { value: 'validkey' } })

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    expect(addButton.disabled).toBe(true)
  })

  test('shows validation error for key starting with caret', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement
    const longInput = inputs[1] as HTMLInputElement

    // Key starting with caret is invalid
    fireEvent.input(shortInput, { target: { value: '^invalid' } })
    fireEvent.input(longInput, { target: { value: 'http://example.org/' } })

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    expect(addButton.disabled).toBe(true)
  })

  test('shows validation error for URI starting with caret', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement
    const longInput = inputs[1] as HTMLInputElement

    fireEvent.input(shortInput, { target: { value: 'validkey' } })
    fireEvent.input(longInput, { target: { value: '^http://example.org/' } })

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    expect(addButton.disabled).toBe(true)
  })

  test('clears add inputs after successful add', () => {
    const ns = NamespaceMap.empty()
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement
    const longInput = inputs[1] as HTMLInputElement

    fireEvent.input(shortInput, { target: { value: 'newns' } })
    fireEvent.input(longInput, { target: { value: 'http://example.org/' } })

    const addButton = findButton(container, 'Add')
    expect(addButton).toBeDefined()
    if (addButton === undefined) return

    const form = addButton.closest('form')
    expect(form).not.toBeNull()
    if (form === null) return

    fireEvent.submit(form)

    // After submit, inputs should be cleared
    expect(shortInput.value).toBe('')
    expect(longInput.value).toBe('')
  })

  test('renders multiple namespace entries correctly', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
      ['rdfs', 'http://www.w3.org/2000/01/rdf-schema#'],
      ['owl', 'http://www.w3.org/2002/07/owl#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    // 3 entries + 1 add row = 4 rows in tbody
    // But we also have controls row, so actually checking inputs is more reliable
    // 3 entries * 2 fields + 2 add fields = 8 text inputs
    const inputs = container.querySelectorAll('input[type="text"]')
    expect(inputs.length).toBe(8)
  })

  test('can rename an existing namespace key', () => {
    const ns = NamespaceMap.fromMap([
      ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
    ])
    const onReset = vi.fn()
    const onUpdate = vi.fn()

    const { container } = render(
      <NamespaceEditor ns={ns} onReset={onReset} onUpdate={onUpdate} />,
    )

    // First input is the short name
    const inputs = container.querySelectorAll('input[type="text"]')
    const shortInput = inputs[0] as HTMLInputElement

    fireEvent.input(shortInput, { target: { value: 'rdfnew' } })

    const applyButton = findButton(container, 'Apply')
    expect(applyButton).toBeDefined()
    if (applyButton === undefined) return

    expect(applyButton.disabled).toBe(false)

    fireEvent.click(applyButton)
    expect(onUpdate).toHaveBeenCalled()

    const calledWith = onUpdate.mock.calls[0][0] as NamespaceMap
    expect(calledWith.has('rdfnew')).toBe(true)
    expect(calledWith.has('rdf')).toBe(false)
  })
})
