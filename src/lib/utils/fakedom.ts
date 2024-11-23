import type {
  CDATASection,
  Comment,
  Document,
  Element,
  Node,
  ProcessingInstruction,
  Text,
} from '@xmldom/xmldom'

/** checks if the given node is an element */
export function isElement(n: Node): n is Element {
  return n.nodeType === n.ELEMENT_NODE
}

/** isTag checks if the given element is an element with the given TagName  */
export function isTag<E extends Element>(
  node: Node,
  tagName: E['tagName'],
): node is E {
  return isElement(node) && node.tagName.toUpperCase() === tagName.toUpperCase()
}

export function cloneNodeInDocument(document: Document, node: Node): Node {
  // if we already own the node, we can just do a plain clone!
  if (document === node.ownerDocument) {
    return node.cloneNode(true)
  }

  switch (node.nodeType) {
    case document.ELEMENT_NODE: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- did the typecheck
      const origElement = node as Element

      const element = document.createElement(origElement.nodeName)
      for (const attribute of origElement.attributes) {
        element.setAttribute(attribute.name, attribute.value)
      }
      for (const child of origElement.childNodes) {
        element.appendChild(cloneNodeInDocument(document, child))
      }
      return element
    }
    case document.TEXT_NODE:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- did the typecheck
      return document.createTextNode((node as Text).data)
    case document.CDATA_SECTION_NODE:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- did the typecheck
      return document.createCDATASection((node as CDATASection).data)
    case document.PROCESSING_INSTRUCTION_NODE: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- did the typecheck
      const pi = node as ProcessingInstruction
      return document.createProcessingInstruction(pi.target, pi.data)
    }
    case document.COMMENT_NODE:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- did the typecheck
      return document.createComment((node as Comment).data)
  }

  console.warn('cloneNodeInDocument: falling back to native implementation')
  return node.cloneNode(true)
}
