import { useEffect } from 'react'
import { WorksPanel } from './components/WorksPanel/WorksPanel'
import { PlacementPanel } from './components/PlacementPanel/PlacementPanel'
import { ExportPanel } from './components/ExportPanel/ExportPanel'
import { useStore } from './store/useStore'
import { deserializePlacements } from './lib/placement'
import styles from './App.module.css'

export function App() {
  const { curatorial_note, setPlacements } = useStore()

  // Restore share link on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('hang')
    if (encoded) {
      try {
        const placements = deserializePlacements(encoded)
        setPlacements(placements)
      } catch {
        // malformed — ignore
      }
    }
  }, [setPlacements])

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.title}>ADG HANG PLANNER</span>
        <span className={styles.subtitle}>1741 SILVERLAKE BLVD</span>
      </header>

      <div className={styles.rule} />

      <WorksPanel />

      <div className={styles.rule} />

      <PlacementPanel />

      {curatorial_note && (
        <>
          <div className={styles.rule} />
          <div className={styles.note}>
            <div className={styles.noteHeader}>
              <span className={styles.step}>03 —</span>
              <span className={styles.noteLabel}>CURATORIAL NOTE</span>
            </div>
            <p className={styles.noteText}>{curatorial_note}</p>
          </div>
        </>
      )}

      <div className={styles.rule} />

      <ExportPanel />
    </div>
  )
}
