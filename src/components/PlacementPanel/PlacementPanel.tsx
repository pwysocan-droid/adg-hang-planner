import { useStore } from '../../store/useStore'
import { ROOM_CONFIG } from '../../lib/room'
import type { WallId } from '../../lib/room'
import { WALLS } from '../../lib/room'
import { Viewer3D } from '../Viewer3D/Viewer3D'
import styles from './PlacementPanel.module.css'

const WALL_LABELS: Record<WallId, string> = {
  south: 'South',
  east: 'East',
  west: 'West',
  column: 'Column',
  'north-left': 'N–Left',
  'north-right': 'N–Right',
}

export function PlacementPanel() {
  const {
    works, placements, selectedWorkId, isGenerating, error,
    setPlacements, setCuratorialNote, setGenerating, setError,
    updatePlacement, toggleLocked, setSelectedWork,
  } = useStore()

  const selectedPlacement = placements.find((p) => p.imageId === selectedWorkId)
  const selectedWork = works.find((w) => w.id === selectedWorkId)

  async function generate(reeval = false) {
    if (works.length === 0) {
      setError('Add at least one work before generating.')
      return
    }
    setGenerating(true)
    setError(null)

    const lockedPlacements = reeval
      ? placements.filter((p) => p.locked).map((p) => ({
          imageId: p.imageId,
          wall: p.wall,
          x: p.x,
          y: p.y,
        }))
      : []

    try {
      const res = await fetch('/api/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          works: works.map((w) => ({
            id: w.id,
            title: w.title,
            widthIn: w.widthIn,
            heightIn: w.heightIn,
          })),
          room: ROOM_CONFIG,
          locked: lockedPlacements,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlacements(data.placements)
      setCuratorialNote(data.curatorial_note)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={styles.step}>02 —</span>
          <span className={styles.heading}>PLACEMENT</span>
        </div>
        <div className={styles.actions}>
          {placements.length > 0 && (
            <button onClick={() => generate(true)} disabled={isGenerating}>
              Re-evaluate
            </button>
          )}
          <button
            onClick={() => generate(false)}
            disabled={isGenerating}
            className="accent"
          >
            {isGenerating ? 'Generating…' : '02 — Generate hang plan →'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <Viewer3D />

      {selectedWork && selectedPlacement && (
        <div className={styles.selectedPanel}>
          <div className={styles.selectedTitle}>{selectedWork.title}</div>
          <div className={styles.wallRow}>
            <span className={styles.label}>Wall</span>
            <div className={styles.wallBtns}>
              {WALLS.map((wall) => (
                <button
                  key={wall.id}
                  onClick={() => updatePlacement(selectedWork.id, { wall: wall.id })}
                  className={selectedPlacement.wall === wall.id ? styles.wallActive : ''}
                >
                  {WALL_LABELS[wall.id]}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.lockRow}>
            <button onClick={() => toggleLocked(selectedWork.id)}>
              {selectedPlacement.locked ? '⊠ Locked' : '⊡ Lock position'}
            </button>
            <button onClick={() => setSelectedWork(null)}>Deselect</button>
          </div>
        </div>
      )}
    </div>
  )
}
