import type { Path } from './pathbuilder'
import type { PathTreeNode } from './pathtree'

export type Diagnostic =
  | { kind: 'path_of_even_length'; node: PathTreeNode; path: string[] }
  | { kind: 'node_path_is_not_an_array'; node: PathTreeNode; path: unknown }
  | {
      kind: 'parent_path_is_not_an_array'
      node: PathTreeNode
      parentPath: unknown
    }
  | {
      kind: 'parent_path_is_of_odd_length'
      node: PathTreeNode
      parentPath: unknown
    }
  | {
      kind: 'parent_path_is_not_a_prefix_of_node_path'
      node: PathTreeNode
      parentPath: unknown
      nodePath: unknown
    }
  | { kind: 'orphaned_field'; id: string; path: Path }
  | { kind: 'orphaned_bundle'; id: string }
  | { kind: 'duplicate_bundle'; id: string; path: Path }
  | { kind: 'disabled_path'; path: Path }

/**
 * Can be called to emit and collect diagnostics about a Pathbuilder.
 */
export class PathbuilderDiagnostics {
  readonly #diagnostics: Diagnostic[] = []

  /**
   * Returns a copy of accumulated diagnostics.
   */
  public get diagnostics(): Diagnostic[] {
    return this.#diagnostics.slice(0)
  }

  /**
   * Resets this diagnostics object to its initial state.
   */
  public clear(): void {
    this.#diagnostics.length = 0
  }

  /**
   * Called when a node path is of even length.
   *
   * @param node Node that has a path of even length
   * @param path The path of even length
   */
  public onPathOfEvenLength(node: PathTreeNode, path: string[]): void {
    this.#diagnostics.push({ kind: 'path_of_even_length', node, path })
  }

  /**
   * Called when a node path is not an array.
   *
   * @param node Node that has a path that is not an array
   * @param elements The path that is not an array
   */
  public onNodePathIsNotAnArray(node: PathTreeNode, path: unknown): void {
    this.#diagnostics.push({ kind: 'node_path_is_not_an_array', node, path })
  }

  /**
   * Called when a parent path is not an array.
   *
   * @param node Node that has a parent path that is not an array
   * @param parentPath The parent path that is not an array
   */
  public onParentPathIsNotAnArray(
    node: PathTreeNode,
    parentPath: unknown,
  ): void {
    this.#diagnostics.push({
      kind: 'parent_path_is_not_an_array',
      node,
      parentPath,
    })
  }

  /**
   * Called when a parent path is of odd length.
   *
   * @param node Node that has a parent path that is of odd length
   * @param parentPath The parent path that is of odd length
   */
  public onParentPathIsOfOddLength(
    node: PathTreeNode,
    parentPath: unknown,
  ): void {
    this.#diagnostics.push({
      kind: 'parent_path_is_of_odd_length',
      node,
      parentPath,
    })
  }

  /**
   * Called when a parent path is not equal with the node path.
   *
   * @param node Node that has a parent path that is not equal with the node path
   * @param parentPath The parent path that is not equal with the node path
   * @param nodePath The node path
   */
  public onParentPathIsNotAPrefixOfNodePath(
    node: PathTreeNode,
    parentPath: unknown,
    nodePath: unknown,
  ): void {
    this.#diagnostics.push({
      kind: 'parent_path_is_not_a_prefix_of_node_path',
      node,
      parentPath,
      nodePath,
    })
  }

  /**
   * Called when a field is orphaned (has no parent bundle).
   *
   * @param id The id of the orphaned field
   * @param path The path of the orphaned field
   */
  public onOrphanedField(id: string, path: Path): void {
    this.#diagnostics.push({ kind: 'orphaned_field', id, path })
  }

  /**
   * Called when a bundle is referenced but missing.
   *
   * @param id The id of the missing bundle
   */
  public onOrphanedBundle(id: string): void {
    this.#diagnostics.push({ kind: 'orphaned_bundle', id })
  }

  /**
   * Called when a bundle is duplicated.
   *
   * @param id The id of the duplicated bundle
   * @param path The path of the duplicated bundle
   */
  public onDuplicateBundle(id: string, path: Path): void {
    this.#diagnostics.push({ kind: 'duplicate_bundle', id, path })
  }

  /**
   * Called when a disabled path is encountered.
   *
   * @param path the path that is disabled
   */
  public onDisabledPath(path: Path): void {
    this.#diagnostics.push({ kind: 'disabled_path', path })
  }
}
