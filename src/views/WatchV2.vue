<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Masthead from '../components/Masthead.vue'
import Player, { host } from '../components/Player.vue'
import Icon from '../components/Icon.vue'
import { kvGet } from '../kv'

const props = defineProps({ id: String, preview: Boolean, open: Boolean })
// side panel opened from the rail; ?q=v3 lands with comments open
const panel = ref(props.open ? 'comments' : '')
const rail = [['desc', 'info', 'Description'], ['comments', 'comment', 'Comments']]
const d = ref(null)
const err = ref(false)
const cur = ref(null)
// builder preview: what's being edited, and the closest data-hl element found for it
const hl = ref('')
const sel = ref('')
// companion card: the ad being edited, else the one playing (or last played) in the player, else the first one
const side = computed(() => d.value?.ads?.[/^ads\.(\d+)/.exec(hl.value)?.[1]] ?? cur.value ?? d.value?.ads?.[0])
const pod = computed(() => d.value?.ads?.filter(a => a.video) ?? [])
const colors = ['#5c6bc0', '#ef6c00', '#00897b', '#8e24aa', '#c62828', '#3949ab', '#6d4c41', '#00838f']
const ib = 'grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20'
// youtube cuts the snippet at 3 lines with "...more" inline after the text
const snip = computed(() => d.value?.video.description?.split('\n').slice(0, 3).join('\n'))
const sk = 'rounded bg-white/10'

// our ads aren't youtube's, so only generic filters can catch them: cosmetic ones hide the bait, network/DNS ones block the script
const adblock = async () => {
  const b = Object.assign(document.createElement('div'), { className: 'adsbox ad-banner textads banner-ads pub_300x250' })
  b.style.cssText = 'position:absolute;left:-9999px;height:1px'
  document.body.append(b)
  const net = fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'HEAD', mode: 'no-cors' }).then(() => false, () => true)
  await new Promise(r => setTimeout(r, 500))
  const hidden = !b.offsetHeight
  b.remove()
  // a slow network shouldn't stall the page; count it as not blocked
  return hidden || Promise.race([net, new Promise(r => setTimeout(r, 1000, false))])
}

onMounted(async () => {
  // builder iframe: render the draft it keeps in localStorage, live
  if (props.preview) {
    const load = () => {
      try {
        d.value = JSON.parse(localStorage.getItem('draft'))
      } catch {}
      hl.value = localStorage.getItem('hl') || ''
    }
    load()
    addEventListener('storage', e => (e.key === 'draft' || e.key === 'hl') && load())
    return
  }
  try {
    if (!props.id) throw 0
    // ponytail: min 800ms so the skeleton is visible even when the JSON loads instantly
    const [res, blocked] = await Promise.all([kvGet(props.id), adblock(), new Promise(r => setTimeout(r, 800))])
    if (!res?.video?.author) throw 0
    // a blocker user expects no ads; showing ours would give the page away
    if (blocked && res.hideOnBlock !== false) res.ads = []
    document.title = res.video.title
    d.value = res
  } catch {
    err.value = true
  }
})

// same effect as the visitor pressing ctrl +/-, but chosen by the page
watch(() => d.value?.site?.zoom, z => (document.documentElement.style.zoom = z ? z / 100 : ''))

// d too: the edited element may only exist after the draft re-renders
watch(
  [hl, d],
  () => {
    const p = hl.value.split('.')
    let el
    while (p.length && !(el = document.querySelector(`[data-hl~="${p.join('.')}"]`))) p.pop()
    sel.value = p.join('.')
    if (!el) return
    // not scrollIntoView: inside the builder iframe it would scroll the parent page too
    const r = el.getBoundingClientRect()
    if (r.top < 56 || r.bottom > innerHeight) scrollTo({ top: scrollY + r.top - (innerHeight - r.height) / 2, behavior: 'smooth' })
  },
  { flush: 'post' },
)
</script>

<template>
  <component :is="'style'" v-if="sel">[data-hl~="{{ sel }}"] { outline: 2px solid #3ea6ff; outline-offset: 2px; position: relative; z-index: 60; box-shadow: var(--glow); animation: hl 0.7s ease-out 0.3s 2 }</component>
  <Masthead :site="d?.site ?? {}" />
  <div v-if="err" class="grid h-screen place-items-center text-lg">Video unavailable</div>
  <template v-else>
    <div class="v2 flex justify-center pt-14" :class="panel ? 'open pr-20' : 'pr-16'">
      <main class="ml-4 min-w-0 flex-[1_1_0] pr-4 pb-6" :class="{ 'max-w-[calc(var(--mp)+16px)]': panel }">
        <div class="mx-auto" :class="{ 'max-w-(--mp)': !panel }">
          <template v-if="!d">
            <div class="aspect-video w-full rounded-xl bg-white/10" />
            <div :class="sk" class="mt-3 h-7 w-3/5" />
            <div class="mt-2 flex items-center gap-3">
              <div class="size-10 rounded-full bg-white/10" />
              <div :class="sk" class="h-4 w-32" />
            </div>
          </template>
          <template v-else>
            <Player data-hl="video.src video.poster video.lock" :key="d.video.src" :src="d.video.src" :poster="d.video.poster" :start="$route.query.t" :force="d.video.lock !== false" :ads="pod" @ad="cur = $event" />
            <div class="mt-3 flex items-center justify-between">
              <h1 data-hl="video.title" class="line-clamp-1 min-w-0 text-xl leading-7 font-bold">{{ d.video.title }}</h1>
              <div class="mr-2 ml-6 shrink-0 text-sm leading-5 font-medium text-[#aaa]"><span data-hl="video.views">{{ d.video.views }}</span>&nbsp;&nbsp;<span data-hl="video.date">{{ d.video.date }}</span></div>
            </div>
            <div class="mt-2 flex h-[42px] items-start justify-between">
              <div class="mr-8 flex shrink-0 items-start">
                <img v-if="d.video.author.avatar" data-hl="video.author.avatar" :src="d.video.author.avatar" class="size-10 rounded-full object-cover" alt="" />
                <div v-else class="grid size-10 place-items-center rounded-full text-lg font-medium" :style="{ background: colors[0] }">{{ d.video.author.name[0] }}</div>
                <div class="mt-px mr-6 ml-3">
                  <div data-hl="video.author.name video.author.verified" class="flex items-center gap-1 text-base leading-[22px] font-medium">
                    {{ d.video.author.name }}<Icon v-if="d.video.author.verified" n="check" :s="14" class="text-[#aaa]" />
                  </div>
                  <div data-hl="video.author.subs" class="mr-1 text-xs leading-[18px] text-[#aaa]">{{ d.video.author.subs }}</div>
                </div>
                <button class="mt-px h-10 rounded-full bg-[#f1f1f1] px-4 text-sm font-medium text-[#0f0f0f] hover:bg-[#d9d9d9]">Subscribe</button>
              </div>
              <div class="mt-[3px] flex items-center gap-2">
                <div class="flex h-10 items-center rounded-full bg-white/10 text-sm font-medium">
                  <button data-hl="video.likes" class="flex h-full items-center gap-1.5 rounded-l-full px-4 hover:bg-white/10"><Icon n="like" />{{ d.video.likes }}</button>
                  <span class="h-6 w-px bg-white/20" />
                  <button class="flex h-full items-center rounded-r-full px-4 hover:bg-white/10"><Icon n="dislike" /></button>
                </div>
                <button v-for="n in ['share', 'download', 'save', 'horiz']" :key="n" :class="ib"><Icon :n="n" /></button>
              </div>
            </div>
          </template>
        </div>

        <div v-if="d" class="mt-3 grid gap-x-4 gap-y-6" :class="panel ? 'grid-cols-[repeat(auto-fill,minmax(max(300px,calc((100%-32px)/3)),1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(max(300px,calc((100%-48px)/4)),1fr))]'">
          <RouterLink v-for="(r, i) in d.recommendations" :key="i" :data-hl="`recommendations.${i}`" :to="r.id ? `/watch?v=${r.id}&q=${$route.query.q}` : $route.fullPath" class="group">
            <div class="relative aspect-video overflow-hidden rounded-xl bg-white/10">
              <img :src="r.thumbnail" class="h-full w-full object-cover" alt="" loading="lazy" />
              <span class="absolute right-2 bottom-2 rounded bg-black/60 px-1 py-px text-xs leading-[18px] font-medium">{{ r.duration }}</span>
            </div>
            <h3 class="mt-2 line-clamp-2 text-sm leading-5 font-medium">{{ r.title }}</h3>
            <div class="mt-0.5 flex items-center gap-1 text-xs leading-[18px] text-[#aaa]">
              {{ r.channel }}<Icon v-if="r.badge === 'music'" n="music" :s="14" /><Icon v-else-if="r.badge === 'verified'" n="check" :s="14" /><span class="ml-1">{{ r.views }}</span><span class="ml-1">{{ r.ago }}</span>
            </div>
          </RouterLink>
        </div>
      </main>

      <aside v-if="panel && d" class="sticky top-14 mb-4 flex h-[calc(100vh-72px)] w-(--sb) shrink-0 flex-col self-start overflow-hidden rounded-xl border border-white/20 bg-[#212121]">
        <div class="flex h-14 shrink-0 items-center gap-2 pr-1 pl-4">
          <h2 v-if="panel === 'comments'" data-hl="video.commentCount" class="flex-1 text-xl leading-7 font-bold">Comments<span class="ml-2 text-base leading-[22px] font-normal text-[#aaa]">{{ d.video.commentCount }}</span></h2>
          <h2 v-else class="flex-1 text-xl leading-7 font-bold">Description</h2>
          <button v-if="panel === 'comments'" class="grid size-10 place-items-center rounded-full hover:bg-white/10"><Icon n="sort" /></button>
          <button class="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close" @click="panel = ''"><Icon n="close" /></button>
        </div>
        <div v-if="panel === 'desc'" class="flex-1 overflow-y-auto px-4 pt-4 text-sm leading-5">
          <div class="font-medium"><span data-hl="video.views">{{ d.video.views }}</span>&nbsp;&nbsp;<span data-hl="video.date">{{ d.video.date }}</span>&nbsp;&nbsp;<span data-hl="video.tags" class="text-[#aaa]">{{ d.video.tags }}</span></div>
          <p data-hl="video.description" class="mt-3 whitespace-pre-line">{{ d.video.description }}</p>
        </div>
        <template v-else>
          <div class="flex-1 overflow-y-auto px-4 pt-4 [scrollbar-width:none]">
            <div v-for="(c, i) in d.comments" :key="i" :data-hl="`comments.${i}`" class="group relative mb-4 flex gap-3">
              <span v-if="c.replies" class="absolute top-8 bottom-5 left-[11px] w-3 rounded-bl-xl border-b border-l border-white/20" />
              <img v-if="c.avatar" :src="c.avatar" class="size-6 shrink-0 rounded-full object-cover" alt="" />
              <div v-else class="grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium uppercase" :style="{ background: colors[(i + 1) % colors.length] }">{{ c.user[0] }}</div>
              <div class="min-w-0 flex-1">
                <div class="text-xs leading-5 font-medium">@{{ c.user }}<span class="ml-1 font-normal text-[#aaa]">{{ c.ago }}</span></div>
                <p class="mt-0.5 text-sm leading-5 whitespace-pre-line">{{ c.text }}</p>
                <div class="mt-1 -ml-2 flex items-center text-xs text-[#aaa]">
                  <button class="grid size-8 place-items-center rounded-full text-[#f1f1f1] hover:bg-white/10"><Icon n="like" :s="20" /></button>
                  <span class="mr-2 leading-[18px]">{{ c.likes }}</span>
                  <button class="grid size-8 place-items-center rounded-full text-[#f1f1f1] hover:bg-white/10"><Icon n="dislike" :s="20" /></button>
                  <button class="ml-2 h-8 rounded-full px-3 font-medium text-[#f1f1f1] hover:bg-white/10">Reply</button>
                </div>
                <button v-if="c.replies" class="mt-3 -ml-4 flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium hover:bg-white/10">
                  {{ c.replies }} {{ c.replies == 1 ? 'reply' : 'replies' }}<Icon n="down" />
                </button>
              </div>
              <Icon n="vert" class="shrink-0 opacity-0 group-hover:opacity-100" />
            </div>
          </div>
          <div class="flex shrink-0 items-start gap-3 border-t border-white/10 p-4">
            <img v-if="d.site.signedIn && d.site.avatar" :src="d.site.avatar" class="size-6 shrink-0 rounded-full object-cover" alt="" />
            <Icon v-else n="account" class="shrink-0 text-[#aaa]" />
            <div class="flex-1 border-b border-white/20 pb-1 text-sm leading-5 text-[#aaa]">Add a comment...</div>
          </div>
        </template>
      </aside>
    </div>

    <nav class="fixed top-14 right-4 z-40 w-12">
      <button v-for="[k, n, l] in rail" :key="k" class="mb-4 flex w-12 flex-col items-center" @click="panel = panel === k ? '' : k">
        <span class="grid size-12 place-items-center rounded-lg" :class="panel === k ? 'bg-white/10' : 'hover:bg-white/10'"><Icon :n="n" /></span>
        <span class="text-[10px] leading-4 whitespace-nowrap">{{ l }}</span>
      </button>
    </nav>
  </template>
</template>
