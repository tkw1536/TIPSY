# TIPSY - Tom's Inspector for Pathbuilders <sub>Yaaaaaahs!</sub>

This repository contains TIPSY, an advanced inspector for Pathbuilders produced by the [WissKI](https://wiss-ki.eu) software.
For more information about the motivation behind TIPSY, you can read:

- Chapter VI.3.4 of my PhD dissertation "Towards A Commons Of Object-Centered Research Data" with doi [10.25593/open-fau-1825](https://doi.org/10.25593/open-fau-1825) or
- the Extended Abstract about TIPSY with doi [10.5281/zenodo.16735970](https://doi.org/10.5281/zenodo.16735970).

This source code is made available for evaluation purposes only.

It is tested on [Firefox](https://www.mozilla.org/en-US/firefox/new/) and [Safari](https://www.apple.com/safari/) only.
It is explicitly <b>not</b> tested on Chrome and Chromium-based browsers, and some functionality may not be available.

See [banner.md](docs/banner.md) for more information about licensing terms.

## User-facing Documentation

User-facing Documentation can be found in-app under the document tab.
Alternatively, see [inspector.md](macros/docs/inspector.md) and [rdf.md](macros/docs/rdf.md).

## Development

The application is written in Typescript and uses [yarn](https://yarnpkg.com) for dependency management.
To install all dependencies (including development tools) use:

```bash
yarn install
```

It uses [Vite](https://vitejs.dev) for bundling, [Vitest](https://vitest.dev) for testing, [Eslint](https://eslint.org) for linting (including a [Prettier](https://prettier.io) plugin for formatting).
See the scripts part in [package.json](package.json) on how each command runs:

```bash
# start a development server
yarn start

# bundle a distribution into the dist/ directory
yarn build

# run typechecking, linting, testing + spellchecking
yarn ci
```

After starting a development server, access the app at `http://localhost:1234/`.

## Embedding

To embed and directly load a file in TIPSY, it is possible to embed tipsy via an iframe and [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) to it.
TIPSY will inform the parent window when it is ready to receive such a message by sending a message with the contents of 'tipsy:ready'.

You can use something like the following to create such an iframe.

```javascript
/**
 * Creates an Iframe with a TIPSY instance at the given url, waits for it to be ready, and then loads the given xml data.
 * The caller should ensure that the iframe is added to the page and actually contains tipsy.
 * @param {string} tipsy the url of the TIPSY instance
 * @param {string} filename the filename of the xml to load
 * @param {string} type the media type of the file
 * @param {string} data XML content of pathbuilder to load
 * @returns {HTMLIFrameElement}
 */
function createTipsyFrame(tipsy, filename, type, data) {
  // create an iframe with the source pointing to tipsy
  const iframe = document.createElement('iframe')
  iframe.setAttribute('src', tipsy)

  // wait for a message from tipsy to tell us that tipsy is ready
  const handleTipsyReady = (/** @type {MessageEvent} */ message) => {
    if (
      message.source !== iframe.contentWindow ||
      message.data !== 'tipsy:ready'
    ) {
      return
    }
    message.preventDefault()

    window.removeEventListener('message', handleTipsyReady)
    message.source.postMessage(
      { filename: filename, type: type, data: data },
      '*',
    )
  }
  window.addEventListener('message', handleTipsyReady)

  // and return the iframe
  return iframe
}

// somehow get the filename and xml
const pbName = 'filename.xml'
const pbXML = '<pathbuilderinterface />' /* full contents omitted */

// create the frame and add it to the body
const frame = createTipsyFrame(
  'http://localhost:1234',
  pbName,
  'application/xml',
  pbXML,
)
document.body.append(frame)
```

## Scripts

In addition to the web-interface there are a couple of scripts in the `scripts` folder.
These can be executed with `vite-node`, for example:

```bash
node node_modules/vite-node/vite-node.mjs ./scripts/render-model-graphviz.ts -p pathbuilder.xml
```

The individual scripts each come with an appropriate `--help` argument for detailed usage.

## LICENSE

None, see warning above.

<!-- spellchecker:words HTMLIFrameElement pathbuilderinterface -->
