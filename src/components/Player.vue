<script>
  export const host = (u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return u || "";
    }
  };
</script>

<script setup>
  import Hls from "hls.js";
  import { ref, computed, onMounted, onBeforeUnmount } from "vue";
  import Icon from "./Icon.vue";
  import { lock, bindLock } from "../lock";

  const props = defineProps({
    src: String,
    poster: String,
    start: String,
    force: { type: Boolean, default: true },
    ads: { type: Array, default: () => [] }
  });
  const emit = defineEmits(["ad"]);
  const box = ref();
  const v = ref();
  const av = ref();
  const ai = ref(-1);
  const ad = computed(() => props.ads[ai.value]);
  const bar = ref();
  const playing = ref(false);
  const t = ref(0);
  const dur = ref(0);
  const buf = ref(0);
  const active = ref(true);
  const drag = ref(false);
  const fs = ref(false);
  let hls, ahls, idle, unbind;
  let pending = props.ads.length > 0;

  const attach = (el, src) => {
    if (Hls.isSupported() && !/\.(mp4|webm|ogg|mov)($|\?)/i.test(src)) {
      const h = new Hls();
      h.loadSource(src);
      h.attachMedia(el);
      return h;
    }
    el.src = src;
  };

  const fmt = (s) => {
    s = Math.floor(s || 0);
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      x = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`;
  };
  const pct = (x) => (dur.value ? (x / dur.value) * 100 : 0) + "%";
  const show = computed(() => !playing.value || active.value || drag.value);

  const vid = () => (ad.value ? av.value : v.value);
  const toggle = () => {
    if (!vid().paused) return vid().pause();
    if (pending) {
      pending = false;
      playAd(0);
    } else vid().play();
    if (props.force) lock(box.value);
  };
  // ads play in their own <video> on top; main video waits underneath
  const playAd = (i) => {
    ahls?.destroy();
    ahls = null;
    if (i >= props.ads.length) {
      // .mp4 ads aren't detached by hls.destroy(), so they'd keep playing hidden
      av.value.pause();
      ai.value = -1;
      t.value = v.value.currentTime;
      dur.value = v.value.duration;
      return v.value.play();
    }
    ai.value = i;
    t.value = dur.value = 0;
    ahls = attach(av.value, props.ads[i].video);
    av.value.play();
    emit("ad", props.ads[i]);
  };
  const skipAt = computed(() => (ad.value?.skip === "" || ad.value?.skip == null ? 5 : +ad.value.skip));
  const clickAd = () => {
    if (!ad.value.url) return toggle();
    open(ad.value.url, "_blank");
    av.value.pause();
  };
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : box.value.requestFullscreen());
  const onFs = () => (fs.value = document.fullscreenElement === box.value);
  const seek = (e) => {
    if (!dur.value) return;
    const r = bar.value.getBoundingClientRect();
    const p = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    v.value.currentTime = t.value = p * dur.value;
  };
  const down = (e) => {
    drag.value = true;
    bar.value.setPointerCapture(e.pointerId);
    seek(e);
  };
  const wake = () => {
    active.value = true;
    clearTimeout(idle);
    idle = setTimeout(() => (active.value = false), 2500);
  };
  const onMeta = (e) => {
    // any seek, even to 0, hides the poster
    const s = parseFloat(props.start);
    if (s) e.target.currentTime = s;
    if (!ad.value) t.value = e.target.currentTime;
  };
  const onBuf = () => {
    const b = v.value.buffered;
    buf.value = b.length ? b.end(b.length - 1) : 0;
  };

  onMounted(() => {
    unbind = bindLock(box.value);
    document.addEventListener("fullscreenchange", onFs);
    hls = attach(v.value, props.src);
  });
  onBeforeUnmount(() => {
    hls?.destroy();
    ahls?.destroy();
    clearTimeout(idle);
    unbind?.();
    document.removeEventListener("fullscreenchange", onFs);
  });
</script>

<template>
  <div
    ref="box"
    class="relative aspect-video w-full overflow-hidden rounded-xl bg-black [&:fullscreen]:rounded-none"
    :class="{ 'cursor-none': !show }"
    @mousemove="wake"
    @mouseleave="active = false"
  >
    <video
      ref="v"
      class="h-full w-full"
      :poster="poster"
      playsinline
      @click="toggle"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="ad || (t = $event.target.currentTime)"
      @durationchange="ad || (dur = $event.target.duration)"
      @progress="onBuf"
      @loadedmetadata="onMeta"
    />
    <video
      v-show="ad"
      ref="av"
      class="absolute inset-0 h-full w-full bg-black"
      playsinline
      @click="clickAd"
      @play="playing = true"
      @pause="ad && (playing = false)"
      @timeupdate="ad && (t = $event.target.currentTime)"
      @durationchange="dur = $event.target.duration"
      @ended="playAd(ai + 1)"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent transition-opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0'"
    />
    <template v-if="ad">
      <div
        class="absolute left-[22px] flex flex-col items-start gap-[7px] transition-[bottom] duration-300"
        :class="show ? 'bottom-[71px]' : 'bottom-4'"
      >
        <a
          v-if="ad.title"
          :href="ad.url || undefined"
          target="_blank"
          class="flex w-[346px] items-center rounded-lg bg-black/60 p-3"
        >
          <img v-if="ad.avatar" :src="ad.avatar" alt="" class="size-9 shrink-0 rounded-full object-cover" />
          <span class="min-w-0 flex-1 pr-5 pl-2">
            <span class="line-clamp-2 text-sm leading-5 font-medium text-white">{{ ad.title }}</span>
            <span class="block truncate text-xs leading-4 text-white/70">{{ ad.domain || host(ad.url) }}</span>
          </span>
          <span class="h-9 shrink-0 rounded-full bg-[#f1f1f1] px-4 text-sm leading-9 font-medium text-[#0f0f0f]">{{
            ad.cta || "Learn more"
          }}</span>
        </a>
        <div class="flex h-7 items-center text-xs leading-7 text-white">
          <span class="font-semibold">Sponsored</span>
          <Icon n="info" :s="12" class="mr-px ml-[5px]" />
          <span v-if="ads.length > 1" class="font-medium">&nbsp;• {{ ai + 1 }} of {{ ads.length }}</span>
          <a :href="ad.url || undefined" target="_blank" class="ml-4 leading-[14px] font-medium">{{
            ad.domain || host(ad.url)
          }}</a>
        </div>
      </div>
      <button
        v-if="t >= skipAt"
        class="absolute right-[22px] flex h-9 items-center rounded-full bg-black/60 pr-1.5 pl-4 text-sm font-medium text-white transition-[bottom] duration-300 hover:bg-[#3f3f3f]/80"
        :class="show ? 'bottom-[70px]' : 'bottom-4'"
        @click="playAd(ai + 1)"
      >
        Skip<span class="grid size-9 place-items-center"><Icon n="skip" /></span>
      </button>
    </template>
    <div
      class="absolute inset-x-0 bottom-0 px-3 transition-opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <div
        ref="bar"
        class="group/bar relative flex h-4 touch-none items-end pb-1"
        :class="{ 'cursor-pointer': !ad }"
        @pointerdown="ad || down($event)"
        @pointermove="drag && seek($event)"
        @pointerup="drag = false"
      >
        <div v-if="ad" class="relative h-1 w-full bg-[#282828]/60">
          <div class="absolute inset-y-0 left-0 bg-[#fc0]" :style="{ width: pct(t) }" />
        </div>
        <div v-else class="relative h-[3px] w-full bg-white/20 transition-[height] group-hover/bar:h-[5px]">
          <div class="absolute inset-y-0 left-0 bg-white/40" :style="{ width: pct(buf) }" />
          <div class="absolute inset-y-0 left-0 bg-[#f00]" :style="{ width: pct(t) }" />
          <div
            class="absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-[#f00] transition-transform group-hover/bar:scale-100"
            :class="{ 'scale-100': drag }"
            :style="{ left: pct(t) }"
          />
        </div>
      </div>
      <div class="flex h-12 items-center justify-between text-white">
        <div class="flex items-center">
          <button class="grid size-12 place-items-center" @click="toggle">
            <Icon :n="playing ? 'pause' : 'play'" :s="32" />
          </button>
          <button v-if="!ad" class="grid size-12 place-items-center"><Icon n="next" :s="28" /></button>
          <button class="grid size-12 place-items-center"><Icon n="volume" :s="26" /></button>
          <span class="px-2 text-[13px] tabular-nums">{{ fmt(t) }} / {{ fmt(dur) }}</span>
        </div>
        <div class="flex items-center">
          <span class="mx-3 flex h-3.5 w-9 items-center rounded-full bg-white/30"
            ><span class="grid size-5 place-items-center rounded-full bg-[#cdcdcd] text-black"
              ><Icon n="pause" :s="12" /></span
          ></span>
          <button class="grid size-12 place-items-center"><Icon n="cc" :s="26" /></button>
          <button class="grid size-12 place-items-center"><Icon n="settings" :s="26" /></button>
          <button v-if="!ad" class="grid size-12 place-items-center"><Icon n="mini" :s="24" /></button>
          <button class="grid size-12 place-items-center"><Icon n="theater" :s="28" /></button>
          <button class="grid size-12 place-items-center" @click="full">
            <Icon :n="fs ? 'unfull' : 'full'" :s="28" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
