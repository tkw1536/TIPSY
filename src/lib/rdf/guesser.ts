const HTMLContentType = 'text/html' as const
const JSONLDContentType = 'application/ld+json' as const
const N3ContentType = 'text/n3' as const
const NQuadsContentType = 'application/n-quads' as const
const NTriplesContentType = 'application/n-triples' as const
const RDFXMLContentType = 'application/rdf+xml' as const
const TurtleContentType = 'text/turtle' as const
const XHTMLContentType = 'application/xhtml+xml' as const

// spellchecker:words RDFXML nquads ntriples jsonld

const validContentTypes = new Set<string>([
  HTMLContentType,
  JSONLDContentType,
  N3ContentType,
  NQuadsContentType,
  NTriplesContentType,
  RDFXMLContentType,
  TurtleContentType,
  XHTMLContentType,
])

/**
 * Guesses the content type of an RDF file.
 * This first reads the actual file type (as returned by the browser) and then attempts to guess based on file extension.
 */
export function guessContentType(
  file: File,
  defaultFormat: string = RDFXMLContentType,
): string {
  if (validContentTypes.has(file.type)) {
    return file.type
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ttl':
    case 'turtle':
      return TurtleContentType
    case 'rdf':
    case 'owl':
    case 'xml':
      return RDFXMLContentType
    case 'json':
    case 'jsonld':
      return JSONLDContentType
    case 'n3':
      return N3ContentType
    case 'nq':
    case 'nquads':
      return NQuadsContentType
    case 'nt':
    case 'ntriples':
      return NTriplesContentType
    case 'html':
    case 'htm':
      return HTMLContentType
    case 'xhtml':
      return XHTMLContentType
    default:
      return defaultFormat
  }
}

/**
 * Based on a content type, returns a filename extension.
 */
export function contentTypeToExtension(
  contentType: string,
  defaultExtension = 'xml',
): string {
  switch (contentType) {
    case TurtleContentType:
      return 'ttl'
    case RDFXMLContentType:
      return 'rdf'
    case JSONLDContentType:
      return 'jsonld'
    case N3ContentType:
      return 'n3'
    case NQuadsContentType:
      return 'nq'
    case NTriplesContentType:
      return 'nt'
    case HTMLContentType:
      return 'html'
    case XHTMLContentType:
      return 'xhtml'
    default:
      return defaultExtension
  }
}
