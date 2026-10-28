<script setup>
  import Icon from "./Icon.vue";
  defineProps({ site: Object });

  const btn = "grid size-10 place-items-center rounded-full hover:bg-white/10";
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-[#0f0f0f] px-4">
    <div class="flex shrink-0 items-center">
      <button :class="btn"><Icon n="menu" /></button>
      <a href="#" data-hl="site.name site.logo" class="ml-3 flex items-center gap-1">
        <img v-if="site.logo" :src="site.logo" class="h-5" alt="" />
        <template v-else>
          <span class="grid h-5 w-7 place-items-center rounded-md bg-[#f10000] text-[#f1f1f1]"
            ><Icon n="play" :s="14"
          /></span>
          <span class="text-lg font-bold tracking-tighter relative top-0.5">{{ site.name }}</span>
        </template>
      </a>
    </div>
    <div class="mx-10 flex max-w-[732px] flex-1 items-center max-sm:hidden">
      <div class="flex h-10 flex-1">
        <input
          placeholder="Search"
          class="min-w-0 flex-1 rounded-l-full border border-[#303030] bg-[#121212] pl-4 text-base outline-none placeholder:text-[#888] focus:border-[#1c62b9]"
        />
        <button class="grid w-16 place-items-center rounded-r-full border border-l-0 border-[#303030] bg-[#222]">
          <Icon n="search" />
        </button>
      </div>
      <button class="ml-4 grid size-10 place-items-center rounded-full bg-[#181818] hover:bg-white/10">
        <Icon n="mic" />
      </button>
    </div>
    <div v-if="site.signedIn" data-hl="site.signedIn site.avatar site.notifs" class="flex shrink-0 items-center gap-2">
      <button class="flex h-10 items-center gap-1.5 rounded-full bg-white/10 pr-4 pl-3 text-sm font-medium hover:bg-white/20 max-sm:hidden"><Icon n="create" />Create</button>
      <button :class="btn" class="relative">
        <Icon n="bell" />
        <span v-if="site.notifs" class="absolute top-1 left-5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e1002d] px-1 text-xs text-white">{{ site.notifs }}</span>
      </button>
      <button class="mx-1.5 grid size-8 place-items-center overflow-hidden rounded-full bg-white/10">
        <img v-if="site.avatar" :src="site.avatar" class="size-full object-cover" alt="" />
        <Icon v-else n="account" :s="32" />
      </button>
    </div>
    <div v-else class="flex shrink-0 items-center gap-2">
      <button :class="btn"><Icon n="vert" /></button>
      <a
        href="#"
        class="flex h-9 items-center gap-1.5 rounded-full border border-white/20 pl-2 pr-3 text-sm font-medium text-[#3ea6ff] hover:bg-[#263850]"
        ><Icon n="account" />Sign in</a
      >
    </div>
  </header>
</template>
