import { sampleFrame } from './frameSampler'
import type { Filter, ControlValues, PipelineSource } from '../types'

export interface PipelineConfig {
  outputCanvas: HTMLCanvasElement
  source: PipelineSource
  filter: Filter
  params: ControlValues
  cols: number
  rows: number
}

export class RenderPipeline {
  private offscreen: HTMLCanvasElement
  private offCtx: CanvasRenderingContext2D
  private outputCtx: CanvasRenderingContext2D
  private rafId: number | null = null
  private config: PipelineConfig | null = null

  // For MediaRecorder export
  readonly stream: MediaStream

  constructor(outputCanvas: HTMLCanvasElement) {
    this.offscreen = document.createElement('canvas')
    // willReadFrequently tells Chrome to keep this canvas CPU-readable
    // instead of promoting it to a GPU texture that blocks on getImageData
    this.offCtx = this.offscreen.getContext('2d', { willReadFrequently: true })!
    this.outputCtx = outputCanvas.getContext('2d')!
    this.stream = outputCanvas.captureStream(30)
  }

  configure(config: PipelineConfig) {
    this.config = config
  }

  start() {
    if (this.rafId !== null) return
    this.tick()
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /** Grab the current frame as a PNG data URL */
  grabFrame(): string {
    return this.config?.outputCanvas.toDataURL('image/png') ?? ''
  }

  private tick = () => {
    this.rafId = requestAnimationFrame(this.tick)
    if (!this.config) return

    const { source, filter, params, cols, rows, outputCanvas } = this.config

    // Skip if video not ready
    if (
      source.kind === 'video' &&
      (source.element as HTMLVideoElement).readyState < 2
    ) return

    const cellW = outputCanvas.width / cols
    const cellH = outputCanvas.height / rows
    const offW = Math.ceil(cellW) * cols
    const offH = Math.ceil(cellH) * rows
    // Only resize when dimensions actually change — resizing resets the canvas every frame otherwise
    if (this.offscreen.width !== offW || this.offscreen.height !== offH) {
      this.offscreen.width = offW
      this.offscreen.height = offH
    }

    const grid = sampleFrame(this.offCtx, source.element, { cols, rows })
    filter.render(this.outputCtx, grid, params)
  }
}
