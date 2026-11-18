(async()=>{
const t=e=>e?.textContent.trim().replace(/\s+/g,' ')||'',$=s=>document.querySelector(s)
const q=()=>document.querySelectorAll('yt-lockup-view-model'),w=ms=>new Promise(r=>setTimeout(r,ms)),y=scrollY
const vid=location.pathname==='/watch'&&new URLSearchParams(location.search).get('v')
for(let n=0,i=0;i<8&&q().length>n;i++){n=q().length;scrollTo(0,document.documentElement.scrollHeight);await w(400)}
if(vid){$('ytd-comments#comments')?.scrollIntoView();for(let i=0;i<20&&!$('ytd-comment-thread-renderer');i++)await w(250)}
const ls=[...q()],cs=[...document.querySelectorAll('ytd-comment-thread-renderer')].slice(0,20)
for(const l of ls){l.scrollIntoView({block:'center'});await w(40)}
for(const c of cs){c.scrollIntoView({block:'center'});await w(150)}
scrollTo(0,y)
const r=ls.flatMap(l=>{
const a=[...l.querySelectorAll('a[href*="/watch"]')]
const h=a[0]?.getAttribute('href')
if(!h||h.includes('list='))return[]
const m=[...new Set([...l.querySelectorAll('yt-content-metadata-view-model span')].map(t).filter(Boolean))]
const v=m.find(s=>/^[\d.,]+[KMB]?( views)?$/i.test(s))||''
return{title:t(l.querySelector('h3')),channel:t(l.querySelector('a[href^="/@"],a[href^="/channel"]'))||m[0]||'',duration:[...l.querySelectorAll('*')].filter(e=>!e.children.length).map(t).find(s=>/^\d+(:\d\d)+$/.test(s))||'',views:v&&!/views/.test(v)?v+' views':v,ago:m.find(s=>/ago$/.test(s))||'',badge:l.querySelector('yt-content-metadata-view-model [aria-label="Official Artist Channel"]')?'music':l.querySelector('yt-content-metadata-view-model [aria-label=Verified]')?'verified':'',thumbnail:`https://i.ytimg.com/vi/${new URLSearchParams(h.split('?')[1]).get('v')}/hqdefault.jpg`}
})
let o=r,msg=`Copied ${r.length} videos. Paste them in the builder's Up next tab.`
if(vid){
// player response survives in-app navigation stale, so only trust it for the video on screen
const p=$('#movie_player')?.getPlayerResponse?.(),vd=p?.videoDetails?.videoId===vid?p.videoDetails:null,pub=vd&&p.microformat?.playerMicroformatRenderer?.publishDate
const ago=s=>{const x=(Date.now()-new Date(s))/1e3;for(const[u,k]of[['year',31536e3],['month',2592e3],['week',604800],['day',86400],['hour',3600],['minute',60]]){const n=Math.floor(x/k);if(n>=1)return`${n} ${u}${n>1?'s':''} ago`}return'just now'}
const n=+(vd?.viewCount||0)
o={video:{title:t($('#above-the-fold #title h1')),views:n?Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1,roundingMode:'trunc'}).format(n)+' views':'',date:pub?ago(pub):'',likes:t($('like-button-view-model .ytSpecButtonShapeNextButtonTextContent')),commentCount:t($('ytd-comments-header-renderer #count')).replace(/ Comments?$/,''),description:vd?.shortDescription??$('#description-inline-expander #attributed-snippet-text')?.innerText.trim()??'',tags:[...document.querySelectorAll('#info-container a,ytd-watch-info-text #info a')].map(t).filter(s=>s[0]==='#').join(' '),poster:`https://i.ytimg.com/vi/${vid}/${vd?.thumbnail?.thumbnails?.at(-1)?.url.match(/\/(\w+)\.\w+(\?|$)/)?.[1]||'hqdefault'}.jpg`,author:{name:t($('#owner #channel-name a')),subs:t($('#owner-sub-count')),avatar:($('#owner #avatar img')?.src||'').replace(/=s\d+/,'=s88'),verified:!!$('#owner ytd-badge-supported-renderer [aria-label]')}},
comments:cs.map(e=>({user:t(e.querySelector('#author-text')).replace(/^@/,''),avatar:e.querySelector('#author-thumbnail img')?.src||'',ago:t(e.querySelector('#published-time-text')),text:e.querySelector('#content-text')?.innerText.trim()||'',likes:t(e.querySelector('#vote-count-middle')),replies:t(e.querySelector('#more-replies button')).split(' ')[0]})),
recommendations:r}
msg=`Copied this video, ${o.comments.length} comments and ${r.length} up next. Paste them in the builder's Video tab.`
}
const j=JSON.stringify(o)
navigator.clipboard.writeText(j).then(()=>alert(msg),()=>prompt('Copy this, then paste in the builder',j))
})()
