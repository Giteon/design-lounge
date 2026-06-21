/* ============================================================
   DESIGN LOUNGE — interactions
   ============================================================ */
document.documentElement.classList.add('js');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = window.matchMedia('(hover:none), (pointer:coarse)').matches;
const hasGSAP = typeof window.gsap !== 'undefined';
const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

/* ---------- Preloader (single clean wipe, fires intro exactly once) ---------- */
(function preloader(){
  const pre = document.getElementById('preloader');
  const bar = document.getElementById('preBar');
  const count = document.getElementById('preCount');
  if(!pre){ introAnimation(); return; }

  let done = false, tick = null;
  function finish(){
    if(done) return;
    done = true;
    if(tick) clearInterval(tick);
    if(bar) bar.style.width = '100%';
    if(count) count.textContent = '100';
    // Lift the curtain (CSS transition) and reveal the hero (CSS via .ready).
    // setTimeout fires even when the tab/RAF is throttled, so this never gets stuck.
    pre.classList.add('hide');
    setTimeout(introAnimation, 300);
    setTimeout(()=>{ pre.style.display = 'none'; }, 950);
  }

  if(REDUCED){ pre.style.display='none'; introAnimation(); return; }

  let p = 0;
  tick = setInterval(()=>{
    p = Math.min(100, p + Math.random()*14 + 9);
    if(bar) bar.style.width = p + '%';
    if(count) count.textContent = Math.floor(p);
    if(p >= 100){ clearInterval(tick); tick = null; setTimeout(finish, 170); }
  }, 95);

  // safety nets — whichever fires first wins, finish() is idempotent
  window.addEventListener('load', ()=> setTimeout(finish, 140));
  setTimeout(finish, 2400);
})();

/* ---------- Hero intro (CSS-driven; runs exactly once) ---------- */
let introPlayed = false;
function introAnimation(){
  if(introPlayed) return;
  introPlayed = true;
  document.documentElement.classList.add('ready');
}

/* ---------- Lenis smooth scroll ---------- */
let lenis = null;
if(typeof window.Lenis !== 'undefined' && !REDUCED){
  lenis = new Lenis({ lerp:0.1, smoothWheel:true, wheelMultiplier:1 });
  if(hasST){
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t)=> lenis.raf(t*1000));
  } else {
    const raf = (t)=>{ lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}
function scrollTo(target){
  const el = typeof target==='string' ? document.querySelector(target) : target;
  if(!el) return;
  if(lenis) lenis.scrollTo(el, { offset:0 });
  else el.scrollIntoView({ behavior:'smooth' });
}

/* ---------- Anchor links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href');
    if(id.length < 2) return;
    const el = document.querySelector(id);
    if(!el) return;
    e.preventDefault();
    closeMenu();
    scrollTo(el);
  });
});

/* ---------- Reveal animations ---------- */
(function reveals(){
  const items = document.querySelectorAll('[data-animate]');
  // hero items are handled by intro; exclude them here
  const targets = [...items].filter(el=> !el.closest('.hero'));
  if(hasST && !REDUCED){
    targets.forEach(el=>{
      gsap.to(el, {
        opacity:1, y:0, duration:0.95, ease:'power3.out',
        scrollTrigger:{ trigger:el, start:'top 86%' }
      });
    });
  } else {
    // IO fallback
    if('IntersectionObserver' in window && !REDUCED){
      const io = new IntersectionObserver((es)=>{
        es.forEach(en=>{ if(en.isIntersecting){ en.target.style.opacity=1; en.target.style.transform='none'; io.unobserve(en.target); } });
      }, { threshold:0.12 });
      targets.forEach(el=> io.observe(el));
    } else {
      targets.forEach(el=>{ el.style.opacity=1; el.style.transform='none'; });
    }
  }
})();

/* ---------- Nav scrolled + progress ---------- */
(function navState(){
  const nav = document.getElementById('nav');
  const prog = document.getElementById('progress');
  function onScroll(){
    const y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle('scrolled', y > 40);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if(prog) prog.style.transform = 'scaleX(' + (h>0 ? Math.min(1, y/h) : 0) + ')';
  }
  if(lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

/* ---------- Mobile menu ---------- */
const navToggle = document.getElementById('navToggle');
function closeMenu(){ document.body.classList.remove('menu-open'); if(lenis) lenis.start(); }
function toggleMenu(){
  const open = document.body.classList.toggle('menu-open');
  if(lenis){ open ? lenis.stop() : lenis.start(); }
}
if(navToggle) navToggle.addEventListener('click', toggleMenu);

/* ---------- Events accordion ---------- */
(function accordion(){
  const items = document.querySelectorAll('#acc .acc-item');
  items.forEach(item=>{
    const head = item.querySelector('.acc-head');
    head.addEventListener('click', ()=>{
      const isActive = item.classList.contains('active');
      items.forEach(i=>{ i.classList.remove('active'); i.querySelector('.acc-head').setAttribute('aria-expanded','false'); });
      if(!isActive){ item.classList.add('active'); head.setAttribute('aria-expanded','true'); }
      if(hasST) ScrollTrigger.refresh();
    });
  });
})();

/* ---------- Stats count-up ---------- */
(function counts(){
  const nums = document.querySelectorAll('[data-count]');
  function run(el){
    const raw = el.dataset.count || '0';
    const target = parseFloat(raw);
    const suffix = el.dataset.suffix || '';
    const decimals = (raw.split('.')[1] || '').length;
    const fmt = (n)=> decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
    const sfx = suffix ? `<span class="num-suf${suffix==='★'?' star':''}">${suffix}</span>` : '';
    if(REDUCED){ el.innerHTML = fmt(target) + sfx; return; }
    const dur = 1400; const t0 = performance.now();
    function frame(t){
      const p = Math.min(1, (t-t0)/dur);
      const eased = 1 - Math.pow(1-p, 3);
      el.innerHTML = fmt(target*eased) + sfx;
      if(p<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if(hasST && !REDUCED){
    nums.forEach(el=> ScrollTrigger.create({ trigger:el, start:'top 90%', once:true, onEnter:()=>run(el) }));
  } else if('IntersectionObserver' in window){
    const io = new IntersectionObserver((es)=>{ es.forEach(en=>{ if(en.isIntersecting){ run(en.target); io.unobserve(en.target); } }); }, { threshold:0.5 });
    nums.forEach(el=> io.observe(el));
  } else nums.forEach(run);
})();

/* ---------- Parallax (about image + hero art) ---------- */
(function parallax(){
  if(!hasST || REDUCED) return;
  const img = document.getElementById('aboutImg');
  if(img){
    gsap.fromTo(img, { yPercent:-8 }, { yPercent:8, ease:'none',
      scrollTrigger:{ trigger:'.about-frame', start:'top bottom', end:'bottom top', scrub:true } });
  }
  // marquee skew on scroll velocity
  const mt = document.getElementById('marquee');
  if(mt){
    let to;
    ScrollTrigger.create({ onUpdate:(self)=>{
      const v = gsap.utils.clamp(-12, 12, self.getVelocity()/-260);
      gsap.to(mt, { skewX:v, duration:0.3, overwrite:true });
      clearTimeout(to); to=setTimeout(()=> gsap.to(mt,{ skewX:0, duration:0.5 }),120);
    }});
  }
})();

/* ---------- Hero art mouse + scroll parallax ---------- */
(function heroArt(){
  const art = document.getElementById('heroArt');
  if(!art || REDUCED) return;
  // subtle scroll drift on the inner image (desktop + mobile) — kept on the
  // child so it doesn't fight the cursor/idle-bob transforms on the container
  const img = art.querySelector('img');
  if(hasST && img){
    gsap.fromTo(img, { yPercent:-6 }, { yPercent:6, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true } });
  }
  // cursor parallax (desktop only)
  if(TOUCH) return;
  const qx = hasGSAP ? gsap.quickTo(art,'x',{duration:0.8,ease:'power3'}) : null;
  const qy = hasGSAP ? gsap.quickTo(art,'y',{duration:0.8,ease:'power3'}) : null;
  // gentle idle bob
  if(hasGSAP) gsap.to(art, { yPercent:'+=3', duration:3.4, ease:'sine.inOut', yoyo:true, repeat:-1 });
  window.addEventListener('mousemove', (e)=>{
    const dx = (e.clientX/window.innerWidth - 0.5);
    const dy = (e.clientY/window.innerHeight - 0.5);
    if(qx){ qx(dx*-30); qy(dy*-22); }
  });
})();

/* ---------- Custom cursor + magnetic ---------- */
(function cursor(){
  if(TOUCH) return;
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  if(!dot || !ring) return;
  document.body.classList.add('cursor-on');
  let mx=innerWidth/2, my=innerHeight/2, rx=mx, ry=my;
  window.addEventListener('mousemove', (e)=>{ mx=e.clientX; my=e.clientY; dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`; });
  (function loop(){ rx+=(mx-rx)*0.18; ry+=(my-ry)*0.18; ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  document.querySelectorAll('a, button, [data-cursor], .g-item, input').forEach(el=>{
    el.addEventListener('mouseenter', ()=> ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', ()=> ring.classList.remove('is-hover'));
  });
  // magnetic
  if(hasGSAP){
    document.querySelectorAll('.magnetic').forEach(el=>{
      const inner = el.querySelector('.btn-inner') || el;
      const qx = gsap.quickTo(el,'x',{duration:0.5,ease:'power3'});
      const qy = gsap.quickTo(el,'y',{duration:0.5,ease:'power3'});
      const ix = gsap.quickTo(inner,'x',{duration:0.5,ease:'power3'});
      const iy = gsap.quickTo(inner,'y',{duration:0.5,ease:'power3'});
      el.addEventListener('mousemove', (e)=>{
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left+r.width/2);
        const y = e.clientY - (r.top+r.height/2);
        qx(x*0.35); qy(y*0.45); ix(x*0.15); iy(y*0.2);
      });
      el.addEventListener('mouseleave', ()=>{ qx(0); qy(0); ix(0); iy(0); });
    });
  }
})();

/* ---------- Gallery tilt ---------- */
(function tilt(){
  if(TOUCH || REDUCED) return;
  document.querySelectorAll('[data-tilt]').forEach(el=>{
    const img = el.querySelector('img');
    el.addEventListener('mousemove', (e)=>{
      const r = el.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width - 0.5;
      const py = (e.clientY-r.top)/r.height - 0.5;
      if(hasGSAP) gsap.to(el, { rotateY:px*7, rotateX:-py*7, duration:0.5, transformPerspective:900, ease:'power2' });
    });
    el.addEventListener('mouseleave', ()=>{ if(hasGSAP) gsap.to(el, { rotateY:0, rotateX:0, duration:0.6, ease:'power3' }); });
  });
})();

/* ---------- Signup ---------- */
(function signup(){
  const sec = document.getElementById('signup');
  const form = sec && sec.querySelector('.signup-form');
  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if(!input.value || !input.checkValidity()){ input.focus(); input.style.borderColor='var(--rose)'; return; }
    const btn = form.querySelector('button[type="submit"]');
    if(btn){ btn.disabled = true; btn.classList.add('is-loading'); }
    try{
      // Apps Script Web App returns no CORS headers, so the response is opaque (no-cors).
      // A resolved fetch means the row was posted; only a network failure rejects.
      // Form-encoded body so the script's e.parameter.email reads correctly.
      await fetch(form.action, { method:'POST', mode:'no-cors', body: new URLSearchParams({ email: input.value.trim() }) });
      sec.classList.add('done');
    } catch(_){ input.style.borderColor='var(--rose)'; if(btn){ btn.disabled = false; btn.classList.remove('is-loading'); } }
  });
})();

/* ---------- Back to top ---------- */
const toTop = document.getElementById('toTop');
if(toTop) toTop.addEventListener('click', ()=> scrollTo('#top'));

/* ============================================================
   THREE.JS — champagne / candlelight particles
   ============================================================ */
(function heroParticles(){
  const canvas = document.getElementById('heroCanvas');
  if(!canvas || typeof window.THREE === 'undefined' || REDUCED) {
    if(canvas) canvas.style.background = 'transparent';
    return;
  }
  let renderer, scene, camera, points, raf;
  const COUNT = TOUCH ? 70 : 170;
  const sizes = { w: innerWidth, h: innerHeight };
  let mouseX = 0, mouseY = 0;

  function sprite(){
    const c = document.createElement('canvas'); c.width=c.height=64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32,32,0,32,32,32);
    grd.addColorStop(0,'rgba(255,238,200,1)');
    grd.addColorStop(0.25,'rgba(233,207,153,0.7)');
    grd.addColorStop(1,'rgba(233,207,153,0)');
    g.fillStyle=grd; g.beginPath(); g.arc(32,32,32,0,Math.PI*2); g.fill();
    const t = new THREE.Texture(c); t.needsUpdate=true; return t;
  }

  try{
    renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:false, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(sizes.w, sizes.h);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, sizes.w/sizes.h, 0.1, 100);
    camera.position.z = 26;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT*3);
    const speed = new Float32Array(COUNT);
    const sway = new Float32Array(COUNT);
    const scl = new Float32Array(COUNT);
    for(let i=0;i<COUNT;i++){
      pos[i*3]   = (Math.random()-0.5)*52;
      pos[i*3+1] = (Math.random()-0.5)*46;
      pos[i*3+2] = (Math.random()-0.5)*22;
      speed[i] = 0.012 + Math.random()*0.03;
      sway[i]  = Math.random()*Math.PI*2;
      scl[i]   = 0.4 + Math.random()*1.4;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));

    const mat = new THREE.PointsMaterial({
      size: 0.9, map: sprite(), transparent:true, depthWrite:false,
      blending: THREE.AdditiveBlending, opacity:0.9,
      color: 0xe9cf99, sizeAttenuation:true
    });
    points = new THREE.Points(geo, mat);
    scene.add(points);

    const clock = new THREE.Clock();
    function frame(){
      const t = clock.getElapsedTime();
      const arr = geo.attributes.position.array;
      for(let i=0;i<COUNT;i++){
        arr[i*3+1] += speed[i];                       // rise
        arr[i*3]   += Math.sin(t*0.6 + sway[i])*0.006; // sway
        if(arr[i*3+1] > 24){ arr[i*3+1] = -24; arr[i*3] = (Math.random()-0.5)*52; }
      }
      geo.attributes.position.needsUpdate = true;
      points.rotation.y += 0.0006;
      // subtle mouse parallax
      camera.position.x += (mouseX*3 - camera.position.x)*0.04;
      camera.position.y += (-mouseY*2 - camera.position.y)*0.04;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    frame();

    window.addEventListener('mousemove', (e)=>{ mouseX = e.clientX/innerWidth - 0.5; mouseY = e.clientY/innerHeight - 0.5; });
    window.addEventListener('resize', ()=>{
      sizes.w = innerWidth; sizes.h = innerHeight;
      camera.aspect = sizes.w/sizes.h; camera.updateProjectionMatrix();
      renderer.setSize(sizes.w, sizes.h);
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    }, { passive:true });

    // pause when hero off-screen
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((es)=>{
        es.forEach(en=>{ if(en.isIntersecting){ if(!raf) frame(); } else { cancelAnimationFrame(raf); raf=null; } });
      }, { threshold:0 });
      io.observe(canvas);
    }
  }catch(err){
    console.warn('Hero particles disabled:', err);
  }
})();
