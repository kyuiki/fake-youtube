<script>
import { reactive } from 'vue'
// optional fields opened but still empty, keyed by the edited object
const open = reactive(new WeakMap())
</script>

<script setup>
import { computed, nextTick, ref } from 'vue'
import Icon from './Icon.vue'

// f: [key, label, optional, wide, type('area'|'img'|[select options])]
// p: path prefix the preview uses to find what's being edited
const { o, f, p } = defineProps({ o: Object, f: Array, p: String })
const root = ref()

const has = k => (o[k] ?? '') !== '' || !!open.get(o)?.has(k)
const hidden = computed(() => f.filter(([k, , opt]) => opt && !has(k)))
const add = async k => {
  ;(open.get(o) || open.set(o, new Set()).get(o)).add(k)
  await nextTick()
  root.value.querySelector(`[data-k="${k}"]`)?.focus()
}
const drop = k => {
  o[k] = ''
  open.get(o)?.delete(k)
}

const inp = 'w-full rounded-md border border-[#303030] bg-[#121212] px-2.5 text-sm outline-none focus:border-[#3ea6ff]'
</script>

<template>
  <div ref="root" class="grid grid-cols-2 gap-x-3 gap-y-2.5">
    <template v-for="[k, l, opt, wide, t] in f" :key="k">
      <label v-if="!opt || has(k)" :class="{ 'col-span-2': wide }" :data-hl="`${p}.${k}`">
        <span class="mb-1 flex h-4 items-center justify-between text-xs text-[#aaa]">
          {{ l }}
          <button v-if="opt" type="button" class="rounded hover:text-white" :aria-label="`Remove ${l}`" @click.prevent="drop(k)"><Icon n="close" :s="14" /></button>
        </span>
        <select v-if="Array.isArray(t)" v-model="o[k]" :data-k="k" :class="inp" class="h-8">
          <option value="">None</option>
          <option v-for="v in t" :key="v" :value="v">{{ v }}</option>
        </select>
        <textarea v-else-if="t === 'area'" v-model="o[k]" :data-k="k" rows="3" :class="inp" class="block resize-y py-1.5" />
        <span v-else class="relative block">
          <img v-if="t === 'img' && o[k]" :key="o[k]" :src="o[k]" alt="" class="absolute top-1 left-1 size-6 rounded bg-white/10 object-cover" @error="$event.target.style.visibility = 'hidden'" />
          <input v-model="o[k]" :data-k="k" :class="[inp, 'h-8', t === 'img' && o[k] && 'pl-9']" />
        </span>
      </label>
    </template>
    <div v-if="hidden.length" class="col-span-2 flex flex-wrap gap-1.5">
      <button
        v-for="[k, l] in hidden"
        :key="k"
        type="button"
        class="flex h-7 items-center gap-1 rounded-full border border-dashed border-white/20 pr-3 pl-2 text-xs text-[#aaa] hover:border-white/40 hover:text-white active:scale-[0.98]"
        @click="add(k)"
      >
        <Icon n="add" :s="14" />{{ l }}
      </button>
    </div>
  </div>
</template>
