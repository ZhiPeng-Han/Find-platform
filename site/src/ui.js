/* ---------- 声音（默认关闭） ---------- */
const Sound={on:false,ctx:null,
  init(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}},
  burst(t0,dur,freq,gain){const c=this.ctx;if(!c)return;const n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,4);
    const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=1.2;const g=c.createGain();g.gain.value=gain;s.connect(f);f.connect(g);g.connect(c.destination);s.start(c.currentTime+t0)},
  play(kind){if(!this.on)return;this.init();if(!this.ctx)return;
    if(this.ctx.state==='suspended')this.ctx.resume();
    if(kind==='detent')this.burst(0,.012,3800,.25);
    else if(kind==='shutter'){this.burst(0,.035,1800,.9);this.burst(.07,.05,1200,.8)}
    else if(kind==='lever'){for(let i=0;i<5;i++)this.burst(i*.022,.012,2600+i*120,.25)}
    else if(kind==='switch')this.burst(0,.02,2400,.5)}
};

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const yuan=n=>'¥'+Math.round(n).toLocaleString('en-US');
const screws=()=>['tl','tr','bl','br'].map(p=>`<i class="screw ${p}" style="--r:${Math.round(Math.random()*160)}deg"></i>`).join('');

/* ---------- 拨动开关 ---------- */
function swHTML(id,label,on,led){
  return `<button type="button" class="sw" id="${id}" role="switch" aria-checked="${on?'true':'false'}"><span class="sw-track"><span class="sw-knob"></span></span>${led?`<span class="led ${on?'':'off'}"></span>`:''}<span class="sw-label">${label}</span></button>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('.sw');if(!b)return;
  const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);
  const l=b.querySelector('.led');if(l)l.classList.toggle('off',!on);
  Sound.play('switch');b.dispatchEvent(new CustomEvent('toggle',{bubbles:true,detail:on}));
});
const swOn=id=>{const b=document.getElementById(id);return !!b&&b.getAttribute('aria-checked')==='true'};

/* ---------- 光圈环（单选） ---------- */
function fstopsHTML(id,opts,sel,label){
  return `<div class="fstops" id="${id}" role="radiogroup" aria-label="${label}" style="--n:${opts.length}">`+
    opts.map((o,i)=>`<button type="button" role="radio" data-v="${esc(o.v)}" aria-checked="${o.v===sel}" tabindex="${o.v===sel?0:-1}">${o.t}${o.s?`<small>${o.s}</small>`:''}</button>`).join('')+`</div>`;
}
function fsSelect(btn){
  const g=btn.closest('.fstops');g.querySelectorAll('button').forEach(x=>{x.setAttribute('aria-checked',x===btn);x.tabIndex=x===btn?0:-1});
  Sound.play('detent');g.dispatchEvent(new CustomEvent('pick',{bubbles:true,detail:btn.dataset.v}));
}
document.addEventListener('click',e=>{const b=e.target.closest('.fstops button');if(b)fsSelect(b)});
document.addEventListener('keydown',e=>{
  const b=e.target.closest&&e.target.closest('.fstops button');if(!b)return;
  const all=[...b.parentNode.querySelectorAll('button')],i=all.indexOf(b);let j=-1;
  if(e.key==='ArrowRight'||e.key==='ArrowDown')j=Math.min(all.length-1,i+1);
  if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=Math.max(0,i-1);
  if(j>=0){e.preventDefault();fsSelect(all[j]);all[j].focus()}
});
const fsVal=id=>{const b=document.querySelector(`#${id} [aria-checked="true"]`);return b?b.dataset.v:null};

/* ---------- 滚花转盘 ---------- */
function Dial(el,o){
  const opts=o.options,n=opts.length,size=o.size||180,arc=o.arc||300,step=arc>=360?360/n:arc/(n-1);
  let idx=Math.max(0,o.value||0);
  el.className='dial'+(o.black?' black':'');el.style.setProperty('--size',size+'px');el.style.setProperty('--fs',(o.fs||13)+'px');
  el.innerHTML=`<div class="dial-shadow"></div><div class="dial-knob" tabindex="0" role="slider" aria-label="${esc(o.label)}" aria-valuemin="0" aria-valuemax="${n-1}"><div class="dial-face"></div><div class="dial-lab"></div><div class="dial-cap"></div></div><div class="dial-index"></div>`;
  const knob=el.querySelector('.dial-knob'),lab=el.querySelector('.dial-lab'),R=size*(o.radius||.33);
  opts.forEach((op,i)=>{const sp=document.createElement('span');sp.textContent=op.t;sp.dataset.i=i;if(op.cls)sp.className=op.cls;
    sp.style.transformOrigin='0 0';sp.style.transform=`rotate(${i*step}deg) translateY(${-R}px) translate(-50%,-50%)`;lab.appendChild(sp)});
  if(o.ticks){for(let i=0;i<n;i++){const t=document.createElement('span');t.className='tick';t.textContent='▪';t.style.transformOrigin='0 0';t.style.transform=`rotate(${i*step}deg) translateY(${-size*.43}px) translate(-50%,-50%)`;lab.appendChild(t)}}
  let rot=-idx*step;
  const paint=()=>{knob.style.setProperty('--rot',rot+'deg');knob.setAttribute('aria-valuenow',idx);knob.setAttribute('aria-valuetext',opts[idx].t)};
  const set=(i,silent)=>{i=arc>=360?((i%n)+n)%n:Math.max(0,Math.min(n-1,i));const ch=i!==idx;idx=i;rot=-idx*step;paint();if(ch&&!silent){Sound.play('detent');o.onChange&&o.onChange(opts[idx].v,idx)}};
  paint();
  let drag=null;
  const ang=e=>{const r=knob.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
  knob.addEventListener('pointerdown',e=>{drag={a0:ang(e),r0:rot,x:e.clientX,y:e.clientY,moved:false,last:idx,t:e.target};knob.setPointerCapture(e.pointerId);el.classList.add('dragging')});
  knob.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)drag.moved=true;if(!drag.moved)return;
    let d=ang(e)-drag.a0;if(d>180)d-=360;if(d<-180)d+=360;rot=drag.r0+d;
    if(arc<360)rot=Math.max(-(n-1)*step-8,Math.min(8,rot));
    knob.style.setProperty('--rot',rot+'deg');const near=Math.round(-rot/step);if(near!==drag.last){drag.last=near;Sound.play('detent')}});
  const end=()=>{if(!drag)return;el.classList.remove('dragging');const d=drag;drag=null;
    if(!d.moved){const t=d.t.closest&&d.t.closest('[data-i]');if(t){set(+t.dataset.i);return}paint();return}
    const i=Math.round(-rot/step);const was=idx;idx=-1;set(i,true);if(idx!==was)o.onChange&&o.onChange(opts[idx].v,idx)};
  knob.addEventListener('pointerup',end);knob.addEventListener('pointercancel',end);
  knob.addEventListener('keydown',e=>{const k=e.key;let d=0;if(k==='ArrowRight'||k==='ArrowUp')d=1;else if(k==='ArrowLeft'||k==='ArrowDown')d=-1;else if(k==='Home'){e.preventDefault();set(0);return}else if(k==='End'){e.preventDefault();set(n-1);return}
    if(d){e.preventDefault();set(idx+d)}});
  return {set:(i,s)=>set(i,s),get:()=>opts[idx].v,index:()=>idx};
}

/* ---------- 卷片拨杆 ---------- */
function Lever(el,onAdvance){
  el.className='advance';
  el.innerHTML=`<div class="adv-hub"></div><div class="adv-arm" role="button" tabindex="0" aria-label="扳动卷片拨杆，换下一台"></div><div class="adv-cap"></div><span class="adv-hint">扳动拨杆过片 ⟳</span>`;
  const arm=el.querySelector('.adv-arm');let drag=null;
  const angle=e=>{const r=el.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+56),e.clientX-(r.left+56))*180/Math.PI};
  const setA=a=>arm.style.setProperty('--a',a+'deg');
  const stroke=()=>{Sound.play('lever');el.classList.remove('dragging');setA(128);setTimeout(()=>{setA(0);onAdvance()},230)};
  arm.addEventListener('pointerdown',e=>{drag={fired:false,moved:false,x:e.clientX,y:e.clientY};arm.setPointerCapture(e.pointerId)});
  arm.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4){drag.moved=true;el.classList.add('dragging')}if(!drag.moved)return;
    let a=angle(e);if(a<-30)a+=360;a=Math.max(0,Math.min(132,a));setA(a);if(a>105&&!drag.fired){drag.fired=true;Sound.play('lever')}});
  const end=()=>{if(!drag)return;const d=drag;drag=null;el.classList.remove('dragging');if(!d.moved){stroke();return}setA(0);if(d.fired)setTimeout(onAdvance,120)};
  arm.addEventListener('pointerup',end);arm.addEventListener('pointercancel',end);
  arm.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();stroke()}});
}

/* ---------- 对焦环价格滑块（对数刻度） ---------- */
const P_MIN=1000,P_MAX=40000;
const t2p=t=>P_MIN*Math.pow(P_MAX/P_MIN,t/100);
const p2t=p=>100*Math.log(p/P_MIN)/Math.log(P_MAX/P_MIN);
function ringHTML(id,a,b,label){
  const marks=[1000,2000,3000,5000,10000,20000,40000];
  let sc='';for(let t=0;t<=100;t+=2.5)sc+=`<i style="left:${t}%"></i>`;
  marks.forEach(m=>{const t=p2t(m);sc+=`<i class="major" style="left:${t}%"></i><b class="${m>=10000?'o':''}" style="left:${t}%">${m>=10000?(m/10000)+'万':(m/1000)+'k'}</b>`});
  return `<div class="ring" id="${id}"><div class="ring-scale">${sc}</div>
   <input type="range" id="${id}-a" min="0" max="100" step="0.5" value="${a}" aria-label="${label}下限">
   <input type="range" id="${id}-b" min="0" max="100" step="0.5" value="${b}" aria-label="${label}上限"></div>`;
}
function bindRing(id,onChange){
  const A=document.getElementById(id+'-a'),B=document.getElementById(id+'-b');let last=[A.value,B.value].join();
  const fix=src=>{if(+A.value>+B.value-4){if(src===A)A.value=+B.value-4;else B.value=+A.value+4}
    A.setAttribute('aria-valuetext',yuan(t2p(+A.value)));B.setAttribute('aria-valuetext',yuan(t2p(+B.value)));
    const k=[A.value,B.value].join();if(k!==last){last=k;Sound.play('detent')}onChange(t2p(+A.value),t2p(+B.value))};
  A.addEventListener('input',()=>fix(A));B.addEventListener('input',()=>fix(B));fix(null);
}
