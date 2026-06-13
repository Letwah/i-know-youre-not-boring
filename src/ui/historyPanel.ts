export interface HistoryEntry {
  thumbnail: string   // data URL from output canvas
  label: string
  restore: () => void
}

const MAX_ENTRIES = 12

export class HistoryPanel {
  private entries: HistoryEntry[] = []
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.container.className = 'history-panel'
  }

  add(entry: HistoryEntry) {
    this.entries.unshift(entry)
    if (this.entries.length > MAX_ENTRIES) this.entries.pop()
    this.render()
  }

  private render() {
    this.container.innerHTML = ''
    for (const entry of this.entries) {
      const item = document.createElement('button')
      item.className = 'history-item'
      item.title = entry.label

      const img = document.createElement('img')
      img.src = entry.thumbnail
      img.alt = entry.label

      const label = document.createElement('span')
      label.textContent = entry.label

      item.appendChild(img)
      item.appendChild(label)
      item.addEventListener('click', entry.restore)
      this.container.appendChild(item)
    }
  }
}
