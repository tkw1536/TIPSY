import { useCallback, useId, useMemo } from 'preact/hooks'
import useInspectorStore from '../state'
import { Fragment, type VNode } from 'preact'
import styles from './uris.module.css'
import type { URISort } from '../state/uris'
import { classes } from '../../../lib/utils/classes'
import { Panel } from '../../../components/layout/panel'
import { Control } from '../../../components/graph-display/controls'
import { Switch } from '../../../components/form/checkbox'
import Dropdown from '../../../components/form/dropdown'
import { Label } from '../../../components/form/generic'
import Text from '../../../components/form/value'

interface URIStats {
  concept: number
  property: {
    relation: number
    datatype: number
  }
}

export default function URIListTab(): VNode<any> {
  return (
    <Panel panel={<URIListPanel />} margin={5}>
      <URIList />
    </Panel>
  )
}

function URIListPanel(): VNode<any> {
  const uriSort = useInspectorStore(s => s.uriSort)
  const setURISort = useInspectorStore(s => s.setURISort)
  const setURIShowInverses = useInspectorStore(s => s.setURIShowInverses)
  const uriUseNamespaces = useInspectorStore(s => s.uriUseNamespaces)
  const uriShowInverses = useInspectorStore(s => s.uriShowInverses)
  const setURIUseNamespaces = useInspectorStore(s => s.setURIUseNamespaces)

  const setSortColumn = useCallback(
    (column: URISort['column']) => {
      setURISort({ column, direction: uriSort.direction })
    },
    [uriSort, setURISort],
  )

  const setSortDirection = useCallback(
    (direction: URISort['direction']) => {
      setURISort({ column: uriSort.column, direction })
    },
    [uriSort, setURISort],
  )

  const id = useId()

  return (
    <>
      <Control name='Sort'>
        <p>
          You can chose how to sort the table. This can also be changed inline
          by clicking the <code>+</code> and <code>-</code> buttons on the
          appropriate column headers.
        </p>

        <table class={styles.wide}>
          <tbody>
            <tr>
              <td>
                <Label id={`${id}-column`}>Column</Label>
              </td>
              <td>
                <Dropdown
                  id={`${id}-column`}
                  values={['uri', 'concept', 'property', 'datatype']}
                  titles={{
                    uri: 'URI',
                    concept: 'Concept',
                    property: 'Property',
                    datatype: 'Datatype',
                  }}
                  value={uriSort.column}
                  onInput={setSortColumn}
                />
              </td>
            </tr>
            <tr>
              <td>
                <Label id={`${id}-direction`}>Direction</Label>
              </td>
              <td>
                <Dropdown
                  id={`${id}-direction`}
                  values={['asc', 'desc']}
                  titles={{ asc: 'Ascending', desc: 'Descending' }}
                  value={uriSort.direction}
                  onInput={setSortDirection}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Control>
      <Control name='Namespaces & URIs'>
        <p>
          By default, this Tab displays complete URIs. Here you can chose to use
          the namespace map instead.
        </p>
        <p>
          <Switch value={uriUseNamespaces} onInput={setURIUseNamespaces}>
            Use namespaces in URI column. Search will always match both short
            and long-form URIs.
          </Switch>
        </p>
        <p>
          <Switch value={uriShowInverses} onInput={setURIShowInverses}>
            Show Inverse URI Column
          </Switch>
        </p>
      </Control>
    </>
  )
}

function URIList(): VNode<any> {
  const tree = useInspectorStore(s => s.pathtree)
  const inverses = useInspectorStore(s => s.inverses)
  const uriSort = useInspectorStore(s => s.uriSort)
  const search = useInspectorStore(s => s.uriSearch)
  const setSearch = useInspectorStore(s => s.setURISearch)
  const uriShowInverses = useInspectorStore(s => s.uriShowInverses)

  const uris = useMemo(() => {
    const nodes = new Map<string, URIStats>()
    for (const node of tree.walk()) {
      for (const element of node.elements()) {
        const theURI = inverses.canonicalize(element.uri)
        const count: URIStats = nodes.get(theURI) ?? {
          concept: 0,
          property: { relation: 0, datatype: 0 },
        }
        switch (element.role) {
          case 'datatype':
            count.property.datatype += 1
            break
          case 'relation':
            count.property.relation += 1
            break
          default:
            count.concept += 1
            break
        }
        nodes.set(theURI, count)
      }
    }
    return nodes
  }, [tree])

  const sortedURIEntries = useMemo(() => {
    let getField: (uri: string, stats: URIStats) => string | number
    switch (uriSort.column) {
      case 'uri':
        getField = (uri, _) => uri
        break
      case 'concept':
        getField = (_, stats) => stats.concept
        break
      case 'property':
        getField = (_, stats) => stats.property.relation
        break
      case 'datatype':
        getField = (_, stats) => stats.property.datatype
        break
    }

    const factor = uriSort.direction === 'asc' ? 1 : -1

    const entries = Array.from(uris.entries())
    entries.sort((a, b) => {
      const leftField = getField(a[0], a[1])
      const rightField = getField(b[0], b[1])
      const result = compare(leftField, rightField) * factor
      return result
    })
    return entries
  }, [uris, uriSort])

  return (
    <table class={styles.table}>
      <thead>
        <tr>
          <th>
            URI
            <SortControl column='uri' />
          </th>
          { uriShowInverses && (
            <Fragment>
              <th colspan={2}>
                Inverse URI
              </th>
            </Fragment>
          )}
          <th colSpan={3}>Stats</th>
        </tr>
        <tr>
          <th>
            <Text value={search} onInput={setSearch} />
          </th>
          { uriShowInverses && (
            <th colspan={2} />
          )}
          <th>
            Concept
            <SortControl column='concept' />
          </th>
          <th>
            Property
            <SortControl column='property' />
          </th>
          <th>
            Datatype
            <SortControl column='datatype' />
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedURIEntries.map(([uri, stats]) => (
          <URInfoRow uri={uri} stats={stats} key={uri} />
        ))}
      </tbody>
    </table>
  )
}

function URInfoRow({
  uri,
  stats,
}: {
  uri: string
  stats: URIStats
}): VNode<any> {
  const uriUseNamespaces = useInspectorStore(s => s.uriUseNamespaces)
  const ns = useInspectorStore(s => s.ns)
  const nsURI = ns.apply(uri)

  const uriShowInverses = useInspectorStore(s => s.uriShowInverses)
  const inverses = useInspectorStore(s => s.inverses)
  const inverseInfo = inverses.check(uri)

  // determine if the URI is inverted
  const isInverted = typeof inverseInfo !== 'undefined' ? inverseInfo.is_inverted : null

  // determine the inverse URI (if one exists)
  let inverseURI = typeof inverseInfo !== 'undefined' ? (inverseInfo.is_inverted ? inverseInfo.canonical : inverseInfo.inverse) : null
  inverseURI = typeof inverseURI === 'string' && uriUseNamespaces ? ns.apply(inverseURI) : inverseURI

  const search = useInspectorStore(s => s.uriSearch)
  const matched = useMemo(() => {
    if (search === '') return null
    const query = search.toLowerCase()
    return (
      nsURI.toLowerCase().includes(query) || uri.toLowerCase().includes(query)
    )
  }, [uri, nsURI, search])
  return (
    <tr
      class={classes(
        matched === true && styles.uri_matched,
        matched === false && styles.uri_not_matched,
      )}
    >
      <td>
        <code>{uriUseNamespaces ? nsURI : uri}</code>
      </td>
      { uriShowInverses && (
          <Fragment>
            <td>
              <code>{inverseURI}</code>
            </td>
            <td>
              { isInverted && "inverted"}
            </td>
          </Fragment>
        )}
      <td>{stats.concept}</td>
      <td>{stats.property.relation}</td>
      <td>{stats.property.datatype}</td>
    </tr>
  )
}

function SortControl({ column }: { column: URISort['column'] }): VNode<any> {
  const uriSort = useInspectorStore(s => s.uriSort)
  const setURISort = useInspectorStore(s => s.setURISort)

  const setAsc = useCallback(() => {
    setURISort({ column, direction: 'asc' })
  }, [setURISort, column])

  const setDesc = useCallback(() => {
    setURISort({ column, direction: 'desc' })
  }, [setURISort, column])

  const isColumnSelected = uriSort.column === column

  return (
    <span class={styles.sortControl}>
      <span
        onClick={setAsc}
        class={classes(
          isColumnSelected && uriSort.direction === 'asc' && styles.active,
          styles.ascending,
        )}
      />
      <span
        onClick={setDesc}
        class={classes(
          isColumnSelected && uriSort.direction === 'desc' && styles.active,
          styles.descending,
        )}
      />
    </span>
  )
}

/**
 * Compares two values left and right.
 *
 * @param left
 * @param right
 * @returns
 *   A positive number if left is greater than right, a negative number if left is less than right, and 0 if they are equal.
 *   All numbers are considered smaller than strings.
 */
function compare(left: number | string, right: number | string): number {
  // can only compare like types: consider number smaller
  if (typeof left !== typeof right) {
    return typeof left === 'number' ? -1 : 1
  }
  return left > right ? 1 : left < right ? -1 : 0
}
