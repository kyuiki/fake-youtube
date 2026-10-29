<script setup>
import '@fontsource-variable/geist'
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { PhArrowRight, PhCloud, PhCode, PhCompass, PhShieldCheck } from '@phosphor-icons/vue'
import Mark from '../components/YouItuMark.vue'

gsap.registerPlugin(ScrollTrigger, SplitText)

const services = [
  { i: PhCompass, t: 'Technology strategy', d: 'A 94-slide deck recommending the option your engineers chose in March, with a roadmap built on the dates they gave us.' },
  { i: PhCloud, t: 'Cloud and infrastructure', d: 'We move your servers to someone else\'s servers. The invoice arrives monthly and is larger.' },
  { i: PhCode, t: 'Software delivery', d: 'Our consultants join your team, spend four months learning the codebase, and then ask who wrote it.' },
  { i: PhShieldCheck, t: 'Security and compliance', d: 'We read the regulations so someone in your next meeting can say they were read. Findings arrive as a password-protected PDF.' },
]

const steps = [
  { t: 'Assess', d: 'We interview your staff, take notes, and present their suggestions to the board as findings.' },
  { t: 'Design', d: 'We prepare three options. Two exist to make the third look reasonable.' },
  { t: 'Deliver', d: 'Your engagement lead sends a status update every Friday. Delivery of the software is scoped separately.' },
  { t: 'Hand over', d: 'Ownership transfers to your team. The retainer transfers to your budget.' },
]

// f = count-up start value
const stats = [
  { n: 1204, l: 'steering committee meetings held last year' },
  { n: 94, l: 'slides in the average strategy deck' },
  { n: 37, l: 'weeks to approve a two-week sprint' },
  { n: 0, f: 100, l: 'engagements that ended on the original date' },
]
const fmt = v => Math.round(v).toLocaleString('en-US')

const root = ref(null)
const wave = ref(null)
const LINES = 7

function draw(t) {
  const ps = wave.value?.children
  if (!ps) return
  for (let i = 0; i < LINES; i++) {
    let d = ''
    for (let x = 0; x <= 1200; x += 24) {
      const y = 330 + i * 34 + Math.sin(x * 0.005 + t + i * 0.7) * 28 + Math.sin(x * 0.011 - t * 0.6 + i) * 12
      d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1)
    }
    ps[i].setAttribute('d', d)
  }
}

let mm

onMounted(() => {
  document.title = 'You Itu Indonesia | Technology consultancy'
  draw(0)

  const r = root.value
  const $ = s => r.querySelectorAll(s)
  const $1 = s => r.querySelector(s)
  const split = el => SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'w' })

  mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tick = t => draw(t * 0.6)
    let live = true
    ScrollTrigger.create({ trigger: $1('.g-hero'), start: 'top top', end: 'bottom top', onToggle: s => (live = s.isActive) })
    const loop = t => live && tick(t)
    gsap.ticker.add(loop)

    const h1 = split($1('.g-h1'))
    gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } })
      .from($1('.g-nav'), { yPercent: -100, duration: 0.8 })
      .from($('.g-nav .disc'), { scaleX: 0, transformOrigin: '40% 50%', duration: 0.6, ease: 'power3.out' }, '<.2')
      .from($('.g-nav .arrow'), { x: 40, y: -32, opacity: 0, duration: 0.35, ease: 'power2.in' }, '>')
      .to($('.g-nav .disc'), { keyframes: { rotate: [0, -6, 4, -2, 0] }, transformOrigin: '40% 50%', duration: 0.6, ease: 'none' }, '>')
      .from(h1.words, { yPercent: 110, stagger: 0.06 }, 0.2)
      .from($('.g-fade'), { y: 20, opacity: 0, stagger: 0.1, duration: 1 }, '<.5')
      .fromTo($1('.g-hero-img'), { clipPath: 'inset(100% 0% 0% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.4 }, 0.3)
      .from($1('.g-hero-img img'), { scale: 1.3, duration: 1.8 }, '<')
      .from(wave.value, { opacity: 0, duration: 2.5, ease: 'power1.out' }, 0.4)

    gsap.to($1('.g-hero-img'), { yPercent: -8, ease: 'none', scrollTrigger: { trigger: $1('.g-hero'), start: 'top top', end: 'bottom top', scrub: true } })

    const mag = $1('.g-mag')
    const xTo = gsap.quickTo(mag, 'x', { duration: 0.5, ease: 'power3' })
    const yTo = gsap.quickTo(mag, 'y', { duration: 0.5, ease: 'power3' })
    const move = e => {
      const b = mag.getBoundingClientRect()
      xTo((e.clientX - b.left - b.width / 2) * 0.35)
      yTo((e.clientY - b.top - b.height / 2) * 0.35)
    }
    const leave = () => { xTo(0); yTo(0) }
    mag.addEventListener('pointermove', move)
    mag.addEventListener('pointerleave', leave)

    $('.g-num').forEach((el, i) => {
      const s = stats[i]
      const o = { v: s.f ?? 0 }
      el.textContent = fmt(o.v)
      gsap.to(o, {
        v: s.n, duration: 2.2, ease: 'power3.out',
        onUpdate: () => (el.textContent = fmt(o.v)),
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    })

    $('.g-split').forEach(el => {
      gsap.from(split(el).words, { yPercent: 110, stagger: 0.07, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
    })

    gsap.set($('.g-card'), { y: 60, opacity: 0 })
    ScrollTrigger.batch($('.g-card'), {
      start: 'top 88%', once: true,
      onEnter: b => gsap.to(b, { y: 0, opacity: 1, stagger: 0.12, duration: 1.1, ease: 'expo.out' }),
    })
    gsap.fromTo($1('.g-card-img'), { yPercent: -8, scale: 1.2 }, { yPercent: 8, scale: 1.2, ease: 'none', scrollTrigger: { trigger: $1('.g-card-img').parentNode, scrub: true } })

    gsap.from($1('.g-line'), { scaleY: 0, ease: 'none', scrollTrigger: { trigger: $1('.g-steps'), start: 'top 70%', end: 'bottom 60%', scrub: true } })
    $('.g-step').forEach(el => {
      gsap.from(el, { opacity: 0.15, x: 32, ease: 'none', scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 60%', scrub: true } })
    })

    const st = $1('.g-statement')
    gsap.fromTo($1('.g-zoom'), { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: st, start: 'top bottom', end: 'bottom top', scrub: true } })
    const q = SplitText.create($1('.g-quote'), { type: 'words' })
    gsap.from(q.words, { opacity: 0.15, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 70%', end: 'center 45%', scrub: true } })

    document.fonts.ready.then(() => ScrollTrigger.refresh())

    return () => {
      gsap.ticker.remove(loop)
      mag.removeEventListener('pointermove', move)
      mag.removeEventListener('pointerleave', leave)
    }
  })
})

onUnmounted(() => mm?.revert())
</script>

<template>
  <div ref="root" class="y min-h-dvh overflow-x-clip bg-(--bg) text-(color:--ink) antialiased">
    <header class="g-nav sticky top-0 z-40 border-b border-(--line) bg-(--bg)/85 backdrop-blur">
      <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <a href="#top" class="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <Mark class="size-9" />You Itu
        </a>
        <div class="hidden items-center gap-8 text-sm text-(color:--mute) md:flex">
          <a href="#services" class="transition-colors hover:text-(color:--ink)">Services</a>
          <a href="#approach" class="transition-colors hover:text-(color:--ink)">Approach</a>
          <a href="#contact" class="transition-colors hover:text-(color:--ink)">Contact</a>
        </div>
        <a href="#contact" class="btn">Book a call</a>
      </nav>
    </header>

    <main id="top">
      <div class="g-hero relative">
        <svg
          ref="wave" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true"
          class="wave pointer-events-none absolute inset-0 size-full"
        >
          <path v-for="i in LINES" :key="i" fill="none" stroke="var(--accent)" :stroke-opacity="0.05 + i * 0.022" stroke-width="1.25" vector-effect="non-scaling-stroke" />
        </svg>
        <section class="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-10 px-4 pt-10 pb-16 md:px-8 lg:grid-cols-12 lg:gap-16">
          <div class="lg:col-span-6">
            <h1 class="g-h1 text-5xl leading-[1.08] font-semibold tracking-tighter text-balance lg:text-5xl xl:text-6xl">
              We tell you what your IT team already told you.
            </h1>
            <p class="g-fade mt-6 max-w-[48ch] text-lg leading-relaxed text-(color:--mute)">
              You Itu Indonesia charges consulting rates to repeat your engineers' recommendations with a slide deck attached.
            </p>
            <div class="g-fade mt-8 flex flex-wrap items-center gap-3">
              <a href="#contact" class="g-mag btn btn-lg">Book a call <PhArrowRight :size="18" weight="bold" /></a>
              <a href="#services" class="btn btn-lg btn-ghost">Our services</a>
            </div>
          </div>
          <div class="g-hero-img overflow-hidden rounded-2xl lg:col-span-6 lg:mt-14">
            <img
              src="https://picsum.photos/seed/youitu-brussels-glass-architecture/1200/1400"
              alt=""
              width="1200" height="1400" fetchpriority="high"
              class="aspect-[5/4] w-full object-cover lg:aspect-[6/7]"
            />
          </div>
        </section>
      </div>

      <section class="border-y border-(--line) bg-white/60">
        <dl class="mx-auto grid max-w-7xl grid-cols-2 px-4 md:grid-cols-4 md:px-8">
          <div v-for="(s, i) in stats" :key="s.l" class="py-10 pr-4 md:px-8 md:py-14" :class="i && 'md:border-l md:border-(--line)'">
            <dd class="g-num text-5xl font-semibold tracking-tighter tabular-nums text-(color:--accent) md:text-6xl">{{ fmt(s.n) }}</dd>
            <dt class="mt-3 max-w-[22ch] text-sm leading-snug text-(color:--mute)">{{ s.l }}</dt>
          </div>
        </dl>
      </section>

      <section id="services" class="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 md:px-8 md:py-32">
        <h2 class="g-split max-w-[20ch] text-4xl leading-tight font-semibold tracking-tighter md:text-5xl">What you are paying for</h2>
        <div class="mt-12 grid gap-4 md:grid-cols-12">
          <article class="g-card group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl p-8 text-white md:col-span-7">
            <img src="https://picsum.photos/seed/youitu-strategy-whiteboard/1200/800" alt="" loading="lazy" width="1200" height="800" class="g-card-img absolute inset-0 size-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#04162a]/90 via-[#04162a]/55 to-[#04162a]/10"></div>
            <div class="relative">
              <component :is="services[0].i" :size="28" weight="regular" class="ico" />
              <h3 class="mt-4 text-2xl font-semibold tracking-tight">{{ services[0].t }}</h3>
              <p class="mt-2 max-w-[48ch] leading-relaxed text-slate-100">{{ services[0].d }}</p>
            </div>
          </article>
          <article class="g-card group card rounded-2xl border border-(--line) bg-white p-8 md:col-span-5">
            <component :is="services[1].i" :size="28" weight="regular" class="ico text-(color:--accent)" />
            <h3 class="mt-4 text-2xl font-semibold tracking-tight">{{ services[1].t }}</h3>
            <p class="mt-2 leading-relaxed text-(color:--mute)">{{ services[1].d }}</p>
          </article>
          <article class="g-card group card rounded-2xl border border-(--line) bg-white p-8 md:col-span-5">
            <component :is="services[2].i" :size="28" weight="regular" class="ico text-(color:--accent)" />
            <h3 class="mt-4 text-2xl font-semibold tracking-tight">{{ services[2].t }}</h3>
            <p class="mt-2 leading-relaxed text-(color:--mute)">{{ services[2].d }}</p>
          </article>
          <article class="g-card group card rounded-2xl bg-(--accent) p-8 text-white md:col-span-7">
            <component :is="services[3].i" :size="28" weight="regular" class="ico" />
            <h3 class="mt-4 text-2xl font-semibold tracking-tight">{{ services[3].t }}</h3>
            <p class="mt-2 max-w-[48ch] leading-relaxed text-sky-50">{{ services[3].d }}</p>
          </article>
        </div>
      </section>

      <section id="approach" class="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 md:px-8 md:pb-32">
        <div class="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <h2 class="g-split text-4xl leading-tight font-semibold tracking-tighter md:text-5xl lg:sticky lg:top-28 lg:col-span-4 lg:self-start">How we work</h2>
          <div class="g-steps relative pl-6 md:pl-10 lg:col-span-8">
            <div class="absolute top-0 left-0 h-full w-px bg-(--line)"></div>
            <div class="g-line absolute top-0 left-0 h-full w-px origin-top bg-(--accent)"></div>
            <ol class="divide-y divide-(--line)">
              <li v-for="s in steps" :key="s.t" class="g-step grid gap-3 py-8 first:pt-0 md:grid-cols-5 md:gap-8">
                <h3 class="text-3xl font-semibold tracking-tight md:col-span-2 md:text-4xl">{{ s.t }}</h3>
                <p class="max-w-[52ch] leading-relaxed text-(color:--mute) md:col-span-3">{{ s.d }}</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 pb-24 md:px-8 md:pb-32">
        <div class="g-statement relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl sm:aspect-[16/9] lg:aspect-[21/9]">
          <img src="https://picsum.photos/seed/youitu-team-workshop/2100/900" alt="" loading="lazy" width="2100" height="900" class="g-zoom absolute inset-0 size-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#04162a]/90 via-[#04162a]/45 to-transparent"></div>
          <p class="g-quote relative max-w-[26ch] p-8 text-3xl leading-tight font-semibold tracking-tight text-white md:p-12 md:text-5xl">
            We have never advised a client to do nothing.
          </p>
        </div>
      </section>

      <section id="contact" class="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 md:px-8 md:pb-32">
        <div class="rounded-2xl border border-(--line) bg-white p-8 md:p-16">
          <h2 class="g-split max-w-[16ch] text-4xl leading-[1.08] font-semibold tracking-tighter md:text-6xl">Tell us your budget.</h2>
          <p class="mt-6 max-w-[48ch] text-lg leading-relaxed text-(color:--mute)">
            We will tell you what the project costs. The two numbers tend to match.
          </p>
        </div>
      </section>
    </main>

    <footer class="border-t border-(--line)">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-12 md:px-8">
        <div class="md:col-span-5">
          <a href="#top" class="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <Mark class="size-9" />You Itu Indonesia
          </a>
          <p class="mt-4 max-w-[36ch] text-sm leading-relaxed text-(color:--mute)">Technology consultancy. Rates available once you have agreed to them.</p>
        </div>
        <div class="text-sm md:col-span-3 md:col-start-8">
          <p class="font-medium">Services</p>
          <ul class="mt-4 space-y-2 text-(color:--mute)">
            <li v-for="s in services" :key="s.t"><a href="#services" class="hover:text-(color:--ink)">{{ s.t }}</a></li>
          </ul>
        </div>
        <div class="text-sm md:col-span-2">
          <p class="font-medium">Company</p>
          <ul class="mt-4 space-y-2 text-(color:--mute)">
            <li><a href="#approach" class="hover:text-(color:--ink)">Approach</a></li>
            <li><a href="#contact" class="hover:text-(color:--ink)">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="mx-auto max-w-7xl border-t border-(--line) px-4 py-6 text-sm text-(color:--mute) md:px-8">
        © 2026 Kyuiki Dev. All rights reserved. <a href="https://kyuiki.com" class="underline underline-offset-4 hover:text-(color:--ink)">kyuiki.com</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.y {
  color-scheme: light;
  --bg: #f3f8fc;
  --ink: #06213a;
  --mute: #455b70;
  --line: #d3e0ec;
  --accent: #0a4a7c;
  font-family: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
}
.wave {
  mask-image: linear-gradient(to bottom, transparent 30%, #000 75%);
}
.y :deep(.w-mask) {
  padding-bottom: 0.14em;
  margin-bottom: -0.14em;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  border-radius: 9999px;
  background: var(--accent);
  color: #fff;
  padding: 0.5rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: filter 0.2s, scale 0.2s;
}
.btn:hover {
  filter: brightness(1.15);
}
.btn:active {
  scale: 0.97;
}
.btn-lg {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
}
.btn-ghost {
  background: transparent;
  color: var(--ink);
  box-shadow: inset 0 0 0 1px rgb(6 33 58 / 0.3);
}
.btn:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.card {
  transition: translate 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s;
}
.card:hover {
  translate: 0 -4px;
  box-shadow: 0 18px 40px -20px rgb(10 74 124 / 0.35);
}
.ico {
  transition: rotate 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.group:hover .ico {
  rotate: -12deg;
}
</style>
