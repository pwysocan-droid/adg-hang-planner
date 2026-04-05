import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { ROOM } from '../../lib/room'
import { useStore } from '../../store/useStore'
import { buildRoom } from '../../lib/three/scene'
import { createArtworkMesh } from '../../lib/three/artwork'
import { OrbitController, CAMERA_PRESETS } from '../../lib/three/controls'
import styles from './Viewer3D.module.css'

export function Viewer3D() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitController | null>(null)
  const textureCache = useRef(new Map<string, THREE.Texture>())
  const artworkGroupRef = useRef<THREE.Group | null>(null)
  const rafRef = useRef<number>(0)

  const works = useStore((s) => s.works)
  const placements = useStore((s) => s.placements)
  const selectedWorkId = useStore((s) => s.selectedWorkId)
  const setSelectedWork = useStore((s) => s.setSelectedWork)
  const updatePlacement = useStore((s) => s.updatePlacement)

  // Init Three.js
  useEffect(() => {
    if (!canvasRef.current) return
    const container = canvasRef.current
    const w = container.clientWidth
    const h = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.setClearColor(0xf8f7f2)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200)
    camera.position.set(ROOM.width / 2, 10, 16)
    camera.lookAt(ROOM.width / 2, 3, 0)
    cameraRef.current = camera

    const controls = new OrbitController(camera, renderer.domElement)
    controlsRef.current = controls

    buildRoom(scene)

    const artGroup = new THREE.Group()
    scene.add(artGroup)
    artworkGroupRef.current = artGroup

    function animate() {
      rafRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    function onResize() {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  // Rebuild artwork meshes whenever works/placements/selection change
  useEffect(() => {
    const scene = sceneRef.current
    const artGroup = artworkGroupRef.current
    if (!scene || !artGroup) return

    // Clear
    while (artGroup.children.length > 0) {
      const child = artGroup.children[0]
      artGroup.remove(child)
    }

    placements.forEach((p) => {
      const work = works.find((w) => w.id === p.imageId)
      if (!work) return
      const mesh = createArtworkMesh(work, p, selectedWorkId === p.imageId, textureCache.current)
      artGroup.add(mesh.group)
    })
  }, [works, placements, selectedWorkId])

  // Click to select
  useEffect(() => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const artGroup = artworkGroupRef.current
    if (!renderer || !camera || !artGroup) return

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onClick(e: MouseEvent) {
      const rect = renderer!.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera!)
      const hits = raycaster.intersectObjects(artGroup!.children, true)
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object
        while (obj && !obj.userData.imageId) obj = obj.parent
        if (obj?.userData.imageId) {
          setSelectedWork(obj.userData.imageId)
          return
        }
      }
      setSelectedWork(null)
    }

    renderer.domElement.addEventListener('click', onClick)
    return () => renderer.domElement.removeEventListener('click', onClick)
  }, [setSelectedWork])

  // Drag selected artwork left/right
  useEffect(() => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    if (!renderer || !camera || !selectedWorkId) return

    let dragging = false
    let startX = 0
    let startPlacementX = 0

    const placement = placements.find((p) => p.imageId === selectedWorkId)

    function onDown(e: MouseEvent) {
      dragging = true
      startX = e.clientX
      startPlacementX = placement?.x ?? 0
    }
    function onMove(e: MouseEvent) {
      if (!dragging || !placement) return
      const dx = (e.clientX - startX) * 0.02
      updatePlacement(selectedWorkId!, { x: Math.max(0, startPlacementX + dx) })
    }
    function onUp() { dragging = false }

    renderer.domElement.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      renderer.domElement.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [selectedWorkId, placements, updatePlacement])

  function goToPreset(id: string) {
    const preset = CAMERA_PRESETS.find((p) => p.id === id)
    if (preset) controlsRef.current?.goTo(preset)
  }

  return (
    <div className={styles.wrapper}>
      <div ref={canvasRef} className={styles.canvas} />
      <div className={styles.presets}>
        {CAMERA_PRESETS.map((p) => (
          <button key={p.id} onClick={() => goToPreset(p.id)} className={styles.presetBtn}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
