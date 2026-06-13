/** RGBA pixel grid from the frame sampler */
export interface PixelGrid {
  data: Uint8ClampedArray
  cols: number
  rows: number
  cellW: number
  cellH: number
}

/** A control the filter exposes to the UI */
export type ControlDef =
  | { type: 'range'; id: string; label: string; min: number; max: number; step: number; default: number }
  | { type: 'color'; id: string; label: string; default: string }
  | { type: 'select'; id: string; label: string; options: string[]; default: string }
  | { type: 'toggle'; id: string; label: string; default: boolean }

export type ControlValues = Record<string, number | string | boolean>

/** Every filter implements this interface */
export interface Filter {
  id: string
  label: string
  controls: ControlDef[]
  /** Called each frame. Must be synchronous. */
  render(ctx: CanvasRenderingContext2D, grid: PixelGrid, params: ControlValues): void
}

/** Source that feeds the pipeline */
export type SourceKind = 'image' | 'video'

export interface PipelineSource {
  kind: SourceKind
  element: HTMLImageElement | HTMLVideoElement
}
