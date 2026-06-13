import type { ControlDef, ControlValues } from '../types'

export function buildControlPanel(
  container: HTMLElement,
  controls: ControlDef[],
  initial: ControlValues,
  onChange: (values: ControlValues) => void,
): () => ControlValues {
  const values: ControlValues = { ...initial }
  container.innerHTML = ''

  for (const def of controls) {
    const row = document.createElement('div')
    row.className = 'control-row'

    const label = document.createElement('label')
    label.textContent = def.label
    label.htmlFor = `ctrl-${def.id}`
    row.appendChild(label)

    if (def.type === 'range') {
      const input = document.createElement('input')
      input.type = 'range'
      input.id = `ctrl-${def.id}`
      input.min = String(def.min)
      input.max = String(def.max)
      input.step = String(def.step)
      input.value = String(values[def.id] ?? def.default)

      const valueDisplay = document.createElement('span')
      valueDisplay.className = 'control-value'
      valueDisplay.textContent = input.value

      input.addEventListener('input', () => {
        const v = parseFloat(input.value)
        values[def.id] = v
        valueDisplay.textContent = input.value
        onChange({ ...values })
      })

      row.appendChild(input)
      row.appendChild(valueDisplay)
    } else if (def.type === 'color') {
      const input = document.createElement('input')
      input.type = 'color'
      input.id = `ctrl-${def.id}`
      input.value = String(values[def.id] ?? def.default)

      input.addEventListener('input', () => {
        values[def.id] = input.value
        onChange({ ...values })
      })

      row.appendChild(input)
    } else if (def.type === 'select') {
      const select = document.createElement('select')
      select.id = `ctrl-${def.id}`

      for (const opt of def.options) {
        const option = document.createElement('option')
        option.value = opt
        option.textContent = opt
        if (opt === (values[def.id] ?? def.default)) option.selected = true
        select.appendChild(option)
      }

      select.addEventListener('change', () => {
        values[def.id] = select.value
        onChange({ ...values })
      })

      row.appendChild(select)
    } else if (def.type === 'toggle') {
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.id = `ctrl-${def.id}`
      input.checked = Boolean(values[def.id] ?? def.default)

      input.addEventListener('change', () => {
        values[def.id] = input.checked
        onChange({ ...values })
      })

      row.appendChild(input)
    }

    container.appendChild(row)
  }

  return () => ({ ...values })
}

/** Collect default values from a controls definition array */
export function defaultValues(controls: ControlDef[]): ControlValues {
  const v: ControlValues = {}
  for (const c of controls) v[c.id] = c.default
  return v
}
