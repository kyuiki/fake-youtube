<script setup>
import { ref, onMounted } from 'vue'
import Masthead from '../components/Masthead.vue'
import Player from '../components/Player.vue'
import Icon from '../components/Icon.vue'
import { kvGet } from '../kv'

const props = defineProps({ id: String, preview: Boolean })
const d = ref(null)
const err = ref(false)
const colors = ['#5c6bc0', '#ef6c00', '#00897b', '#8e24aa', '#c62828', '#3949ab', '#6d4c41', '#00838f']
const pill = 'flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-medium hover:bg-white/20'
const sk = 'rounded bg-white/10'

onMounted(async () => {
  // builder iframe: render the draft it keeps in localStorage, live
  if (props.preview) {
    const load = () => {
      try {
        d.value = JSON.parse(localStorage.getItem('draft'))
      } catch {}
    }
    load()
    addEventListener('storage', e => e.key === 'draft' && load())
    return
  }
  try {
    if (!props.id) throw 0
    // ponytail: min 800ms so the skeleton is visible even when the JSON loads instantly
    const [res] = await Promise.all([kvGet(props.id), new Promise(r => setTimeout(r, 800))])
    if (!res?.video?.author) throw 0
    document.title = res.video.title
    d.value = res
  } catch {
    err.value = true
  }
})
</script>

<template>
  <Masthead :site="d?.site ?? {}" />
  <div v-if="err" class="grid h-screen place-items-center text-lg">Video unavailable</div>
  <div v-else class="flex justify-center gap-6 px-6 pt-20 max-[1016px]:flex-col">
    <main class="min-w-0 flex-1 pb-6" style="max-width: max(640px, calc((100vh - 216px) * 16 / 9))">
      <template v-if="!d">
        <div class="aspect-video w-full rounded-xl bg-white/10" />
        <div :class="sk" class="mt-3 h-6 w-full" />
        <div :class="sk" class="mt-2 h-6 w-2/5" />
        <div class="mt-4 flex items-center gap-3">
          <div class="size-10 rounded-full bg-white/10" />
          <div class="flex-1">
            <div :class="sk" class="h-4 w-32" />
            <div :class="sk" class="mt-2 h-3 w-20" />
          </div>
          <div class="h-9 w-36 rounded-full bg-white/10" />
          <div class="h-9 w-24 rounded-full bg-white/10" />
        </div>
      </template>

      <template v-else>
        <Player :key="d.video.src" :src="d.video.src" :poster="d.video.poster" />
        <h1 class="mt-3 line-clamp-2 text-xl font-bold leading-7">{{ d.video.title }}</h1>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center">
            <img v-if="d.video.author.avatar" :src="d.video.author.avatar" class="size-10 rounded-full object-cover" alt="" />
            <div v-else class="grid size-10 place-items-center rounded-full text-lg font-medium" :style="{ background: colors[0] }">{{ d.video.author.name[0] }}</div>
            <div class="ml-3 mr-6">
              <div class="flex items-center gap-1 text-base font-medium leading-[22px]">
                {{ d.video.author.name }}<Icon v-if="d.video.author.verified" n="check" :s="14" class="text-[#aaa]" />
              </div>
              <div class="text-xs leading-[18px] text-[#aaa]">{{ d.video.author.subs }}</div>
            </div>
            <button class="h-9 rounded-full bg-[#f1f1f1] px-4 text-sm font-medium text-[#0f0f0f] hover:bg-[#d9d9d9]">Subscribe</button>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex h-9 items-center rounded-full bg-white/10 text-sm font-medium">
              <button class="flex h-full items-center gap-1.5 rounded-l-full pl-3 pr-4 hover:bg-white/10"><Icon n="like" />{{ d.video.likes }}</button>
              <span class="h-6 w-px bg-white/20" />
              <button class="flex h-full items-center rounded-r-full px-4 hover:bg-white/10"><Icon n="dislike" /></button>
            </div>
            <button :class="pill"><Icon n="share" />Share</button>
            <button :class="pill" class="max-lg:hidden"><Icon n="download" />Download</button>
            <button class="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"><Icon n="horiz" /></button>
          </div>
        </div>

        <div class="mt-3 rounded-xl bg-white/10 p-3 text-sm leading-5 hover:bg-white/20">
          <div class="font-medium">{{ d.video.views }}&nbsp;&nbsp;{{ d.video.date }}&nbsp;&nbsp;<span class="text-[#aaa]">{{ d.video.tags }}</span></div>
          <p class="line-clamp-3 whitespace-pre-line">{{ d.video.description }}</p>
          <span class="font-medium">...more</span>
        </div>

        <section class="mt-6">
          <div class="mb-6 flex items-center gap-8">
            <h2 class="text-xl font-bold">{{ d.video.commentCount }} Comments</h2>
            <span class="flex items-center gap-2 text-sm font-medium"><Icon n="sort" />Sort by</span>
          </div>
          <div class="mb-8 flex gap-4">
            <Icon n="account" :s="40" class="shrink-0 text-[#aaa]" />
            <div class="flex-1 border-b border-white/20 pt-2 pb-1 text-sm text-[#aaa]">Add a comment...</div>
          </div>
          <div v-for="(c, i) in d.comments" :key="i" class="mb-4 flex gap-4">
            <img v-if="c.avatar" :src="c.avatar" class="size-10 shrink-0 rounded-full object-cover" alt="" />
            <div v-else class="grid size-10 shrink-0 place-items-center rounded-full text-lg font-medium uppercase" :style="{ background: colors[(i + 1) % colors.length] }">{{ c.user[0] }}</div>
            <div class="min-w-0 flex-1">
              <div class="text-[13px] font-medium leading-[18px]">@{{ c.user }}<span class="ml-1 text-xs font-normal text-[#aaa]">{{ c.ago }}</span></div>
              <p class="mt-0.5 whitespace-pre-line text-sm leading-5">{{ c.text }}</p>
              <div class="mt-1 -ml-2 flex items-center text-xs text-[#aaa]">
                <button class="grid size-8 place-items-center rounded-full text-[#f1f1f1] hover:bg-white/10"><Icon n="like" :s="20" /></button>
                <span class="ml-0.5">{{ c.likes }}</span>
                <button class="ml-2 grid size-8 place-items-center rounded-full text-[#f1f1f1] hover:bg-white/10"><Icon n="dislike" :s="20" /></button>
                <button class="ml-2 h-8 rounded-full px-3 font-medium text-[#f1f1f1] hover:bg-white/10">Reply</button>
              </div>
              <button v-if="c.replies" class="mt-1 -ml-3 flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[#3ea6ff] hover:bg-[#263850]">
                <Icon n="down" />{{ c.replies }} {{ c.replies > 1 ? 'replies' : 'reply' }}
              </button>
            </div>
            <Icon n="vert" class="shrink-0" />
          </div>
        </section>
      </template>
    </main>

    <aside class="shrink-0 pb-6 min-[1017px]:w-[402px]">
      <template v-if="!d">
        <div class="mb-3 flex gap-3">
          <div v-for="i in 4" :key="i" class="h-8 w-20 rounded-lg bg-white/10" />
        </div>
        <div v-for="i in 10" :key="i" class="mb-2 flex gap-2">
          <div class="h-[94px] w-[168px] shrink-0 rounded-lg bg-white/10" />
          <div class="flex-1">
            <div :class="sk" class="h-4 w-full" />
            <div :class="sk" class="mt-2 h-4 w-3/5" />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="mb-3 flex gap-3 overflow-hidden">
          <span v-for="(c, i) in d.chips" :key="c" class="flex h-8 shrink-0 items-center rounded-lg px-3 text-sm font-medium" :class="i ? 'bg-white/10' : 'bg-[#f1f1f1] text-[#0f0f0f]'">{{ c }}</span>
        </div>
        <RouterLink v-for="(r, i) in d.recommendations" :key="i" :to="r.id ? `/watch?v=${r.id}` : $route.fullPath" class="mb-2 flex gap-2">
          <div class="relative h-[94px] w-[168px] shrink-0 overflow-hidden rounded-lg bg-white/10">
            <img :src="r.thumbnail" class="h-full w-full object-cover" alt="" loading="lazy" />
            <span class="absolute right-1 bottom-1 rounded bg-black/80 px-1 text-xs font-medium leading-[18px]">{{ r.duration }}</span>
          </div>
          <div class="relative min-w-0 flex-1 pr-6">
            <h3 class="mb-1 line-clamp-2 text-sm font-medium leading-5">{{ r.title }}</h3>
            <div class="text-xs leading-[18px] text-[#aaa]">{{ r.channel }}</div>
            <div class="text-xs leading-[18px] text-[#aaa]">{{ r.views }} • {{ r.ago }}</div>
            <Icon n="vert" :s="20" class="absolute top-0 right-0" />
          </div>
        </RouterLink>
      </template>
    </aside>
  </div>
</template>
