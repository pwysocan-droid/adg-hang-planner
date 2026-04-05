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

// Jason Nocito placeholder works — shown when no images uploaded
const NOCITO_PLACEHOLDERS = [
  { title: 'Untitled (Figure)', widthIn: 30, heightIn: 40, imageUrl: 'https://cdn.sanity.io/images/gxc2nmr0/production/f0aa7e7de7a7dbe9cac0954c357f9a91348c48ee-4200x3142.jpg' },
  { title: 'Untitled (Portrait)', widthIn: 24, heightIn: 30, imageUrl: 'https://cdn.sanity.io/images/gxc2nmr0/production/e9f8ff311c7be11a9d0c287091387eace48b9079-3423x2192.jpg' },
  { title: 'Untitled (Still)', widthIn: 20, heightIn: 24, imageUrl: 'https://cdn.sanity.io/images/gxc2nmr0/production/06b5904b0fd042511ce90d1a86c6e355089a0ff5-1080x827.jpg' },
  { title: 'Untitled (Landscape)', widthIn: 40, heightIn: 30, imageUrl: 'https://twelve-books.com/cdn/shop/products/160112.14_2814.jpg?v=1571703891' },
]

let placeholderCounter = 0

function chaosLabel(v: number) {
  if (v <= 1) return 'Minimal'
  if (v <= 3) return 'Considered'
  if (v <= 5) return 'Balanced'
  if (v <= 7) return 'Provocative'
  if (v <= 9) return 'Chaotic'
  return 'Maximum chaos'
}

export function PlacementPanel() {
  const {
    works, placements, selectedWorkId, isGenerating, error, chaos,
    setPlacements, setCuratorialNote, setGenerating, setError,
    updatePlacement, toggleLocked, setSelectedWork, setChaos, addWork,
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
          chaos,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setPlacements(data.placements)
      setCuratorialNote(data.curatorial_note)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }

  function addPlaceholders() {
    NOCITO_PLACEHOLDERS.forEach((p) => {
      addWork({
        id: `placeholder-${++placeholderCounter}`,
        title: p.title,
        widthIn: p.widthIn,
        heightIn: p.heightIn,
        imageUrl: p.imageUrl,
      })
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={styles.step}>02 —</span>
          <span className={styles.heading}>PLACEMENT</span>
        </div>
        <div className={styles.actions}>
          {works.length === 0 && (
            <button onClick={addPlaceholders}>
              + Nocito placeholders
            </button>
          )}
          {placements.length > 0 && (
            <button onClick={() => generate(false)} disabled={isGenerating}>
              New idea
            </button>
          )}
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

      <div className={styles.chaosRow}>
        <span className={styles.chaosLabel}>Minimal</span>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={chaos}
          onChange={(e) => setChaos(Number(e.target.value))}
          className={styles.chaosSlider}
        />
        <span className={styles.chaosLabel}>Chaos</span>
        <span className={styles.chaosValue}>{chaosLabel(chaos)}</span>
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
