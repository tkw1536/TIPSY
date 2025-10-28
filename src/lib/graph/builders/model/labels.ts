import type {
  Attachment,
  Element,
  ElementWithAttachments,
  Renderable,
} from '..'
import type ColorMap from '../../../pathbuilder/annotations/colormap'
import type { NamespaceMap } from '../../../pathbuilder/namespace'
import type { Bundle, Field } from '../../../pathbuilder/pathtree'
import type ImmutableSet from '../../../utils/immutable-set'

/** a node in the model graph */
export type ModelNode = ConceptModelNode | LiteralModelNode

export type ModelAttachmentKey = 'fields' | 'bundles'

export class ConceptModelNode
  implements Renderable<ModelOptions, ModelAttachmentKey>
{
  constructor(
    /** class represented at this node */
    public readonly clz: string,

    /** bundles with a defining concept at this node */
    public readonly bundles: ImmutableSet<Bundle>,

    /** fields without a datatype property attached to this node */
    public readonly fields: ImmutableSet<Field>,
  ) {}

  public render(
    id: string,
    options: ModelOptions,
  ): ElementWithAttachments<ModelAttachmentKey> | null {
    const fields = options.display.Compounds.ConceptFields
      ? Array.from(this.fields)
      : []
    const bundles = options.display.Compounds.Bundles
      ? Array.from(this.bundles)
      : []

    if (!options.display.Concept.complex) {
      return this.#renderSimple(id, options, fields, bundles)
    }

    const complex = this.#renderComplex(id, options, fields, bundles)
    if (complex === null) {
      return null
    }

    const { element, bundles: bundleRenders, fields: fieldRenders } = complex
    if (bundleRenders.length === 0 && fieldRenders.length === 0) {
      return element
    }

    return {
      ...element,
      attached: {
        boxed: options.display.Concept.boxed,
        elements: {
          fields: fieldRenders,
          bundles: bundleRenders,
        },
      },
    }
  }

  #renderSimple(
    id: string,
    options: ModelOptions,
    fields: Field[],
    bundles: Bundle[],
  ): Element {
    const labelParts: string[] = []
    const tooltipParts: string[] = []

    if (options.display.Labels.Concept) {
      labelParts.push(options.ns.apply(this.clz))
      tooltipParts.push(this.clz)
    }

    if (options.display.Labels.Bundle) {
      bundles.forEach(bundle => {
        labelParts.push('Bundle ' + bundle.path.name)
        tooltipParts.push('Bundle ' + bundle.path.id)
      })
    }

    if (options.display.Labels.ConceptField) {
      fields.forEach(field => {
        labelParts.push('Field ' + field.path.name)
        tooltipParts.push('Field ' + field.path.id)
      })
    }

    return {
      id,
      label: labelParts.length > 0 ? labelParts.join('\n\n') : null,
      inverseLabel: null,
      tooltip: tooltipParts.length > 0 ? tooltipParts.join('\n\n') : null,
      color: options.cm.get(...fields, ...bundles),
      shape: 'ellipse',
    }
  }

  #renderComplex(
    id: string,
    options: ModelOptions,
    fields: Field[],
    bundles: Bundle[],
  ): {
    element: Element
    bundles: Attachment[]
    fields: Attachment[]
  } | null {
    const element: Element = {
      id,
      label: options.display.Labels.Concept ? options.ns.apply(this.clz) : null,
      inverseLabel: null,
      tooltip: options.display.Labels.Concept ? this.clz : null,
      color: null,
      shape: 'ellipse',
    }

    const {
      Bundle: BundleLabels,
      ConceptField: ConceptFieldLabels,
      ConceptFieldType: ConceptFieldTypes,
    } = options.display.Labels

    const bundleRenders = bundles.map((bundle, idx): Attachment => {
      const bundleID = `${id}-bundle-${idx}`
      const color = options.cm.get(bundle)
      return {
        node: {
          id: bundleID + '-node',
          label: BundleLabels ? bundle.path.name : null,
          inverseLabel: null,
          tooltip: BundleLabels ? bundle.path.id : null,
          color,
          shape: 'diamond',
        },
        edge: {
          id: bundleID + '-edge',
          inverseLabel: null,
          label: null,
          tooltip: null,
          color,
          shape: null,
        },
      }
    })

    const fieldRenders = fields.map((field, idx): Attachment => {
      const fieldID = `${id}-field-${idx}`
      const color = options.cm.get(field)

      return {
        node: {
          id: fieldID + '-node',
          label: ConceptFieldLabels ? field.path.name : null,
          inverseLabel: null,
          tooltip: ConceptFieldLabels ? field.path.id : null,
          color,
          shape: 'diamond',
        },
        edge: {
          id: fieldID + '-edge',
          label: ConceptFieldTypes ? field.path.informativeFieldType : null,
          inverseLabel: null,
          tooltip: ConceptFieldTypes ? field.path.fieldType : null,
          color,
          shape: null,
        },
      }
    })

    return { element, bundles: bundleRenders, fields: fieldRenders }
  }
}

export class LiteralModelNode {
  constructor(
    /** fields with a datatype property attached to this literal node */
    public readonly fields: ImmutableSet<Field>,
  ) {}

  public render(
    id: string,
    options: ModelOptions,
  ): ElementWithAttachments<ModelAttachmentKey> | null {
    const fields = options.display.Compounds.DataFields
      ? Array.from(this.fields)
      : []

    if (!options.display.Literal.complex) {
      return LiteralModelNode.#renderSimple(id, options, fields)
    }

    const complex = LiteralModelNode.#renderComplex(id, options, fields)
    if (complex === null) {
      return null
    }

    const { element, fields: fieldRenders } = complex
    if (fieldRenders.length === 0) {
      return element
    }
    return {
      ...element,
      attached: {
        boxed: options.display.Literal.boxed,
        elements: {
          fields: fieldRenders,
          bundles: [],
        },
      },
    }
  }

  static #renderSimple(
    id: string,
    options: ModelOptions,
    fields: Field[],
  ): Element {
    const label = options.display.Labels.DatatypeField
      ? fields.map(field => field.path.name).join('\n\n')
      : null

    return {
      id,
      label,
      inverseLabel: null,
      tooltip: null,
      color: options.cm.get(...fields),
      shape: 'box',
    }
  }

  static #renderComplex(
    id: string,
    options: ModelOptions,
    fields: Field[],
  ): {
    element: Element
    fields: Attachment[]
  } | null {
    const {
      Labels: {
        DatatypeField: DatatypeFieldLabels,
        DatatypeFieldType: DatatypeFieldTypes,
      },
    } = options.display
    if (!options.display.Compounds.Datatypes) {
      return null
    }
    return {
      element: {
        id,
        label: null,
        inverseLabel: null,
        tooltip: null,
        color: null,
        shape: 'box',
      },
      fields: Array.from(fields).map((field, idx): Attachment => {
        const fieldID = `${id}-field-${idx}`
        const color = options.cm.get(field)
        return {
          node: {
            id: fieldID + '-node',
            label: DatatypeFieldLabels ? field.path.name : null,
            inverseLabel: null,
            tooltip: DatatypeFieldLabels ? field.path.id : null,
            color,
            shape: 'diamond',
          },
          edge: {
            id: fieldID + '-edge',
            label: DatatypeFieldTypes ? field.path.informativeFieldType : null,
            inverseLabel: null,
            tooltip: DatatypeFieldTypes ? field.path.fieldType : null,
            color,
            shape: null,
          },
        }
      }),
    }
  }
}

export type ModelEdge = PropertyModelEdge | DataModelEdge

export class PropertyModelEdge {
  constructor(
    /** the actual property */
    public property: string,
    /** the inverse property (if any) */
    public inverse_property?: string,
  ) {}

  render(id: string, options: ModelOptions): Element {
    const label = options.display.Labels.Property
      ? options.ns.apply(this.property)
      : null
    const inverseLabel =
      options.display.Labels.Inverse &&
      options.display.Labels.Property &&
      typeof this.inverse_property === 'string'
        ? options.ns.apply(this.inverse_property)
        : null

    return {
      id,
      label,
      inverseLabel,
      tooltip: options.display.Labels.Property ? this.property : null,
      color: null,
      shape: null,
    }
  }
}

export class DataModelEdge {
  constructor(
    /** the actual property */
    public property: string,

    /** the inverted property */
    public inverse_property?: string,
  ) {}

  render(id: string, options: ModelOptions): Element | null {
    if (!options.display.Compounds.Datatypes) {
      return null
    }

    const inverseLabel =
      options.display.Labels.Inverse &&
      options.display.Labels.DatatypeProperty &&
      typeof this.inverse_property === 'string'
        ? options.ns.apply(this.inverse_property)
        : null
    return {
      id,
      label: options.display.Labels.DatatypeProperty
        ? options.ns.apply(this.property)
        : null,
      inverseLabel,
      tooltip: options.display.Labels.DatatypeProperty ? this.property : null,
      color: null,
      shape: null,
    }
  }
}

export interface ModelOptions {
  ns: NamespaceMap
  cm: ColorMap
  display: ModelDisplay
}

export interface ModelDisplay {
  Compounds: {
    Bundles: boolean
    Datatypes: boolean
    ConceptFields: boolean
    DataFields: boolean
  }
  Concept: ModelCompoundDisplay
  Literal: ModelCompoundDisplay
  Labels: {
    Concept: boolean
    Property: boolean
    Inverse: boolean

    Bundle: boolean
    ConceptField: boolean
    ConceptFieldType: boolean

    DatatypeFieldType: boolean
    DatatypeField: boolean
    DatatypeProperty: boolean
  }
}

interface ModelCompoundDisplay {
  complex: boolean
  boxed: boolean
}
