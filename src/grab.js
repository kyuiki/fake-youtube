(async()=>{
const t=e=>e?.textContent.trim()||''
const q=()=>document.querySelectorAll('yt-lockup-view-model'),w=ms=>new Promise(r=>setTimeout(r,ms)),y=scrollY
for(let n=0,i=0;i<8&&q().length>n;i++){n=q().length;scrollTo(0,document.documentElement.scrollHeight);await w(400)}
const ls=[...q()]
for(const l of ls){l.scrollIntoView({block:'center'});await w(40)}
scrollTo(0,y)
const r=ls.flatMap(l=>{
const a=[...l.querySelectorAll('a[href*="/watch"]')]
const h=a[0]?.getAttribute('href')
if(!h||h.includes('list='))return[]
const m=[...new Set([...l.querySelectorAll('yt-content-metadata-view-model span')].map(t).filter(Boolean))]
const v=m.find(s=>/^[\d.,]+[KMB]?( views)?$/i.test(s))||''
return{title:t(l.querySelector('h3')),channel:t(l.querySelector('a[href^="/@"],a[href^="/channel"]'))||m[0]||'',duration:[...l.querySelectorAll('*')].filter(e=>!e.children.length).map(t).find(s=>/^\d+(:\d\d)+$/.test(s))||'',views:v&&!/views/.test(v)?v+' views':v,ago:m.find(s=>/ago$/.test(s))||'',badge:l.querySelector('yt-content-metadata-view-model [aria-label="Official Artist Channel"]')?'music':l.querySelector('yt-content-metadata-view-model [aria-label=Verified]')?'verified':'',thumbnail:`https://i.ytimg.com/vi/${new URLSearchParams(h.split('?')[1]).get('v')}/hqdefault.jpg`}
})
const j=JSON.stringify(r)
navigator.clipboard.writeText(j).then(()=>alert(`Copied ${r.length} videos. Paste them in the builder's Up next tab.`),()=>prompt('Copy this, then paste in the builder',j))
})()
