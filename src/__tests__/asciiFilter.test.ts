import { describe, it, expect } from 'vitest'
import { brightnessToGlyph, pixelBrightness, buildRamp } from '../filters/asciiFilter'

describe('pixelBrightness', () => {
  it('returns 0 for black', () => {
    expect(pixelBrightness(0, 0, 0)).toBe(0)
  })

  it('returns 1 for white', () => {
    expect(pixelBrightness(255, 255, 255)).toBe(1)
  })

  it('uses perceptual luma weights (0.299 R + 0.587 G + 0.114 B)', () => {
    // Pure red: 0.299 * 255 ≈ 76.2 → 76.2/255 ≈ 0.299
    expect(pixelBrightness(255, 0, 0)).toBeCloseTo(0.299, 2)
  })

  it('mid-grey returns ~0.5', () => {
    expect(pixelBrightness(128, 128, 128)).toBeCloseTo(128 / 255, 2)
  })
})

describe('buildRamp', () => {
  it('returns the ramp string as an array of characters', () => {
    const ramp = buildRamp(' .:-=+*#@')
    expect(ramp).toEqual([' ', '.', ':', '-', '=', '+', '*', '#', '@'])
  })

  it('deduplicates while preserving order', () => {
    const ramp = buildRamp('aab')
    expect(ramp).toEqual(['a', 'b'])
  })

  it('returns single-char array for single-char ramp', () => {
    expect(buildRamp('X')).toEqual(['X'])
  })
})

describe('brightnessToGlyph', () => {
  const ramp = [' ', '.', '+', '#', '@']

  it('maps brightness 0 to the first (darkest) glyph', () => {
    expect(brightnessToGlyph(0, ramp)).toBe(' ')
  })

  it('maps brightness 1 to the last (brightest) glyph', () => {
    expect(brightnessToGlyph(1, ramp)).toBe('@')
  })

  it('maps mid-brightness to a mid-ramp glyph', () => {
    expect(brightnessToGlyph(0.5, ramp)).toBe('+')
  })

  it('clamps values below 0', () => {
    expect(brightnessToGlyph(-0.1, ramp)).toBe(' ')
  })

  it('clamps values above 1', () => {
    expect(brightnessToGlyph(1.1, ramp)).toBe('@')
  })

  it('maps inverted brightness when invert=true', () => {
    expect(brightnessToGlyph(0, ramp, true)).toBe('@')
    expect(brightnessToGlyph(1, ramp, true)).toBe(' ')
  })
})
