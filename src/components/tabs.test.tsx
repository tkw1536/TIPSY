import { describe, expect, test, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import Tabs, { Tab, TabLabel, TabInterface } from './tabs'

describe('Tab', () => {
  test('renders children correctly', () => {
    const { container } = render(
      <Tab id='test' title='Test Tab'>
        <div>Tab Content</div>
      </Tab>,
    )
    expect(container.textContent).toBe('Tab Content')
  })
})

describe('TabLabel', () => {
  test('renders children correctly', () => {
    const { container } = render(
      <TabLabel>
        <span>Label Text</span>
      </TabLabel>,
    )
    expect(container.textContent).toBe('Label Text')
  })

  test('renders empty when no children provided', () => {
    const { container } = render(<TabLabel />)
    expect(container.textContent).toBe('')
  })
})

describe('Tabs', () => {
  test('renders tabs with correct roles', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
        <Tab id='tab2' title='Second Tab'>
          Content 2
        </Tab>
      </Tabs>,
    )

    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist).not.toBeNull()

    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs.length).toBe(2)
  })

  test('marks active tab as selected', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab2' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
        <Tab id='tab2' title='Second Tab'>
          Content 2
        </Tab>
      </Tabs>,
    )

    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs[0].getAttribute('aria-selected')).toBe('false')
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
  })

  test('displays content of active tab only', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          <div data-testid='content1'>Content 1</div>
        </Tab>
        <Tab id='tab2' title='Second Tab'>
          <div data-testid='content2'>Content 2</div>
        </Tab>
      </Tabs>,
    )

    const panels = container.querySelectorAll('[role="tabpanel"]')
    expect(panels.length).toBe(2)

    // Active panel should contain its content, inactive should not
    expect(panels[0].textContent).toContain('Content 1')
    expect(panels[1].textContent).not.toContain('Content 2')
  })

  test('calls onChangeTab when clicking a tab', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
        <Tab id='tab2' title='Second Tab'>
          Content 2
        </Tab>
      </Tabs>,
    )

    const tabs = container.querySelectorAll('[role="tab"]')
    fireEvent.click(tabs[1])

    expect(onChangeTab).toHaveBeenCalledWith('tab2')
  })

  test('does not call onChangeTab when clicking a disabled tab', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
        <Tab id='tab2' title='Second Tab' disabled>
          Content 2
        </Tab>
      </Tabs>,
    )

    const tabs = container.querySelectorAll('[role="tab"]')
    fireEvent.click(tabs[1])

    expect(onChangeTab).not.toHaveBeenCalled()
  })

  test('disabled tab has correct aria-disabled attribute', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
        <Tab id='tab2' title='Second Tab' disabled>
          Content 2
        </Tab>
      </Tabs>,
    )

    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs[0].getAttribute('aria-disabled')).toBeNull()
    expect(tabs[1].getAttribute('aria-disabled')).toBe('true')
  })

  test('renders TabLabel correctly in the tablist', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <TabLabel>Section Label</TabLabel>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
      </Tabs>,
    )

    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist?.textContent).toContain('Section Label')
    expect(tablist?.textContent).toContain('First Tab')
  })

  test('does not render content for disabled active tab', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab' disabled>
          <div data-testid='content1'>Content 1</div>
        </Tab>
        <Tab id='tab2' title='Second Tab'>
          <div data-testid='content2'>Content 2</div>
        </Tab>
      </Tabs>,
    )

    const panels = container.querySelectorAll('[role="tabpanel"]')
    // Even if active, disabled tabs should not show content
    expect(panels[0].className).not.toContain('selected')
  })

  test('filters out invalid children', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
        {null}
        {undefined}
        <div>Invalid child</div>
        <Tab id='tab2' title='Second Tab'>
          Content 2
        </Tab>
      </Tabs>,
    )

    // Should only have 2 tabs (the invalid div is filtered out)
    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs.length).toBe(2)
  })

  test('tabs have correct aria-controls linking to panels', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
      </Tabs>,
    )

    const tab = container.querySelector('[role="tab"]')
    const panel = container.querySelector('[role="tabpanel"]')

    const tabAriaControls = tab?.getAttribute('aria-controls')
    const panelId = panel?.getAttribute('id')

    expect(tabAriaControls).toBe(panelId)
  })

  test('panels have correct aria-labelledby linking to tabs', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
      </Tabs>,
    )

    const tab = container.querySelector('[role="tab"]')
    const panel = container.querySelector('[role="tabpanel"]')

    const tabId = tab?.getAttribute('id')
    const panelAriaLabelledby = panel?.getAttribute('aria-labelledby')

    expect(panelAriaLabelledby).toBe(tabId)
  })

  test('tabs have tabindex for keyboard navigation', () => {
    const onChangeTab = vi.fn()
    const { container } = render(
      <Tabs active='tab1' onChangeTab={onChangeTab}>
        <Tab id='tab1' title='First Tab'>
          Content 1
        </Tab>
      </Tabs>,
    )

    const tab = container.querySelector('[role="tab"]')
    expect(tab?.getAttribute('tabindex')).toBe('0')
  })
})

describe('TabInterface', () => {
  test('renders with pre-processed children', () => {
    const onChangeTab = vi.fn()
    const children = [
      {
        type: 'tab' as const,
        id: 'tab1',
        title: 'First',
        children: 'Content 1',
      },
      {
        type: 'tab' as const,
        id: 'tab2',
        title: 'Second',
        children: 'Content 2',
      },
    ]

    const { container } = render(
      <TabInterface active='tab1' onChangeTab={onChangeTab}>
        {children}
      </TabInterface>,
    )

    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs.length).toBe(2)
    expect(tabs[0].textContent).toBe('First')
    expect(tabs[1].textContent).toBe('Second')
  })

  test('renders labels in tablist', () => {
    const onChangeTab = vi.fn()
    const children = [
      { type: 'label' as const, children: 'My Label' },
      {
        type: 'tab' as const,
        id: 'tab1',
        title: 'First',
        children: 'Content 1',
      },
    ]

    const { container } = render(
      <TabInterface active='tab1' onChangeTab={onChangeTab}>
        {children}
      </TabInterface>,
    )

    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist?.textContent).toContain('My Label')
  })

  test('labels do not create tabpanels', () => {
    const onChangeTab = vi.fn()
    const children = [
      { type: 'label' as const, children: 'My Label' },
      {
        type: 'tab' as const,
        id: 'tab1',
        title: 'First',
        children: 'Content 1',
      },
    ]

    const { container } = render(
      <TabInterface active='tab1' onChangeTab={onChangeTab}>
        {children}
      </TabInterface>,
    )

    const panels = container.querySelectorAll('[role="tabpanel"]')
    expect(panels.length).toBe(1)
  })
})
