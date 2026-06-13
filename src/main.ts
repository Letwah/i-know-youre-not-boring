import { RenderPipeline } from './pipeline/renderPipeline'
import { asciiFilter } from './filters/asciiFilter'
import { buildControlPanel, defaultValues } from './ui/controlPanel'
import { CanvasExporter, downloadBlob, grabPng } from './pipeline/exporter'
import type { ControlValues, PipelineSource } from './types'

// ── DOM ──────────────────────────────────────────────────────────────────────

const app = document.getElementById('app')!
app.innerHTML = `
  <div class="layout">
    <aside class="sidebar">
      <div class="branding">not boring</div>
      <div class="drop-zone" id="dropZone">
        <span>Drop video or image here</span>
        <input type="file" id="fileInput" accept="video/*,image/*" />
      </div>
      <div class="controls-scroll">
        <div id="controlPanel"></div>
      </div>
      <div class="export-bar">
        <button id="btnGrabFrame">Save PNG</button>
        <button id="btnRecord">Record</button>
      </div>
    </aside>
    <main class="canvas-area">
      <canvas id="output"></canvas>
    </main>
  </div>
`

// ── Elements ─────────────────────────────────────────────────────────────────

const outputCanvas = document.getElementById('output') as HTMLCanvasElement
const dropZone = document.getElementById('dropZone') as HTMLDivElement
const fileInput = document.getElementById('fileInput') as HTMLInputElement
const controlPanelEl = document.getElementById('controlPanel') as HTMLDivElement
const btnGrabFrame = document.getElementById('btnGrabFrame') as HTMLButtonElement
const btnRecord = document.getElementById('btnRecord') as HTMLButtonElement

// ── Pipeline ─────────────────────────────────────────────────────────────────

const pipeline = new RenderPipeline(outputCanvas)
const exporter = new CanvasExporter(pipeline.stream)
let params: ControlValues = defaultValues(asciiFilter.controls)

function getGridSize() {
  return {
    cols: params['cols'] as number ?? 80,
    rows: params['rows'] as number ?? 45,
  }
}

function updateParams(next: ControlValues) {
  params = next
  if (currentSource) {
    const { cols, rows } = getGridSize()
    pipeline.configure({
      outputCanvas,
      source: currentSource,
      filter: asciiFilter,
      params,
      cols,
      rows,
    })
  }
}

buildControlPanel(controlPanelEl, asciiFilter.controls, params, updateParams)

// ── Source handling ───────────────────────────────────────────────────────────

let currentSource: PipelineSource | null = null

function loadFile(file: File) {
  pipeline.stop()

  const url = URL.createObjectURL(file)

  if (file.type.startsWith('video/')) {
    const video = document.createElement('video')
    video.loop = true
    video.muted = true
    video.playsInline = true
    // Must be in DOM before src is set — browsers won't decode frames for detached elements
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;'
    document.body.appendChild(video)

    video.addEventListener('loadedmetadata', () => {
      resizeCanvas(video.videoWidth, video.videoHeight)
      currentSource = { kind: 'video', element: video }
      const { cols, rows } = getGridSize()
      pipeline.configure({ outputCanvas, source: currentSource, filter: asciiFilter, params, cols, rows })
      pipeline.start()
      video.play().catch(() => { /* autoplay blocked */ })
    })

    video.src = url
  } else {
    const img = new Image()
    img.onload = () => {
      resizeCanvas(img.naturalWidth, img.naturalHeight)
      currentSource = { kind: 'image', element: img }
      const { cols, rows } = getGridSize()
      pipeline.configure({ outputCanvas, source: currentSource, filter: asciiFilter, params, cols, rows })
      pipeline.start()
    }
    img.src = url
  }
}

function resizeCanvas(srcW: number, srcH: number) {
  // Fit inside viewport, maintain aspect
  const maxW = window.innerWidth - 280
  const maxH = window.innerHeight - 32
  const scale = Math.min(maxW / srcW, maxH / srcH, 1)
  outputCanvas.width = Math.round(srcW * scale)
  outputCanvas.height = Math.round(srcH * scale)
}

// ── Drag & drop ───────────────────────────────────────────────────────────────

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over') })
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'))
dropZone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropZone.classList.remove('drag-over')
  const file = e.dataTransfer?.files[0]
  if (file) loadFile(file)
})
dropZone.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (file) loadFile(file)
})

// ── Export ────────────────────────────────────────────────────────────────────

btnGrabFrame.addEventListener('click', () => {
  grabPng(outputCanvas)
})

btnRecord.addEventListener('click', async () => {
  if (exporter.isRecording) {
    btnRecord.textContent = 'Record'
    btnRecord.classList.remove('recording')
    const blob = await exporter.stopRecording()
    downloadBlob(blob, `not-boring-${Date.now()}.webm`)
  } else {
    exporter.startRecording()
    btnRecord.textContent = 'Stop'
    btnRecord.classList.add('recording')
  }
})
