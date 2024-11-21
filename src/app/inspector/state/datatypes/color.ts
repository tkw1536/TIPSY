import ColorMap from '../../../../lib/pathbuilder/annotations/colormap'
import { Field, type PathTreeNode } from '../../../../lib/pathbuilder/pathtree'

export enum ColorPreset {
  OrangeAndGray = 'Orange And Gray',
  OnePerMainBundle = 'Per Main Bundle',
  OnePerBundle = 'Per Bundle',
  OnePerPath = 'Per Path',
}

export const colorPresets: ColorPreset[] = [
  ColorPreset.OrangeAndGray,
  ColorPreset.OnePerMainBundle,
  ColorPreset.OnePerBundle,
  ColorPreset.OnePerPath,
]

export function applyColorPreset(
  node: PathTreeNode,
  preset: ColorPreset,
): ColorMap {
  switch (preset) {
    case ColorPreset.OnePerBundle:
      return colorPerBundlePreset(node)
    case ColorPreset.OnePerMainBundle:
      return colorPerMainBundlePreset(node)
    case ColorPreset.OnePerPath:
      return colorPerPath(node)
    default:
      return bluePreset(node)
  }
}

function bluePreset(node: PathTreeNode): ColorMap {
  return ColorMap.generate(node, { bundle: '#f6b73c', field: '#d3d3d3' })
}

const GOLDEN_ANGLE = 137.508
function colorOf(index: number): string {
  const h = (index > 0 ? index + 1 : 1) * GOLDEN_ANGLE
  return (
    ColorMap.parseColor(`hsl(${h % 360},50%,75%)`) ?? ColorMap.globalDefault
  )
}

/**
 * Assigns one color per bundle
 */
function colorPerBundlePreset(root: PathTreeNode): ColorMap {
  return colorPerAssocPreset(root, node =>
    node instanceof Field ? node.parent.path.id : node.path?.id,
  )
}

/**
 * Assigns one color per main bundle
 * @param root
 * @returns
 */
function colorPerMainBundlePreset(root: PathTreeNode): ColorMap {
  return colorPerAssocPreset(root, node => node.mainBundle?.path.id)
}

/**
 * Assigns one color per path
 * @param root
 * @returns
 */
function colorPerPath(root: PathTreeNode): ColorMap {
  return colorPerAssocPreset(root, node => node.path?.id)
}

/**
 * colorPerAssocPreset generates one color per "association".
 * the {@param assoc} function is called for each node.
 *
 * When two nodes return the same string value, they are given the same color.
 * When it returns undefined, no color is assigned to the node.
 */
function colorPerAssocPreset(
  root: PathTreeNode,
  assoc: (node: PathTreeNode) => string | undefined,
): ColorMap {
  const map = new Map<string, string>()
  const colors = new Map<string, string>()

  let index = 0
  for (const node of root.walk()) {
    // grab the corresponding association
    const id = assoc(node)
    if (typeof id !== 'string') {
      continue
    }

    // get or set the color of the id
    let color = colors.get(id)
    if (typeof color !== 'string') {
      color = colorOf(index++)
      colors.set(id, color)
    }

    // set the color of the path
    const { path } = node
    if (path === null) {
      continue
    }
    map.set(path.id, color)
  }

  return new ColorMap(ColorMap.globalDefault, map)
}
