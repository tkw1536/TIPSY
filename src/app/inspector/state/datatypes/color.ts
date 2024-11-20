import ColorMap from '../../../../lib/pathbuilder/annotations/colormap'
import {
  Bundle,
  Field,
  type PathTreeNode,
} from '../../../../lib/pathbuilder/pathtree'

export enum ColorPreset {
  OrangeAndGray = 'Orange And Gray',
  OnePerMainBundle = 'One Color Per Main Bundle',
  OnePerBundle = 'One Color Per Bundle',
}

export const colorPresets: ColorPreset[] = [
  ColorPreset.OrangeAndGray,
  ColorPreset.OnePerBundle,
  ColorPreset.OnePerMainBundle,
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

function colorPerBundlePreset(root: PathTreeNode): ColorMap {
  const map = new Map<string, string>()
  let index = 0
  for (const node of root.walk()) {
    if (node instanceof Bundle) {
      map.set(node.path.id, colorOf(index++))
      continue
    }

    if (node instanceof Field) {
      const parentColor = map.get(node.parent.path.id)
      if (typeof parentColor === 'undefined') {
        map.set(node.path.id, colorOf(index++))
        continue
      }
      map.set(node.path.id, parentColor)
    }
  }

  return new ColorMap(ColorMap.globalDefault, map)
}

function colorPerMainBundlePreset(root: PathTreeNode): ColorMap {
  const map = new Map<string, string>()
  const bundleColors = new Map<string, string>()

  let index = 0
  for (const node of root.walk()) {
    // grab the corresponding main bundle
    const bundle = node.mainBundle
    if (bundle === null) {
      continue
    }

    // get or set the color of the main bundle
    const id = bundle.path.id
    let color = bundleColors.get(id)
    if (typeof color !== 'string') {
      color = colorOf(index++)
      bundleColors.set(id, color)
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
