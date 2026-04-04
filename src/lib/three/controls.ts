import * as THREE from 'three'
import { ROOM } from '../room'

export interface CameraPreset {
  id: string
  label: string
  position: THREE.Vector3
  target: THREE.Vector3
}

// All positions are INSIDE the room.
// Coordinate system: origin = SW corner, X = east, Z = north, Y = up.
export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    label: 'Overview',
    position: new THREE.Vector3(ROOM.width / 2, 8.5, 12),
    target: new THREE.Vector3(ROOM.width / 2, 3.5, 0),
  },
  {
    id: 'south',
    label: 'South',
    position: new THREE.Vector3(ROOM.width / 2, ROOM.eyeLevel, 10),
    target: new THREE.Vector3(ROOM.width / 2, ROOM.eyeLevel, 0),
  },
  {
    id: 'east',
    label: 'East',
    // South portion of east wall (avoid window zone z>9.5)
    position: new THREE.Vector3(5, ROOM.eyeLevel, 4),
    target: new THREE.Vector3(ROOM.width, ROOM.eyeLevel, 4),
  },
  {
    id: 'west',
    label: 'West',
    position: new THREE.Vector3(14, ROOM.eyeLevel, 4),
    target: new THREE.Vector3(0, ROOM.eyeLevel, 4),
  },
  {
    id: 'column',
    label: 'Column',
    position: new THREE.Vector3((ROOM.column.xStart + ROOM.column.xEnd) / 2, ROOM.eyeLevel, 6),
    target: new THREE.Vector3((ROOM.column.xStart + ROOM.column.xEnd) / 2, ROOM.eyeLevel, ROOM.column.depth),
  },
  {
    id: 'north-left',
    label: 'N–Left',
    position: new THREE.Vector3(1.65, ROOM.eyeLevel, 9),
    target: new THREE.Vector3(1.65, ROOM.eyeLevel, ROOM.depth),
  },
  {
    id: 'north-right',
    label: 'N–Right',
    position: new THREE.Vector3(17.6, ROOM.eyeLevel, 9),
    target: new THREE.Vector3(17.6, ROOM.eyeLevel, ROOM.depth),
  },
]

export class OrbitController {
  private isDragging = false
  private isShiftDragging = false
  private lastMouse = new THREE.Vector2()
  private spherical = new THREE.Spherical()
  private target: THREE.Vector3

  constructor(
    private camera: THREE.PerspectiveCamera,
    private domElement: HTMLElement
  ) {
    this.target = new THREE.Vector3(ROOM.width / 2, 3.5, 0)
    this.updateSpherical()
    this.bind()
  }

  private updateSpherical() {
    const dir = new THREE.Vector3().subVectors(this.camera.position, this.target)
    this.spherical.setFromVector3(dir)
  }

  private bind() {
    this.domElement.addEventListener('mousedown', this.onMouseDown)
    this.domElement.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false })
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown)
    this.domElement.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
    this.domElement.removeEventListener('wheel', this.onWheel)
  }

  private onMouseDown = (e: MouseEvent) => {
    this.isDragging = true
    this.isShiftDragging = e.shiftKey
    this.lastMouse.set(e.clientX, e.clientY)
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return
    const dx = e.clientX - this.lastMouse.x
    const dy = e.clientY - this.lastMouse.y
    this.lastMouse.set(e.clientX, e.clientY)

    if (this.isShiftDragging) {
      const right = new THREE.Vector3()
      const up = new THREE.Vector3()
      this.camera.getWorldDirection(right)
      right.cross(this.camera.up).normalize()
      up.copy(this.camera.up)
      const panSpeed = 0.02
      this.target.addScaledVector(right, -dx * panSpeed)
      this.target.addScaledVector(up, dy * panSpeed)
    } else {
      this.spherical.theta -= dx * 0.01
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi + dy * 0.01))
    }

    this.applyCamera()
  }

  private onMouseUp = () => {
    this.isDragging = false
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    this.spherical.radius = Math.max(2, Math.min(40, this.spherical.radius + e.deltaY * 0.02))
    this.applyCamera()
  }

  private applyCamera() {
    const offset = new THREE.Vector3().setFromSpherical(this.spherical)
    this.camera.position.copy(this.target).add(offset)
    this.camera.lookAt(this.target)
  }

  goTo(preset: CameraPreset) {
    this.target.copy(preset.target)
    this.camera.position.copy(preset.position)
    this.camera.lookAt(this.target)
    this.updateSpherical()
  }
}
