export type WallId = 'south' | 'east' | 'west' | 'column' | 'north-left' | 'north-right'

export interface WallDef {
  id: WallId
  label: string
  usableLength: number // feet
  height: number       // feet (hangable height)
}

export const ROOM = {
  width: 19.33,   // E-W feet
  depth: 14.5,    // N-S feet
  ceilingH: 9.5,  // feet

  column: {
    width: 6.1,
    depth: 1.8,
    xStart: 6.9,
    xEnd: 13.0,
  },

  window: {
    zStart: 10.5,
    zEnd: 13.0,
    yBottom: 3.0,
    yTop: 5.8,
  },

  eyeLevel: 4.75, // 57 inches in feet
} as const

export const WALLS: WallDef[] = [
  { id: 'south',       label: 'South',    usableLength: 19.33, height: 9.5 },
  { id: 'east',        label: 'East',     usableLength: 9.5,   height: 9.5 },
  { id: 'west',        label: 'West',     usableLength: 10,    height: 9.5 },
  { id: 'column',      label: 'Column',   usableLength: 6.1,   height: 9.5 },
  { id: 'north-left',  label: 'N–Left',   usableLength: 3.3,   height: 7.5 },
  { id: 'north-right', label: 'N–Right',  usableLength: 3.43,  height: 7.5 },
]

export const ROOM_CONFIG = {
  width: ROOM.width,
  depth: ROOM.depth,
  ceilingH: ROOM.ceilingH,
  eyeLevel: ROOM.eyeLevel,
  column: ROOM.column,
  window: ROOM.window,
  walls: WALLS,
}
