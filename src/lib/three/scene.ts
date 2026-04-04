import * as THREE from 'three'
import { ROOM } from '../room'

export function buildRoom(scene: THREE.Scene) {
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf8f6f0, side: THREE.FrontSide })
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xd0cdc8 })
  const ceilMat  = new THREE.MeshLambertMaterial({ color: 0xfafafa })

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
    floorMat
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(ROOM.width / 2, 0, ROOM.depth / 2)
  scene.add(floor)

  // Ceiling
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
    ceilMat
  )
  ceil.rotation.x = Math.PI / 2
  ceil.position.set(ROOM.width / 2, ROOM.ceilingH, ROOM.depth / 2)
  scene.add(ceil)

  // South wall (z=0)
  const southWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.ceilingH),
    wallMat
  )
  southWall.position.set(ROOM.width / 2, ROOM.ceilingH / 2, 0)
  scene.add(southWall)

  // North wall segments (with door openings)
  // Left panel: x=0..3.3, solid
  addNorthPanel(scene, 0, 3.3, ROOM.ceilingH, wallMat)
  // Door openings: 3.3..6.9 and 13.0..15.9 (height 7.5), above doors solid
  addNorthPanel(scene, 3.3, 6.9, ROOM.ceilingH - 7.5, wallMat, 7.5)
  addNorthPanel(scene, 6.9, 13.0, ROOM.ceilingH, wallMat) // column zone wall at back
  addNorthPanel(scene, 13.0, 15.9, ROOM.ceilingH - 7.5, wallMat, 7.5)
  // Right panel: 15.9..19.33
  addNorthPanel(scene, 15.9, ROOM.width, ROOM.ceilingH, wallMat)

  // East wall (x=ROOM.width)
  const eastWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.depth, ROOM.ceilingH),
    wallMat
  )
  eastWall.rotation.y = -Math.PI / 2
  eastWall.position.set(ROOM.width, ROOM.ceilingH / 2, ROOM.depth / 2)
  scene.add(eastWall)

  // East wall window
  const winMat = new THREE.MeshLambertMaterial({
    color: 0xb8d4e8,
    transparent: true,
    opacity: 0.45,
  })
  const winDepth = ROOM.window.zEnd - ROOM.window.zStart
  const winH = ROOM.window.yTop - ROOM.window.yBottom
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(winDepth, winH),
    winMat
  )
  win.rotation.y = -Math.PI / 2
  const winCZ = (ROOM.window.zStart + ROOM.window.zEnd) / 2
  const winCY = (ROOM.window.yBottom + ROOM.window.yTop) / 2
  win.position.set(ROOM.width - 0.01, winCY, winCZ)
  scene.add(win)

  // West wall (x=0)
  const westWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.depth, ROOM.ceilingH),
    wallMat
  )
  westWall.rotation.y = Math.PI / 2
  westWall.position.set(0, ROOM.ceilingH / 2, ROOM.depth / 2)
  scene.add(westWall)

  // Column
  const colMat = new THREE.MeshLambertMaterial({ color: 0xf0ede7 })
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(
      ROOM.column.xEnd - ROOM.column.xStart,
      ROOM.ceilingH,
      ROOM.column.depth
    ),
    colMat
  )
  col.position.set(
    (ROOM.column.xStart + ROOM.column.xEnd) / 2,
    ROOM.ceilingH / 2,
    ROOM.column.depth / 2
  )
  scene.add(col)

  // 57" eye level guide on south wall
  const guideMat = new THREE.MeshBasicMaterial({ color: 0xcccccc })
  const guide = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width, 0.01, 0.005),
    guideMat
  )
  guide.position.set(ROOM.width / 2, ROOM.eyeLevel, 0.01)
  scene.add(guide)

  // Fluorescent tubes
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  for (const zPos of [3.5, 10.0]) {
    const tube = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM.width * 0.7, 0.08, 0.12),
      tubeMat
    )
    tube.position.set(ROOM.width / 2, ROOM.ceilingH - 0.05, zPos)
    scene.add(tube)
  }

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambient)

  for (const zPos of [3.5, 10.0]) {
    const spot = new THREE.SpotLight(0xffffff, 1.0)
    spot.position.set(ROOM.width / 2, ROOM.ceilingH - 0.1, zPos)
    spot.target.position.set(ROOM.width / 2, 0, zPos)
    spot.angle = Math.PI / 2.5
    spot.penumbra = 0.4
    scene.add(spot)
    scene.add(spot.target)
  }
}

function addNorthPanel(
  scene: THREE.Scene,
  xStart: number,
  xEnd: number,
  height: number,
  mat: THREE.Material,
  yOffset: number = 0
) {
  const w = xEnd - xStart
  if (w <= 0 || height <= 0) return
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, height), mat)
  panel.rotation.y = Math.PI
  panel.position.set(
    (xStart + xEnd) / 2,
    yOffset + height / 2,
    ROOM.depth
  )
  scene.add(panel)
}
