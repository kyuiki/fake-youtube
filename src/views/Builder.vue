<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import sample from '../sample.json'
import { kvGet, kvSave } from '../kv'
import Fields from '../components/Fields.vue'
import { host } from '../components/Player.vue'
import Icon from '../components/Icon.vue'
import grab from '../grab.js?raw'

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
  video: [['src', 'Video URL (.m3u8 / .mp4 / .webm)', 0, 1], ['title', 'Title', 0, 1], ['views', 'Views'], ['date', 'Date'], ['likes', 'Likes'], ['commentCount', 'Comment count'], ['description', 'Description', 0, 1, 'area'], ['poster', 'Poster URL', 1, 1, 'img'], ['tags', 'Tags', 1, 1]],
  author: [['name', 'Name'], ['subs', 'Subscribers'], ['avatar', 'Avatar URL', 1, 1, 'img']],
  site: [['name', 'Site name', 0, 1], ['logo', 'Logo URL', 1, 1, 'img']],
  user: [['avatar', 'Avatar URL', 1, 1, 'img'], ['notifs', 'Notification count', 1]],
  rec: [['title', 'Title', 0, 1], ['channel', 'Channel'], ['duration', 'Duration'], ['views', 'Views'], ['ago', 'Uploaded'], ['badge', 'Channel badge', 1, 0, ['verified', 'music']], ['thumbnail', 'Thumbnail URL', 0, 1, 'img'], ['id', 'Links to page id', 1, 1]],
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

const bm = `javascript:${encodeURIComponent(grab)}`
const saved1 = ref(false)
const saveBm = async () => {
  await navigator.clipboard.writeText(bm)
  saved1.value = true
}
const paste = () =>
  run('Pasting…', async () => {
    const r = JSON.parse(await navigator.clipboard.readText())
    // feed grab: an array of videos; watch-page grab: the video itself plus its comments and up next
    if (Array.isArray(r)) return void (d.value.recommendations = r)
    if (!r?.video) throw Error('Clipboard has no grabbed videos')
    const v = d.value.video
    Object.assign(v, r.video, { author: { ...v.author, ...r.video.author } })
    if (r.comments?.length) d.value.comments = r.comments
    if (r.recommendations?.length) d.value.recommendations = r.recommendations
  })

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

// youtube layout the page renders in; travels as ?q= on the link and the preview
const layouts = [['', 'Classic'], ['v2', 'New'], ['v3', 'New + comments']]
const q = computed(() => (d.value.layout ? `q=${d.value.layout}` : ''))
const link = computed(() => cur.value && `${location.origin}/watch?v=${cur.value.key}${q.value && '&' + q.value}`)
const copy = async () => {
  await navigator.clipboard.writeText(link.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

document.title = 'Rektoomtube'
// /preview (iframe or another tab) re-renders from this on every change
watch(d, v => localStorage.setItem('draft', JSON.stringify(v)), { deep: true, immediate: true })
// field being edited (or open list item); preview outlines the matching element
const focus = ref('')
const hl = computed(() => {
  const i = list.value?.indexOf(ex.value)
  return focus.value || (i >= 0 ? `${L[tab.value].key}.${i}` : '')
})
watch(hl, v => localStorage.setItem('hl', v), { immediate: true })
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
  <div class="lg:flex lg:h-dvh lg:flex-col">
    <div class="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(400px,520px)_1fr]">
      <div class="lg:overflow-y-auto">
        <div class="mx-auto max-w-xl">
          <header class="sticky top-0 z-10 bg-[#0f0f0f] px-4 pt-3">
            <div class="flex items-center gap-1.5">
              <h1 class="mr-auto shrink-0 text-base font-bold">Rektoomtube</h1>
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
              <a :class="ico" :href="`/preview${q && '?' + q}`" target="_blank" title="Open preview" aria-label="Open preview"><Icon n="open" :s="18" /></a>
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

          <main class="px-4 py-4" @focusin="focus = $event.target.closest('[data-hl]')?.dataset.hl ?? ''" @focusout="$event.currentTarget.contains($event.relatedTarget) || (focus = '')">
            <template v-if="tab === 'video'">
              <div class="mb-4 flex items-center gap-3 rounded-lg border border-white/10 p-3 text-sm">
                <p class="flex-1 text-xs text-[#aaa]">Copy a real video: open it on YouTube, click your <b class="font-medium text-[#f1f1f1]">Grab from YouTube</b> bookmark (set up in <button type="button" class="text-[#3ea6ff] hover:underline" @click="tab = 'recs'">Up next</button>), then paste. Fills the title, stats, description, channel, comments and Up next. Your video URL stays.</p>
                <button :class="btn" class="shrink-0" @click="paste">Paste grabbed</button>
              </div>
              <Fields :o="d.video" :f="F.video" p="video" />
              <label data-hl="video.lock" class="mt-3 flex items-center gap-2 text-sm">
                <input :checked="d.video.lock !== false" type="checkbox" class="size-3.5 accent-[#3ea6ff]" @change="d.video.lock = $event.target.checked" />
                Force fullscreen on play
                <span class="text-xs text-[#aaa]">(locks the mouse, Esc exits)</span>
              </label>
              <div class="mt-5 mb-2.5 flex items-center justify-between border-t border-white/10 pt-4">
                <h2 class="text-sm font-bold">Channel</h2>
                <label data-hl="video.author.verified" class="flex items-center gap-2 text-xs text-[#aaa]"><input v-model="d.video.author.verified" type="checkbox" class="size-3.5 accent-[#3ea6ff]" />Verified</label>
              </div>
              <Fields :o="d.video.author" :f="F.author" p="video.author" />
            </template>

            <template v-else-if="tab === 'site'">
              <div class="mb-3">
                <span class="mb-1 block text-xs text-[#aaa]">Layout</span>
                <div class="flex rounded-md border border-[#303030] bg-[#121212] p-0.5 text-sm">
                  <button v-for="[v, l] in layouts" :key="v" type="button" class="h-7 flex-1 rounded px-2" :class="(d.layout || '') === v ? 'bg-white/15 font-medium' : 'text-[#aaa] hover:text-white'" @click="d.layout = v">{{ l }}</button>
                </div>
              </div>
              <Fields :o="d.site" :f="F.site" p="site" />
              <label data-hl="site.zoom" class="mt-2.5 block">
                <span class="mb-1 flex h-4 items-center justify-between text-xs text-[#aaa]">
                  Page zoom
                  <button v-if="d.site.zoom" type="button" class="hover:text-white" @click.prevent="d.site.zoom = ''">{{ d.site.zoom }}% · Reset</button>
                  <span v-else>100%</span>
                </span>
                <input :value="d.site.zoom || 100" type="range" min="50" max="200" step="5" class="w-full accent-[#3ea6ff]" @input="d.site.zoom = +$event.target.value === 100 ? '' : +$event.target.value" />
              </label>
              <label data-hl="site.signedIn" class="mt-3 flex items-center gap-2 text-sm">
                <input v-model="d.site.signedIn" type="checkbox" class="size-3.5 accent-[#3ea6ff]" />
                Signed in
                <span class="text-xs text-[#aaa]">(replaces the Sign in button)</span>
              </label>
              <Fields v-if="d.site.signedIn" :o="d.site" :f="F.user" p="site" class="mt-2.5" />
              <label data-hl="chips" class="mt-2.5 block">
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
              <details v-if="tab === 'recs'" open class="mb-3 rounded-lg border border-white/10 text-sm">
                <summary class="flex h-10 cursor-pointer items-center gap-2 px-3 font-medium select-none">Import your YouTube feed</summary>
                <ol class="space-y-4 px-3 pt-1 pb-3">
                  <li class="flex gap-3">
                    <b class="grid size-6 shrink-0 place-items-center rounded-full bg-[#3ea6ff] text-xs text-[#0f0f0f]">1</b>
                    <div class="min-w-0 flex-1 space-y-2">
                      <p>Drag this button onto your bookmarks bar.</p>
                      <a :href="bm" :class="btn" class="inline-flex cursor-grab items-center ring-2 ring-[#3ea6ff]/60" @click.prevent="saveBm">Grab from YouTube</a>
                      <p v-if="saved1" role="status" class="rounded-md bg-[#3ea6ff]/10 px-2.5 py-2 text-xs text-[#f1f1f1]">
                        Copied! Press <kbd class="rounded bg-white/10 px-1 font-sans">Ctrl+D</kbd> to bookmark this page, then edit that bookmark: name it "Grab from YouTube" and paste the copied text as its URL.
                      </p>
                      <p class="text-xs text-[#aaa]">
                        Bookmarks bar hidden? Press <kbd class="rounded bg-white/10 px-1 font-sans">Ctrl+Shift+B</kbd> (<kbd class="rounded bg-white/10 px-1 font-sans">⌘⇧B</kbd> on Mac) to show it. Can't drag? Right-click the button and choose Bookmark link (Firefox), or Copy link address and add it as a new bookmark's URL (Chrome).
                      </p>
                      <div class="flex h-7 items-center gap-1.5 rounded bg-white/5 px-2" aria-hidden="true">
                        <i class="h-3 w-12 rounded-sm bg-white/15" /><i class="h-3 w-16 rounded-sm bg-white/15" /><i class="h-3 w-10 rounded-sm bg-white/15" />
                        <span class="flex h-4 animate-pulse items-center rounded-sm border border-dashed border-[#3ea6ff] px-1.5 text-[10px] text-[#3ea6ff]">Grab from YouTube</span>
                      </div>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <b class="grid size-6 shrink-0 place-items-center rounded-full bg-[#3ea6ff] text-xs text-[#0f0f0f]">2</b>
                    <div class="min-w-0 flex-1 space-y-2">
                      <p>Open youtube.com and click the bookmark. It copies the videos on screen. On a video page it copies that video too.</p>
                      <div class="overflow-hidden rounded border border-white/10" aria-hidden="true">
                        <div class="flex h-6 items-center gap-1.5 bg-white/5 px-2">
                          <span class="rounded-sm bg-[#3ea6ff]/25 px-1.5 text-[10px] text-[#3ea6ff] ring-1 ring-[#3ea6ff]">Grab from YouTube</span>
                          <span class="ml-auto text-[10px] text-[#aaa]">Copied 24 videos</span>
                        </div>
                        <div class="grid grid-cols-4 gap-1.5 p-2">
                          <i v-for="n in 8" :key="n" class="aspect-video rounded-sm bg-white/10" />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <b class="grid size-6 shrink-0 place-items-center rounded-full bg-[#3ea6ff] text-xs text-[#0f0f0f]">3</b>
                    <div class="min-w-0 flex-1 space-y-2">
                      <p>Come back here and paste. They replace the list below.</p>
                      <button :class="btn" @click="paste">Paste grabbed</button>
                    </div>
                  </li>
                </ol>
              </details>
              <label v-if="tab === 'ads'" class="mb-2 flex items-center gap-2 text-sm">
                <input :checked="d.hideOnBlock !== false" type="checkbox" class="size-3.5 accent-[#3ea6ff]" @change="d.hideOnBlock = $event.target.checked" />
                Skip ads if an ad blocker is detected
              </label>
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
                <Fields v-if="ex === o" :o="o" :f="L[tab].f" :p="`${L[tab].key}.${i}`" class="px-2 pt-1 pb-3" />
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
        <iframe :src="`/preview${q && '?' + q}`" title="Preview" allow="fullscreen" class="origin-top-left border-0" :style="{ width: `${w / scale}px`, height: `${100 / scale}vh`, transform: `scale(${scale})` }" />
      </div>
    </div>
    <footer role="note" class="sticky bottom-0 flex items-center justify-center gap-2 bg-[#ffd54f] px-4 py-1.5 text-center text-xs font-medium text-black">
      <Icon n="info" :s="16" class="shrink-0" />
      Rektoomtube is a prank page builder. It is NOT YouTube and not affiliated with Google. Do not use it for phishing.
    </footer>
  </div>
</template>
