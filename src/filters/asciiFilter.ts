import type { Filter, PixelGrid, ControlValues, ControlDef } from '../types'

// ── Pure helpers (exported for testing) ─────────────────────────────────────

export function pixelBrightness(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function buildRamp(rampStr: string): string[] {
  const seen = new Set<string>()
  const chars: string[] = []
  for (const ch of rampStr) {
    if (!seen.has(ch)) {
      seen.add(ch)
      chars.push(ch)
    }
  }
  return chars
}

export function brightnessToGlyph(
  brightness: number,
  ramp: string[],
  invert = false,
): string {
  const b = Math.max(0, Math.min(1, invert ? 1 - brightness : brightness))
  const idx = Math.round(b * (ramp.length - 1))
  return ramp[idx]
}

// ── Filter definition ────────────────────────────────────────────────────────

const DEFAULT_RAMP = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'

export const controls: ControlDef[] = [
  {
    type: 'select',
    id: 'colourSource',
    label: 'Glyph colour',
    options: ['source-pixel', 'fixed-ink'],
    default: 'source-pixel',
  },
  {
    type: 'color',
    id: 'inkColour',
    label: 'Ink colour',
    default: '#ffffff',
  },
  {
    type: 'color',
    id: 'bgColour',
    label: 'Background colour',
    default: '#000000',
  },
  {
    type: 'range',
    id: 'cellSize',
    label: 'Cell size',
    min: 4,
    max: 40,
    step: 1,
    default: 10,
  },
  {
    type: 'range',
    id: 'cellAspect',
    label: 'Cell height',
    min: 0.5,
    max: 4.0,
    step: 0.1,
    default: 2.0,
  },
  {
    type: 'range',
    id: 'fontScale',
    label: 'Font scale',
    min: 0.4,
    max: 2.0,
    step: 0.05,
    default: 1.0,
  },
  {
    type: 'range',
    id: 'contrast',
    label: 'Contrast',
    min: 0.5,
    max: 3,
    step: 0.05,
    default: 1,
  },
  {
    type: 'toggle',
    id: 'invert',
    label: 'Invert',
    default: false,
  },
  {
    type: 'select',
    id: 'ramp',
    label: 'Glyph ramp',
    options: ['standard', 'blocks', 'dots', 'custom'],
    default: 'standard',
  },
  {
    type: 'select',
    id: 'bgMode',
    label: 'Background',
    options: ['flat', 'cell-glow'],
    default: 'flat',
  },
  {
    type: 'range',
    id: 'glowOpacity',
    label: 'Glow intensity',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.35,
  },
]

const RAMPS: Record<string, string> = {
  standard: DEFAULT_RAMP,
  blocks: ' ░▒▓█',
  dots: ' ·•●',
  custom: DEFAULT_RAMP,
}

export const asciiFilter: Filter = {
  id: 'ascii',
  label: 'ASCII',
  controls,

  render(ctx: CanvasRenderingContext2D, grid: PixelGrid, params: ControlValues) {
    const colourSource = params['colourSource'] as string
    const inkColour = params['inkColour'] as string
    const bgColour = params['bgColour'] as string
    const contrast = params['contrast'] as number
    const invert = params['invert'] as boolean
    const rampKey = params['ramp'] as string
    const bgMode = params['bgMode'] as string
    const glowOpacity = params['glowOpacity'] as number
    const fontScale = params['fontScale'] as number

    const ramp = buildRamp(RAMPS[rampKey] ?? DEFAULT_RAMP)
    const { cols, rows, cellW, cellH, data } = grid

    // Base font size on cell width (not min) so tall cells still use full width
    const fontSize = Math.floor(cellW * fontScale)
    ctx.font = `${fontSize}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Flat background always goes down first
    ctx.fillStyle = bgColour
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = (row * cols + col) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        const cx = col * cellW
        const cy = row * cellH

        // Cell-glow: flood each cell with its source colour before the glyph
        if (bgMode === 'cell-glow') {
          ctx.fillStyle = `rgba(${r},${g},${b},${glowOpacity})`
          ctx.fillRect(cx, cy, cellW, cellH)
        }

        // Apply contrast around mid-point
        const raw = pixelBrightness(r, g, b)
        const contrasted = Math.max(0, Math.min(1, (raw - 0.5) * contrast + 0.5))
        const glyph = brightnessToGlyph(contrasted, ramp, invert)

        ctx.fillStyle =
          colourSource === 'source-pixel'
            ? `rgb(${r},${g},${b})`
            : inkColour

        ctx.fillText(glyph, cx + cellW / 2, cy + cellH / 2)
      }
    }
  },
}
