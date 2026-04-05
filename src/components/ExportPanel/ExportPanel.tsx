import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { serializePlacements, ftToDisplay } from '../../lib/placement'
import { WALLS } from '../../lib/room'
import type { WallId } from '../../lib/room'
import styles from './ExportPanel.module.css'

const WALL_LABELS: Record<WallId, string> = {
  south: 'SOUTH WALL',
  east: 'EAST WALL',
  west: 'WEST WALL',
  column: 'COLUMN (SOUTH FACE)',
  'north-left': 'NORTH WALL — LEFT PANEL',
  'north-right': 'NORTH WALL — RIGHT PANEL',
}

function copyToClipboard(text: string, onSuccess: () => void) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      onSuccess()
    })
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    onSuccess()
  }
}

export function ExportPanel() {
  const { works, placements, curatorial_note } = useStore()
  const [copied, setCopied] = useState<string | null>(null)

  function flash(label: string) {
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  function shareLink() {
    if (placements.length === 0) return
    const encoded = serializePlacements(placements)
    const url = new URL(window.location.href)
    url.searchParams.set('hang', encoded)
    copyToClipboard(url.toString(), () => flash('link'))
  }

  function hangSheet() {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const lines: string[] = [
      'ADG HANG PLAN — 1741 SILVERLAKE',
      date,
      '',
    ]

    for (const wall of WALLS) {
      const wallPlacements = placements
        .filter((p) => p.wall === wall.id)
        .sort((a, b) => a.x - b.x)
      if (wallPlacements.length === 0) continue
      lines.push(WALL_LABELS[wall.id])
      for (const p of wallPlacements) {
        const work = works.find((w) => w.id === p.imageId)
        if (!work) continue
        const centerFt = p.x + (work.widthIn / 12) / 2
        lines.push(
          `  — ${work.title}, ${work.widthIn}" × ${work.heightIn}", center ${ftToDisplay(centerFt)} from left, eye 57"`
        )
      }
      lines.push('')
    }

    copyToClipboard(lines.join('\n'), () => flash('sheet'))
  }

  async function exportPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })

    const margin = 0.75
    let y = margin

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('ADG HANG PLAN — 1741 SILVERLAKE BLVD', margin, y)
    y += 0.25

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(new Date().toLocaleDateString(), margin, y)
    y += 0.35

    if (curatorial_note) {
      doc.setFontSize(9)
      const noteLines = doc.splitTextToSize(curatorial_note, 7)
      doc.text(noteLines, margin, y)
      y += noteLines.length * 0.14 + 0.2
    }

    for (const wall of WALLS) {
      const wallPlacements = placements
        .filter((p) => p.wall === wall.id)
        .sort((a, b) => a.x - b.x)
      if (wallPlacements.length === 0) continue

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(WALL_LABELS[wall.id], margin, y)
      y += 0.18

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      for (const p of wallPlacements) {
        const work = works.find((w) => w.id === p.imageId)
        if (!work) continue
        const centerFt = p.x + (work.widthIn / 12) / 2
        doc.text(
          `${work.title}  |  ${work.widthIn}" × ${work.heightIn}"  |  center ${ftToDisplay(centerFt)} from left edge  |  eye 57"`,
          margin + 0.15,
          y
        )
        y += 0.16
        if (y > 10) { doc.addPage(); y = margin }
      }
      y += 0.12
    }

    // Simple floor plan schematic
    if (placements.length > 0) {
      if (y > 7.5) { doc.addPage(); y = margin }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('FLOOR PLAN (TOP VIEW)', margin, y)
      y += 0.2

      const scale = 0.35 // inches per foot
      const ox = margin
      const oy = y

      // Room outline
      doc.setDrawColor(0)
      doc.setLineWidth(0.01)
      doc.rect(ox, oy, 19.33 * scale, 14.5 * scale)

      // Column
      doc.setFillColor(200, 200, 200)
      doc.rect(ox + 6.9 * scale, oy, 6.1 * scale, 1.8 * scale, 'FD')

      // Placements as small rectangles
      for (const p of placements) {
        const work = works.find((w) => w.id === p.imageId)
        if (!work) continue
        const wFt = work.widthIn / 12
        let rx = ox, ry = oy
        switch (p.wall) {
          case 'south':   rx = ox + p.x * scale; ry = oy; break
          case 'east':    rx = ox + 19.33 * scale - 0.06; ry = oy + p.x * scale; break
          case 'west':    rx = ox; ry = oy + p.x * scale; break
          case 'column':  rx = ox + (6.9 + p.x) * scale; ry = oy + 1.8 * scale; break
          case 'north-left': rx = ox + p.x * scale; ry = oy + 14.5 * scale - 0.06; break
          case 'north-right': rx = ox + (15.9 + p.x) * scale; ry = oy + 14.5 * scale - 0.06; break
        }
        doc.setFillColor(80, 80, 80)
        doc.rect(rx, ry, wFt * scale, 0.06, 'F')
      }
    }

    doc.save('adg-hang-plan.pdf')
  }

  const hasData = placements.length > 0

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={styles.step}>04 —</span>
          <span className={styles.heading}>EXPORT</span>
        </div>
        <div className={styles.actions}>
          <button onClick={shareLink} disabled={!hasData}>{copied === 'link' ? 'Copied ✓' : 'Share link'}</button>
          <button onClick={hangSheet} disabled={!hasData}>{copied === 'sheet' ? 'Copied ✓' : 'Hang sheet'}</button>
          <button onClick={exportPdf} disabled={!hasData}>Export PDF</button>
        </div>
      </div>
    </div>
  )
}
