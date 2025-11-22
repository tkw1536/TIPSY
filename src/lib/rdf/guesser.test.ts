import { describe, expect, test } from 'vitest'
import { guessContentType, contentTypeToExtension } from './guesser'

describe('guessContentType', () => {
  describe('with valid MIME types', () => {
    test.each([
      ['text/html', 'test.unknown', 'text/html'],
      ['application/ld+json', 'test.unknown', 'application/ld+json'],
      ['text/n3', 'test.unknown', 'text/n3'],
      ['application/n-quads', 'test.unknown', 'application/n-quads'],
      ['application/n-triples', 'test.unknown', 'application/n-triples'],
      ['application/rdf+xml', 'test.unknown', 'application/rdf+xml'],
      ['text/turtle', 'test.unknown', 'text/turtle'],
      ['application/xhtml+xml', 'test.unknown', 'application/xhtml+xml'],
    ])(
      'returns %s when file has MIME type %s',
      (mimeType, filename, expected) => {
        const file = new File(['content'], filename, { type: mimeType })
        expect(guessContentType(file)).toBe(expected)
      },
    )
  })

  describe('with invalid MIME types and file extensions', () => {
    test.each([
      ['test.ttl', 'text/turtle'],
      ['test.turtle', 'text/turtle'],
      ['test.rdf', 'application/rdf+xml'],
      ['test.owl', 'application/rdf+xml'],
      ['test.xml', 'application/rdf+xml'],
      ['test.json', 'application/ld+json'],
      ['test.jsonld', 'application/ld+json'],
      ['test.n3', 'text/n3'],
      ['test.nq', 'application/n-quads'],
      ['test.nquads', 'application/n-quads'],
      ['test.nt', 'application/n-triples'],
      ['test.ntriples', 'application/n-triples'],
      ['test.html', 'text/html'],
      ['test.htm', 'text/html'],
      ['test.xhtml', 'application/xhtml+xml'],
    ])('guesses %s as %s', (filename, expected) => {
      const file = new File(['content'], filename, { type: '' })
      expect(guessContentType(file)).toBe(expected)
    })
  })

  describe('with uppercase extensions', () => {
    test.each([
      ['test.TTL', 'text/turtle'],
      ['test.TURTLE', 'text/turtle'],
      ['test.RDF', 'application/rdf+xml'],
      ['test.OWL', 'application/rdf+xml'],
      ['test.XML', 'application/rdf+xml'],
      ['test.JSON', 'application/ld+json'],
      ['test.JSONLD', 'application/ld+json'],
      ['test.N3', 'text/n3'],
      ['test.NQ', 'application/n-quads'],
      ['test.NQUADS', 'application/n-quads'],
      ['test.NT', 'application/n-triples'],
      ['test.NTRIPLES', 'application/n-triples'],
      ['test.HTML', 'text/html'],
      ['test.HTM', 'text/html'],
      ['test.XHTML', 'application/xhtml+xml'],
    ])('guesses %s as %s (case insensitive)', (filename, expected) => {
      const file = new File(['content'], filename, { type: '' })
      expect(guessContentType(file)).toBe(expected)
    })
  })

  describe('with mixed case extensions', () => {
    test.each([
      ['test.TtL', 'text/turtle'],
      ['test.Rdf', 'application/rdf+xml'],
      ['test.JsonLd', 'application/ld+json'],
    ])('guesses %s as %s (case insensitive)', (filename, expected) => {
      const file = new File(['content'], filename, { type: '' })
      expect(guessContentType(file)).toBe(expected)
    })
  })

  describe('with unknown extensions', () => {
    test.each([
      ['test.txt', 'application/rdf+xml'],
      ['test.pdf', 'application/rdf+xml'],
      ['test.unknown', 'application/rdf+xml'],
      ['test', 'application/rdf+xml'],
    ])('returns default format for %s', filename => {
      const file = new File(['content'], filename, { type: '' })
      expect(guessContentType(file)).toBe('application/rdf+xml')
    })
  })

  describe('with custom default format', () => {
    test.each([
      ['test.txt', 'text/turtle', 'text/turtle'],
      ['test.pdf', 'text/n3', 'text/n3'],
      ['test.unknown', 'application/ld+json', 'application/ld+json'],
    ])(
      'returns %s for %s when default is %s',
      (filename, defaultFormat, expected) => {
        const file = new File(['content'], filename, { type: '' })
        expect(guessContentType(file, defaultFormat)).toBe(expected)
      },
    )
  })

  describe('with multiple extensions', () => {
    test.each([
      ['archive.tar.ttl', 'text/turtle'],
      ['data.backup.rdf', 'application/rdf+xml'],
      ['file.old.jsonld', 'application/ld+json'],
    ])('uses last extension for %s', (filename, expected) => {
      const file = new File(['content'], filename, { type: '' })
      expect(guessContentType(file)).toBe(expected)
    })
  })

  describe('with no extension', () => {
    test('returns default format for file without extension', () => {
      const file = new File(['content'], 'noextension', { type: '' })
      expect(guessContentType(file)).toBe('application/rdf+xml')
    })

    test('returns custom default format for file without extension', () => {
      const file = new File(['content'], 'noextension', { type: '' })
      expect(guessContentType(file, 'text/turtle')).toBe('text/turtle')
    })
  })

  describe('MIME type takes precedence over extension', () => {
    test.each([
      ['test.ttl', 'application/rdf+xml', 'application/rdf+xml'],
      ['test.rdf', 'text/turtle', 'text/turtle'],
      ['test.json', 'text/n3', 'text/n3'],
    ])(
      'returns MIME type %s for %s even though extension suggests different format',
      (filename, mimeType, expected) => {
        const file = new File(['content'], filename, { type: mimeType })
        expect(guessContentType(file)).toBe(expected)
      },
    )
  })

  describe('with invalid MIME types', () => {
    test.each([
      ['test.ttl', 'application/octet-stream', 'text/turtle'],
      ['test.rdf', 'text/plain', 'application/rdf+xml'],
      ['test.json', 'application/json', 'application/ld+json'],
    ])(
      'falls back to extension for %s with invalid MIME type %s',
      (filename, mimeType, expected) => {
        const file = new File(['content'], filename, { type: mimeType })
        expect(guessContentType(file)).toBe(expected)
      },
    )
  })
})

describe('contentTypeToExtension', () => {
  describe('with valid content types', () => {
    test.each([
      ['text/turtle', 'ttl'],
      ['application/rdf+xml', 'rdf'],
      ['application/ld+json', 'jsonld'],
      ['text/n3', 'n3'],
      ['application/n-quads', 'nq'],
      ['application/n-triples', 'nt'],
      ['text/html', 'html'],
      ['application/xhtml+xml', 'xhtml'],
    ])('converts %s to %s', (contentType, expected) => {
      expect(contentTypeToExtension(contentType)).toBe(expected)
    })
  })

  describe('with unknown content types', () => {
    test.each([
      ['text/plain', 'xml'],
      ['application/octet-stream', 'xml'],
      ['application/json', 'xml'],
      ['unknown/type', 'xml'],
    ])('returns default extension for %s', contentType => {
      expect(contentTypeToExtension(contentType)).toBe('xml')
    })
  })

  describe('with custom default extension', () => {
    test.each([
      ['text/plain', 'txt', 'txt'],
      ['application/octet-stream', 'bin', 'bin'],
      ['unknown/type', 'dat', 'dat'],
    ])(
      'returns %s for %s when default is %s',
      (contentType, defaultExt, expected) => {
        expect(contentTypeToExtension(contentType, defaultExt)).toBe(expected)
      },
    )
  })

  describe('round-trip consistency', () => {
    test.each([
      ['text/turtle', 'ttl'],
      ['application/rdf+xml', 'rdf'],
      ['application/ld+json', 'jsonld'],
      ['text/n3', 'n3'],
      ['application/n-quads', 'nq'],
      ['application/n-triples', 'nt'],
      ['text/html', 'html'],
      ['application/xhtml+xml', 'xhtml'],
    ])(
      'contentTypeToExtension(%s) produces extension that guessContentType recognizes',
      (contentType, extension) => {
        const ext = contentTypeToExtension(contentType)
        expect(ext).toBe(extension)

        const file = new File(['content'], `test.${ext}`, { type: '' })
        expect(guessContentType(file)).toBe(contentType)
      },
    )
  })
})
