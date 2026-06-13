import type { PixelGrid } from '../types'

export interface SampleOptions {
  cols: number
  rows: number
}

/**
 * Draws `source` onto `ctx` at the canvas's native size, then reads back
 * one averaged pixel per grid cell. Returns a PixelGrid with RGBA data.
 *
 * `ctx` must be backed by an offscreen canvas sized to match the desired
 * sampling resolution. The caller controls canvas size so the sampler stays
 * pure and testable.
 */
export function sampleFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  options: SampleOptions,
): PixelGrid {
  const { cols, rows } = options
  const { width, height } = ctx.canvas

  ctx.drawImage(source, 0, 0, width, height)

  // One GPU→CPU transfer for the whole frame, then sample in JS.
  // Per-cell getImageData calls (3600+ at 80×45) kill frame rate.
  const full = ctx.getImageData(0, 0, width, height)

  const cellW = width / cols
  const cellH = height / rows
  const data = new Uint8ClampedArray(cols * rows * 4)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = Math.floor(col * cellW + cellW / 2)
      const y = Math.floor(row * cellH + cellH / 2)
      const srcIdx = (y * width + x) * 4
      const dstIdx = (row * cols + col) * 4
      data[dstIdx]     = full.data[srcIdx]
      data[dstIdx + 1] = full.data[srcIdx + 1]
      data[dstIdx + 2] = full.data[srcIdx + 2]
      data[dstIdx + 3] = full.data[srcIdx + 3]
    }
  }

  return { data, cols, rows, cellW, cellH }
}
