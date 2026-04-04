import type { WallId } from './room'

export interface Work {
  id: string
  title: string
  widthIn: number
  heightIn: number
  imageUrl: string | null // object URL or null for placeholder
}

export interface Placement {
  imageId: string
  wall: WallId
  x: number    // position along wall in feet from left edge
  y: number    // center height in feet (default 4.75)
  locked?: boolean
}

export interface PlacementResponse {
  placements: Placement[]
  curatorial_note: string
}

// Convert inches to feet
export function inToFt(inches: number): number {
  return inches / 12
}

// Format feet as feet+inches string
export function ftToDisplay(feet: number): string {
  const totalInches = Math.round(feet * 12)
  const ft = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  if (inches === 0) return `${ft}'`
  return `${ft}'-${inches}"`
}

// Serialize placements to URL-safe base64
export function serializePlacements(placements: Placement[]): string {
  const data = placements.map(p => ({
    id: p.imageId,
    w: p.wall,
    x: Math.round(p.x * 100) / 100,
    y: Math.round(p.y * 100) / 100,
  }))
  return btoa(JSON.stringify(data))
}

export function deserializePlacements(encoded: string): Placement[] {
  const data = JSON.parse(atob(encoded))
  return data.map((d: { id: string; w: WallId; x: number; y: number }) => ({
    imageId: d.id,
    wall: d.w,
    x: d.x,
    y: d.y,
  }))
}
