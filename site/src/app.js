const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const APP=$('#app');
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const WATCH=new Set(load('find.watch',[]));
const isWatched=id=>WATCH.has(id);
function toggleWatch(id,on){on?WATCH.add(id):WATCH.delete(id);save('find.watch',[...WATCH]);const n=$('#fc-n');n.textContent=WATCH.size;
  const w=n.parentNode;w.classList.remove('bump');void w.offsetWidth;w.classList.add('bump');toast(on?'已加入关注。点右上角的计数窗可以随时查看':'已取消关注')}
let toastT=0;
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;t.classList.remove('out');clearTimeout(toastT);toastT=setTimeout(()=>{t.classList.add('out');setTimeout(()=>{t.hidden=true},260)},2600)}
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function tilt(stage){
  if(!stage||reduceMotion()||matchMedia('(hover: none)').matches)return;
  const cam=stage.querySelector('.cam');
  stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    cam.style.transform=`perspective(1000px) rotateY(${(x*12).toFixed(2)}deg) rotateX(${(-y*8).toFixed(2)}deg) translateZ(10px)`;
    stage.style.setProperty('--gx',((x+.5)*100).toFixed(1)+'%');stage.style.setProperty('--gy',((y+.5)*100).toFixed(1)+'%')});
  stage.addEventListener('pointerleave',()=>{cam.style.transform=''});
}
function draft(k,ids,after){
  const key='find.draft.'+k,d=load(key,null);
  if(d&&ids.some(id=>d[id])){ids.forEach(id=>{if(d[id])$('#'+id).value=d[id]});after&&after();toast('已恢复你上次没填完的内容')}
  let t=0;ids.forEach(id=>$('#'+id).addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{const o={};ids.forEach(i=>o[i]=$('#'+i).value);save(key,o)},400)}));
}
function hintContact(inp){
  const h=document.createElement('small');h.className='hint';h.setAttribute('aria-live','polite');inp.after(h);
  inp.addEventListener('blur',()=>{const v=inp.value.trim();
    h.textContent=!v||/^1\d{10}$/.test(v.replace(/[\s-]/g,''))||/^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/.test(v)?'':'看起来不像手机号或微信号，提交前再确认一下。'});
}
const PRESETS=[
  {t:'第一台胶片机 · 两千五以内',c:'',s:{hi:p2t(2500)}},
  {t:'不用电池的全机械',c:'red',s:{mech:true}},
  {t:'口袋里的便携机',c:'blue',s:{cat:'cp'}},
  {t:'中画幅',c:'',s:{cat:'mf'}},
  {t:'老镜头',c:'red',s:{cat:'lens'}},
  {t:'早期数码 CCD',c:'blue',s:{cat:'dig'}}
];
const FAQ=[
  ['怎么付款？','走第三方担保交易。你收到器材、对照护照验完机，确认收货后款项才会结算给卖家。'],
  ['怎么寄送？','顺丰保价，防震包装。随机附上器材护照、测试卷印样，以及主人的信或留言原件。'],
  ['收到后和描述不一样怎么办？','和护照描述不符的，收到后 7 天内可以原样退回，来回运费由 Find 承担。'],
  ['能先看实物吗？','可以预约看机。不方便的话，告诉我们想看哪里，我们拍细节视频给你。'],
  ['以后想换一台怎么办？','在 Find 买的器材，180 天内可以按成交价 70% 回购，或者按 80% 抵扣换购下一台。']
];
function recentHTML(){
  const ids=load('find.recent',[]).filter(id=>STOCK.find(s=>s.id===id));if(!ids.length)return '';
  return `<div class="sec-h"><div><span class="dymo blue">足迹</span><h2>你最近看过</h2></div></div><div class="recent">${ids.map(id=>{const it=STOCK.find(s=>s.id===id);
    return `<a class="rc chrome" href="#item-${it.id}"><span class="rc-cam velvet">${camSVG(it.r,it.f,{mark:it.mark,wear:it.grade,seed:it.id})}</span><span><b>${esc(it.name)}</b><small>${yuan(it.price)} · ${it.status}</small></span></a>`}).join('')}</div>`;
}
const today=()=>{const d=new Date();return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`};
const refNo=k=>({sell:'JS',find:'XW',buy:'YY'}[k]||'FD')+'-'+Date.now().toString(36).slice(-6).toUpperCase();

/* ---------- 补全每台器材的检测数据 ---------- */
const PARTS={slr:['外观','取景器','快门','测光','卷片与计数'],rf:['外观','取景器与测距','快门','测光','卷片'],cp:['外观','液晶屏','镜头光学','对焦','快门与闪光'],mf:['外观','取景器','快门','后背与片夹','镜头光学'],lens:['外观','镜片','光圈叶片','对焦','卡口'],dig:['外观','传感器','屏幕','电池与存储卡','镜头']};
const LOOK={'A+':'几乎没有使用痕迹','A':'边角有极轻微的使用痕迹','AB':'边角有正常使用痕迹，无凹陷','B':'有明显磨损和细小划痕，无凹陷','C':'有磕碰或较多掉漆'};
const OKTXT={'取景器':'明亮，轻微尘点不影响对焦','取景器与测距':'测距斑清晰，上下重合准确','快门':'各档实测在 ±1/3 EV 以内','测光':'与标准测光表偏差在 0.3 EV 以内','卷片与计数':'顺畅，计数器归零正常','卷片':'顺畅，无异响','液晶屏':'显示完整，没有漏液','镜头光学':'无霉、无雾、无划痕','对焦':'对焦准确，马达无异响','快门与闪光':'快门与闪光均正常','后背与片夹':'片夹平整，无漏光','镜片':'无霉、无雾、无划痕','光圈叶片':'干净无油，回弹迅速','卡口':'卡口无磨损','传感器':'无坏点','屏幕':'显示正常','电池与存储卡':'原装电池续航正常','镜头':'伸缩顺畅，无异响'};
const CHECKS={
  slr:[['ok','快门帘外观'],['ok','反光镜与阻尼'],['fix','遮光海绵','原海绵老化，已更换'],['ok','测光表'],['ok','自拍机构'],['ok','后盖锁扣'],['ok','铭牌与序列号','与机身记录一致'],['ok','改装与非原厂零件','未发现']],
  rf:[['ok','测距器校准'],['ok','取景器框线'],['ok','快门帘'],['fix','遮光海绵','已更换'],['ok','测光表'],['ok','铭牌与序列号','与机身记录一致'],['ok','改装与仿制','未发现']],
  cp:[['ok','液晶屏','没有漏液'],['ok','镜头盖与伸缩马达'],['ok','自动对焦'],['ok','闪光灯'],['ok','电池仓','无氧化'],['ok','胶片压板'],['ok','外壳','无裂纹'],['ok','序列号','与机身记录一致']],
  mf:[['ok','镜间快门逐档'],['ok','取景屏'],['ok','后背片夹'],['fix','遮光海绵','已更换'],['ok','卷片与计数'],['ok','序列号','与机身记录一致']],
  lens:[['ok','背光检查'],['ok','光圈叶片','干净无油'],['ok','对焦阻尼'],['ok','卡口'],['ok','前后盖','原装']],
  dig:[['ok','传感器坏点','未发现'],['ok','屏幕'],['ok','电池续航'],['ok','存储卡槽'],['ok','镜头伸缩'],['ok','按键与转盘']]
};
STOCK.forEach(it=>{
  const R=rng(it.id),g=it.grade;
  if(!it.parts)it.parts=PARTS[it.cat].map((p,i)=>i===0?[p,g,LOOK[g]]:[p,(g==='B'||g==='C')?'AB':'A',OKTXT[p]||'正常']);
  if(!it.dev)it.dev=SPEEDS.map((s,i)=>+(((R()-.5)*.14)-Math.max(0,i-8)*.035*(.5+R())).toFixed(2));
  if(!it.dust){const n={'A+':0,'A':1,'AB':2,'B':3,'C':4}[g];it.dust=[];for(let i=0;i<n;i++){const a=R()*Math.PI*2,r=.2+R()*.55;it.dust.push([Math.cos(a)*r,Math.sin(a)*r,'微尘 · 第 '+(1+Math.floor(R()*5))+' 片'])}}
  if(!it.checks)it.checks=CHECKS[it.cat];
});
const forSale=()=>STOCK.filter(s=>s.status!=='已售');
const catName=id=>(CATS.find(c=>c.id===id)||{}).n||'';

/* ---------- 数据（受邀成员可在线提交） ---------- */
let DB=null,UID_=null,ADMIN=false,unsubInbox=null;
(async()=>{
  try{
    if(!(window.claude&&window.claude.use))return;
    const [user,db]=await Promise.all([window.claude.use('user'),window.claude.use('db')]);
    DB=db;
    if(user){UID_=await user.id();ADMIN=!!(await user.canEdit());if(ADMIN){$('#nav-inbox').hidden=false;if(location.hash==='#inbox')renderInbox()}}
  }catch(e){}
})();
async function submit(kind,data){
  const rec=Object.assign({kind,ref:refNo(kind),at:new Date().toISOString()},data);
  if(DB&&UID_){
    try{const ref=DB.doc('inbox/'+UID_),snap=await ref.get();
      const items=snap.exists&&Array.isArray(snap.data().items)?snap.data().items.slice():[];
      items.push(rec);await ref.set({items,updated:rec.at});return {ok:true,rec}}catch(e){}
  }
  const box=load('find.outbox',[]);box.push(rec);save('find.outbox',box);
  return {ok:false,rec};
}
function receiptHTML(res,title){
  const r=res.rec;
  return `<div class="receipt"><span class="stamp">${res.ok?'已收到':'已暂存'}</span><h4>${title} · ${r.ref}</h4>
  <p>${res.ok?'已经送到 Find。我们会在 24 小时内通过你留下的联系方式回复。':'这是预览版，目前只有受邀成员可以在线提交。内容已暂存在这台设备的浏览器里，也可以复制下面的内容，通过微信发给我们。'}</p>
  ${res.ok?'':`<div class="copybox">${esc(r.summary)}</div><button class="key" type="button" data-copy style="margin-top:10px">复制内容</button>`}</div>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-copy]');if(!b)return;const box=b.parentNode.querySelector('.copybox');
  const done=()=>{b.textContent='已复制'};
  try{navigator.clipboard.writeText(box.textContent).then(done,()=>{selectText(box);b.textContent='已选中，请手动复制'})}catch(err){selectText(box);b.textContent='已选中，请手动复制'}
});
function selectText(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}

/* ---------- 共用片段 ---------- */
function card(it){
  const sold=it.status==='已售',led=it.status==='在售'?'':it.status==='已预订'?'amber':'red';
  return `<a class="card${sold?' is-sold':''}" href="#item-${it.id}">
    <div class="vit velvet"><span class="grade">${it.grade}</span><span class="st"><span class="led ${led}"></span>${it.status}</span>
      <div class="cam">${camSVG(it.r,it.f,{mark:it.mark,label:it.name,wear:it.grade,seed:it.id})}</div>${sold?'<div class="sold"><span>已售</span></div>':''}</div>
    <div class="base chrome"><span class="engr">${it.year} · ${STRUCT[it.struct]} · №${it.no}</span>
      <div><h3>${esc(it.name)}</h3><div class="sub">${esc(it.lens)}</div></div><div class="pr">${yuan(it.price)}</div></div></a>`;
}
const crumb=parts=>`<div class="crumb">${parts.map(p=>p[1]?`<a href="${p[1]}">${p[0]}</a>`:esc(p[0])).join(' / ')}</div>`;

/* ---------- 首页 ---------- */
let heroI=0;
function renderHome(){
  const list=forSale(),fm=STOCK[0];
  APP.innerHTML=`<div class="wrap page">
  <h1 class="hero-title foil">三十年的相机，<br>正在等下一任主人。</h1>
  <p class="hero-sub">Find 只收 1976 到 2006 年间有来历的机身和镜头。每一台都由师傅检测，附一本器材护照：检测数据、本机测试卷、历任主人，还有它经历过的事。</p>
  <div class="hero">
    <div class="hero-stage velvet"><div class="cam" id="hero-cam"></div><div class="cap"><span id="hero-no"></span><span>展柜 · 本周上架</span></div></div>
    <div class="hero-panel chrome">${screws()}
      <div class="row"><span class="engr">On the shelf · 在架</span><div class="counter"><span class="engr" style="letter-spacing:.1em">№</span><div class="counter-win"><div class="counter-big" id="hero-n">1</div></div></div></div>
      <div><h2 id="hero-name"></h2><div class="meta" id="hero-meta"></div></div>
      <p class="line" id="hero-line"></p>
      <div class="row"><div class="price" id="hero-price"></div><span class="engr" id="hero-st"></span></div>
      <div class="acts"><a class="key dark" id="hero-go" href="#shop"><span class="dot"></span>看这台的护照</a><a class="key" href="#shop">进店看全部</a></div>
      <div class="adv-wrap"><div id="lever"></div></div>
    </div>
  </div>
  <div class="plaques">
    <div class="plaque">${screws()}<b>26 项</b><span>师傅逐项检测</span><p>快门逐档实测、背光查霉雾、测距与测光校验，结论签字负责。</p></div>
    <div class="plaque">${screws()}<b>1 卷</b><span>本机测试卷</span><p>每台机身拍一卷测试卷，印样附在护照里，看得到这一台拍出来的样子。</p></div>
    <div class="plaque">${screws()}<b>180 天</b><span>回购与置换</span><p>在 Find 买的器材，180 天内按成交价 70% 回购，或 80% 抵扣换购下一台。</p></div>
    <div class="plaque">${screws()}<b>担保</b><span>验机后再确认</span><p>付款走第三方担保交易，收到器材、验机满意后再确认收货。</p></div>
  </div>
  <div class="presets" aria-label="快速开始"><span class="presets-l">从这里开始</span>${PRESETS.map((p,i)=>`<button type="button" class="dymo ${p.c}" data-preset="${i}">${p.t}</button>`).join('')}</div>
  <div class="sec-h"><div><span class="dymo">本周上架</span><h2>在架上</h2><p>本周新上架的几台。每一台都只有一台。</p></div><a class="key" href="#shop">进店看全部 ${STOCK.length} 台</a></div>
  <div class="grid">${STOCK.slice(0,6).map(card).join('')}</div>
  ${recentHTML()}
  <div class="sec-h"><div><span class="dymo red">服务</span><h2>三件事，都可以交给我们</h2><p>不管你是想卖、想买，还是只想知道家里那台老相机值多少钱。</p></div></div>
  <div class="services">
    <a class="svc" href="#sell"><span class="key big">寄售给 Find<i>CONSIGN</i></span><p>检测、拍摄、建护照、定价、售后都由我们完成。你不用应付砍价，也不用担心调包退货。</p></a>
    <a class="svc" href="#find"><span class="key big">帮我找一台<i>SOURCE</i></span><p>说出型号、成色底线和预算。我们在国内和日本中古渠道找货，先发检测报告，你确认后再付款。</p></a>
    <a class="svc" href="#sell"><span class="key big">估一估<i>APPRAISE</i></span><p>家里抽屉里的老相机值多少？填几项信息，估价表马上给出参考价，再决定要不要寄售。</p></a>
  </div>
  <div class="sec-h"><div><span class="dymo">护照</span><h2>每一台都有一本护照</h2><p>护照跟着器材走。下一次转手时，检测和履历接着往下写。这是 ${esc(fm.name)} 的那一本。</p></div></div>
  <div class="booklet paper" id="booklet">
    <div class="bk-page l"><div class="bk-cover"><span class="no">FIND 器材护照 · No.${fm.no}</span><h3>${esc(fm.name)}</h3><p style="font-size:14px;color:#5b5243">${esc(fm.lens)} · ${fm.year} 年产 · ${fm.owners} 位主人</p><div class="cam">${camSVG(fm.r,fm.f,{mark:fm.mark,wear:fm.grade,seed:fm.id})}</div><div style="display:flex;align-items:center;gap:14px;margin-top:auto"><span class="stamp">${fm.grade}<small>${GRADE_TXT[fm.grade]}</small></span><span style="font-size:13px;color:#5b5243">检测：陈师傅 · ${today()}</span></div></div></div>
    <div class="bk-page bk-r" id="bk-r"></div>
    <div class="bk-tabs" role="tablist" aria-label="护照内页">${['检测','测试卷','履历','主人的信'].map((t,i)=>`<button role="tab" type="button" data-tab="${i}" aria-selected="${i===0}">${t}</button>`).join('')}</div>
  </div>
  <div class="sec-h"><div><span class="dymo blue">1976–2006</span><h2>三十年的器材史</h2></div></div>
  <div class="teaser chrome">${screws()}<div id="mini-dial"></div><div><h3>转动年份，看那一年出了什么</h3><p>1976 到 2006 年，${HIST.length} 台有代表性的机身和镜头，按年份放进展柜。每一台都写了它的时代意义，和买它时该检查的地方。</p><a class="key dark" href="#history" id="to-hist"><span class="dot"></span>打开器材史</a></div></div>
  </div>`;
  const showHero=()=>{const it=list[heroI%list.length];
    $('#hero-cam').innerHTML=camSVG(it.r,it.f,{mark:it.mark,label:it.name,wear:it.grade,seed:it.id});
    $('#hero-name').textContent=it.name;$('#hero-meta').textContent=`${it.year} · ${it.grade} ${GRADE_TXT[it.grade]} · ${STRUCT[it.struct]} · ${it.lens}`;
    $('#hero-line').textContent='“'+it.line+'”';$('#hero-price').innerHTML=`<small>¥</small>${Math.round(it.price).toLocaleString('en-US')}`;
    $('#hero-st').textContent=it.status;$('#hero-go').href='#item-'+it.id;$('#hero-no').textContent=`№ ${it.no} · 第 ${heroI%list.length+1} / ${list.length} 台`;
    $('#hero-n').textContent=heroI%list.length+1};
  showHero();tilt($('.hero-stage'));
  Lever($('#lever'),()=>{heroI++;showHero()});
  const tabs=$$('.bk-tabs button'),bk=$('#bk-r');
  const tab=i=>{tabs.forEach((b,j)=>b.setAttribute('aria-selected',j===i));
    if(i===0)bk.innerHTML=`<h4>检测记录</h4><ul class="bk-list">${fm.parts.map(p=>`<li><span>${p[0]}</span><span style="color:#5b5243;flex:1;text-align:right;font-size:12.5px">${p[2]}</span><b>${p[1]}</b></li>`).join('')}</ul>`;
    if(i===1){bk.innerHTML=`<h4>本机测试卷</h4><p>检测时用这台机身拍的黑白测试卷，第一格看锐度，第二格看曝光。</p><div style="margin-top:14px;overflow:hidden;border-radius:2px"><canvas id="bk-roll" width="1642" height="300" style="width:200%;display:block"></canvas></div>`;drawRoll($('#bk-roll'),fm.id)}
    if(i===2)bk.innerHTML=`<h4>履历</h4><ul class="bk-list">${fm.life.map(l=>`<li style="display:grid;grid-template-columns:86px 1fr;gap:10px"><b>${l[0]}</b><span>${l[1]}</span></li>`).join('')}</ul><p style="margin-top:12px">第 3 页起留给下一任主人。</p>`;
    if(i===3)bk.innerHTML=`<h4>第一任主人的信</h4>${fm.letter.slice(0,3).map(p=>`<p class="hand">${p}</p>`).join('')}<p style="text-align:right;margin-top:6px" class="hand">${fm.signer}</p>`};
  tabs.forEach(b=>b.addEventListener('click',()=>tab(+b.dataset.tab)));tab(0);
  const yrs=[];for(let y=1976;y<=2006;y+=5)yrs.push(y);
  Dial($('#mini-dial'),{options:yrs.map(y=>({v:y,t:String(y)})),value:1,size:170,arc:300,fs:13,radius:.31,label:'年份',onChange:v=>{HY=v;HSEL=null}});
}

/* ---------- 选购 ---------- */
const SHOP0={cat:'all',lo:0,hi:100,grade:'C',mech:false,watch:false,hideSold:false,sort:'new',q:''};
const SHOP=Object.assign({},SHOP0,load('find.shop',{}),{watch:false});
function renderShop(){
  APP.innerHTML=`<div class="wrap page">${crumb([['首页','#home'],['选购']])}
  <div class="shop">
    <aside class="panel chrome" aria-label="筛选">${screws()}<div class="panel-inner">
      <label class="vf"><span class="vh">搜索型号</span><input type="search" id="q" placeholder="搜型号，例如 FM2　（按 / 键）" value="${esc(SHOP.q)}" autocomplete="off"></label>
      <div><h4>Category<span>品类</span></h4><div class="dial-box"><div id="cat-dial"></div><p class="dial-hint">拖动转盘，或点刻度</p></div></div>
      <div><h4>Price<span id="pr-txt"></span></h4>${ringHTML('price',SHOP.lo,SHOP.hi,'价格')}</div>
      <div><h4>Grade<span>最低成色</span></h4>${fstopsHTML('gr',GRADES.map(g=>({v:g,t:g,s:GRADE_TXT[g]})),SHOP.grade,'最低成色')}</div>
      <div style="display:grid;gap:4px">${swHTML('f-mech','只看全机械',SHOP.mech,true)}${swHTML('f-watch','只看我关注的',SHOP.watch,true)}${swHTML('f-sold','隐藏已售',SHOP.hideSold,true)}</div>
      <div><h4>Sort<span>排序</span></h4><div class="sortbar" role="group" aria-label="排序">${[['new','新上架'],['asc','价格低'],['desc','价格高']].map(s=>`<button type="button" data-s="${s[0]}" aria-pressed="${SHOP.sort===s[0]}">${s[1]}</button>`).join('')}</div></div>
      <div class="lcd"><span>符合条件</span><b id="cnt">0</b><span>台</span></div>
    </div></aside>
    <section><div class="shop-head"><div><h1 style="font-family:var(--f-serif);font-size:30px">在架上的器材</h1><p class="crumb" style="margin-top:6px">每一台都附器材护照。点进去可以看检测数据、测试卷和它的经历。</p></div></div><div class="active-f" id="af" aria-live="polite"></div><div class="grid" id="shop-grid"></div></section>
  </div></div>`;
  Dial($('#cat-dial'),{options:CATS.map(c=>({v:c.id,t:c.n,cls:'cn'})),value:CATS.findIndex(c=>c.id===SHOP.cat),size:200,arc:300,fs:14,radius:.3,label:'品类',onChange:v=>{SHOP.cat=v;shopGrid()}});
  bindRing('price',(lo,hi)=>{SHOP.lo=p2t(lo);SHOP.hi=p2t(hi);$('#pr-txt').textContent=`${yuan(lo)} – ${hi>=P_MAX*.99?'不限':yuan(hi)}`;shopGrid()});
  $('#gr').addEventListener('pick',e=>{SHOP.grade=e.detail;shopGrid()});
  $('.panel').addEventListener('toggle',e=>{const id=e.target.id;if(id==='f-mech')SHOP.mech=e.detail;if(id==='f-watch')SHOP.watch=e.detail;if(id==='f-sold')SHOP.hideSold=e.detail;shopGrid()});
  $$('.sortbar button').forEach(b=>b.addEventListener('click',()=>{SHOP.sort=b.dataset.s;$$('.sortbar button').forEach(x=>x.setAttribute('aria-pressed',x===b));Sound.play('switch');shopGrid()}));
  const q=$('#q');q.addEventListener('input',()=>{SHOP.q=q.value;shopGrid()});
  $('#af').addEventListener('click',e=>{const b=e.target.closest('[data-clear]');if(!b)return;const k=b.dataset.clear;
    if(k==='all')Object.assign(SHOP,SHOP0);else if(k==='price'){SHOP.lo=0;SHOP.hi=100}else SHOP[k]=SHOP0[k];Sound.play('switch');renderShop()});
  shopGrid();
}
function shopGrid(){
  const lo=t2p(SHOP.lo),hi=SHOP.hi>=99.5?Infinity:t2p(SHOP.hi),gi=GRADES.indexOf(SHOP.grade);
  let rows=STOCK.filter(it=>(SHOP.cat==='all'||it.cat===SHOP.cat)&&it.price>=lo-1&&it.price<=hi+1&&GRADES.indexOf(it.grade)<=gi&&(!SHOP.mech||it.struct==='m')&&(!SHOP.watch||isWatched(it.id))&&(!SHOP.hideSold||it.status!=='已售')&&(!SHOP.q.trim()||(it.name+' '+it.cn+' '+it.mark+' '+it.lens).toLowerCase().includes(SHOP.q.trim().toLowerCase())));
  rows.sort((a,b)=>SHOP.sort==='asc'?a.price-b.price:SHOP.sort==='desc'?b.price-a.price:b.added.localeCompare(a.added));
  $('#cnt').textContent=String(rows.length).padStart(2,'0');
  save('find.shop',Object.assign({},SHOP,{watch:false}));
  const chips=[];
  if(SHOP.q.trim())chips.push(['q',`“${SHOP.q.trim()}”`]);
  if(SHOP.cat!=='all')chips.push(['cat',catName(SHOP.cat)]);
  if(SHOP.lo>.5||SHOP.hi<99.5)chips.push(['price',`${yuan(t2p(SHOP.lo))}–${SHOP.hi>=99.5?'不限':yuan(t2p(SHOP.hi))}`]);
  if(SHOP.grade!=='C')chips.push(['grade',`${SHOP.grade} 及以上`]);
  if(SHOP.mech)chips.push(['mech','全机械']);if(SHOP.watch)chips.push(['watch','我关注的']);if(SHOP.hideSold)chips.push(['hideSold','隐藏已售']);
  $('#af').innerHTML=chips.length?`<span>当前筛选</span>${chips.map(c=>`<button type="button" class="chip" data-clear="${c[0]}" aria-label="去掉筛选：${esc(c[1])}">${esc(c[1])} ×</button>`).join('')}<button type="button" class="chip clear" data-clear="all">全部清除</button>`:'';
  $('#shop-grid').innerHTML=rows.length?rows.map(card).join(''):`<div class="empty velvet" style="grid-column:1/-1"><p style="font-size:16px;color:var(--text)">没有符合条件的器材</p><p style="margin-top:6px">放宽价格或成色试试，或者让我们<a href="#find" style="color:var(--orange)">帮你找一台</a>。</p></div>`;
}

/* ---------- 商品详情 ---------- */
function renderItem(id){
  const it=STOCK.find(s=>s.id===id);if(!it){renderShop();return}
  const h=HIST.find(x=>x.n===it.hist),avail=it.status==='在售',led=avail?'':it.status==='已预订'?'amber':'red';
  const film=it.cat!=='dig';
  const writing=it.letter?{t:'第一任主人的信',ps:it.letter,s:it.signer}:it.note?{t:'主人留言',ps:[it.note],s:it.signer}:null;
  {const rc=load('find.recent',[]).filter(x=>x!==it.id);rc.unshift(it.id);save('find.recent',rc.slice(0,6))}
  APP.innerHTML=`<div class="wrap page item-page">${crumb([['首页','#home'],['选购','#shop'],[it.name]])}
  <div class="item-top">
    <div><div class="item-stage velvet"><div class="cam reflect">${camSVG(it.r,it.f,{mark:it.mark,label:it.name,wear:it.grade,seed:it.id})}</div></div>
      <dl class="spec-plate chrome">${screws()}<div><dt>Year</dt><dd>${it.year} 年</dd></div><div><dt>Shutter</dt><dd>${STRUCT[it.struct]}</dd></div><div><dt>Owners</dt><dd>${it.owners} 位主人</dd></div><div><dt>Passport</dt><dd>№ ${it.no}</dd></div></dl></div>
    <div class="hangtag paper">
      <div class="no"><span>FIND 器材护照 № ${it.no}</span><span>${catName(it.cat)}</span></div>
      <h1>${esc(it.name)}</h1><p class="lens">${esc(it.lens)}</p>
      <div class="mid"><div class="pr"><small>¥</small>${Math.round(it.price).toLocaleString('en-US')}</div><span class="stamp">${it.grade}<small>${GRADE_TXT[it.grade]}</small></span></div>
      <p class="hand">${esc(it.line)}</p>
      <div class="pos"><div class="pos-l"><span>同型号近期成交（示例）</span><span>${yuan(round50(it.price*.8))} – ${yuan(round50(it.price*1.15))}</span></div><div class="pos-bar" role="img" aria-label="这台的价格位于同型号成交区间的中上"><i style="left:57%"></i></div><small>定在区间中上，理由写在下面的检测报告和履历里。</small></div>
      <div class="status"><span class="led ${led}"></span>${it.status}${avail?' · 预约后为你保留 24 小时':''}</div>
      <div class="bb"><b>180 天回购</b>：按成交价 70% 回购，或 80% 抵扣换购 Find 的下一台。付款走第三方担保交易，验机满意后再确认收货。</div>
      <div class="acts"><button class="release" id="buy" type="button" aria-label="预约购买" ${avail?'':'disabled'}></button><div><b style="font-size:16px">${avail?'预约购买':it.status}</b><p style="font-size:12.5px;color:var(--paper-ink-2)">${avail?'按下快门，填写联系方式':'可以让我们帮你找一台同型号'}</p></div><span style="margin-left:auto">${swHTML('watch','关注',isWatched(it.id),true)}</span></div>
    </div>
  </div>
  <nav class="jump" aria-label="本页内容">${[['rep','检测报告'],['tst',it.cat==='lens'?'镜头灯箱':'快门与灯箱'],film?['roll','测试卷']:null,['life','履历'],['faq','常见问题']].filter(Boolean).map(j=>`<button type="button" data-jump="${j[0]}">${j[1]}</button>`).join('')}</nav>
  <div class="sec-h" id="j-rep"><div><h2>检测报告</h2><p>由陈师傅检测，${it.parts.length} 个部位分项评级。综合成色取影响使用的最低一项。</p></div></div>
  <div class="bench">
    <div class="clip paper"><div class="clip-top"></div><h3>成色评级</h3><p class="note">Find 五级成色标准</p>
      <div class="gradebar">${GRADES.map(g=>`<div class="${g===it.grade?'on':''}">${g}<small>${GRADE_TXT[g]}</small></div>`).join('')}</div>
      <table class="parts">${it.parts.map(p=>`<tr><td>${p[0]}</td><td class="g">${p[1]}</td><td>${p[2]}</td></tr>`).join('')}</table></div>
    <div class="clip paper"><div class="clip-top"></div><h3>检查清单</h3><p class="note">打勾为正常，圈号为已处理，三角为需要留意</p>
      <ul class="checks">${it.checks.map(c=>`<li><i class="${c[0]==='warn'?'warn':''}">${c[0]==='ok'?'✓':c[0]==='fix'?'○':'△'}</i><span>${c[1]}${c[2]?`<small>${c[2]}</small>`:''}</span></li>`).join('')}</ul></div>
  </div>
  <div class="bench" style="margin-top:26px" id="j-tst">
    ${it.cat==='lens'?`<div class="brass-note">${screws()}<h3>镜头不做快门测试</h3><p>镜头检测光圈叶片的回弹速度、对焦行程和阻尼，以及卡口磨损。结果写在左边的检查清单里。</p></div>`:
    `<div class="instr"><h3 style="color:var(--text)">快门测试仪</h3><p class="note">转动速度盘，看这台机身每一档的实测值。指针停在绿区，说明偏差小于 1/3 档。</p>
      <div class="instr-body"><div id="spd-dial"></div><div><div class="gauge" id="gauge">${gaugeSVG({labels:[[-1,'−½'],[-.667,'−⅓'],[0,'0'],[.667,'+⅓'],[1,'+½']],unit:'EV',zone:.667,aria:'快门偏差表'})}</div><div class="lcd" id="spd-lcd"></div></div></div></div>`}
    <div class="light paint"><h3>镜头灯箱</h3><p class="note" style="color:#a8a49c">打开灯箱，从后组照亮镜头。师傅标出的每一处都在这里。</p>
      <div class="lightbox" id="lbox">${lensBoxSVG(it.dust)}</div>
      <div class="light-foot">${swHTML('lb-sw','打开灯箱',false,true)}<dl><dt>霉</dt><dd>无</dd><dt>雾</dt><dd>无</dd><dt>划痕</dt><dd>无</dd><dt>微尘</dt><dd>${it.dust.length?it.dust.length+' 处':'无'}</dd></dl></div>
      ${it.dust.length?`<p style="font-size:12.5px;color:#a8a49c;margin-top:10px">${it.dust.map((d,i)=>`${i+1}. ${d[2]}`).join('　')}，都不影响成像。</p>`:''}</div>
  </div>
  ${film?`<div class="lighttable" style="margin-top:34px" id="j-roll"><h3>本机测试卷</h3><p class="note">检测时用这台${it.cat==='lens'?'镜头':'机身'}拍一卷黑白测试卷，冲洗后做成印样附在护照里。红笔圈出的那张用来判读锐度。</p>
    <div class="roll"><div class="roll-in"><canvas id="roll" width="1642" height="300" aria-label="测试卷印样"></canvas><svg viewBox="0 0 1642 300" preserveAspectRatio="none" aria-hidden="true"><path d="M22,44 C110,36 250,38 333,46 C340,110 338,190 330,262 C230,268 110,266 20,258 C14,180 16,110 26,40 L60,38"/></svg></div></div>
    <div class="frames" id="frames"></div></div>`:''}
  <div class="sec-h" id="j-life"><div><h2>它的履历</h2><p>护照里的经历由主人讲述，Find 按序列号和票据核对。</p></div></div>
  <div class="bench">
    <div class="cards-life">${it.life.map(l=>`<div class="icard"><span class="y">${l[0]}</span><div><b>${l[1]}</b><p>${l[2]}</p></div></div>`).join('')}<div class="icard next"><span class="y">下一页</span><div><b>等下一任主人来写</b><p>买下它以后，你可以在护照里补上自己拍的照片和去过的地方。</p></div></div></div>
    ${writing?`<div><div class="letter paper"><p style="font-family:var(--f-cn);font-size:12px;color:#6a6152;letter-spacing:.1em">${writing.t}</p>${writing.ps.map(p=>`<p>${esc(p)}</p>`).join('')}<p class="sig">${esc(writing.s)}</p><p class="note">原件随机附赠 · 预览版为示例文本</p></div></div>`:
      `<div class="brass-note">${screws()}<h3>还没有主人留言</h3><p>寄售时主人可以写一段话给下一任，原件随机附赠。</p></div>`}
  </div>
  ${h?`<div class="brass-note" style="margin-top:30px">${screws()}<h3>关于这个型号 · ${h.y} 年</h3><p>${h.w}</p><p><b>买它时要看：</b>${h.k}</p><p style="margin-top:10px"><a href="#history" data-year="${h.y}" style="color:#35270b;font-weight:700">在器材史里看 ${h.y} 年 →</a></p></div>`:''}
  <div class="sec-h" id="j-faq"><div><span class="dymo">问答</span><h2>买之前常问的</h2></div></div>
  <div class="faq">${FAQ.map((q,i)=>`<details class="paper"${i===0?' open':''}><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</div>
  <div class="sec-h"><div><h2>也许你也会喜欢</h2></div></div>
  <div class="grid">${STOCK.filter(s=>s.id!==it.id&&s.status!=='已售').sort((a,b)=>(b.cat===it.cat)-(a.cat===it.cat)).slice(0,3).map(card).join('')}</div>
  </div>
  <div class="buybar chrome" id="buybar" aria-hidden="true"><div class="wrap"><span class="bb-cam velvet">${camSVG(it.r,it.f,{mark:it.mark,wear:it.grade,seed:it.id})}</span><span class="bb-t"><b>${esc(it.name)}</b><small><span class="led ${led}"></span>${it.grade} ${GRADE_TXT[it.grade]} · ${it.status}</small></span><span class="bb-p">${yuan(it.price)}</span>${avail?'<button class="key dark" type="button" id="buy2" tabindex="-1"><span class="dot"></span>预约购买</button>':'<a class="key" href="#find" tabindex="-1">帮我找同款</a>'}</div></div>`;
  if(it.cat!=='lens'){
    const lcd=$('#spd-lcd'),gauge=$('#gauge');
    const show=i=>{const d=it.dev[i],t=SPEED_SEC[i]*Math.pow(2,d),f=x=>x>=.5?x.toFixed(2)+' s':'1/'+Math.round(1/x);
      lcd.innerHTML=`<div><span>标称</span><b>${f(SPEED_SEC[i])}</b></div><div><span>实测</span><b>${f(t)}</b></div><div><span>偏差</span><b>${d>0?'+':d<0?'−':''}${Math.abs(d).toFixed(2)}</b></div>`;setNeedle(gauge,d/.5)};
    const small=innerWidth<640;
    Dial($('#spd-dial'),{options:SPEEDS.map(s=>({v:s,t:s==='1s'?'1':s,cls:s==='250'?'hot':''})),value:8,size:small?190:176,arc:330,fs:small?13:12,radius:.35,black:true,label:'快门速度',onChange:(v,i)=>show(i)});
    requestAnimationFrame(()=>show(8));
  }
  $('#lbox').closest('.light').addEventListener('toggle',e=>{if(e.target.id==='lb-sw')$('#lbox').classList.toggle('on',e.detail)});
  if(film){const n0=drawRoll($('#roll'),it.id);$('#frames').innerHTML=['西门子星，看锐度','灰阶，看曝光','砖墙，看细节','逆光，看眩光','网格，看畸变'].map((t,i)=>`<span><b>${n0+i}</b>${t}</span>`).join('')}
  $('#watch').addEventListener('toggle',e=>toggleWatch(it.id,e.detail));
  if(avail)$('#buy').addEventListener('click',()=>{Sound.play('shutter');openBuy(it)});
  const hy=$('[data-year]');if(hy)hy.addEventListener('click',()=>{HY=+hy.dataset.year;HSEL=null});
  tilt($('.item-stage'));
  $$('.jump button').forEach(b=>b.addEventListener('click',()=>{const t=$('#j-'+b.dataset.jump);if(t)t.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'})}));
  const bar=$('#buybar'),tag=$('.hangtag');
  if('IntersectionObserver' in window)new IntersectionObserver(([en])=>{const show=!en.isIntersecting&&en.boundingClientRect.top<0;
    bar.classList.toggle('show',show);bar.setAttribute('aria-hidden',String(!show));$$('a,button',bar).forEach(x=>x.tabIndex=show?0:-1)}).observe(tag);
  const b2=$('#buy2');if(b2)b2.addEventListener('click',()=>{Sound.play('shutter');openBuy(it)});
}
function openBuy(it){
  const d=$('#drawer');d.hidden=false;
  d.innerHTML=`<div class="slip paper card-form" role="dialog" aria-modal="true" aria-labelledby="buy-h">
    <div class="head"><h1 id="buy-h" style="font-size:22px">预约购买<br><span style="font-size:16px;font-family:var(--f-cn)">${esc(it.name)} · ${yuan(it.price)}</span></h1><div class="no">No. ${it.no}<br>${today()}</div></div>
    <form id="buy-form" novalidate>
      <div class="fld"><label for="b-name">称呼</label><input type="text" id="b-name" autocomplete="name"></div>
      <div class="fld"><label for="b-contact">微信或手机</label><input type="text" id="b-contact" autocomplete="tel"></div>
      <div class="fld"><span class="lab">交付方式</span>${fstopsHTML('b-way',[{v:'顺丰保价寄送',t:'寄送',s:'顺丰保价'},{v:'约时间看机',t:'看机',s:'当面验机'}],'顺丰保价寄送','交付方式')}</div>
      <div class="fld"><label for="b-msg">留言</label><textarea id="b-msg" rows="2" placeholder="想问的问题，或者想先看的细节"></textarea></div>
      <div class="submit-row"><p id="b-err">提交后这台会为你保留 24 小时。</p><button class="key dark" type="submit"><span class="dot"></span>提交预约</button></div>
    </form><div id="buy-receipt"></div>
    <div style="margin-top:16px;text-align:right"><button class="key" type="button" id="buy-close">关闭</button></div></div>`;
  $('#b-name').focus();hintContact($('#b-contact'));
  $('#buy-close').addEventListener('click',closeDrawer);
  $('#buy-form').addEventListener('submit',async e=>{e.preventDefault();
    const name=$('#b-name').value.trim(),contact=$('#b-contact').value.trim();
    if(!contact){$('#b-err').innerHTML='<b style="color:var(--red)">请留下微信或手机，我们才能联系你。</b>';$('#b-contact').focus();return}
    const way=fsVal('b-way'),msg=$('#b-msg').value.trim();
    const res=await submit('buy',{item:it.id,itemName:it.name,price:it.price,name,contact,way,msg,summary:`预约购买：${it.name}（№${it.no}，${yuan(it.price)}）\n称呼：${name||'未填'}\n联系方式：${contact}\n交付：${way}\n留言：${msg||'无'}`});
    $('#buy-form').hidden=true;$('#buy-receipt').innerHTML=receiptHTML(res,'预约回执')});
}
function closeDrawer(){const d=$('#drawer');if(d&&!d.hidden){d.hidden=true;d.innerHTML=''}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
document.addEventListener('click',e=>{if(e.target.id==='drawer')closeDrawer()});

/* ---------- 估价 ---------- */
function estimate(model,cat,grade,fn,acc){
  const m=' '+model.toLowerCase()+' ';let base=null,hit=null;
  REF.forEach(([k,v])=>{if(m.includes(k)&&(!hit||k.length>hit.length)){hit=k;base=v}});
  const conf=hit?.75:model.trim()?-.35:-.8;
  if(!base)base=CAT_BASE[cat]||1500;
  let p=base*{'A+':1.15,'A':1.05,'AB':1,'B':.85,'C':.62}[grade];
  fn.forEach(ok=>{if(!ok)p*=.8});acc.forEach(a=>{if(a)p*=1.03});
  return {mid:p,lo:p*.88,hi:p*1.12,hit,conf};
}
const round50=n=>Math.round(n/50)*50;

/* ---------- 寄售 ---------- */
function renderSell(){
  const no='JS-'+Date.now().toString(36).slice(-5).toUpperCase();
  const models=[...new Set(HIST.map(h=>h.n).concat(STOCK.map(s=>s.name)))];
  APP.innerHTML=`<div class="wrap page">${crumb([['首页','#home'],['寄售']])}
  <div class="sec-h" style="margin-top:14px"><div><h2>把器材交给 Find</h2><p>填一张寄售登记卡。右边的估价表会实时给出参考价，并比较三种出手方式。估价只是起点，最终价格以师傅检测为准。</p></div></div>
  <div class="form-wrap">
    <form class="card-form paper" id="sell-form" novalidate>
      <div class="head"><h1>寄售登记卡</h1><div class="no">No. ${no}<br>${today()}</div></div>
      <div class="fld"><span class="lab">品类</span><div id="s-cat" style="justify-self:start;margin:16px 0 4px"></div></div>
      <div class="fld"><label for="s-model">品牌与型号</label><input type="text" id="s-model" list="models" placeholder="例如 Nikon FM2、Contax T2、海鸥 4B" autocomplete="off"><datalist id="models">${models.map(m=>`<option value="${esc(m)}"></option>`).join('')}</datalist></div>
      <div class="fld"><span class="lab">成色自评</span>${fstopsHTML('s-grade',GRADES.map(g=>({v:g,t:g,s:GRADE_TXT[g]})),'AB','成色自评')}</div>
      <div class="fld"><span class="lab">功能</span><div class="row">${swHTML('s-f1','快门各档正常',true,true)}${swHTML('s-f2','测光正常',true,true)}${swHTML('s-f3','镜头无霉无雾',true,true)}</div></div>
      <div class="fld"><span class="lab">附件</span><div class="row">${swHTML('s-a1','原包装',false,true)}${swHTML('s-a2','说明书',false,true)}${swHTML('s-a3','购买凭证',false,true)}</div></div>
      <div class="fld"><span class="lab">想怎么出手</span>${fstopsHTML('s-way',[{v:'寄售',t:'寄售',s:'成交后结算'},{v:'直接卖给 Find',t:'直收',s:'检测后打款'},{v:'先估价',t:'估价',s:'还没想好'}],'寄售','出手方式')}</div>
      <div class="fld"><span class="lab">照片</span><div><label class="drop"><span class="canister"></span><span>点这里选照片，或把照片拖进来<br><small style="color:#6a6152">正面、背面、镜头背光各一张就够。照片只在你的浏览器里预览，不会上传。</small></span><input type="file" id="s-photos" accept="image/*" multiple></label><div class="thumbs" id="thumbs"></div></div></div>
      <div class="fld"><label for="s-story">它的故事</label><textarea id="s-story" rows="3" placeholder="什么时候买的，谁用过，去过哪里。会写进器材护照"></textarea></div>
      <div class="fld"><label for="s-name">称呼</label><input type="text" id="s-name" autocomplete="name"></div>
      <div class="fld"><label for="s-contact">微信或手机</label><input type="text" id="s-contact" autocomplete="tel"></div>
      <div class="submit-row"><p id="s-err">提交后我们会联系你，约定寄送方式和保价。</p><button class="key dark big" type="submit"><span class="dot"></span>提交登记卡</button></div>
      <div id="s-receipt"></div>
    </form>
    <aside class="meter-panel instr"><h3 style="color:var(--text)">估价表</h3><p class="note">按型号、成色、功能和附件估算。预览版的参考价为示例数据。</p>
      <div class="gauge" id="s-gauge" style="margin-top:16px">${gaugeSVG({labels:[[-1,'低'],[0,'中'],[1,'高']],unit:'估价把握',plain:true,aria:'估价把握程度'})}</div>
      <div class="lcd" style="margin-top:16px;text-align:center"><span style="font-size:11px;display:block">参考成交价</span><b id="s-range" style="font-size:20px;font-weight:400;white-space:nowrap">—</b></div>
      <div class="ways" id="s-ways"></div><p class="note" id="s-hit" style="margin-top:12px"></p></aside>
  </div></div>`;
  let cat='slr';
  const sc=CATS.filter(c=>c.id!=='all');
  Dial($('#s-cat'),{options:sc.map(c=>({v:c.id,t:c.n,cls:'cn'})),value:0,size:170,arc:300,fs:13,radius:.3,label:'品类',onChange:v=>{cat=v;upd()}});
  const upd=()=>{
    const model=$('#s-model').value,g=fsVal('s-grade')||'AB';
    const e=estimate(model,cat,g,[swOn('s-f1'),swOn('s-f2'),swOn('s-f3')],[swOn('s-a1'),swOn('s-a2'),swOn('s-a3')]);
    $('#s-range').textContent=`${yuan(round50(e.lo))} – ${yuan(round50(e.hi))}`;
    $('#s-ways').innerHTML=[['寄售，卖家到手',e.mid*.88,'佣金按 12% 计（示例）'],['直接卖给 Find',e.mid*.72,'检测后当天打款'],['自己挂二手平台',e.mid*.9,'自己拍照、回复、发货，承担退货风险']]
      .map(w=>`<div class="lcd"><span>${w[0]}<br><small style="opacity:.7">${w[2]}</small></span><b>${yuan(round50(w[1]))}</b></div>`).join('');
    $('#s-hit').textContent=e.hit?`已匹配到参考型号，估价把握较高。`:model.trim()?'没有匹配到这个型号，按品类估算。寄过来检测后会给出准确价格。':'填上型号，估价会更准。';
    setNeedle($('#s-gauge'),e.conf);return e};
  $('#s-model').addEventListener('input',upd);$('#s-grade').addEventListener('pick',upd);$('#sell-form').addEventListener('toggle',upd);
  requestAnimationFrame(upd);
  draft('sell',['s-model','s-story','s-name','s-contact'],upd);hintContact($('#s-contact'));
  $('#s-photos').addEventListener('change',e=>{const t=$('#thumbs');t.innerHTML='';[...e.target.files].slice(0,8).forEach(f=>{const img=document.createElement('img');img.alt=f.name;img.src=URL.createObjectURL(f);t.appendChild(img)})});
  $('#sell-form').addEventListener('submit',async e=>{e.preventDefault();
    const model=$('#s-model').value.trim(),contact=$('#s-contact').value.trim();
    if(!model||!contact){$('#s-err').innerHTML=`<b style="color:var(--red)">${!model?'请填写品牌与型号。':'请留下微信或手机，我们才能联系你。'}</b>`;(!model?$('#s-model'):$('#s-contact')).focus();return}
    const est=upd(),g=fsVal('s-grade'),way=fsVal('s-way'),name=$('#s-name').value.trim(),story=$('#s-story').value.trim();
    const fn=[['快门',swOn('s-f1')],['测光',swOn('s-f2')],['镜头',swOn('s-f3')]].map(x=>x[0]+(x[1]?'正常':'有问题')).join('，');
    const acc=[['原包装',swOn('s-a1')],['说明书',swOn('s-a2')],['购买凭证',swOn('s-a3')]].filter(x=>x[1]).map(x=>x[0]).join('、')||'无';
    const res=await submit('sell',{model,cat,grade:g,way,name,contact,story,estimate:[round50(est.lo),round50(est.hi)],
      summary:`寄售登记：${model}（${catName(cat)}）\n成色自评：${g}\n功能：${fn}\n附件：${acc}\n出手方式：${way}\n参考价：${yuan(round50(est.lo))}–${yuan(round50(est.hi))}\n故事：${story||'未填'}\n称呼：${name||'未填'}\n联系方式：${contact}`});
    $('#s-receipt').innerHTML=receiptHTML(res,'寄售回执');save('find.draft.sell',null);$('#s-err').textContent='登记卡已提交。';$('#s-receipt').scrollIntoView({block:'center',behavior:'smooth'})});
}

/* ---------- 帮我找 ---------- */
function renderFind(){
  const models=[...new Set(HIST.map(h=>h.n).concat(STOCK.map(s=>s.name)))];
  APP.innerHTML=`<div class="wrap page">${crumb([['首页','#home'],['帮我找']])}
  <div class="sec-h" style="margin-top:14px"><div><h2>帮我找一台</h2><p>说出想要的型号、成色底线和预算。找到以后先发检测报告和测试卷给你，确认了再付款。</p></div></div>
  <div class="form-wrap">
    <form class="card-form paper" id="find-form" novalidate>
      <div class="head"><h1>寻物委托单</h1><div class="no">FIND 寻物<br>${today()}</div></div>
      <div class="fld"><label for="q-model">想找的型号</label><input type="text" id="q-model" list="models2" placeholder="例如 Leica M6、Mamiya 7、Contax T3" autocomplete="off"><datalist id="models2">${models.map(m=>`<option value="${esc(m)}"></option>`).join('')}</datalist></div>
      <div class="fld"><span class="lab">预算 <span id="q-bud" style="display:block;font-family:var(--f-hand);font-size:19px;color:#1f3150;font-weight:400"></span></span>${ringHTML('budget',p2t(3000),p2t(12000),'预算')}</div>
      <div class="fld"><span class="lab">成色底线</span>${fstopsHTML('q-grade',GRADES.map(g=>({v:g,t:g,s:GRADE_TXT[g]})),'AB','成色底线')}</div>
      <div class="fld"><span class="lab">愿意等多久</span><div id="q-wait" style="justify-self:start;margin:16px 0 4px"></div></div>
      <div class="fld"><span class="lab">渠道</span><div class="row">${swHTML('q-c1','国内',true,true)}${swHTML('q-c2','日本中古店',true,true)}</div></div>
      <div class="fld"><span class="lab">要求</span><div class="row">${swHTML('q-r1','要原包装',false,true)}${swHTML('q-r2','接受维修过',true,true)}${swHTML('q-r3','只要全机械',false,true)}</div></div>
      <div class="fld"><label for="q-note">还想说的</label><textarea id="q-note" rows="3" placeholder="比如序列号段、颜色、想配的镜头"></textarea></div>
      <div class="fld"><label for="q-name">称呼</label><input type="text" id="q-name" autocomplete="name"></div>
      <div class="fld"><label for="q-contact">微信或手机</label><input type="text" id="q-contact" autocomplete="tel"></div>
      <div class="submit-row"><p id="q-err">委托不收定金。找到后报价里会写清楚货源、检测结果和税费。</p><button class="key dark big" type="submit"><span class="dot"></span>发出委托</button></div>
      <div id="q-receipt"></div>
    </form>
    <aside class="meter-panel chrome">${screws()}
      <h3 style="color:#1f2124;text-shadow:0 1px 0 #fff">委托之后会发生什么</h3>
      <ol style="margin:14px 0 0;padding-left:1.3em;color:#3b3f43;font-size:14px;display:grid;gap:8px">
        <li>我们在 24 小时内回复，确认需求和大致周期。</li><li>在国内和日本中古渠道找货，挑出符合条件的几台。</li><li>到货后由师傅检测，给你发检测报告和测试卷。</li><li>你确认后付款，走第三方担保交易。</li><li>顺丰保价寄出，附上这台的器材护照。</li></ol>
      <div style="margin-top:20px"><span class="engr">On the shelf · 在架上也许就有</span><div id="q-match" style="display:grid;gap:8px;margin-top:10px"></div></div>
    </aside>
  </div></div>`;
  const waits=['两周','一个月','三个月','不着急'];
  Dial($('#q-wait'),{options:waits.map(w=>({v:w,t:w,cls:'cn'})),value:1,size:150,arc:240,fs:12,radius:.3,black:true,label:'愿意等多久'});
  bindRing('budget',(lo,hi)=>{$('#q-bud').textContent=`${yuan(round50(lo))}–${hi>=P_MAX*.99?'不限':yuan(round50(hi))}`});
  const match=()=>{const q=$('#q-model').value.trim().toLowerCase();
    const rows=q?STOCK.filter(s=>s.status!=='已售'&&(s.name.toLowerCase().includes(q)||q.includes(s.mark.toLowerCase())||s.cn.includes(q))):[];
    $('#q-match').innerHTML=rows.length?rows.map(s=>`<a href="#item-${s.id}" class="lcd" style="text-decoration:none;display:flex;justify-content:space-between"><span>${esc(s.name)} · ${s.grade}</span><b style="font-weight:400">${yuan(s.price)}</b></a>`).join(''):`<p style="font-size:13px;color:#4a4e52">${q?'在架上暂时没有，交给我们去找。':'输入型号后，这里会显示在架上的同型号。'}</p>`};
  $('#q-model').addEventListener('input',match);match();
  draft('find',['q-model','q-note','q-name','q-contact'],match);hintContact($('#q-contact'));
  $('#find-form').addEventListener('submit',async e=>{e.preventDefault();
    const model=$('#q-model').value.trim(),contact=$('#q-contact').value.trim();
    if(!model||!contact){$('#q-err').innerHTML=`<b style="color:var(--red)">${!model?'请填写想找的型号。':'请留下微信或手机，我们才能联系你。'}</b>`;(!model?$('#q-model'):$('#q-contact')).focus();return}
    const lo=round50(t2p(+$('#budget-a').value)),hiT=+$('#budget-b').value,hi=hiT>=99.5?null:round50(t2p(hiT));
    const g=fsVal('q-grade'),wait=waits[+$('#q-wait .dial-knob').getAttribute('aria-valuenow')];
    const ch=[['国内',swOn('q-c1')],['日本中古店',swOn('q-c2')]].filter(x=>x[1]).map(x=>x[0]).join('、')||'不限';
    const req=[['要原包装',swOn('q-r1')],['接受维修过',swOn('q-r2')],['只要全机械',swOn('q-r3')]].filter(x=>x[1]).map(x=>x[0]).join('、')||'无';
    const name=$('#q-name').value.trim(),note=$('#q-note').value.trim();
    const res=await submit('find',{model,budget:[lo,hi],grade:g,wait,channels:ch,req,note,name,contact,
      summary:`寻物委托：${model}\n预算：${yuan(lo)}–${hi?yuan(hi):'不限'}\n成色底线：${g}\n期限：${wait}\n渠道：${ch}\n要求：${req}\n备注：${note||'无'}\n称呼：${name||'未填'}\n联系方式：${contact}`});
    $('#q-receipt').innerHTML=receiptHTML(res,'委托回执');save('find.draft.find',null);$('#q-err').textContent='委托已发出。';$('#q-receipt').scrollIntoView({block:'center',behavior:'smooth'})});
}

/* ---------- 器材史 ---------- */
let HY=1982,HSEL=null;
function renderHistory(){
  const years=[];for(let y=1976;y<=2006;y++)years.push(y);
  APP.innerHTML=`<div class="wrap page">${crumb([['首页','#home'],['器材史']])}
  <div class="sec-h" style="margin-top:14px"><div><h2>器材史 1976–2006</h2><p>转动年份转盘，或者点下面胶片上的任意一格。展柜里是那一年发布的机身和镜头，点一下看它的故事。</p></div></div>
  <div class="hist-top">
    <div class="dial-plate chrome"><div id="y-dial"></div><div class="lcd" id="y-lcd"></div></div>
    <div class="era chrome">${screws()}<div class="tag-era" id="era-tag"></div><h2 id="era-name"></h2><p id="era-d"></p>
      <div class="nav-y"><button class="key" type="button" id="y-prev">◀ 上一年</button><button class="key" type="button" id="y-next">下一年 ▶</button></div></div>
  </div>
  <div class="cabinet"><div class="cab-in"><div class="shelf" id="shelf"></div><div class="shelf-board"></div></div></div>
  <div class="exhibit-info paper" id="ex-info"></div>
  <div class="strip"><div class="strip-in" id="strip">${years.map(y=>{const n=HIST.filter(h=>h.y===y).length,e=ERAS.find(x=>x.from===y);
    return `<button class="fr" type="button" data-y="${y}" aria-label="${y} 年，${n} 台">${e?`<span class="era-mark">▸ ${e.name}</span>`:''}<b>${y}</b><span class="dots">${'<i></i>'.repeat(n)}</span></button>`}).join('')}</div></div>
  </div>`;
  const small=innerWidth<520;
  const dial=Dial($('#y-dial'),{options:years.map(y=>({v:y,t:"'"+String(y).slice(2)})),value:HY-1976,size:small?250:300,arc:330,fs:small?11:12,radius:.37,label:'年份',ticks:false,onChange:v=>{HY=v;HSEL=null;showYear(false)}});
  $('#y-prev').addEventListener('click',()=>{if(HY>1976){HY--;HSEL=null;dial.set(HY-1976,true);Sound.play('detent');showYear(false)}});
  $('#y-next').addEventListener('click',()=>{if(HY<2006){HY++;HSEL=null;dial.set(HY-1976,true);Sound.play('detent');showYear(false)}});
  $$('.fr').forEach(b=>b.addEventListener('click',()=>{HY=+b.dataset.y;HSEL=null;dial.set(HY-1976,true);Sound.play('detent');showYear(false)}));
  showYear(true);
}
function showYear(first){
  $('#y-lcd').textContent=HY;
  const era=ERAS.find(e=>HY>=e.from&&HY<=e.to);
  $('#era-tag').textContent=`Era · ${era.from}–${era.to}`;$('#era-name').textContent=`${HY} 年 · ${era.name}`;$('#era-d').textContent=era.d;
  const items=HIST.filter(h=>h.y===HY),shelf=$('#shelf');
  shelf.style.setProperty('--n',Math.max(1,Math.min(3,items.length)));
  shelf.innerHTML=items.length?items.map(h=>`<button class="exhibit" type="button" data-h="${h.id}" aria-pressed="false"><div class="cam">${camSVG(h.r,h.f,{mark:'',label:h.n})}</div><div class="bp"><b>${esc(h.n)}</b><span>${catName(h.c)} · ${STRUCT[h.t]}</span></div></button>`).join(''):
    `<div class="cab-empty"><p>${HY} 年的柜子还空着。<br>这一年的条目正在整理，先看看前后两年。</p></div>`;
  if(HSEL==null||!items.find(h=>h.id===HSEL))HSEL=items.length?items[0].id:null;
  $$('.exhibit',shelf).forEach(b=>b.addEventListener('click',()=>{HSEL=+b.dataset.h;Sound.play('detent');info()}));
  info();
  $$('.fr').forEach(b=>b.setAttribute('aria-current',+b.dataset.y===HY));
  const cur=$(`.fr[data-y="${HY}"]`),sc=$('.strip');if(cur&&sc)sc.scrollLeft=cur.offsetLeft-sc.clientWidth/2+cur.offsetWidth/2;
}
function info(){
  $$('.exhibit').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.h===HSEL));
  const box=$('#ex-info');const h=HIST[HSEL];
  if(!h){box.hidden=true;return}box.hidden=false;
  const s=STOCK.find(x=>x.hist===h.n&&x.status!=='已售');
  box.innerHTML=`<div><h4>${h.y} · ${catName(h.c)} · ${STRUCT[h.t]}</h4><h3>${esc(h.n)}</h3><p>${h.w}</p></div><div><h4>买它时要看</h4><p>${h.k}</p></div><div>${s?`<a class="key dark" href="#item-${s.id}"><span class="dot"></span>在架上有一台 · ${yuan(s.price)}</a>`:`<a class="key" href="#find">帮我找一台</a>`}</div>`;
}

/* ---------- 收件箱（仅店主与编辑者） ---------- */
function renderInbox(){
  APP.innerHTML=`<div class="wrap page">${crumb([['首页','#home'],['收件箱']])}<div class="ledger paper" style="margin-top:16px"><h1>收件箱</h1><p style="font-size:13.5px;color:var(--paper-ink-2);margin-top:4px">顾客提交的寄售登记、寻物委托和购买预约。只有你和编辑者能看到。</p><div class="tblwrap" id="ib"><p style="margin-top:16px">正在读取……</p></div></div></div>`;
  const ib=$('#ib');
  if(!ADMIN||!DB){ib.innerHTML='<p style="margin-top:16px">这一页只对店主和编辑者开放。</p>';return}
  let got=false;const timer=setTimeout(()=>{if(!got)ib.innerHTML='<p style="margin-top:16px">暂时连不上数据，过一会儿再来看。</p>'},10000);
  if(unsubInbox)unsubInbox();
  unsubInbox=DB.collection('inbox').onSnapshot(snap=>{got=true;clearTimeout(timer);
    const rows=[];snap.docs.forEach(d=>{const x=d.data()||{};(x.items||[]).forEach(r=>rows.push(r))});rows.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
    const K={sell:'寄售',find:'寻物',buy:'预约'};
    ib.innerHTML=rows.length?`<table><thead><tr><th>时间</th><th>类型</th><th>编号</th><th>联系方式</th><th>内容</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(String(r.at).slice(0,16).replace('T',' '))}</td><td>${K[r.kind]||r.kind}</td><td>${esc(r.ref)}</td><td>${esc(r.name||'')}<br>${esc(r.contact||'')}</td><td style="white-space:pre-wrap">${esc(r.summary||'')}</td></tr>`).join('')}</tbody></table>`:
      '<p style="margin-top:16px">还没有提交。顾客在寄售、帮我找、预约购买里提交的内容会出现在这里。</p>'},
    ()=>{got=true;clearTimeout(timer);ib.innerHTML='<p style="margin-top:16px">读取失败，刷新页面再试一次。</p>'});
}

/* ---------- 路由 ---------- */
let PREV=null;const SCROLL={};
function render(h){
  if(unsubInbox&&h!=='inbox'){unsubInbox();unsubInbox=null}
  closeDrawer();
  if(h.startsWith('item-'))renderItem(h.slice(5));
  else ({home:renderHome,shop:renderShop,sell:renderSell,find:renderFind,history:renderHistory,inbox:renderInbox}[h]||renderHome)();
  const key=h.startsWith('item-')?'shop':h;
  $$('.nav a').forEach(a=>a.getAttribute('href')==='#'+key?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
}
async function shutter(fn){
  const c=$('#curtain');
  if(reduceMotion()||!c.animate){fn();return}
  c.style.visibility='visible';Sound.play('shutter');
  try{await c.animate([{transform:'translateY(-101%)'},{transform:'translateY(0)'}],{duration:140,easing:'cubic-bezier(.55,0,.9,.55)',fill:'forwards'}).finished}catch(e){}
  fn();
  try{await c.animate([{transform:'translateY(0)'},{transform:'translateY(101%)'}],{duration:190,easing:'cubic-bezier(.15,.55,.35,1)',fill:'forwards'}).finished}catch(e){}
  c.style.visibility='hidden';
}
function route(){
  const h=location.hash.slice(1)||'home',from=PREV,first=from===null;
  if(!first)SCROLL[from]=scrollY;
  PREV=h;
  const go=()=>{render(h);const y=h==='shop'&&from&&from.startsWith('item-')?SCROLL.shop||0:0;window.scrollTo(0,y);if(!first)APP.focus({preventScroll:true})};
  first?go():shutter(go);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(!b)return;
  Object.assign(SHOP,SHOP0,PRESETS[+b.dataset.preset].s);Sound.play('switch');if(location.hash==='#shop')renderShop();else location.hash='#shop'});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){const q=$('#q');if(q){e.preventDefault();q.focus()}}});
$('#skip').addEventListener('click',()=>{APP.focus();APP.scrollIntoView()});
$('#fc').addEventListener('click',e=>{SHOP.watch=true;SHOP.hideSold=false;if(location.hash==='#shop'){e.preventDefault();renderShop()}});
$('#snd').addEventListener('toggle',e=>{Sound.on=e.detail;save('find.sound',e.detail);if(e.detail){Sound.init();Sound.play('shutter')}});
window.addEventListener('hashchange',route);
applyTextures();
$('#fc-n').textContent=WATCH.size;
route();
