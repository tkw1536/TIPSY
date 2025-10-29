import { Fragment, type JSX } from 'preact'
import Spinner from '../../../components/spinner'
import { Panel } from '../../../components/layout/panel'
import { useState } from 'preact/hooks'
import { Numeric } from '../../../components/form/value'
import { Label } from '../../../components/form/generic'
import Button, {
  ButtonGroup,
  ButtonGroupText,
} from '../../../components/form/button'
import Checkbox, { Switch } from '../../../components/form/checkbox'
import Dropdown, { Radio } from '../../../components/form/dropdown'

export default function DebugTab(): JSX.Element {
  const panel = []
  for (let i = 0; i < 100; i += 1) {
    panel.push(
      <Fragment key={i}>
        Line {i} in panel
        <br />
      </Fragment>,
    )
  }

  const main = []
  for (let i = 0; i < 1000; i += 1) {
    main.push(
      <Fragment key={i}>
        Line {i} in main
        <br />
      </Fragment>,
    )
  }

  const [open, setOpen] = useState(true)

  return (
    <Panel
      panel={<>{panel}</>}
      open={open}
      setOpen={setOpen}
      margin='10px'
      width='10vw'
    >
      <h2>Debug Page</h2>

      <table>
        <tbody>
          <tr>
            <td>
              <Label id={'numeric-normal'}>Numeric Normal</Label>
            </td>
            <td>
              <Numeric id='numeric-normal' value={42} />
            </td>
          </tr>
          <tr>
            <td>
              <Label id={'numeric-valid'}>Numeric Valid</Label>
            </td>
            <td>
              <Numeric id='numeric-valid' value={42} customValidity='' />
            </td>
          </tr>
          <tr>
            <td>
              <Label id={'numeric-invalid'}>Numeric Invalid</Label>
            </td>
            <td>
              <Numeric
                id='numeric-invalid'
                value={69}
                customValidity={'not permitted'}
                reportValidity
              />
            </td>
          </tr>
          <tr>
            <td>
              <Label id={'numeric-disabled'}>Numeric Disabled</Label>
            </td>
            <td>
              <Numeric id='numeric-disabled' value={112} disabled />
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td>Checked</td>
            <td>
              <Switch value={true} />
            </td>
            <td>
              <Switch value={true} disabled />
            </td>
            <td>
              <Checkbox value={true} />
            </td>
            <td>
              <Checkbox value={true} disabled />
            </td>
          </tr>
          <tr>
            <td>Unchecked</td>
            <td>
              <Switch value={false} />
            </td>
            <td>
              <Switch value={false} disabled />
            </td>
            <td>
              <Checkbox value={false} />
            </td>
            <td>
              <Checkbox value={false} disabled />
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td>Enabled</td>
            <td>
              <Dropdown
                value='a'
                values={['a', 'b', 'c']}
                titles={{ a: 'Alpha', b: 'Beta', c: 'Gamma' }}
              />
            </td>
            <td>
              <Radio
                value='a'
                values={['a', 'b', 'c']}
                titles={{ a: 'Alpha', b: 'Beta', c: 'Gamma' }}
                descriptions={{
                  a: 'The first letter',
                  b: 'The second letter',
                  c: 'The third letter',
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Disabled</td>
            <td>
              <Dropdown
                disabled
                value='a'
                values={['a', 'b', 'c']}
                titles={{ a: 'Alpha', b: 'Beta', c: 'Gamma' }}
              />
            </td>
            <td>
              <Radio
                disabled
                value='a'
                values={['a', 'b', 'c']}
                titles={{ a: 'Alpha', b: 'Beta', c: 'Gamma' }}
                descriptions={{
                  a: 'The first letter',
                  b: 'The second letter',
                  c: 'The third letter',
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        <Button>Not in a group</Button>
      </p>

      <p>
        <Button disabled>Disabled</Button>
      </p>

      <p>
        <ButtonGroup>
          <Button>Active</Button>
          <Button disabled>Disabled</Button>
          <ButtonGroupText>Some Text Here</ButtonGroupText>
        </ButtonGroup>
      </p>

      <p>
        <ButtonGroup inline>
          <Button>Active</Button>
          <Button disabled>Disabled</Button>
          <ButtonGroupText>Inline Button Group</ButtonGroupText>
        </ButtonGroup>
      </p>

      <p>
        <ButtonGroup inline>
          <Button>One-Button-Box</Button>
        </ButtonGroup>
      </p>

      <Spinner message='Your message here' />

      {main}
    </Panel>
  )
}

// spellchecker:words bluenote
