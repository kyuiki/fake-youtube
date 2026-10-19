<script setup>
import Hls from 'hls.js'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'
import { lock, bindLock } from '../lock'

const props = defineProps({ src: String, poster: String, start: String })
const box = ref()
const v = ref()
const bar = ref()
const playing = ref(false)
const t = ref(0)
const dur = ref(0)
const buf = ref(0)
const active = ref(true)
const drag = ref(false)
const fs = ref(false)
let hls, idle, unbind

const fmt = s => {
  s = Math.floor(s || 0)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`
}
const pct = x => (dur.value ? (x / dur.value) * 100 : 0) + '%'
const show = computed(() => !playing.value || active.value || drag.value)

const toggle = () => {
  if (!v.value.paused) return v.value.pause()
  v.value.play()
  lock(box.value)
}
const full = () => (document.fullscreenElement ? document.exitFullscreen() : box.value.requestFullscreen())
const onFs = () => (fs.value = document.fullscreenElement === box.value)
const seek = e => {
  if (!dur.value) return
  const r = bar.value.getBoundingClientRect()
  const p = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
  v.value.currentTime = t.value = p * dur.value
}
const down = e => {
  drag.value = true
  bar.value.setPointerCapture(e.pointerId)
  seek(e)
}
const wake = () => {
  active.value = true
  clearTimeout(idle)
  idle = setTimeout(() => (active.value = false), 2500)
}
const onMeta = e => (e.target.currentTime = t.value = parseFloat(props.start) || 0)
const onBuf = () => {
  const b = v.value.buffered
  buf.value = b.length ? b.end(b.length - 1) : 0
}

onMounted(() => {
  unbind = bindLock(box.value)
  document.addEventListener('fullscreenchange', onFs)
  if (Hls.isSupported()) {
    hls = new Hls()
    hls.loadSource(props.src)
    hls.attachMedia(v.value)
  } else v.value.src = props.src
})
onBeforeUnmount(() => {
  hls?.destroy()
  clearTimeout(idle)
  unbind?.()
  document.removeEventListener('fullscreenchange', onFs)
})
</script>

<template>
  <div ref="box" class="relative aspect-video w-full overflow-hidden rounded-xl bg-black [&:fullscreen]:rounded-none" :class="{ 'cursor-none': !show }" @mousemove="wake" @mouseleave="active = false">
    <video
      ref="v"
      class="h-full w-full"
      :poster="poster"
      playsinline
      @click="toggle"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="t = $event.target.currentTime"
      @durationchange="dur = $event.target.duration"
      @progress="onBuf"
      @loadedmetadata="onMeta"
    />
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent transition-opacity duration-300" :class="show ? 'opacity-100' : 'opacity-0'" />
    <div class="absolute inset-x-0 bottom-0 px-3 transition-opacity duration-300" :class="show ? 'opacity-100' : 'opacity-0 pointer-events-none'">
      <div
        ref="bar"
        class="group/bar relative flex h-4 cursor-pointer touch-none items-end pb-1"
        @pointerdown="down"
        @pointermove="drag && seek($event)"
        @pointerup="drag = false"
      >
        <div class="relative h-[3px] w-full bg-white/20 transition-[height] group-hover/bar:h-[5px]">
          <div class="absolute inset-y-0 left-0 bg-white/40" :style="{ width: pct(buf) }" />
          <div class="absolute inset-y-0 left-0 bg-[#f00]" :style="{ width: pct(t) }" />
          <div class="absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-[#f00] transition-transform group-hover/bar:scale-100" :class="{ 'scale-100': drag }" :style="{ left: pct(t) }" />
        </div>
      </div>
      <div class="flex h-12 items-center justify-between text-white">
        <div class="flex items-center">
          <button class="grid size-12 place-items-center" @click="toggle"><Icon :n="playing ? 'pause' : 'play'" :s="32" /></button>
          <button class="grid size-12 place-items-center"><Icon n="next" :s="28" /></button>
          <button class="grid size-12 place-items-center"><Icon n="volume" :s="26" /></button>
          <span class="px-2 text-[13px] tabular-nums">{{ fmt(t) }} / {{ fmt(dur) }}</span>
        </div>
        <div class="flex items-center">
          <span class="mx-3 flex h-3.5 w-9 items-center rounded-full bg-white/30"><span class="grid size-5 place-items-center rounded-full bg-[#cdcdcd] text-black"><Icon n="pause" :s="12" /></span></span>
          <button class="grid size-12 place-items-center"><Icon n="cc" :s="26" /></button>
          <button class="grid size-12 place-items-center"><Icon n="settings" :s="26" /></button>
          <button class="grid size-12 place-items-center"><Icon n="mini" :s="24" /></button>
          <button class="grid size-12 place-items-center"><Icon n="theater" :s="28" /></button>
          <button class="grid size-12 place-items-center" @click="full"><Icon :n="fs ? 'unfull' : 'full'" :s="28" /></button>
        </div>
      </div>
    </div>
  </div>
</template>
