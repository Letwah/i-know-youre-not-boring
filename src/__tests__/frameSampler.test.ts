import { describe, it, expect } from 'vitest'
import { sampleFrame } from '../pipeline/frameSampler'

// Minimal CanvasRenderingContext2D stub for tests
function makeCtx(width: number, height: number, fillRgba?: [number, number, number, number]) {
  const [r, g, b, a] = fillRgba ?? [128, 64, 32, 255]
  return {
    canvas: { width, height },
    drawImage: vi.fn(),
    getImageData(_x: number, _y: number, w: number, h: number) {
      const data = new Uint8ClampedArray(w * h * 4)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a
      }
      return { data, width: w, height: h } as ImageData
    },
  } as unknown as CanvasRenderingContext2D
}

describe('sampleFrame', () => {
  it('returns a grid with the requested number of cols and rows', () => {
    const ctx = makeCtx(320, 240)
    const source = document.createElement('canvas') as unknown as HTMLVideoElement

    const grid = sampleFrame(ctx, source, { cols: 40, rows: 30 })

    expect(grid.cols).toBe(40)
    expect(grid.rows).toBe(30)
  })

  it('data array length equals cols * rows * 4 (RGBA)', () => {
    const ctx = makeCtx(320, 240)
    const source = document.createElement('canvas') as unknown as HTMLVideoElement

    const grid = sampleFrame(ctx, source, { cols: 10, rows: 8 })

    expect(grid.data.length).toBe(10 * 8 * 4)
  })

  it('captures pixel colour from the source into the grid', () => {
    const ctx = makeCtx(320, 240, [200, 100, 50, 255])
    const source = document.createElement('canvas') as unknown as HTMLVideoElement

    const grid = sampleFrame(ctx, source, { cols: 4, rows: 4 })

    // First cell RGBA
    expect(grid.data[0]).toBe(200)
    expect(grid.data[1]).toBe(100)
    expect(grid.data[2]).toBe(50)
    expect(grid.data[3]).toBe(255)
  })

  it('computes cellW and cellH from canvas dimensions and grid size', () => {
    const ctx = makeCtx(400, 300)
    const source = document.createElement('canvas') as unknown as HTMLVideoElement

    const grid = sampleFrame(ctx, source, { cols: 20, rows: 15 })

    expect(grid.cellW).toBeCloseTo(400 / 20)
    expect(grid.cellH).toBeCloseTo(300 / 15)
  })

  it('draws the source onto the sampling canvas before reading pixels', () => {
    const ctx = makeCtx(320, 240)
    const source = document.createElement('canvas') as unknown as HTMLVideoElement

    sampleFrame(ctx, source, { cols: 10, rows: 10 })

    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0, 320, 240)
  })
})
