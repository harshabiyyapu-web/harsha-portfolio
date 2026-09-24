/* Meta Pixel 4665609720376690: consent-gated browser analytics.
   No email, names, form values, or advanced matching identifiers are sent. */
(()=>{
 const id='4665609720376690', key='harsha-analytics-consent';
 const local=['localhost','127.0.0.1',''].includes(location.hostname);
 let consent=false,installed=false;const seen=new Set();
 const banner=document.querySelector('#privacy-banner');
 const read=()=>{try{return localStorage.getItem(key)}catch{return null}};
 const save=v=>{try{localStorage.setItem(key,v)}catch{}};
 const prohibited=navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';
 function event(name,data={},standard=false){if(!consent||local||typeof window.fbq!=='function')return;window.fbq(standard?'track':'trackCustom',name,data);}
 function once(name,data={},standard=false){const k=name+JSON.stringify(data);if(seen.has(k)||!consent)return;seen.add(k);event(name,data,standard);}
 function start(){
  if(installed||local)return;installed=true;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('consent','grant');window.fbq('init',id);window.fbq('track','PageView');
 }
 function choose(allow){consent=allow&&!prohibited;save(consent?'granted':'denied');banner.hidden=true;if(consent){start();if(window.fbq)window.fbq('consent','grant');}else{if(window.fbq)window.fbq('consent','revoke');for(const k of ['_fbp','_fbc']){document.cookie=k+'=; Max-Age=0; path=/';document.cookie=k+'=; Max-Age=0; path=/; domain='+location.hostname;}}}
 document.querySelector('#allow-analytics').addEventListener('click',()=>choose(true));
 document.querySelector('#decline-analytics').addEventListener('click',()=>choose(false));
 document.querySelector('#privacy-settings').addEventListener('click',()=>banner.hidden=false);
 const existing=read();if(existing==='granted'&&!prohibited){consent=true;start();}else if(!existing&&!prohibited)banner.hidden=false;
 document.addEventListener('click',e=>{
  const link=e.target.closest('a');if(link){const h=link.getAttribute('href')||'';const label=link.textContent.trim().replace(/\s+/g,' ').slice(0,80);
   if(link.classList.contains('social-card')){const channel=link.querySelector('strong')?.textContent||'Email';event('Contact',{content_name:channel,action:'outbound_click'},true);}
   else if(h.startsWith('http'))event('OutboundClick',{content_name:label,destination:new URL(h).hostname});
  }
  const c=e.target.closest('.certificate');if(c)event('CertificateOpen',{content_name:c.dataset.title});
  if(e.target.closest('#reset-skills'))event('SkillsReplay');
 });
 document.querySelectorAll('.project').forEach(card=>{
  let timer;new IntersectionObserver(entries=>{clearTimeout(timer);if(entries[0].isIntersecting)timer=setTimeout(()=>once('ViewContent',{content_name:card.querySelector('h3')?.textContent,content_type:'portfolio_project'},true),1200);},{threshold:.5}).observe(card);
 });
 const skill=document.querySelector('#playground');skill.addEventListener('pointerdown',e=>{if(e.target.closest('.skill-block'))once('SkillsInteraction');});
 skill.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')once('SkillsInteraction');});
 let queued=false;addEventListener('scroll',()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const travel=document.documentElement.scrollHeight-innerHeight;if(travel<=0)return;const pct=scrollY/travel*100;for(const n of [25,50,75,90])if(pct>=n)once('ScrollDepth',{percent:n});});},{passive:true});
 let active=0;setInterval(()=>{if(!document.hidden&&consent){active+=5;for(const n of [30,60,120])if(active>=n)once('EngagedVisit',{active_seconds:n});}},5000);
 const v=document.querySelector('#product-video');if(v){v.addEventListener('play',()=>once('VideoStart',{content_name:'Varam 3D animation'}));v.addEventListener('timeupdate',()=>{if(!v.duration)return;const pct=v.currentTime/v.duration*100;for(const n of [25,50,75,95])if(pct>=n)once('VideoProgress',{content_name:'Varam 3D animation',percent:n});});}
})();
