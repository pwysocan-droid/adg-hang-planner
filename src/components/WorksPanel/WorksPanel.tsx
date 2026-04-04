import { useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import type { Work } from '../../lib/placement'
import styles from './WorksPanel.module.css'

let idCounter = 0
function genId() { return `work-${++idCounter}` }

function WorkCard({ work }: { work: Work }) {
  const { updateWork, removeWork } = useStore()
  const [title, setTitle] = useState(work.title)
  const [w, setW] = useState(String(work.widthIn))
  const [h, setH] = useState(String(work.heightIn))

  function commitTitle() {
    updateWork(work.id, { title: title || 'Untitled' })
  }

  function commitDims() {
    const wVal = parseFloat(w)
    const hVal = parseFloat(h)
    if (wVal > 0) updateWork(work.id, { widthIn: wVal })
    if (hVal > 0) updateWork(work.id, { heightIn: hVal })
  }

  return (
    <div className={styles.card}>
      {work.imageUrl
        ? <img src={work.imageUrl} className={styles.thumb} alt={work.title} />
        : <div className={styles.placeholder} />
      }

      <div className={styles.fields}>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
          placeholder="Title"
        />

        <div className={styles.dimRow}>
          <div className={styles.dimField}>
            <span className={styles.dimLabel}>W</span>
            <input
              type="number"
              className={styles.dimInput}
              value={w}
              min="1"
              onChange={(e) => setW(e.target.value)}
              onBlur={commitDims}
              onKeyDown={(e) => e.key === 'Enter' && commitDims()}
            />
          </div>
          <span className={styles.dimSep}>×</span>
          <div className={styles.dimField}>
            <span className={styles.dimLabel}>H</span>
            <input
              type="number"
              className={styles.dimInput}
              value={h}
              min="1"
              onChange={(e) => setH(e.target.value)}
              onBlur={commitDims}
              onKeyDown={(e) => e.key === 'Enter' && commitDims()}
            />
          </div>
          <span className={styles.dimUnit}>in</span>
        </div>
      </div>

      <button onClick={() => removeWork(work.id)} className={styles.removeBtn}>✕</button>
    </div>
  )
}

export function WorksPanel() {
  const { works, addWork } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function processFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.match(/image\//)) return
      const url = URL.createObjectURL(file)
      const name = file.name.replace(/\.[^.]+$/, '')
      const dimMatch = name.match(/(\d+)\s*[xX×]\s*(\d+)/)
      const work: Work = {
        id: genId(),
        title: name,
        widthIn: dimMatch ? parseInt(dimMatch[1]) : 24,
        heightIn: dimMatch ? parseInt(dimMatch[2]) : 30,
        imageUrl: url,
      }
      addWork(work)
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.step}>01 —</span>
        <span className={styles.heading}>WORKS</span>
      </div>

      <div
        className={`${styles.dropzone} ${dragging ? styles.dragOver : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <span className={styles.dropLabel}>Drop images here — or click to upload</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {works.length > 0 && (
        <div className={styles.list}>
          {works.map((w) => <WorkCard key={w.id} work={w} />)}
        </div>
      )}
    </div>
  )
}
