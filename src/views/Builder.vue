<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import sample from '../sample.json'
import { kvGet, kvSave } from '../kv'
import Fields from '../components/Fields.vue'
import { host } from '../components/Player.vue'
import Icon from '../components/Icon.vue'

const clone = o => JSON.parse(JSON.stringify(o))
// pages saved before ads existed
const norm = v => ((v.ads ??= []), v)
const d = ref(clone(sample))
const cur = ref(null)
const status = ref('')
const bad = ref(false)
const raw = ref('')
const tab = ref('video')
const ex = ref(null)
const chip = ref('')
const copied = ref(false)
let saved = []
try {
  saved = JSON.parse(localStorage.getItem('mine') || '[]')
} catch {}
const mine = ref(saved)

// [key, label, optional, wide, type]
const F = {
  video: [['src', 'Video URL (.m3u8)', 0, 1], ['title', 'Title', 0, 1], ['views', 'Views'], ['date', 'Date'], ['likes', 'Likes'], ['commentCount', 'Comment count'], ['description', 'Description', 0, 1, 'area'], ['poster', 'Poster URL', 1, 1, 'img'], ['tags', 'Tags', 1, 1]],
  author: [['name', 'Name'], ['subs', 'Subscribers'], ['avatar', 'Avatar URL', 1, 1, 'img']],
  site: [['name', 'Site name', 0, 1], ['logo', 'Logo URL', 1, 1, 'img']],
  rec: [['title', 'Title', 0, 1], ['channel', 'Channel'], ['duration', 'Duration'], ['views', 'Views'], ['ago', 'Uploaded'], ['thumbnail', 'Thumbnail URL', 0, 1, 'img'], ['id', 'Links to page id', 1, 1]],
  comment: [['user', 'Handle'], ['ago', 'Posted'], ['likes', 'Likes'], ['replies', 'Replies', 1], ['text', 'Text', 0, 1, 'area'], ['avatar', 'Avatar URL', 1, 1, 'img']],
  ad: [['title', 'Headline', 0, 1], ['url', 'Link URL'], ['cta', 'Button text'], ['avatar', 'Logo URL', 0, 1, 'img'], ['video', 'Video URL (.m3u8 / .mp4), empty = sidebar only', 0, 1], ['banner', 'Sidebar banner URL (5:1)', 1, 1, 'img'], ['skip', 'Skippable after (s)', 1], ['domain', 'Display URL', 1]],
}
// list tabs: row() -> [image, title, subtitle, fallback letter]
const L = {
  recs: { key: 'recommendations', f: F.rec, add: 'Add video', row: r => [r.thumbnail, r.title || 'Untitled', [r.channel, r.duration].filter(Boolean).join(' · ')] },
  ads: { key: 'ads', f: F.ad, add: 'Add ad', row: a => [a.banner || a.avatar, a.title || 'Untitled ad', [a.domain || host(a.url), a.video ? 'Video + sidebar' : 'Sidebar only'].filter(Boolean).join(' · ')] },
  comments: { key: 'comments', f: F.comment, add: 'Add comment', round: 1, row: c => [c.avatar, c.user ? `@${c.user}` : 'No handle', c.text, c.user?.[0]] },
}
const tabs = computed(() => [
  ['video', 'Video'],
  ['recs', 'Up next', d.value.recommendations.length],
  ['comments', 'Comments', d.value.comments.length],
  ['ads', 'Ads', d.value.ads.length],
  ['site', 'Site'],
  ['json', 'JSON'],
])
const blank = f => Object.fromEntries(f.map(([k]) => [k, '']))
const list = computed(() => L[tab.value] && d.value[L[tab.value].key])
const rows = computed(() => list.value?.map(o => [o, ...L[tab.value].row(o)]))
const addItem = () => {
  list.value.push(blank(L[tab.value].f))
  ex.value = list.value.at(-1)
}
const dup = i => {
  list.value.splice(i + 1, 0, clone(list.value[i]))
  ex.value = list.value[i + 1]
}

const addChip = () => {
  const v = chip.value.trim()
  if (v && !d.value.chips.includes(v)) d.value.chips.push(v)
  chip.value = ''
}
const chipKey = e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addChip()
  } else if (e.key === 'Backspace' && !chip.value) d.value.chips.pop()
}

const link = computed(() => cur.value && `${location.origin}/watch?v=${cur.value.key}`)
const copy = async () => {
  await navigator.clipboard.writeText(link.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

document.title = 'Watch page builder'
// /preview (iframe or another tab) re-renders from this on every change
watch(d, v => localStorage.setItem('draft', JSON.stringify(v)), { deep: true, immediate: true })
watch(tab, t => t === 'json' && (raw.value = JSON.stringify(d.value, null, 2)))

// render the preview at desktop width, scaled down to fit the pane
const pane = ref()
const w = ref(1280)
const scale = computed(() => Math.min(1, w.value / 1280))
let ro
onMounted(() => {
  ro = new ResizeObserver(([e]) => (w.value = e.contentRect.width))
  ro.observe(pane.value)
})
onBeforeUnmount(() => ro.disconnect())

const run = async (msg, fn) => {
  status.value = msg
  bad.value = false
  try {
    await fn()
    status.value = ''
  } catch (e) {
    status.value = e.message
    bad.value = true
  }
}
const save = () =>
  run('Saving…', async () => {
    cur.value = await kvSave(d.value, cur.value)
    mine.value = [{ ...cur.value, title: d.value.video.title }, ...mine.value.filter(m => m.key !== cur.value.key)]
    localStorage.setItem('mine', JSON.stringify(mine.value))
  })
const edit = key =>
  run('Loading…', async () => {
    d.value = norm(await kvGet(key))
    cur.value = mine.value.find(m => m.key === key)
  })
const fresh = () => {
  d.value = clone(sample)
  cur.value = null
  status.value = ''
}
const applyRaw = () =>
  run('', async () => {
    d.value = norm(JSON.parse(raw.value))
  })

const ico = 'grid size-9 shrink-0 place-items-center rounded-full text-[#aaa] hover:bg-white/10 hover:text-white active:scale-[0.96]'
const btn = 'h-9 rounded-full bg-white/10 px-4 text-sm font-medium hover:bg-white/20 active:scale-[0.98]'
const btnP = 'h-9 rounded-full bg-[#3ea6ff] px-4 text-sm font-medium text-[#0f0f0f] hover:bg-[#65b8ff] active:scale-[0.98]'
</script>

<template>
  <div class="lg:grid lg:h-dvh lg:grid-cols-[minmax(400px,520px)_1fr]">
    <div class="lg:overflow-y-auto">
      <div class="mx-auto max-w-xl">
        <header class="sticky top-0 z-10 bg-[#0f0f0f] px-4 pt-3">
          <div class="flex items-center gap-1.5">
            <h1 class="mr-auto shrink-0 text-base font-bold">Builder</h1>
            <span class="min-w-0 truncate text-xs" :class="bad ? 'text-[#ff8a80]' : 'text-[#aaa]'">{{ status }}</span>
            <select
              v-if="mine.length"
              :value="cur?.key ?? ''"
              aria-label="Saved pages"
              class="h-9 max-w-40 min-w-0 truncate rounded-full bg-white/10 pr-2 pl-3 text-sm outline-none hover:bg-white/20"
              @change="edit($event.target.value)"
            >
              <option value="" disabled>Saved pages</option>
              <option v-for="m in mine" :key="m.key" :value="m.key">{{ m.title || m.key }}</option>
            </select>
            <button :class="ico" title="New page" aria-label="New page" @click="fresh"><Icon n="add" :s="20" /></button>
            <a :class="ico" href="/preview" target="_blank" title="Open preview" aria-label="Open preview"><Icon n="open" :s="18" /></a>
            <button :class="btnP" @click="save">{{ cur ? 'Save' : 'Create' }}</button>
          </div>

          <div v-if="link" class="mt-2 flex h-8 items-center gap-1 rounded-md bg-white/5 pl-2.5 text-xs">
            <a :href="link" target="_blank" class="min-w-0 flex-1 truncate text-[#3ea6ff]">{{ link }}</a>
            <span v-if="copied" class="text-[#aaa]">Copied</span>
            <button :class="ico" class="size-8" title="Copy link" aria-label="Copy link" @click="copy"><Icon n="copy" :s="16" /></button>
          </div>

          <nav class="mt-2 flex overflow-x-auto scrollbar-none border-b border-white/10" role="tablist">
            <button
              v-for="[k, l, n] in tabs"
              :key="k"
              role="tab"
              :aria-selected="tab === k"
              class="-mb-px h-10 shrink-0 border-b-2 px-3 text-sm font-medium"
              :class="tab === k ? 'border-[#f1f1f1] text-[#f1f1f1]' : 'border-transparent text-[#aaa] hover:text-[#f1f1f1]'"
              @click="tab = k"
            >
              {{ l }}<span v-if="n != null" class="ml-1.5 text-xs text-[#aaa]">{{ n }}</span>
            </button>
          </nav>
        </header>

        <main class="px-4 py-4">
          <template v-if="tab === 'video'">
            <Fields :o="d.video" :f="F.video" />
            <label class="mt-3 flex items-center gap-2 text-sm">
              <input :checked="d.video.lock !== false" type="checkbox" class="size-3.5 accent-[#3ea6ff]" @change="d.video.lock = $event.target.checked" />
              Force fullscreen on play
              <span class="text-xs text-[#aaa]">(locks the mouse, Esc exits)</span>
            </label>
            <div class="mt-5 mb-2.5 flex items-center justify-between border-t border-white/10 pt-4">
              <h2 class="text-sm font-bold">Channel</h2>
              <label class="flex items-center gap-2 text-xs text-[#aaa]"><input v-model="d.video.author.verified" type="checkbox" class="size-3.5 accent-[#3ea6ff]" />Verified</label>
            </div>
            <Fields :o="d.video.author" :f="F.author" />
          </template>

          <template v-else-if="tab === 'site'">
            <Fields :o="d.site" :f="F.site" />
            <label class="mt-2.5 block">
              <span class="mb-1 block text-xs text-[#aaa]">Chips</span>
              <span class="flex flex-wrap gap-1.5 rounded-md border border-[#303030] bg-[#121212] p-1 focus-within:border-[#3ea6ff]">
                <span v-for="(c, i) in d.chips" :key="c" class="flex h-7 items-center gap-0.5 rounded bg-white/10 pr-1 pl-2.5 text-sm">
                  {{ c }}
                  <button type="button" class="rounded text-[#aaa] hover:text-white" :aria-label="`Remove ${c}`" @click.prevent="d.chips.splice(i, 1)"><Icon n="close" :s="14" /></button>
                </span>
                <input v-model="chip" class="h-7 min-w-24 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-[#888]" placeholder="Type, then Enter" @keydown="chipKey" @blur="addChip" />
              </span>
            </label>
          </template>

          <template v-else-if="tab === 'json'">
            <textarea v-model="raw" rows="24" spellcheck="false" class="block w-full resize-y rounded-md border border-[#303030] bg-[#121212] p-2.5 font-mono text-xs outline-none focus:border-[#3ea6ff]" />
            <button :class="btn" class="mt-2" @click="applyRaw">Apply</button>
          </template>

          <div v-else class="space-y-1">
            <p v-if="!rows.length" class="py-6 text-center text-sm text-[#aaa]">Nothing here yet.</p>
            <div v-for="([o, img, title, sub, ch], i) in rows" :key="o" class="group rounded-lg" :class="ex === o ? 'bg-white/5' : 'hover:bg-white/5'">
              <div class="flex items-center pr-1">
                <button class="flex min-w-0 flex-1 items-center gap-3 p-2 text-left" :aria-expanded="ex === o" @click="ex = ex === o ? null : o">
                  <img v-if="img" :src="img" alt="" class="shrink-0 bg-white/10 object-cover" :class="L[tab].round ? 'size-8 rounded-full' : 'h-9 w-16 rounded'" />
                  <span v-else class="grid shrink-0 place-items-center bg-white/10 text-sm font-medium uppercase" :class="L[tab].round ? 'size-8 rounded-full' : 'h-9 w-16 rounded'">{{ ch }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm">{{ title }}</span>
                    <span class="block truncate text-xs text-[#aaa]">{{ sub }}</span>
                  </span>
                  <Icon n="down" :s="20" class="shrink-0 text-[#aaa] transition-transform" :class="{ 'rotate-180': ex === o }" />
                </button>
                <span class="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100" :class="{ 'opacity-100': ex === o }">
                  <button :class="ico" class="size-8" title="Duplicate" aria-label="Duplicate" @click="dup(i)"><Icon n="copy" :s="16" /></button>
                  <button :class="ico" class="size-8 hover:text-[#ff8a80]" title="Remove" aria-label="Remove" @click="list.splice(i, 1)"><Icon n="delete" :s="18" /></button>
                </span>
              </div>
              <Fields v-if="ex === o" :o="o" :f="L[tab].f" class="px-2 pt-1 pb-3" />
            </div>
            <button
              class="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 text-sm text-[#aaa] hover:border-white/30 hover:text-white active:scale-[0.99]"
              @click="addItem"
            >
              <Icon n="add" :s="18" />{{ L[tab].add }}
            </button>
          </div>
        </main>
      </div>
    </div>

    <div ref="pane" class="overflow-hidden border-l border-white/10 max-lg:hidden">
      <iframe src="/preview" title="Preview" allow="fullscreen" class="origin-top-left border-0" :style="{ width: `${w / scale}px`, height: `${100 / scale}vh`, transform: `scale(${scale})` }" />
    </div>
  </div>
</template>
