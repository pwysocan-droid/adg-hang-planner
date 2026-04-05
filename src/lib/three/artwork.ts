import * as THREE from 'three'
import type { Placement, Work } from '../placement'
import { ROOM } from '../room'
import { inToFt } from '../placement'

const FRAME_DEPTH = 0.05   // feet
const FRAME_BORDER = 0.04  // feet (frame width around image)

export interface ArtworkMesh {
  group: THREE.Group
  imageId: string
}

// Returns world-space position + rotation for a placement
export function wallTransform(placement: Placement, widthFt: number): {
  position: THREE.Vector3
  rotationY: number
  xAlong: number  // x along wall for clamping
} {
  const { wall, x, y } = placement
  const halfW = widthFt / 2

  switch (wall) {
    case 'south':
      return {
        position: new THREE.Vector3(x + halfW, y, 0.02),
        rotationY: 0,
        xAlong: x,
      }
    case 'north-left':
      return {
        position: new THREE.Vector3(x + halfW, y, ROOM.depth - 0.02),
        rotationY: Math.PI,
        xAlong: x,
      }
    case 'north-right':
      return {
        position: new THREE.Vector3(15.9 + x + halfW, y, ROOM.depth - 0.02),
        rotationY: Math.PI,
        xAlong: x,
      }
    case 'east':
      return {
        position: new THREE.Vector3(ROOM.width - 0.02, y, x + halfW),
        rotationY: -Math.PI / 2,
        xAlong: x,
      }
    case 'west':
      return {
        position: new THREE.Vector3(0.02, y, x + halfW),
        rotationY: Math.PI / 2,
        xAlong: x,
      }
    case 'column': {
      // South face of column — flush with north wall, faces south into the space
      const colSouthZ = ROOM.depth - ROOM.column.depth
      return {
        position: new THREE.Vector3(ROOM.column.xStart + x + halfW, y, colSouthZ - 0.02),
        rotationY: Math.PI,  // face south (-Z) into the room
        xAlong: x,
      }
    }
  }
}

export function createArtworkMesh(
  work: Work,
  placement: Placement,
  isSelected: boolean,
  textureCache: Map<string, THREE.Texture>
): ArtworkMesh {
  const widthFt = inToFt(work.widthIn)
  const heightFt = inToFt(work.heightIn)

  const group = new THREE.Group()

  // Frame backing
  const frameW = widthFt + FRAME_BORDER * 2
  const frameH = heightFt + FRAME_BORDER * 2
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x111111 })
  const frameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(frameW, frameH, FRAME_DEPTH),
    frameMat
  )
  frameMesh.position.z = -FRAME_DEPTH / 2
  group.add(frameMesh)

  // Image plane
  let imgMat: THREE.MeshLambertMaterial
  if (work.imageUrl) {
    let tex = textureCache.get(work.id)
    if (!tex) {
      tex = new THREE.TextureLoader().load(work.imageUrl)
      textureCache.set(work.id, tex)
    }
    imgMat = new THREE.MeshLambertMaterial({ map: tex })
  } else {
    // Placeholder — grey
    imgMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
  }

  const imgMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(widthFt, heightFt),
    imgMat
  )
  imgMesh.position.z = 0.001
  group.add(imgMesh)

  // Selection outline
  if (isSelected) {
    const edges = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(frameW + 0.02, frameH + 0.02, FRAME_DEPTH + 0.02)
    )
    const lineMat = new THREE.LineBasicMaterial({ color: 0xe8280a, linewidth: 2 })
    const outline = new THREE.LineSegments(edges, lineMat)
    outline.position.z = -FRAME_DEPTH / 2
    group.add(outline)
  }

  // Position
  const { position, rotationY } = wallTransform(placement, widthFt)
  group.position.copy(position)
  group.rotation.y = rotationY
  group.userData = { imageId: work.id }

  return { group, imageId: work.id }
}
