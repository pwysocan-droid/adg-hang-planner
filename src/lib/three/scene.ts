import * as THREE from 'three'
import { ROOM } from '../room'

export function buildRoom(scene: THREE.Scene) {
  // Each surface gets its own tone to read as a distinct plane under light
  const southMat  = new THREE.MeshLambertMaterial({ color: 0xfaf9f6 }) // hero — near white
  const northMat  = new THREE.MeshLambertMaterial({ color: 0xd8d4cc }) // back — clearly darker
  const eastMat   = new THREE.MeshLambertMaterial({ color: 0xf0ece4 }) // side
  const westMat   = new THREE.MeshLambertMaterial({ color: 0xeceae2 }) // side
  const floorMat  = new THREE.MeshLambertMaterial({ color: 0xa8a49e }) // polished concrete
  const ceilMat   = new THREE.MeshLambertMaterial({ color: 0xffffff }) // white ceiling

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(ROOM.width / 2, 0, ROOM.depth / 2)
  scene.add(floor)

  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), ceilMat)
  ceil.rotation.x = Math.PI / 2
  ceil.position.set(ROOM.width / 2, ROOM.ceilingH, ROOM.depth / 2)
  scene.add(ceil)

  // South wall
  const southWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.ceilingH), southMat)
  southWall.position.set(ROOM.width / 2, ROOM.ceilingH / 2, 0)
  scene.add(southWall)

  // North wall segments
  addNorthPanel(scene, 0, 3.3, ROOM.ceilingH, northMat)
  addNorthPanel(scene, 3.3, 6.9, ROOM.ceilingH - 7.5, northMat, 7.5)
  addNorthPanel(scene, 6.9, 13.0, ROOM.ceilingH, northMat)
  addNorthPanel(scene, 13.0, 15.9, ROOM.ceilingH - 7.5, northMat, 7.5)
  addNorthPanel(scene, 15.9, ROOM.width, ROOM.ceilingH, northMat)

  // East wall
  const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.depth, ROOM.ceilingH), eastMat)
  eastWall.rotation.y = -Math.PI / 2
  eastWall.position.set(ROOM.width, ROOM.ceilingH / 2, ROOM.depth / 2)
  scene.add(eastWall)

  // Window
  const winMat = new THREE.MeshLambertMaterial({ color: 0xc8dff0, transparent: true, opacity: 0.5 })
  const winDepth = ROOM.window.zEnd - ROOM.window.zStart
  const winH = ROOM.window.yTop - ROOM.window.yBottom
  const win = new THREE.Mesh(new THREE.PlaneGeometry(winDepth, winH), winMat)
  win.rotation.y = -Math.PI / 2
  win.position.set(ROOM.width - 0.01, (ROOM.window.yBottom + ROOM.window.yTop) / 2, (ROOM.window.zStart + ROOM.window.zEnd) / 2)
  scene.add(win)

  // West wall
  const westWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.depth, ROOM.ceilingH), westMat)
  westWall.rotation.y = Math.PI / 2
  westWall.position.set(0, ROOM.ceilingH / 2, ROOM.depth / 2)
  scene.add(westWall)

  // Column — per-face materials so each side reads differently
  const colFaceMats = [
    new THREE.MeshLambertMaterial({ color: 0xe2dfd8 }), // east face — in shadow
    new THREE.MeshLambertMaterial({ color: 0xe8e5de }), // west face
    new THREE.MeshLambertMaterial({ color: 0xfafaf8 }), // top
    new THREE.MeshLambertMaterial({ color: 0xb8b4ae }), // bottom
    new THREE.MeshLambertMaterial({ color: 0xf0ede6 }), // south face — hero, brightest
    new THREE.MeshLambertMaterial({ color: 0xd8d4cc }), // north face — flush with wall, darkest
  ]
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.column.xEnd - ROOM.column.xStart, ROOM.ceilingH, ROOM.column.depth),
    colFaceMats
  )
  col.position.set(
    (ROOM.column.xStart + ROOM.column.xEnd) / 2,
    ROOM.ceilingH / 2,
    ROOM.depth - ROOM.column.depth / 2
  )
  scene.add(col)

  // 57" eye level guide on south wall
  const guideMat = new THREE.MeshBasicMaterial({ color: 0xd0ccc4 })
  const guide = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.01, 0.005), guideMat)
  guide.position.set(ROOM.width / 2, ROOM.eyeLevel, 0.01)
  scene.add(guide)

  // Fluorescent tubes
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  for (const zPos of [3.5, 10.0]) {
    const tube = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width * 0.7, 0.06, 0.1), tubeMat)
    tube.position.set(ROOM.width / 2, ROOM.ceilingH - 0.04, zPos)
    scene.add(tube)
  }

  // Lighting — layered for spatial depth
  // Strong ambient — baseline brightness so nothing goes black
  scene.add(new THREE.AmbientLight(0xfff8f0, 0.8))

  // Key from south — blasts the south wall bright, camera faces it
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
  keyLight.position.set(ROOM.width / 2, ROOM.ceilingH, -6)
  keyLight.target.position.set(ROOM.width / 2, ROOM.eyeLevel, 0)
  scene.add(keyLight)
  scene.add(keyLight.target)

  // Overhead fill — lifts everything evenly
  const overhead = new THREE.DirectionalLight(0xfff8f0, 0.8)
  overhead.position.set(ROOM.width / 2, ROOM.ceilingH + 2, ROOM.depth / 2)
  overhead.target.position.set(ROOM.width / 2, 0, ROOM.depth / 2)
  scene.add(overhead)
  scene.add(overhead.target)

  // Side fill — keeps east/west readable
  const sideLight = new THREE.DirectionalLight(0xfff0e8, 0.4)
  sideLight.position.set(-6, 6, ROOM.depth / 2)
  sideLight.target.position.set(ROOM.width / 2, ROOM.eyeLevel, ROOM.depth / 2)
  scene.add(sideLight)
  scene.add(sideLight.target)

  // Fluorescent ceiling spots
  for (const zPos of [3.5, 10.0]) {
    const spot = new THREE.SpotLight(0xffffff, 1.2)
    spot.position.set(ROOM.width / 2, ROOM.ceilingH - 0.1, zPos)
    spot.target.position.set(ROOM.width / 2, 0, zPos)
    spot.angle = Math.PI / 2.5
    spot.penumbra = 0.5
    spot.decay = 1.2
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
  panel.position.set((xStart + xEnd) / 2, yOffset + height / 2, ROOM.depth)
  scene.add(panel)
}
