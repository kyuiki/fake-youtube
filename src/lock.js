import { reactive } from 'vue'

// Game-style input for the player: pointer lock, held keys (by e.code, e.g. 'KeyW', 'Space'), mouse deltas.
// A game loop reads `input` each frame and zeroes dx/dy after using them.
// Play also goes fullscreen. Esc always releases both (browser rule); pressing play again re-grabs them.
export const input = reactive({ locked: false, keys: new Set(), dx: 0, dy: 0 })

const grab = el => el.requestPointerLock?.()?.catch?.(() => {})

// Lock first (fullscreen can use up the click's user activation), then re-lock once fullscreen settles.
export const lock = el => {
  grab(el)
  el.requestFullscreen?.().then(
    () => document.pointerLockElement !== el && grab(el),
    () => {},
  )
}

export function bindLock(el) {
  const change = () => {
    input.locked = document.pointerLockElement === el
    if (!input.locked) input.keys.clear()
  }
  const key = e => {
    if (!input.locked) return
    e.preventDefault()
    if (e.type === 'keydown') input.keys.add(e.code)
    else input.keys.delete(e.code)
  }
  const move = e => {
    if (!input.locked) return
    input.dx += e.movementX
    input.dy += e.movementY
  }
  document.addEventListener('pointerlockchange', change)
  addEventListener('keydown', key)
  addEventListener('keyup', key)
  addEventListener('mousemove', move)
  return () => {
    document.removeEventListener('pointerlockchange', change)
    removeEventListener('keydown', key)
    removeEventListener('keyup', key)
    removeEventListener('mousemove', move)
    if (input.locked) document.exitPointerLock()
  }
}
