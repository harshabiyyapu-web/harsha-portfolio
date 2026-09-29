const $ = (s) => document.querySelector(s);
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let motionOff = reducedQuery.matches;
const menuButton = $('.menu-toggle');
const menu = $('#mobile-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menu.hidden = !open;
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Open navigation'); }));
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !menu.hidden) { menu.hidden=true; menuButton.setAttribute('aria-expanded','false'); menuButton.focus(); } });
const dialog = $('#certificate-dialog');
document.querySelectorAll('.certificate').forEach(button => button.addEventListener('click', () => {
  $('#dialog-title').textContent = button.dataset.title;
  $('#dialog-image').src = button.dataset.image;
  $('#dialog-image').alt = button.dataset.title;

  dialog.showModal();
  $('#close-dialog').focus();
}));
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});

// DOM-rendered rigid bodies keep text crisp and accessible, without a canvas or scroll hijacking.
const stage = $('#playground');
const blocks = [...document.querySelectorAll('.skill-block')];
const reset = $('#reset-skills');
let physics;
if(window.Matter){
  const {Engine,Bodies,Body,Composite,Constraint,Sleeping} = Matter;
  const engine = Engine.create({enableSleeping:true,positionIterations:8,velocityIterations:6});
  engine.gravity.y=1.15;
  let items=[],bounds=[],visible=false,started=false,raf=0,last=0,drag=null,pending=[],generation=0;
  let width=stage.clientWidth,height=stage.clientHeight;
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function paint(){items.forEach(({body,el,w,h})=>{el.style.transform=`translate3d(${body.position.x-w/2}px,${body.position.y-h/2}px,0) rotate(${body.angle}rad)`;});}
  function tick(time){
    raf=0;
    if(!visible||motionOff||document.hidden)return;
    const delta=last?Math.min(time-last,33.334):16.667;last=time;
    // Bounded substeps keep collisions stable on slower frames.
    const count=Math.ceil(delta/16.667);for(let i=0;i<count;i++)Engine.update(engine,delta/count);
    // Clamp tilt so stacking/collisions never flip a chip past a slight, readable lean.
    const maxTilt=.3;
    items.forEach(({body})=>{
      if(drag&&drag.item.body===body)return;
      let a=body.angle%(Math.PI*2);if(a>Math.PI)a-=Math.PI*2;else if(a<-Math.PI)a+=Math.PI*2;
      if(a>maxTilt){Body.setAngle(body,maxTilt);Body.setAngularVelocity(body,0);}
      else if(a<-maxTilt){Body.setAngle(body,-maxTilt);Body.setAngularVelocity(body,0);}
    });
    paint();
    if(drag||items.some(i=>!i.body.isSleeping)||pending.length)raf=requestAnimationFrame(tick);else last=0;
  }
  function wake(){if(!raf&&visible&&!motionOff&&!document.hidden){last=0;raf=requestAnimationFrame(tick);}}
  function walls(){
    bounds.forEach(b=>Composite.remove(engine.world,b));
    width=stage.clientWidth;height=stage.clientHeight;
    bounds=[Bodies.rectangle(width/2,height+45,width+200,90,{isStatic:true,friction:.5}),Bodies.rectangle(-45,height/2,90,height+2000,{isStatic:true}),Bodies.rectangle(width+45,height/2,90,height+2000,{isStatic:true}),Bodies.rectangle(width/2,-1000,width+200,80,{isStatic:true})];
    Composite.add(engine.world,bounds);
  }
  function release(){
    if(!drag)return;
    Composite.remove(engine.world,drag.constraint);
    const speed={x:Math.max(-18,Math.min(18,drag.vx)),y:Math.max(-18,Math.min(18,drag.vy))};
    Body.setVelocity(drag.item.body,speed);
    try{drag.item.el.releasePointerCapture(drag.pointer);}catch{}
    drag=null;wake();
  }
  function drop(){
    generation++;const token=generation;pending.forEach(clearTimeout);pending=[];release();stop();
    Composite.clear(engine.world,false);Engine.clear(engine);items=[];bounds=[];
    stage.classList.remove('physics-ready');
    blocks.forEach(el=>{el.style.transform='';el.style.visibility='';el.style.width='';});
    if(motionOff){started=false;return;}
    width=stage.clientWidth;height=stage.clientHeight;
    const sizes=blocks.map(el=>({w:Math.min(el.offsetWidth,width-20),h:el.offsetHeight}));
    stage.classList.add('physics-ready');walls();started=true;
    // Evenly spaced, shuffled spawn slots keep the drop readable instead of a random pile-up.
    const n=blocks.length,slot=width/n,order=[...Array(n).keys()];
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    blocks.forEach((el,i)=>{
      el.style.visibility='hidden';
      const timer=setTimeout(()=>{
        pending=pending.filter(id=>id!==timer);if(token!==generation)return;
        const {w,h}=sizes[i];el.style.width=`${w}px`;
        const slotCenter=slot*(order[i]+.5)+(Math.random()-.5)*slot*.3;
        const x=Math.max(w/2+10,Math.min(width-w/2-10,slotCenter));
        const body=Bodies.rectangle(x,-h-25,w,h,{chamfer:{radius:Math.min(h/2-1,18)},restitution:.2,friction:.6,frictionAir:.045,density:.002,sleepThreshold:65,angle:(Math.random()-.5)*.12});
        // Heavier rotational inertia keeps collisions from tipping chips over — a clean fall, not a tumble.
        Body.setInertia(body,body.inertia*14);
        Body.setAngularVelocity(body,(Math.random()-.5)*.01);Composite.add(engine.world,body);
        items.push({body,el,w,h});el.style.visibility='visible';paint();wake();
      },i*100);
      pending.push(timer);
    });wake();
  }
  blocks.forEach(el=>{
    el.setAttribute('aria-label',el.textContent+'. Drag to move, or press Enter to toss.');
    el.addEventListener('pointerdown',e=>{
      if(motionOff||!started||e.button!==0)return;
      const item=items.find(i=>i.el===el);if(!item)return;
      e.preventDefault();release();
      const r=stage.getBoundingClientRect();const point={x:e.clientX-r.left,y:e.clientY-r.top};
      Sleeping.set(item.body,false);
      const a=-item.body.angle,dx=point.x-item.body.position.x,dy=point.y-item.body.position.y;
      const c=Constraint.create({pointA:point,bodyB:item.body,pointB:{x:dx*Math.cos(a)-dy*Math.sin(a),y:dx*Math.sin(a)+dy*Math.cos(a)},stiffness:.16,damping:.12,length:0});
      Composite.add(engine.world,c);drag={constraint:c,item,pointer:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp,vx:0,vy:0};el.setPointerCapture(e.pointerId);wake();
    });
    el.addEventListener('pointermove',e=>{
      if(!drag||drag.pointer!==e.pointerId)return;
      const r=stage.getBoundingClientRect();drag.constraint.pointA={x:Math.max(8,Math.min(width-8,e.clientX-r.left)),y:Math.max(8,Math.min(height-8,e.clientY-r.top))};
      const dt=Math.max(8,e.timeStamp-drag.t);drag.vx=(e.clientX-drag.x)/dt*16.667;drag.vy=(e.clientY-drag.y)/dt*16.667;drag.x=e.clientX;drag.y=e.clientY;drag.t=e.timeStamp;wake();
    });
    el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
    el.addEventListener('click',e=>{if(e.detail!==0||motionOff)return;const item=items.find(i=>i.el===el);if(item){Sleeping.set(item.body,false);Body.setVelocity(item.body,{x:(Math.random()-.5)*12,y:-13});Body.setAngularVelocity(item.body,(Math.random()-.5)*.05);wake();}});
  });
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible){if(!started&&!motionOff)drop();else wake();}else{release();stop();}
  },{threshold:.12}).observe(stage);
  let resizeTimer;
  new ResizeObserver(()=>{
    if(Math.abs(stage.clientWidth-width)<2&&Math.abs(stage.clientHeight-height)<2)return;
    clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(started)drop();else{width=stage.clientWidth;height=stage.clientHeight;}},160);
  }).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){release();stop();}else wake();});
  reset.addEventListener('click',drop);
  physics={drop,stop,wake};
}else{reset.disabled=true;reset.textContent='Skills';}
function setMotion(off){
  motionOff=off;document.body.classList.toggle('motion-off',off);
  $('#motion-toggle').setAttribute('aria-pressed',String(off));
  $('#motion-toggle').textContent=`Motion ${off?'off':'on'} ${off?'○':'◉'}`;
  reset.disabled=off;reset.title=off?'Enable motion in the footer to play':'';
  if(physics)physics.drop();
  if(window.siteMotion)off?window.siteMotion.disable():window.siteMotion.enable();
}
$('#motion-toggle').addEventListener('click',()=>setMotion(!motionOff));
reducedQuery.addEventListener('change',e=>setMotion(e.matches));
if(motionOff)setMotion(true);

// Play the original product animation only while visible; preserve native playback controls.
const productVideo = document.querySelector('#product-video');
if(productVideo){
 let userPaused=false;
 productVideo.addEventListener('pointerdown',()=>{userPaused=true;});
 productVideo.addEventListener('keydown',()=>{userPaused=true;});
 new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting&&!motionOff&&!userPaused)productVideo.play().catch(()=>{});
  else if(!entries[0].isIntersecting)productVideo.pause();
 },{threshold:.35}).observe(productVideo);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)productVideo.pause();});
 document.querySelector('#motion-toggle').addEventListener('click',()=>{if(motionOff)productVideo.pause();});
}

// The live project starts on demand so the rest of the portfolio stays fast.
const geoHome=document.querySelector('#geo-stage');
const geoDialog=document.querySelector('#geo-dialog');
let geoFrame;
function loadGeo(){
 if(!geoFrame){
  geoFrame=document.createElement('iframe');geoFrame.title='GeoPulse interactive website';
  geoFrame.src='https://geopulse-ai.lovable.app/';geoFrame.referrerPolicy='strict-origin-when-cross-origin';
  geoFrame.setAttribute('allow','fullscreen');
  geoFrame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
  geoHome.replaceChildren(geoFrame);document.querySelector('#geo-reload').hidden=false;
 }
 return geoFrame;
}
document.querySelector('#geo-launch').addEventListener('click',loadGeo);
document.querySelector('#geo-expand').addEventListener('click',()=>{document.querySelector('#geo-expanded-stage').append(loadGeo());geoDialog.showModal();document.querySelector('#geo-close').focus();});
document.querySelector('#geo-close').addEventListener('click',()=>geoDialog.close());
geoDialog.addEventListener('close',()=>{if(geoFrame)geoHome.append(geoFrame);document.querySelector('#geo-expand').focus();});
document.querySelector('#geo-reload').addEventListener('click',()=>{if(geoFrame)geoFrame.src='https://geopulse-ai.lovable.app/';});

const galleryPhotos=[["photo-01", "Harsha Biyyapu"], ["photo-02", "By the sea"], ["photo-11", "GeoPulse at Mesa"], ["photo-16", "Between classes"], ["photo-09", "At my desk"], ["photo-14", "At IIM Bangalore"], ["photo-04", "Build. Break. Learn. Repeat."], ["photo-03", "A quiet afternoon"], ["photo-10", "A conversation in progress"], ["photo-08", "A win to remember"], ["photo-07", "Together, outdoors"], ["photo-15", "Taking the scenic route"], ["photo-12", "Finding my rhythm"], ["photo-13", "School memories"], ["photo-06", "Out in the hills"], ["photo-05", "A moment between plans"]];
const photoDialog=document.querySelector('#photo-dialog');let photoIndex=0;
function displayPhoto(index){photoIndex=(index+galleryPhotos.length)%galleryPhotos.length;const [file,caption]=galleryPhotos[photoIndex];document.querySelector('#photo-full').src=`assets/gallery/${file}.webp`;document.querySelector('#photo-full').alt=caption;document.querySelector('#photo-caption').textContent=caption;document.querySelector('#photo-count').textContent=`${photoIndex+1} / ${galleryPhotos.length}`;}
document.querySelectorAll('[data-photo]').forEach(b=>b.addEventListener('click',()=>{displayPhoto(Number(b.dataset.photo));photoDialog.showModal();document.querySelector('#photo-close').focus();}));
document.querySelector('#photo-close').addEventListener('click',()=>photoDialog.close());
document.querySelector('#photo-next').addEventListener('click',()=>displayPhoto(photoIndex+1));
document.querySelector('#photo-prev').addEventListener('click',()=>displayPhoto(photoIndex-1));
photoDialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();displayPhoto(photoIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();displayPhoto(photoIndex-1);}});
document.querySelector('#gallery-more').addEventListener('click',e=>{const b=e.currentTarget;const show=b.getAttribute('aria-expanded')!=='true';document.querySelectorAll('[data-photo]').forEach((el,i)=>{if(i>=6)el.hidden=!show;});b.setAttribute('aria-expanded',String(show));b.textContent=show?'Show fewer photos −':'See all 16 photos ＋';document.querySelector('#gallery-count').textContent=show?'16 / 16 MOMENTS':'06 / 16 MOMENTS';layoutGallery();if(!show)document.querySelector('#gallery').scrollIntoView({block:'start',behavior:motionOff?'instant':'smooth'});});

// Use each photo's own proportions to build a responsive masonry grid.
const photoGrid=document.querySelector('.photo-grid');
function layoutGallery(){
 const gap=parseFloat(getComputedStyle(photoGrid).rowGap)||16;
 photoGrid.querySelectorAll('[data-photo]').forEach(card=>{if(card.hidden)return;const img=card.querySelector('img');const height=card.clientWidth*Number(img.getAttribute('height'))/Number(img.getAttribute('width'));card.style.gridRowEnd=`span ${Math.ceil((height+gap)/(4+gap))}`;});
}
new ResizeObserver(layoutGallery).observe(photoGrid);
layoutGallery();
