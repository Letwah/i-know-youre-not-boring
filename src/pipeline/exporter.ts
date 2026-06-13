export interface ExportOptions {
  mimeType?: string
  videoBitsPerSecond?: number
}

export class CanvasExporter {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []

  constructor(private stream: MediaStream) {}

  startRecording(options: ExportOptions = {}) {
    const mime = options.mimeType ?? this.pickMime()
    this.chunks = []
    this.recorder = new MediaRecorder(this.stream, {
      mimeType: mime,
      videoBitsPerSecond: options.videoBitsPerSecond ?? 5_000_000,
    })
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start(100)
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) { reject(new Error('Not recording')); return }
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder!.mimeType })
        resolve(blob)
      }
      this.recorder.stop()
    })
  }

  get isRecording() {
    return this.recorder?.state === 'recording'
  }

  private pickMime(): string {
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? 'video/webm'
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function grabPng(canvas: HTMLCanvasElement, filename = 'frame.png') {
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename)
  }, 'image/png')
}
