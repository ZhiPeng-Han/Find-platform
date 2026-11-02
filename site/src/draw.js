/* ---------- 材质贴图（运行时生成） ---------- */
function rng(seed){let h=1779033703^String(seed).length;for(const ch of String(seed)){h=Math.imul(h^ch.charCodeAt(0),3432918353);h=h<<13|h>>>19}
  return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')]}

function texLeather(){
  const S=240,C=6,N=S/C,R=rng('leather'),pts=[];
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)pts.push([i*C+R()*C,j*C+R()*C]);
  const H=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const ci=Math.floor(x/C),cj=Math.floor(y/C);let d1=1e9,d2=1e9;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
      const ii=ci+di,jj=cj+dj,p=pts[((jj+N)%N)*N+((ii+N)%N)];
      const px=p[0]+(ii<0?-S:ii>=N?S:0),py=p[1]+(jj<0?-S:jj>=N?S:0);
      const d=Math.hypot(px-x,py-y);if(d<d1){d2=d1;d1=d}else if(d<d2)d2=d;
    }
    H[y*S+x]=Math.min(1,(d2-d1)/2.4);
  }
  const [c,g]=cv(S,S),im=g.createImageData(S,S),D=im.data;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const h=H[y*S+x],hx=H[y*S+(x+1)%S]-H[y*S+(x-1+S)%S],hy=H[((y+1)%S)*S+x]-H[((y-1+S)%S)*S+x];
    const v=25+h*8+(-hx-hy)*20+(R()-.5)*3,k=(y*S+x)*4;
    D[k]=v+1.5;D[k+1]=v;D[k+2]=v-2;D[k+3]=255;
  }
  g.putImageData(im,0,0);return c.toDataURL('image/png');
}
function texBrushed(seed){
  const W=520,H=140,R=rng(seed),[c,g]=cv(W,H);
  g.fillStyle='rgb(128,128,128)';g.fillRect(0,0,W,H);
  for(let i=0;i<2200;i++){
    const y=R()*H,x=R()*W,len=30+R()*300,v=R()<.5?255:0;
    g.strokeStyle=`rgba(${v},${v},${v},${.03+R()*.09})`;g.lineWidth=R()<.85?.6:1.3;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+len,y);g.moveTo(x-W,y);g.lineTo(x-W+len,y);g.stroke();
  }
  return c.toDataURL('image/png');
}
function texPaper(){
  const S=220,R=rng('paper'),[c,g]=cv(S,S);
  for(let i=0;i<2600;i++){g.fillStyle=`rgba(${90+R()*40},${70+R()*30},${40},${.03+R()*.08})`;g.fillRect(R()*S,R()*S,R()<.9?1:2,R()<.9?1:2)}
  g.lineWidth=.6;
  for(let i=0;i<70;i++){const x=R()*S,y=R()*S,a=R()*Math.PI*2,l=4+R()*12;g.strokeStyle=`rgba(120,95,55,${.06+R()*.08})`;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+1)*l/2,y+Math.sin(a+1)*l/2,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  return c.toDataURL('image/png');
}
function texGrain(seed,alpha){
  const S=140,R=rng(seed),[c,g]=cv(S,S),im=g.createImageData(S,S),D=im.data;
  for(let k=0;k<D.length;k+=4){const v=R()<.5?255:0;D[k]=D[k+1]=D[k+2]=v;D[k+3]=R()*alpha}
  g.putImageData(im,0,0);return c.toDataURL('image/png');
}
function texWood(){
  const W=600,H=160,R=rng('wood'),[c,g]=cv(W,H);
  for(let y=0;y<H;y++){
    const w=Math.sin(y*.09+Math.sin(y*.013)*3)*.5+Math.sin(y*.37)*.25;
    g.fillStyle=`rgba(${w>0?255:0},${w>0?200:0},${w>0?150:0},${Math.abs(w)*.09})`;g.fillRect(0,y,W,1);
  }
  for(let i=0;i<260;i++){const y=R()*H,x=R()*W,l=60+R()*260;g.strokeStyle=`rgba(20,8,0,${.08+R()*.14})`;g.lineWidth=.5+R()*.9;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+l/3,y+(R()-.5)*4,x+2*l/3,y+(R()-.5)*4,x+l,y+(R()-.5)*3);g.stroke()}
  return c.toDataURL('image/png');
}
function applyTextures(){
  const s=document.documentElement.style,t=(k,f)=>{try{s.setProperty(k,`url(${f()})`)}catch(e){}};
  t('--leather-tex',texLeather);t('--brushed',()=>texBrushed('b1'));t('--brushed-dark',()=>texBrushed('b2'));
  t('--paper-tex',texPaper);t('--velvet-tex',()=>texGrain('v',10));t('--crackle',()=>texGrain('c',22));t('--wood',texWood);
}

/* ---------- 相机绘制（SVG，正面视角） ---------- */
let UID=0;
const FIN={
  chrome:[[0,'#fbfbf9'],[.16,'#e2e3e0'],[.44,'#bfc2c1'],[.52,'#9fa3a3'],[.72,'#d4d6d4'],[1,'#eeeeec']],
  black:[[0,'#55575b'],[.14,'#2a2b2e'],[.55,'#141517'],[1,'#26272a']],
  ti:[[0,'#f5efe1'],[.2,'#ded5c0'],[.46,'#b6ab92'],[.54,'#cdc1a6'],[.8,'#e9e1ce'],[1,'#cbbfa6']],
  silver:[[0,'#f5f6f7'],[.25,'#dadde0'],[.5,'#aab0b5'],[.75,'#d6d9dc'],[1,'#c0c4c8']]
};
const st=a=>a.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('');
function camDefs(u,f){
  return `<defs>
<linearGradient id="p${u}" x1="0" y1="0" x2="0" y2="1">${st(FIN[f]||FIN.chrome)}</linearGradient>
<linearGradient id="c${u}" x1="0" y1="0" x2="0" y2="1">${st(FIN.chrome)}</linearGradient>
<linearGradient id="k${u}" x1="0" y1="0" x2="0" y2="1">${st(FIN.black)}</linearGradient>
<linearGradient id="d${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8f8f6"/><stop offset=".35" stop-color="#a5a8a7"/><stop offset=".55" stop-color="#ebebe9"/><stop offset="1" stop-color="#6c7071"/></linearGradient>
<linearGradient id="e${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5d6064"/><stop offset=".4" stop-color="#151617"/><stop offset=".62" stop-color="#303236"/><stop offset="1" stop-color="#09090a"/></linearGradient>
<pattern id="l${u}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#1a1a19"/><circle cx="1.6" cy="1.6" r="1.35" fill="#2c2b29"/><circle cx="4.6" cy="4.3" r="1.2" fill="#272624"/><circle cx="4.5" cy="1.2" r=".7" fill="#232220"/></pattern>
<pattern id="n${u}" width="3.2" height="30" patternUnits="userSpaceOnUse"><rect width="3.2" height="30" fill="#8b8f90"/><rect width="1.5" height="30" fill="#f3f4f1"/></pattern>
<pattern id="m${u}" width="3.2" height="30" patternUnits="userSpaceOnUse"><rect width="3.2" height="30" fill="#0c0c0d"/><rect width="1.4" height="30" fill="#505255"/></pattern>
<radialGradient id="g${u}" cx=".4" cy=".36" r=".72"><stop offset="0" stop-color="#4d607f"/><stop offset=".35" stop-color="#18213a"/><stop offset=".75" stop-color="#070a12"/><stop offset="1" stop-color="#020306"/></radialGradient>
<radialGradient id="h${u}" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#f4f4f0"/><stop offset="1" stop-color="#bcbcb4"/></radialGradient>
<linearGradient id="y${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232426"/><stop offset=".15" stop-color="#6e7074"/><stop offset=".3" stop-color="#28292b"/><stop offset=".7" stop-color="#0a0a0b"/><stop offset="1" stop-color="#1c1c1e"/></linearGradient>
<linearGradient id="z${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d8182"/><stop offset=".15" stop-color="#ffffff"/><stop offset=".32" stop-color="#b9bcbb"/><stop offset=".7" stop-color="#6c7071"/><stop offset="1" stop-color="#a4a7a7"/></linearGradient>
</defs>`;
}
function lensFront(u,cx,cy,R,o){
  o=o||{};
  let s=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${o.chrome?'d':'e'}${u})" stroke="#070707"/>`;
  if(o.knurl!==false)s+=`<circle cx="${cx}" cy="${cy}" r="${(R*.88).toFixed(1)}" fill="none" stroke="${o.chrome?'#5a5e5f':'#2e3033'}" stroke-width="${(R*.13).toFixed(1)}" stroke-dasharray="1.3 1.7"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${(R*.76).toFixed(1)}" fill="#0f0f10" stroke="#3b3d40"/>`;
  if(o.text){const rr=R*.68,id='tp'+u;
    s+=`<path id="${id}" d="M${cx-rr},${cy} a${rr},${rr} 0 1,1 ${2*rr},0 a${rr},${rr} 0 1,1 ${-2*rr},0" fill="none"/><text font-size="${Math.max(4.5,R*.085).toFixed(1)}" fill="#e6e3da" font-family="Jost, sans-serif" letter-spacing="1.1"><textPath href="#${id}" startOffset="3%">${o.text}</textPath></text>`}
  const G=R*.6;
  s+=`<circle cx="${cx}" cy="${cy}" r="${G.toFixed(1)}" fill="url(#g${u})"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${(G*.72).toFixed(1)}" fill="none" stroke="rgba(175,125,255,.3)" stroke-width="1.2"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${(G*.45).toFixed(1)}" fill="none" stroke="rgba(110,230,170,.24)"/>`;
  let hx='';for(let i=0;i<6;i++){const a=i*Math.PI/3+.3;hx+=(i?'L':'M')+(cx+G*.26*Math.cos(a)).toFixed(1)+','+(cy+G*.26*Math.sin(a)).toFixed(1)}
  s+=`<path d="${hx}Z" fill="#000" opacity=".55"/>`;
  s+=`<ellipse cx="${(cx-G*.32).toFixed(1)}" cy="${(cy-G*.36).toFixed(1)}" rx="${(G*.27).toFixed(1)}" ry="${(G*.14).toFixed(1)}" fill="#fff" opacity=".55" transform="rotate(-35 ${(cx-G*.32).toFixed(1)} ${(cy-G*.36).toFixed(1)})"/>`;
  s+=`<path d="M${(cx+G*.55).toFixed(1)},${(cy+G*.2).toFixed(1)} A${(G*.62).toFixed(1)},${(G*.62).toFixed(1)} 0 0 1 ${(cx+G*.05).toFixed(1)},${(cy+G*.6).toFixed(1)}" fill="none" stroke="#fff" stroke-width="${(G*.06).toFixed(1)}" opacity=".22" stroke-linecap="round"/>`;
  s+=`<circle cx="${(cx+G*.2).toFixed(1)}" cy="${(cy+G*.22).toFixed(1)}" r="${(G*.05).toFixed(1)}" fill="#ffd9a8" opacity=".55"/>`;
  return s;
}
const tx=(x,y,t,size,fill,anchor)=>`<text x="${x}" y="${y}" text-anchor="${anchor||'middle'}" font-size="${size}" fill="${fill}" font-family="Jost, sans-serif" letter-spacing="2.2">${t||''}</text>`;
const BODY={
  slr(u,f,o){
    const P=`url(#p${u})`,K=f==='black'?`url(#m${u})`:`url(#n${u})`,ink=f==='black'?'#ece9e1':'#2b2d30';
    let s=`<rect x="28" y="108" width="10" height="12" rx="2" fill="url(#c${u})"/><rect x="362" y="108" width="10" height="12" rx="2" fill="url(#c${u})"/>`;
    s+=`<rect x="66" y="78" width="50" height="20" rx="2" fill="${K}"/><rect x="64" y="73" width="54" height="7" rx="2" fill="${P}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`;
    s+=`<rect x="272" y="78" width="56" height="20" rx="2" fill="${K}"/><rect x="270" y="73" width="60" height="7" rx="2" fill="${P}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`;
    s+=`<path d="M300,70 L356,63 Q362,62 362,67 L362,69 Q362,72 356,72 L300,76 Z" fill="url(#c${u})" stroke="rgba(0,0,0,.35)" stroke-width=".6"/><rect x="346" y="61" width="18" height="12" rx="5" fill="#161718"/>`;
    s+=`<rect x="290" y="62" width="16" height="9" rx="3" fill="url(#c${u})" stroke="rgba(0,0,0,.4)" stroke-width=".6"/>`;
    s+=`<rect x="36" y="96" width="328" height="120" rx="9" fill="${P}" stroke="rgba(0,0,0,.55)"/>`;
    s+=`<path d="M146,98 L162,48 Q164,42 170,42 L230,42 Q236,42 238,48 L254,98 Z" fill="${P}" stroke="rgba(0,0,0,.5)"/>`;
    s+=`<path d="M165,54 L235,54" stroke="rgba(255,255,255,.55)"/>`;
    s+=`<rect x="181" y="34" width="38" height="9" rx="1.5" fill="url(#k${u})"/>`;
    s+=`<rect x="168" y="64" width="64" height="17" rx="2" fill="#141516" stroke="rgba(255,255,255,.25)" stroke-width=".6"/>`+tx(200,76,o.mark,8,'#ece9e1');
    s+=`<rect x="38" y="124" width="324" height="74" fill="url(#l${u})"/>`;
    s+=`<line x1="38" y1="124" x2="362" y2="124" stroke="rgba(0,0,0,.6)"/><line x1="38" y1="198" x2="362" y2="198" stroke="rgba(0,0,0,.6)"/><line x1="44" y1="97.5" x2="356" y2="97.5" stroke="rgba(255,255,255,.6)"/>`;
    s+=`<rect x="92" y="136" width="12" height="38" rx="5" fill="url(#c${u})" transform="rotate(-18 98 155)"/>`;
    s+=`<circle cx="296" cy="112" r="4" fill="${ink}" opacity=".0"/>`;
    s+=`<circle cx="200" cy="158" r="60" fill="url(#d${u})" stroke="#2a2b2c"/>`;
    s+=lensFront(u,200,158,55,{text:o.lt||'1:1.4 f=50mm ∅52'});
    return s;
  },
  slraf(u,f,o){
    let s=`<path d="M48,112 Q48,94 66,92 L148,90 Q156,56 176,48 L224,48 Q244,56 252,90 L334,92 Q352,94 352,112 L352,208 Q352,220 338,220 L62,220 Q48,220 48,206 Z" fill="url(#k${u})" stroke="#000"/>`;
    s+=`<path d="M150,90 Q158,58 178,51 L222,51 Q242,58 250,90" fill="none" stroke="rgba(255,255,255,.18)"/>`;
    s+=`<path d="M48,104 Q26,108 28,150 Q26,206 50,216 L92,218 L96,98 Z" fill="url(#l${u})" stroke="#000"/>`;
    s+=`<path d="M50,110 Q34,114 34,150" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2"/>`;
    s+=`<rect x="48" y="86" width="28" height="8" rx="2" fill="#0e0e0f"/><ellipse cx="62" cy="86" rx="13" ry="4.5" fill="url(#c${u})"/>`;
    s+=`<rect x="272" y="80" width="56" height="12" rx="3" fill="#0f1011"/><rect x="276" y="82" width="48" height="8" rx="2" fill="#87926f" opacity=".7"/>`;
    s+=`<rect x="104" y="80" width="40" height="12" rx="3" fill="url(#m${u})"/>`;
    s+=tx(200,76,o.mark,9,'#e8e6de');
    s+=`<circle cx="210" cy="162" r="59" fill="#0c0c0d" stroke="#2a2a2c"/><circle cx="210" cy="162" r="57" fill="none" stroke="url(#d${u})" stroke-width="2.5"/>`;
    s+=lensFront(u,210,162,54,{text:o.lt||'AF 1:1.8 50mm ∅52'});
    s+=`<circle cx="120" cy="118" r="6" fill="#3a1410" stroke="#000"/>`;
    return s;
  },
  rf(u,f,o){
    const P=`url(#p${u})`,K=f==='black'?`url(#m${u})`:`url(#n${u})`,ink=f==='black'?'#ece9e1':'#2b2d30';
    let s=`<rect x="58" y="72" width="40" height="16" rx="2" fill="${K}"/><rect x="56" y="68" width="44" height="6" rx="2" fill="${P}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`;
    s+=`<rect x="276" y="72" width="44" height="16" rx="2" fill="${K}"/><rect x="274" y="68" width="48" height="6" rx="2" fill="${P}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`;
    s+=`<rect x="326" y="66" width="13" height="9" rx="3" fill="url(#c${u})"/><rect x="178" y="75" width="44" height="10" rx="1.5" fill="url(#k${u})"/>`;
    s+=`<clipPath id="b${u}"><rect x="28" y="84" width="344" height="128" rx="20"/></clipPath>`;
    s+=`<g clip-path="url(#b${u})"><rect x="28" y="84" width="344" height="128" fill="${P}"/><rect x="28" y="120" width="344" height="76" fill="url(#l${u})"/>`;
    s+=`<line x1="28" y1="120" x2="372" y2="120" stroke="rgba(0,0,0,.55)"/><line x1="28" y1="196" x2="372" y2="196" stroke="rgba(0,0,0,.55)"/><line x1="40" y1="85.5" x2="360" y2="85.5" stroke="rgba(255,255,255,.6)"/></g>`;
    s+=`<rect x="28" y="84" width="344" height="128" rx="20" fill="none" stroke="rgba(0,0,0,.6)"/>`;
    s+=`<rect x="58" y="92" width="28" height="20" rx="2.5" fill="url(#g${u})" stroke="#0a0a0a"/>`;
    s+=`<rect x="214" y="93" width="40" height="18" rx="2" fill="url(#h${u})" stroke="#555"/>`;
    for(let i=0;i<6;i++)s+=`<line x1="${217+i*6}" y1="95" x2="${217+i*6}" y2="109" stroke="rgba(0,0,0,.08)"/>`;
    s+=`<rect x="276" y="90" width="54" height="24" rx="3" fill="url(#g${u})" stroke="#0a0a0a"/><rect x="280" y="93" width="16" height="6" rx="2" fill="#fff" opacity=".35"/>`;
    s+=tx(148,107,o.mark,8.5,ink);
    s+=`<rect x="126" y="130" width="9" height="28" rx="3" fill="url(#c${u})"/>`;
    s+=`<circle cx="196" cy="160" r="50" fill="url(#d${u})" stroke="#2a2b2c"/>`;
    s+=lensFront(u,196,160,46,{text:o.lt||'1:2 f=35mm ∅39'});
    s+=`<rect x="22" y="104" width="8" height="12" rx="2" fill="url(#c${u})"/><rect x="370" y="104" width="8" height="12" rx="2" fill="url(#c${u})"/>`;
    return s;
  },
  cp(u,f,o){
    const P=`url(#p${u})`,ink=f==='black'?'#ece9e1':'#2b2d30';
    let s=`<rect x="266" y="60" width="30" height="10" rx="4" fill="url(#c${u})"/>`;
    s+=`<rect x="66" y="66" width="268" height="146" rx="28" fill="${P}" stroke="rgba(0,0,0,.6)"/>`;
    s+=`<path d="M94,68.5 L306,68.5" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>`;
    s+=`<rect x="88" y="82" width="54" height="22" rx="4" fill="url(#h${u})" stroke="rgba(0,0,0,.4)"/>`;
    for(let i=0;i<8;i++)s+=`<line x1="${92+i*6.4}" y1="84" x2="${92+i*6.4}" y2="102" stroke="rgba(0,0,0,.09)"/>`;
    s+=`<rect x="204" y="85" width="14" height="10" rx="2" fill="#140d14"/><rect x="226" y="85" width="14" height="10" rx="2" fill="#140d14"/>`;
    s+=`<rect x="262" y="82" width="38" height="24" rx="4" fill="url(#g${u})" stroke="rgba(0,0,0,.6)"/><rect x="266" y="85" width="12" height="5" rx="2" fill="#fff" opacity=".35"/>`;
    s+=`<circle cx="176" cy="150" r="53" fill="${P}" stroke="rgba(0,0,0,.4)"/><circle cx="176" cy="150" r="48" fill="none" stroke="rgba(255,255,255,.5)"/>`;
    s+=lensFront(u,176,150,40,{knurl:false,text:o.lt||'1:2.8 f=35mm'});
    s+=tx(296,196,o.mark,9,ink,'end');
    s+=`<rect x="58" y="120" width="8" height="12" rx="2" fill="url(#c${u})"/>`;
    return s;
  },
  tlr(u,f,o){
    let s=`<rect x="138" y="10" width="124" height="20" rx="3" fill="url(#k${u})" stroke="#000"/><rect x="141" y="12" width="118" height="3" fill="rgba(255,255,255,.18)"/>`;
    s+=`<rect x="118" y="88" width="18" height="50" rx="7" fill="url(#n${u})"/>`;
    s+=`<rect x="134" y="28" width="132" height="222" rx="6" fill="url(#c${u})" stroke="rgba(0,0,0,.6)"/><rect x="140" y="34" width="120" height="210" rx="3" fill="url(#l${u})"/>`;
    s+=`<rect x="150" y="44" width="100" height="70" rx="6" fill="url(#c${u})" stroke="rgba(0,0,0,.35)"/>`;
    s+=lensFront(u,200,79,30,{text:'1:2.8 f=80'});
    s+=`<rect x="156" y="118" width="88" height="16" rx="2" fill="#0c0c0d" stroke="rgba(255,255,255,.3)" stroke-width=".6"/>`+tx(200,129.5,o.mark,8,'#ece9e1');
    s+=`<rect x="146" y="138" width="108" height="102" rx="10" fill="url(#c${u})" stroke="rgba(0,0,0,.4)"/>`;
    s+=`<rect x="146" y="176" width="10" height="26" rx="3" fill="url(#n${u})"/><rect x="244" y="176" width="10" height="26" rx="3" fill="url(#n${u})"/>`;
    s+=lensFront(u,200,189,36,{text:'1:2.8 f=80mm HFT'});
    return s;
  },
  box(u,f,o){
    let s=`<rect x="124" y="30" width="152" height="28" rx="3" fill="url(#k${u})" stroke="#000"/><rect x="128" y="33" width="144" height="3" fill="rgba(255,255,255,.18)"/>`;
    s+=`<rect x="276" y="112" width="16" height="42" rx="4" fill="url(#n${u})"/>`;
    s+=`<rect x="116" y="56" width="168" height="176" rx="7" fill="url(#p${u})" stroke="rgba(0,0,0,.6)"/><rect x="124" y="64" width="152" height="160" rx="3" fill="url(#l${u})"/>`;
    s+=`<line x1="121" y1="57.5" x2="279" y2="57.5" stroke="rgba(255,255,255,.6)"/>`+tx(250,78,o.mark,7,'#ddd9cf');
    s+=`<circle cx="262" cy="208" r="7" fill="url(#c${u})" stroke="#000"/>`;
    s+=`<circle cx="200" cy="146" r="68" fill="url(#d${u})" stroke="#1a1a1a"/><circle cx="200" cy="146" r="63" fill="none" stroke="#5d6162" stroke-width="5" stroke-dasharray="1 2.6"/>`;
    s+=lensFront(u,200,146,57,{text:'1:2.8 f=80mm T*'});
    return s;
  },
  lens(u,f,o){
    const ch=f==='chrome',Y=`url(#${ch?'z':'y'}${u})`;
    let s=`<rect x="54" y="96" width="24" height="68" rx="3" fill="url(#z${u})" stroke="#222"/>`;
    s+=`<rect x="78" y="88" width="18" height="84" fill="${Y}" stroke="#000"/>`;
    s+=`<rect x="96" y="80" width="54" height="100" fill="url(#y${u})" stroke="#000"/>`;
    const ap=['16','11','8','5.6','4','2.8','2','1.4'];
    ap.forEach((t,i)=>{const th=(i-3)*17*Math.PI/180;if(Math.abs(th)>1.4)return;const y=130+48*Math.sin(th),sz=9*Math.cos(th);
      s+=`<text x="123" y="${(y+sz*.35).toFixed(1)}" text-anchor="middle" font-size="${sz.toFixed(1)}" fill="${t==='1.4'?'#e98a2c':'#efede6'}" font-family="Barlow Condensed, sans-serif" font-weight="600">${t}</text>`});
    for(let i=0;i<9;i++){const th=(i-4)*19*Math.PI/180,y=130+50*Math.sin(th);s+=`<line x1="96" y1="${y.toFixed(1)}" x2="104" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.18)"/>`}
    s+=`<rect x="150" y="82" width="12" height="96" fill="${Y}" stroke="#000"/><line x1="150" y1="130" x2="162" y2="130" stroke="#efede6" stroke-width="1.4"/><circle cx="156" cy="124" r="1.6" fill="#d0301f"/>`;
    s+=`<rect x="162" y="76" width="104" height="108" rx="2" fill="url(#y${u})" stroke="#000"/>`;
    for(let i=-14;i<=14;i++){const th=i*6*Math.PI/180,y=130+54*Math.sin(th);s+=`<line x1="164" y1="${y.toFixed(1)}" x2="264" y2="${y.toFixed(1)}" stroke="${i%2?'#000':'rgba(255,255,255,.1)'}" stroke-width="${(1.4*Math.cos(th)).toFixed(2)}"/>`}
    s+=`<rect x="266" y="80" width="28" height="100" fill="${Y}" stroke="#000"/>`;
    ['∞','10','5','3','2','1.5','1'].forEach((t,i)=>{const th=(i-3)*17*Math.PI/180,y=130+48*Math.sin(th),sz=8.5*Math.cos(th);
      s+=`<text x="280" y="${(y+sz*.35).toFixed(1)}" text-anchor="middle" font-size="${sz.toFixed(1)}" fill="${ch?'#2a2c2f':'#efede6'}" font-family="Barlow Condensed, sans-serif" font-weight="600">${t}</text>`});
    s+=`<rect x="294" y="82" width="36" height="96" fill="${Y}" stroke="#000"/><line x1="296" y1="82" x2="296" y2="178" stroke="rgba(255,255,255,.2)"/>`;
    s+=`<rect x="330" y="76" width="9" height="108" rx="2" fill="${Y}" stroke="#000"/>`;
    s+=`<ellipse cx="341" cy="130" rx="9" ry="46" fill="url(#g${u})" stroke="#000"/><ellipse cx="338" cy="112" rx="3" ry="14" fill="#fff" opacity=".35"/>`;
    s+=tx(312,214,o.mark,9,'#cfcbc2');
    return s;
  }
};
function camSVG(r,f,o){
  const u=++UID;o=o||{};
  return `<svg viewBox="0 0 400 260" role="img" aria-label="${o.label||''}" xmlns="http://www.w3.org/2000/svg">${camDefs(u,f||'chrome')}${(BODY[r]||BODY.slr)(u,f||'chrome',o)}</svg>`;
}

/* ---------- 测试卷印样 ---------- */
function drawRoll(c,seed){
  const g=c.getContext('2d'),W=c.width,H=c.height,FW=308,FH=206,GAP=17,FY=47,R=rng(seed);
  g.fillStyle='#1b1815';g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,240,220,.04)';g.fillRect(0,0,W,40);g.fillRect(0,H-40,W,40);
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();g.fill()};
  g.fillStyle='#ece6db';for(let x=10;x<W;x+=40.7){rr(x,13,24,17,3);rr(x,H-30,24,17,3)}
  const n0=10+Math.floor(R()*12);
  g.fillStyle='#e39b55';g.font='600 13px "Share Tech Mono", monospace';g.textBaseline='middle';
  for(let i=0;i<5;i++){const fx=GAP+i*(FW+GAP);g.fillText(String(n0+i),fx+4,H-8);g.fillText((n0+i)+'A',fx+FW/2+6,H-8);if(i%2===0)g.fillText('FIND TEST 400',fx+FW/2-40,8)}
  const frames=[star,steps,brick,flare,grid];
  frames.forEach((fn,i)=>{const fx=GAP+i*(FW+GAP);g.save();g.beginPath();g.rect(fx,FY,FW,FH);g.clip();g.translate(fx,FY);fn(FW,FH);
    const v=g.createRadialGradient(FW/2,FH/2,FH*.35,FW/2,FH/2,FW*.62);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.42)');g.fillStyle=v;g.fillRect(0,0,FW,FH);g.restore();grain(fx,FY,FW,FH)});
  function grain(x,y,w,h){const d=g.getImageData(x,y,w,h),p=d.data;for(let k=0;k<p.length;k+=4){const n=(R()-.5)*34,v=Math.max(0,Math.min(255,p[k]*.3+p[k+1]*.59+p[k+2]*.11+n));p[k]=p[k+1]=p[k+2]=v}g.putImageData(d,x,y)}
  function star(w,h){g.fillStyle='#b9b9b6';g.fillRect(0,0,w,h);const cx=w/2,cy=h/2,Rr=86,n=36;for(let i=0;i<n;i++){g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,Rr,i*2*Math.PI/n,(i+1)*2*Math.PI/n);g.closePath();g.fillStyle=i%2?'#f2f2ef':'#111';g.fill()}g.strokeStyle='#222';g.lineWidth=1.5;g.beginPath();g.arc(cx,cy,Rr+4,0,Math.PI*2);g.stroke()}
  function steps(w,h){g.fillStyle='#8c8c89';g.fillRect(0,0,w,h);const n=11,sw=(w-40)/n;for(let i=0;i<n;i++){const v=Math.round(245-i*23.5);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(20+i*sw,46,sw+.5,h-92);g.fillStyle=i<6?'#222':'#ddd';g.font='10px monospace';g.fillText(String(i),20+i*sw+sw/2-3,h-58)}}
  function brick(w,h){g.fillStyle='#d6d4cf';g.fillRect(0,0,w,h);const bh=17,bw=46;for(let r=0;r*bh<h+bh;r++){const off=(r%2)*bw/2;for(let x=-bw;x<w+bw;x+=bw){const v=Math.round(255*(.35+R()*.35));g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x+off+1.5,r*bh+1.5,bw-3,bh-3)}}g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,h-34,w,34)}
  function flare(w,h){const s=g.createLinearGradient(0,0,0,h);s.addColorStop(0,'#7a7a78');s.addColorStop(.62,'#d9d9d6');s.addColorStop(.63,'#2a2a29');s.addColorStop(1,'#141414');g.fillStyle=s;g.fillRect(0,0,w,h);const sx=w*.62,sy=h*.48,gl=g.createRadialGradient(sx,sy,4,sx,sy,90);gl.addColorStop(0,'rgba(255,255,255,1)');gl.addColorStop(.18,'rgba(255,255,255,.85)');gl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(0,0,w,h);g.fillStyle='#fff';g.beginPath();g.arc(sx,sy,13,0,Math.PI*2);g.fill();g.fillStyle='#161616';g.fillRect(w*.24,h*.18,5,h);g.fillRect(w*.24,h*.18,28,4);g.beginPath();g.ellipse(w*.24+28,h*.18+6,8,4,0,0,Math.PI*2);g.fill();g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=2;g.beginPath();g.arc(w-sx+20,h-sy+30,9,0,Math.PI*2);g.stroke()}
  function grid(w,h){g.fillStyle='#ecebe7';g.fillRect(0,0,w,h);g.strokeStyle='#1a1a1a';g.lineWidth=1.6;for(let x=14;x<w;x+=24){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let y=7;y<h;y+=24){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}g.fillStyle='#111';g.beginPath();g.arc(w/2,h/2,5,0,Math.PI*2);g.fill()}
  return n0;
}

/* ---------- 指针表头 ---------- */
function gaugeSVG(o){
  // o: {left,right,mid,zone}  zone = 绿色区间占半幅的比例
  const cx=120,cy=132,R=96,A=62,zone=o.zone||.667;
  const pt=(deg,r)=>{const a=(deg-90)*Math.PI/180;return [(cx+r*Math.cos(a)).toFixed(1),(cy+r*Math.sin(a)).toFixed(1)]};
  const arc=(d0,d1,r)=>{const [x0,y0]=pt(d0,r),[x1,y1]=pt(d1,r);return `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`};
  let s=`<svg viewBox="0 0 240 150" role="img" aria-label="${o.aria||'指针表'}"><rect x="2" y="2" width="236" height="146" rx="5" fill="#efeadc"/>`;
  if(o.plain)s+=`<path d="${arc(-A,A,R)}" fill="none" stroke="#9a9381" stroke-width="7" opacity=".55"/><path d="${arc(A*.4,A,R)}" fill="none" stroke="#3a8f5c" stroke-width="7" opacity=".6"/>`;
  else{s+=`<path d="${arc(-A,-A*zone,R)}" fill="none" stroke="#c9412e" stroke-width="7" opacity=".7"/><path d="${arc(A*zone,A,R)}" fill="none" stroke="#c9412e" stroke-width="7" opacity=".7"/>`;
  s+=`<path d="${arc(-A*zone,A*zone,R)}" fill="none" stroke="#3a8f5c" stroke-width="7" opacity=".7"/>`}
  for(let i=-12;i<=12;i++){const d=i*A/12,[x0,y0]=pt(d,R-6),[x1,y1]=pt(d,R-(i%3===0?18:12));s+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#222" stroke-width="${i%3===0?1.4:.8}"/>`}
  (o.labels||[]).forEach(l=>{const [x,y]=pt(l[0]*A,R-30);s+=`<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#222" font-family="Barlow Condensed, sans-serif" font-weight="600">${l[1]}</text>`});
  s+=`<text x="${cx}" y="${cy-40}" text-anchor="middle" font-size="8" fill="#555" font-family="Jost, sans-serif" letter-spacing="2">${o.unit||''}</text>`;
  s+=`<g class="needle" style="transform-origin:${cx}px ${cy}px;transform:rotate(0deg);transition:transform .7s cubic-bezier(.3,1.6,.5,1)"><line x1="${cx}" y1="${cy+8}" x2="${cx}" y2="${cy-R+4}" stroke="#151515" stroke-width="1.8"/><line x1="${cx}" y1="${cy-R+30}" x2="${cx}" y2="${cy-R+4}" stroke="#d0301f" stroke-width="1.8"/></g>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="9" fill="#1d1d1e"/><circle cx="${cx-2}" cy="${cy-2}" r="3" fill="#666"/>`;
  s+=`<path d="M8,10 L232,10 L232,50 Q120,30 8,70 Z" fill="#fff" opacity=".22"/></svg>`;
  return s;
}
function setNeedle(root,frac){const n=root.querySelector('.needle');if(n)n.style.transform=`rotate(${Math.max(-1.08,Math.min(1.08,frac))*62}deg)`}

/* ---------- 镜头灯箱 ---------- */
function lensBoxSVG(dust){
  const cx=150,cy=150;
  let s=`<svg viewBox="0 0 300 300" role="img" aria-label="镜头背光检查示意"><defs><radialGradient id="lbg" cx=".45" cy=".42" r=".7"><stop offset="0" class="lb-g0" stop-color="#2d3550"/><stop offset="1" class="lb-g1" stop-color="#05070c"/></radialGradient></defs>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="138" fill="#151617" stroke="#000"/><circle cx="${cx}" cy="${cy}" r="124" fill="none" stroke="#2c2e31" stroke-width="12" stroke-dasharray="1.2 2"/>`;
  s+=`<circle class="lb-glass" cx="${cx}" cy="${cy}" r="104" fill="url(#lbg)"/>`;
  s+=`<circle class="lb-ring" cx="${cx}" cy="${cy}" r="76" fill="none" stroke="rgba(150,120,255,.25)"/><circle class="lb-ring" cx="${cx}" cy="${cy}" r="48" fill="none" stroke="rgba(120,220,170,.2)"/>`;
  dust.forEach((d,i)=>{const x=cx+d[0]*104,y=cy+d[1]*104;
    s+=`<g class="lb-dust"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${2.2+(i%2)}" fill="#3a3f47"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="none" stroke="#d0301f" stroke-width="1.4" stroke-dasharray="3 2"/><text x="${(x+14).toFixed(1)}" y="${(y-12).toFixed(1)}" font-size="10" fill="#d0301f" font-family="Noto Sans SC, sans-serif" font-weight="700">${i+1}</text></g>`});
  s+=`<ellipse class="lb-hi" cx="112" cy="104" rx="30" ry="14" fill="#fff" opacity=".35" transform="rotate(-35 112 104)"/></svg>`;
  return s;
}
