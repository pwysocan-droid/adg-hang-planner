import { create } from 'zustand'
import type { Work, Placement } from '../lib/placement'

interface AppState {
  works: Work[]
  placements: Placement[]
  curatorial_note: string
  selectedWorkId: string | null
  isGenerating: boolean
  error: string | null

  addWork: (work: Work) => void
  updateWork: (id: string, updates: Partial<Work>) => void
  removeWork: (id: string) => void

  setPlacements: (placements: Placement[]) => void
  updatePlacement: (imageId: string, updates: Partial<Placement>) => void
  toggleLocked: (imageId: string) => void

  setCuratorialNote: (note: string) => void
  setSelectedWork: (id: string | null) => void
  setGenerating: (v: boolean) => void
  setError: (msg: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  works: [],
  placements: [],
  curatorial_note: '',
  selectedWorkId: null,
  isGenerating: false,
  error: null,

  addWork: (work) => set((s) => ({ works: [...s.works, work] })),
  updateWork: (id, updates) =>
    set((s) => ({
      works: s.works.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
  removeWork: (id) =>
    set((s) => ({
      works: s.works.filter((w) => w.id !== id),
      placements: s.placements.filter((p) => p.imageId !== id),
    })),

  setPlacements: (placements) => set({ placements }),
  updatePlacement: (imageId, updates) =>
    set((s) => ({
      placements: s.placements.map((p) =>
        p.imageId === imageId ? { ...p, ...updates } : p
      ),
    })),
  toggleLocked: (imageId) =>
    set((s) => ({
      placements: s.placements.map((p) =>
        p.imageId === imageId ? { ...p, locked: !p.locked } : p
      ),
    })),

  setCuratorialNote: (note) => set({ curatorial_note: note }),
  setSelectedWork: (id) => set({ selectedWorkId: id }),
  setGenerating: (v) => set({ isGenerating: v }),
  setError: (msg) => set({ error: msg }),
}))
