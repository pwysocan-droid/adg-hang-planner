import { useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import type { Work } from '../../lib/placement'
import styles from './WorksPanel.module.css'

let idCounter = 0
function genId() { return `work-${++idCounter}` }

function WorkCard({ work }: { work: Work }) {
  const { updateWork, removeWork } = useStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(work.title)
  const [w, setW] = useState(String(work.widthIn))
  const [h, setH] = useState(String(work.heightIn))

  function save() {
    updateWork(work.id, {
      title: title || 'Untitled',
      widthIn: parseFloat(w) || work.widthIn,
      heightIn: parseFloat(h) || work.heightIn,
    })
    setEditing(false)
  }

  return (
    <div className={styles.card}>
      {work.imageUrl ? (
        <img src={work.imageUrl} className={styles.thumb} alt={work.title} />
      ) : (
        <div className={styles.placeholder} />
      )}

      {editing ? (
        <div className={styles.editForm}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className={styles.titleInput}
          />
          <div className={styles.dimRow}>
            <input
              type="number"
              value={w}
              onChange={(e) => setW(e.target.value)}
              className={styles.dimInput}
            />
            <span className={styles.dimSep}>×</span>
            <input
              type="number"
              value={h}
              onChange={(e) => setH(e.target.value)}
              className={styles.dimInput}
            />
            <span className={styles.dimUnit}>in</span>
          </div>
          <button onClick={save} className={styles.saveBtn}>Save</button>
        </div>
      ) : (
        <div className={styles.meta}>
          <div className={styles.workTitle}>{work.title}</div>
          <div className={styles.dims}>
            {work.widthIn}" × {work.heightIn}"
          </div>
          <div className={styles.actions}>
            <button onClick={() => setEditing(true)} className={styles.iconBtn}>✎</button>
            <button onClick={() => removeWork(work.id)} className={styles.iconBtn}>✕</button>
          </div>
        </div>
      )}
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
      // Try to parse dimensions from filename e.g. "portrait_24x30"
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
        <div className={styles.grid}>
          {works.map((w) => <WorkCard key={w.id} work={w} />)}
        </div>
      )}
    </div>
  )
}
