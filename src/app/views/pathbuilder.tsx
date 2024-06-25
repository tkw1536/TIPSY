import { Component, ComponentChild, ComponentChildren } from 'preact'
import DropArea from '../../lib/components/drop-area'
import * as styles from './pathbuilder.module.css'
import { ReducerProps } from '../state'
import { loaderPathbuilder, resetInterface } from '../state/reducers/init'
import ErrorDisplay from '../../lib/components/error'
import { formatXML } from '../../lib/drivers/impl'
import download from '../../lib/utils/download'

export default class PathbuilderView extends Component<ReducerProps> {
  render (): ComponentChildren {
    return this.props.state.loaded === true ? <Info {...this.props} /> : <Loader {...this.props} />
  }
}

class Loader extends Component<ReducerProps> {
  private readonly dragContent = (active: boolean, valid: boolean): ComponentChild => {
    switch (true) {
      case active && valid:
        return <><b>Release</b> to load <em>Pathbuilder</em></>
      case active && !valid:
        return <>Invalid <em>Pathbuilder</em>: Must be a <b>xml</b> file</>
      default:
        return <><b>Select</b> or <b>Drop</b> a <em>Pathbuilder</em> here</>
    }
  }

  private readonly handleLoadPathbuilder = (file: File): void => {
    this.props.apply(loaderPathbuilder(file))
  }

  render (): ComponentChild {
    const { loaded: error } = this.props.state

    return (
      <>
        <p>
          This tool provides an interface for inspecting <code>Pathbuilders</code> created by the <a href='https://wiss-ki.eu' target='_blank' rel='noopener noreferrer'>WissKI</a> software.
          Click below to load a pathbuilder.
        </p>
        <p>
          All processing happens on-device, meaning the server host can not access any data contained within your pathbuilder.
        </p>
        <DropArea class={styles.dropZone} activeValidClass={styles.valid} activeInvalidClass={styles.invalid} onDropFile={this.handleLoadPathbuilder} types={[formatXML]}>{this.dragContent}</DropArea>
        {typeof error !== 'boolean' && error.error instanceof Error && (
          <>
            <p><b>Unable to load pathbuilder: </b></p>
            <ErrorDisplay error={error.error} />
          </>
        )}
      </>
    )
  }
}

class Info extends Component<ReducerProps> {
  private readonly handleClosePathbuilder = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(resetInterface)
  }

  private readonly handleExport = (evt: MouseEvent): void => {
    evt.preventDefault()

    const { pathbuilder } = this.props.state
    const file = new Blob([pathbuilder.toXML()], { type: 'application/xml' })
    download(file, this.filename)
      .catch(() => console.error('never reached'))
  }

  get filename (): string {
    const { filename } = this.props.state
    return filename !== '' ? filename : 'pathbuilder.xml'
  }

  render (): ComponentChildren {
    return (
      <>
        <p>
          Pathbuilder <button onClick={this.handleExport}>{this.filename}</button> successfully loaded.
          You can use the other tabs to inspect the pathbuilder.
        </p>
        <p>
          You can also close <button onClick={this.handleClosePathbuilder}>Close</button> this pathbuilder.
        </p>
      </>
    )
  }
}
