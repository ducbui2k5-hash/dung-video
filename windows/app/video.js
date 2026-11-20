'use strict';
/* ================= common ================= */
const $=s=>document.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,10);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>{t=Math.max(0,t||0);const m=Math.floor(t/60),s=t-m*60;return String(m).padStart(2,'0')+':'+s.toFixed(1).padStart(4,'0')};
const fmtS=t=>{const m=Math.floor(t/60),s=Math.round(t-m*60);return m+':'+String(s).padStart(2,'0')};
const easeOut=p=>1-Math.pow(1-p,3);
const easeIO=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
const easeBack=p=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2)};
function rnd(seed){let x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x)}
const FONTS=['Be Vietnam Pro','Montserrat','Oswald','Lobster','Pacifico','Dancing Script','Patrick Hand','Arial','Times New Roman'];
const STICKERS={
 'Cảm xúc':'😀 😂 🤣 😍 🥰 😘 😎 🤩 🥳 😭 😡 😱 🤔 🙄 😴 🤯 🥺 😇 🤪 😜 🫶 👍 👏 🙏 💪 ✌️ 🤞 👀',
 'Trái tim':'❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💖 💗 💓 💞 💕 💘 💝 ❣️ 💔',
 'Trang trí':'✨ ⭐ 🌟 💫 🔥 💥 💯 🎉 🎊 🎈 🎁 🏆 👑 💎 🌈 ☀️ 🌙 ⚡ ❄️ 🌸 🌺 🌻 🍀 🦋',
 'Đồ ăn':'🍜 🍲 🍚 🥖 🍕 🍔 🍟 🍦 🍰 🧋 ☕ 🍉 🥭 🍓',
 'Khác':'📍 📸 🎵 🎶 🎬 🎮 ⚽ 🏀 🚗 ✈️ 🏖️ 🐶 🐱 🐼 🐰 💤 💬 ❗ ❓ ✅ ❌ ➡️ ⬅️ ⬆️ ⬇️ 🔴 🟢'
};
let toastT=0;function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),3400)}
function modal(h){$('#mbox').innerHTML=h;$('#modal').classList.remove('hide')}
function closeModal(){$('#modal').classList.add('hide')}
let DL=null;
(function waitClaude(n){if(window.claude&&typeof window.claude.use==='function'){window.claude.use('downloads').then(d=>{DL=d}).catch(()=>{})}else if(n<60)setTimeout(()=>waitClaude(n+1),250)})(0);
const inFrame=window.self!==window.top;
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function fileOf(name,blob){const ext=name.split('.').pop().toLowerCase(),mt={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',mp4:'video/mp4',webm:'video/webm'}[ext]||blob.type||'application/octet-stream';try{return new File([blob],name,{type:mt})}catch(e){return null}}
function canShareFile(name,blob){if(inFrame||!navigator.canShare)return false;const f=fileOf(name,blob);try{return!!f&&navigator.canShare({files:[f]})}catch(e){return false}}
async function shareBlob(name,blob){const f=fileOf(name,blob);try{await navigator.share({files:[f],title:name});toast('Đã mở chia sẻ')}catch(e){if(e&&e.name==='AbortError')toast('Đã hủy');else{console.warn(e);downloadLink(name,blob)}}}
function downloadLink(name,blob){try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Đang tải về “'+name+'”…')}catch(e){toast('Chế độ xem này không cho lưu tệp.')}}
function saveBtns(){return'<button class="pri" id="mSave">💾 Lưu về máy</button>'+(canShareFile('x.jpg',new Blob(['x']))||isIOS&&!inFrame?'<button id="mShare">📤 Chia sẻ / Lưu vào Ảnh</button>':'')}
function bindSave(name,blob,kind){$('#mSave').onclick=()=>saveBlob(name,blob,kind);const sh=$('#mShare');if(sh)sh.onclick=()=>canShareFile(name,blob)?shareBlob(name,blob):(toast('Trình duyệt này không hỗ trợ chia sẻ tệp, đang tải về…'),downloadLink(name,blob))}
const AB=window.AndroidBridge||null;
async function androidSave(name,blob,kind){
 try{const ext=name.split('.').pop().toLowerCase();let mt=fileOf(name,blob).type;if(kind==='audio')mt=ext==='webm'?'audio/webm':'audio/mp4';
  const id=AB.begin(name,mt);const CH=393216;
  for(let o=0;o<blob.size;o+=CH){const buf=new Uint8Array(await blob.slice(o,o+CH).arrayBuffer());let bin='';for(let i=0;i<buf.length;i+=8192)bin+=String.fromCharCode.apply(null,buf.subarray(i,i+8192));AB.append(id,btoa(bin))}
  const r=AB.finish(id);if(String(r).startsWith('ok'))toast('Đã lưu vào máy: '+String(r).slice(3));else toast('Không lưu được: '+r);
 }catch(e){console.error(e);toast('Không lưu được tệp')}
}
async function saveBlob(name,blob,kind){
 if(AB){toast('Đang lưu…');return androidSave(name,blob,kind)}
 if(DL){try{await DL.save({filename:name,data:blob});toast('Đã lưu “'+name+'”');return}catch(e){const c=e&&e.code;
  if(c==='declined'){toast('Bạn đã hủy lưu tệp');return}
  if(c==='rate_limited'){toast('Đang có hộp thoại lưu khác, thử lại sau giây lát');return}
  if(c==='too_large'){toast('Tệp quá lớn để lưu ở đây');return}
  console.warn(e)}}
 if(isIOS&&canShareFile(name,blob)){shareBlob(name,blob);return}
 downloadLink(name,blob);
}
function stickerPicker(onPick){
 modal(`<h2>Chọn sticker</h2>${Object.entries(STICKERS).map(([k,v])=>`<div class="gt" style="margin-top:10px">${k}</div><div class="stk">${v.split(' ').map(e=>`<button data-e="${e}">${e}</button>`).join('')}</div>`).join('')}<div class="btns"><button id="mClose">Đóng</button></div>`);
 $('#mClose').onclick=closeModal;
 $('#mbox').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{closeModal();onPick(b.dataset.e)});
}

/* ================= video editor ================= */
const ASPECTS={'16:9':[1280,720],'9:16':[720,1280],'1:1':[720,720],'4:3':[960,720],'3:4':[720,960]};
const F0={b:100,c:100,s:100,h:0,sep:0,gray:0,blur:0};
const PRESETS={'Gốc':{},'Rực rỡ':{s:150,c:115},'Ấm áp':{sep:30,s:120,b:105},'Mát lạnh':{h:-12,s:90,b:102,c:105},'Đen trắng':{gray:100,c:120},'Cổ điển':{sep:60,c:90,b:105,s:85},'Điện ảnh':{c:130,s:80,b:95},'Mơ màng':{blur:1.2,b:110,s:110,c:90},'Tối huyền bí':{b:80,c:125,s:70}};
const TSTYLES={
 'Trắng viền đen':{color:'#ffffff',strokeOn:true,stroke:'#000000',bgOn:false,font:'Be Vietnam Pro',bold:true},
 'Vàng nổi':{color:'#ffd400',strokeOn:true,stroke:'#000000',bgOn:false,font:'Montserrat',bold:true},
 'Nền đen':{color:'#ffffff',strokeOn:false,bgOn:true,bg:'#000000',font:'Be Vietnam Pro',bold:true},
 'Nền trắng':{color:'#111111',strokeOn:false,bgOn:true,bg:'#ffffff',font:'Be Vietnam Pro',bold:true},
 'Hồng':{color:'#ff4fa3',strokeOn:true,stroke:'#ffffff',bgOn:false,font:'Lobster',bold:false},
 'Viết tay':{color:'#ffffff',strokeOn:true,stroke:'#1b1b1b',bgOn:false,font:'Dancing Script',bold:true},
 'Tiêu đề':{color:'#ffffff',strokeOn:false,bgOn:false,font:'Oswald',bold:true}
};
const TRANS={none:'Không',fade:'Hòa tan',black:'Qua màn đen',white:'Qua màn trắng',flash:'Lóe sáng',slideL:'Đẩy sang trái',slideR:'Đẩy sang phải',slideU:'Đẩy lên',slideD:'Đẩy xuống',wipeL:'Quét ngang',wipeD:'Quét dọc',circle:'Vòng tròn mở',zoomIn:'Phóng vào',zoomOut:'Lùi ra',spin:'Xoay tròn',blur:'Làm mờ',glitch:'Nhiễu glitch'};
const VFX={none:'Không',kb:'Zoom chậm',pulse:'Nhịp đập',shake:'Rung lắc',glitch:'Glitch',vhs:'Băng VHS',oldfilm:'Phim cũ',flicker:'Nhấp nháy',mirror:'Soi gương'};

let S={aspect:'16:9',fit:'fit',bg:'#000000',video:[],text:[],audio:[],over:[]};
const media=new Map();
let sel=null,T=0,playing=false,pps=50,exporting=false;
let actx=null,master,spk,recDest;
const cv=$('#cv'),ctx=cv.getContext('2d');
const offA=document.createElement('canvas'),offB=document.createElement('canvas');
const inner=$('#tlInner'),scroller=$('#tlScroll');

/* ---------- audio ---------- */
function ensureAudio(){
 if(actx)return;
 actx=new (window.AudioContext||window.webkitAudioContext)();
 master=actx.createGain();spk=actx.createGain();master.connect(spk);spk.connect(actx.destination);
 if(actx.createMediaStreamDestination){recDest=actx.createMediaStreamDestination();master.connect(recDest)}
}
function decodeBuf(ab){return new Promise((res,rej)=>{const p=actx.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej)})}

/* ---------- media ---------- */
function seekEl(el,t){return new Promise(res=>{let done=false;const f=()=>{if(done)return;done=true;el.removeEventListener('seeked',f);res()};el.addEventListener('seeked',f);el.currentTime=t;setTimeout(f,2000)})}
function newVideoEl(url){const el=document.createElement('video');el.src=url;el.preload='auto';el.playsInline=true;el.setAttribute('playsinline','');return el}
function getEl(m,key){
 m.els=m.els||{};if(m.els[key])return m.els[key];
 const el=newVideoEl(m.url);const src=actx.createMediaElementSource(el);const g=actx.createGain();src.connect(g);g.connect(master);
 return m.els[key]={el,g};
}
async function addVideoMedia(f){
 const url=URL.createObjectURL(f);const el=newVideoEl(url);
 await new Promise((res,rej)=>{el.onloadedmetadata=res;el.onerror=()=>rej(new Error('Không đọc được video'))});
 if(!isFinite(el.duration)){el.currentTime=1e7;await new Promise(r=>{el.ondurationchange=r;setTimeout(r,3000)});el.currentTime=0}
 if(!el.videoWidth){toast('Trình duyệt không hỗ trợ định dạng video “'+f.name+'”. Hãy thử file MP4.');return null}
 const m={id:uid(),kind:'video',name:f.name,file:f,url,duration:el.duration,w:el.videoWidth,h:el.videoHeight};
 try{await seekEl(el,Math.min(1,el.duration*0.1));const c=document.createElement('canvas');c.height=64;c.width=Math.round(64*el.videoWidth/el.videoHeight);c.getContext('2d').drawImage(el,0,0,c.width,c.height);m.thumb=c.toDataURL('image/jpeg',.7)}catch(e){}
 const src=actx.createMediaElementSource(el);const g=actx.createGain();src.connect(g);g.connect(master);m.els={0:{el,g}};
 media.set(m.id,m);return m;
}
async function addImageMedia(f,name){
 const url=URL.createObjectURL(f);const img=new Image();img.src=url;await img.decode();
 const m={id:uid(),kind:'image',name:name||f.name,url,img,duration:3,w:img.naturalWidth,h:img.naturalHeight,thumb:url};
 media.set(m.id,m);return m;
}
function makeWave(buf){
 const w=Math.min(4000,Math.max(200,Math.ceil(buf.duration*40))),h=40;
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 const d=buf.getChannelData(0),step=Math.max(1,Math.floor(d.length/w));g.fillStyle='rgba(120,255,200,.75)';
 for(let x=0;x<w;x++){let mx=0;const s=x*step;for(let i=0;i<step;i+=8){const v=Math.abs(d[s+i]||0);if(v>mx)mx=v}const bh=Math.max(1,mx*h);g.fillRect(x,(h-bh)/2,1,bh)}
 return c.toDataURL();
}
function addAudioMedia(name,buffer){const m={id:uid(),kind:'audio',name,buffer,duration:buffer.duration,wave:makeWave(buffer)};media.set(m.id,m);return m}
const isVideoFile=f=>/^video\//.test(f.type)||/\.(mp4|mov|webm|mkv|m4v|avi|3gp)$/i.test(f.name);
const isAudioFile=f=>/^audio\//.test(f.type)||/\.(mp3|wav|m4a|aac|ogg|oga|flac|opus|wma)$/i.test(f.name);
const isImageFile=f=>/^image\//.test(f.type);
async function importFiles(files,autoAdd){
 ensureAudio();const added=[];
 for(const f of files){
  try{let m=null;
   if(isVideoFile(f))m=await addVideoMedia(f);
   else if(isAudioFile(f)){toast('Đang đọc nhạc…');m=addAudioMedia(f.name,await decodeBuf(await f.arrayBuffer()))}
   else if(isImageFile(f))m=await addImageMedia(f);
   else toast('Không hỗ trợ tệp: '+f.name);
   if(m)added.push(m);
  }catch(e){console.error(e);toast('Không mở được “'+f.name+'”')}
 }
 renderLib();
 const vis=added.filter(m=>m.kind!=='audio');
 if(autoAdd&&vis.length){edit(()=>{for(const m of vis)pushToTimeline(m)});if(vis.length<added.length)toast('Đã đưa video/ảnh vào dòng 🎬. Nhạc nằm trong Thư viện, bấm “＋ Thêm” để chèn.')}
 else if(added.length)toast('Đã thêm '+added.length+' tệp vào thư viện. Bấm “＋ Thêm” để đưa vào video.');
 return added;
}
async function extractFromVideoFile(f,name){
 ensureAudio();toast('Đang tách nhạc từ video…');
 try{const b=await decodeBuf(await f.arrayBuffer());const m=addAudioMedia('🎵 '+String(name).replace(/\.[^.]+$/,''),b);renderLib();return m}
 catch(e){console.error(e);toast('Video này không có âm thanh, hoặc trình duyệt không đọc được.');return null}
}

/* ---------- project ---------- */
function vLayout(){
 const n=S.video.length,ds=S.video.map(c=>(c.out-c.in)/c.speed),L=[];
 for(let i=0;i<n;i++){const c=S.video[i];const start=i?L[i-1].end-L[i-1].ov:0;
  const ov=(i<n-1&&c.tr&&c.tr.type!=='none')?Math.min(c.tr.d,ds[i]/2,ds[i+1]/2):0;
  L.push({c,i,start,end:start+ds[i],d:ds[i],ov})}
 return L;
}
const ovLen=o=>(o.out-o.in);
function total(){const L=vLayout();let e=L.length?L[L.length-1].end:0;for(const x of S.text)e=Math.max(e,x.start+x.dur);for(const a of S.audio)e=Math.max(e,a.start+a.out-a.in);for(const o of S.over)e=Math.max(e,o.start+ovLen(o));return e}
function activeV(L){L=L||vLayout();return L.filter(r=>T>=r.start&&T<r.end)}
function curV(){const a=activeV();return a[a.length-1]||null}
function selObj(){if(!sel)return null;const tr=sel.tr==='trans'?'video':sel.tr;return S[tr].find(x=>x.id===sel.id)||null}
function newVClip(m){return{id:uid(),m:m.id,in:0,out:m.kind==='image'?3:m.duration,speed:1,vol:1,mute:false,f:{...F0},preset:'Gốc',fi:0,fo:0,zoom:1,rot:0,flip:false,fx:'none',tr:null}}
function pushToTimeline(m){
 if(m.kind==='audio'){const a={id:uid(),m:m.id,start:T,in:0,out:m.duration,vol:1,fi:0,fo:0};S.audio.push(a);sel={tr:'audio',id:a.id}}
 else{const c=newVClip(m);if(m.kind==='image')c.fx='kb';S.video.push(c);sel={tr:'video',id:c.id};if(S.video.length===1&&m.w&&m.h)autoAspect(m)}
}
function pushOverlay(m){const o={id:uid(),m:m.id,start:T,in:0,out:m.kind==='image'?3:m.duration,x:.72,y:.28,w:.38,rot:0,op:1,vol:1,mute:false,shape:'round',fi:0,fo:0};S.over.push(o);sel={tr:'over',id:o.id}}
function autoAspect(m){const r=m.w/m.h;S.aspect=r<0.7?'9:16':r<0.9?'3:4':r<1.15?'1:1':r<1.5?'4:3':'16:9'}
function applyAspect(){const[w,h]=ASPECTS[S.aspect];if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}}

/* ---------- undo ---------- */
let undo=[],redo=[],lastKey=null,lastAt=0;
function pushUndo(key){const now=Date.now();if(key&&key===lastKey&&now-lastAt<900){lastAt=now;return}lastKey=key||null;lastAt=now;undo.push(JSON.stringify(S));if(undo.length>120)undo.shift();redo=[];updUndo()}
function edit(fn,key,noProps){pushUndo(key);fn();changed(noProps)}
function changed(noProps){if(!exporting)applyAspect();if(sel&&!selObj())sel=null;const tot=total();if(T>tot)T=tot;if(playing)resync();renderTimeline();if(!noProps)renderProps();updTime();updUndo()}
function vUndo(){if(!undo.length)return;redo.push(JSON.stringify(S));S=JSON.parse(undo.pop());lastKey=null;changed()}
function vRedo(){if(!redo.length)return;undo.push(JSON.stringify(S));S=JSON.parse(redo.pop());lastKey=null;changed()}
function updUndo(){if(document.body.classList.contains('pm'))return;$('#undoBtn').disabled=!undo.length;$('#redoBtn').disabled=!redo.length}

/* ---------- playback ---------- */
let clockT0=0,ctxT0=0,srcs=[];
function play(){ensureAudio();actx.resume();if(T>=total()-0.02)T=0;if(total()<=0)return;playing=true;ctxT0=actx.currentTime;clockT0=T;scheduleAudio();updPlay()}
function pause(){playing=false;stopSources();for(const m of media.values())if(m.els)for(const o of Object.values(m.els))if(!o.el.paused)o.el.pause();updPlay()}
function toggle(){if(exporting)return;playing?pause():play()}
function resync(){stopSources();clockT0=T;ctxT0=actx.currentTime;scheduleAudio()}
function seekTo(t){T=clamp(t,0,total());if(playing)resync();updTime();updPh()}
function stopSources(){for(const s of srcs){try{s.stop&&s.stop()}catch(e){}try{s.disconnect()}catch(e){}}srcs=[]}
function volAt(a,l){const len=a.out-a.in;let k=1;if(a.fi>0&&l<a.fi)k=Math.min(k,l/a.fi);if(a.fo>0&&l>len-a.fo)k=Math.min(k,(len-l)/a.fo);return a.vol*Math.max(0,k)}
function scheduleAudio(){
 const now=actx.currentTime;
 for(const a of S.audio){
  const m=media.get(a.m);if(!m||!m.buffer)continue;
  const len=a.out-a.in,end=a.start+len;if(end<=T+0.01)continue;
  const local=Math.max(0,T-a.start),when=now+Math.max(0,a.start-T),t0=now+(a.start-T);
  const s=actx.createBufferSource();s.buffer=m.buffer;const g=actx.createGain();s.connect(g);g.connect(master);
  g.gain.setValueAtTime(volAt(a,local),when);
  if(a.fi>0&&local<a.fi)g.gain.linearRampToValueAtTime(a.vol,t0+a.fi);
  if(a.fo>0){const fs=t0+len-a.fo;if(fs>when)g.gain.setValueAtTime(a.vol,fs);g.gain.linearRampToValueAtTime(0,t0+len)}
  s.start(when,a.in+local,len-local);srcs.push(s,g);
 }
}
function fadeK(c,lt,d){let k=1;if(c.fi>0&&lt<c.fi)k=Math.min(k,lt/c.fi);if(c.fo>0&&lt>d-c.fo)k=Math.min(k,(d-lt)/c.fo);return clamp(k,0,1)}
function transP(act){return act.length===2&&act[0].ov>0?clamp((T-act[1].start)/act[0].ov,0,1):null}
function syncVideo(){
 const L=vLayout(),act=activeV(L),want=new Map(),p=transP(act);
 act.forEach((r,j)=>{const m=media.get(r.c.m);if(!m||m.kind!=='video')return;const o=getEl(m,r.i%2);
  let g=r.c.mute?0:r.c.vol*fadeK(r.c,T-r.start,r.d);if(p!==null)g*=j===0?1-p:p;
  want.set(o,{t:r.c.in+(T-r.start)*r.c.speed,s:r.c.speed,g})});
 const last=act[act.length-1];const ni=last?last.i+1:L.findIndex(r=>r.start>T);
 if(ni>=0&&ni<L.length&&L[ni].start-T<1.5){const n=L[ni],m=media.get(n.c.m);if(m&&m.kind==='video'){const o=getEl(m,n.i%2);if(!want.has(o))want.set(o,{t:n.c.in,s:n.c.speed,g:0,pre:true})}}
 for(const ov of S.over){if(T<ov.start||T>=ov.start+ovLen(ov))continue;const m=media.get(ov.m);if(!m||m.kind!=='video')continue;
  const o=getEl(m,'o'+ov.id);want.set(o,{t:ov.in+(T-ov.start),s:1,g:ov.mute?0:ov.vol*fadeK(ov,T-ov.start,ovLen(ov))})}
 for(const m of media.values())if(m.els)for(const o of Object.values(m.els)){const w=want.get(o);if(!w){if(!o.el.paused)o.el.pause();continue}applyEl(o,w)}
}
function applyEl(o,w){
 const el=o.el;o.g.gain.value=w.g;
 if(w.pre){if(!el.paused)el.pause();if(!el.seeking&&Math.abs(el.currentTime-w.t)>0.05)el.currentTime=w.t;return}
 if(playing){if(Math.abs(el.playbackRate-w.s)>0.001)el.playbackRate=w.s;
  if(el.paused){if(Math.abs(el.currentTime-w.t)>0.08)el.currentTime=w.t;el.play().catch(()=>{})}
  else if(!el.seeking&&Math.abs(el.currentTime-w.t)>0.3)el.currentTime=w.t}
 else{if(!el.paused)el.pause();if(!el.seeking&&Math.abs(el.currentTime-w.t)>0.03)el.currentTime=w.t}
}

/* ---------- render ---------- */
const boxes=[];
function filterStr(f,k){return`brightness(${f.b}%) contrast(${f.c}%) saturate(${f.s}%) hue-rotate(${f.h}deg) sepia(${f.sep}%) grayscale(${f.gray}%)`+(f.blur>0?` blur(${(f.blur*k).toFixed(2)}px)`:'')}
function srcOf(m,key){if(m.kind==='image')return{src:m.img,sw:m.w,sh:m.h,ok:true};const o=getEl(m,key);return{src:o.el,sw:o.el.videoWidth,sh:o.el.videoHeight,ok:o.el.readyState>=2}}
function sizeOff(c,W,H){if(c.width!==W||c.height!==H){c.width=W;c.height=H}return c.getContext('2d')}
function drawClip(g,r,W,H,k){
 const c=r.c,m=media.get(c.m);
 g.save();g.globalAlpha=1;g.filter='none';g.globalCompositeOperation='source-over';g.fillStyle=S.bg;g.fillRect(0,0,W,H);
 if(m){const s=srcOf(m,r.i%2);if(s.sw&&s.sh){
  const lt=T-r.start,fx=c.fx||'none';
  g.globalAlpha=fadeK(c,lt,r.d);g.filter=filterStr(c.f,k)+(fx==='oldfilm'?' sepia(70%) contrast(110%)':'');
  g.translate(W/2,H/2);
  if(fx==='shake'){const a=10*k,q=Math.floor(lt*24);g.translate((rnd(q)-.5)*2*a,(rnd(q+99)-.5)*2*a)}
  if(fx==='pulse'){const s=1+0.07*Math.pow(Math.max(0,Math.sin(lt*Math.PI*2)),4);g.scale(s,s)}
  if(fx==='kb'){const s=1+0.18*(lt/Math.max(0.1,r.d));g.scale(s,s)}
  g.rotate((c.rot||0)*Math.PI/180);if(c.flip)g.scale(-1,1);
  const side=(c.rot||0)%180!==0,rw=side?s.sh:s.sw,rh=side?s.sw:s.sh;
  const z=(S.fit==='fit'?Math.min(W/rw,H/rh):Math.max(W/rw,H/rh))*(c.zoom||1);
  g.drawImage(s.src,-s.sw*z/2,-s.sh*z/2,s.sw*z,s.sh*z);
  g.restore();g.save();
  postFx(g,fx,lt,W,H,k);
 }}
 g.restore();
}
function postFx(g,fx,lt,W,H,k){
 const q=Math.floor(lt*24);
 if(fx==='glitch'){const ph=lt%1.2;if(ph<0.3||rnd(q)>0.85){const n=6+Math.floor(rnd(q+1)*8);for(let i=0;i<n;i++){const y=rnd(q*7+i)*H,h=(4+rnd(q*3+i)*40)*k,dx=(rnd(q*5+i)-.5)*80*k;g.drawImage(g.canvas,0,y,W,h,dx,y,W,h)}
  g.globalCompositeOperation='screen';g.globalAlpha=.35;g.drawImage(g.canvas,6*k,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
  g.fillStyle=`rgba(${rnd(q)>.5?'255,0,90':'0,255,220'},.18)`;g.fillRect(0,rnd(q+5)*H,W,(10+rnd(q+6)*30)*k)}}
 else if(fx==='vhs'){g.fillStyle='rgba(0,0,0,.16)';for(let y=0;y<H;y+=4*k)g.fillRect(0,y,W,1.5*k);
  const by=((lt*0.25)%1)*H;g.fillStyle='rgba(255,255,255,.07)';g.fillRect(0,by,W,30*k);
  g.drawImage(g.canvas,0,by,W,12*k,(rnd(q)-.5)*20*k,by,W,12*k);
  g.fillStyle='#fff';g.font=`700 ${30*k}px monospace`;g.textBaseline='top';g.shadowColor='#000';g.shadowBlur=4*k;
  if(Math.floor(lt*2)%2===0)g.fillText('▶ PLAY',36*k,30*k);g.fillText(fmt(lt).replace('.',':'),W-200*k,H-60*k);g.shadowBlur=0}
 else if(fx==='oldfilm'){g.fillStyle='rgba(0,0,0,.5)';for(let i=0;i<3;i++)if(rnd(q*11+i)>.5)g.fillRect(rnd(q*13+i)*W,0,1.5*k,H);
  for(let i=0;i<14;i++){g.fillStyle=rnd(q+i*3)>.5?'rgba(255,255,255,.5)':'rgba(0,0,0,.5)';g.fillRect(rnd(q*17+i)*W,rnd(q*19+i)*H,2.5*k,2.5*k)}
  const gr=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.6)');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 else if(fx==='flicker'){const a=rnd(Math.floor(lt*12))*0.35;g.fillStyle=`rgba(0,0,0,${a})`;g.fillRect(0,0,W,H)}
 else if(fx==='mirror'){g.save();g.translate(W,0);g.scale(-1,1);g.drawImage(g.canvas,0,0,W/2,H,0,0,W/2,H);g.restore()}
}
function drawScaled(g,img,s,a,W,H,rot){g.save();g.globalAlpha=a;g.translate(W/2,H/2);if(rot)g.rotate(rot);g.scale(s,s);g.drawImage(img,-W/2,-H/2);g.restore()}
function compose(type,a,b,p,W,H,k){
 const g=ctx,e=easeIO(p);g.save();g.fillStyle='#000';g.fillRect(0,0,W,H);
 switch(type){
  case 'black':case 'white':g.fillStyle=type==='black'?'#000':'#fff';g.fillRect(0,0,W,H);if(p<.5){g.globalAlpha=1-p*2;g.drawImage(a,0,0)}else{g.globalAlpha=p*2-1;g.drawImage(b,0,0)}break;
  case 'flash':g.drawImage(a,0,0);g.globalAlpha=e;g.drawImage(b,0,0);g.globalAlpha=Math.sin(p*Math.PI)*.92;g.fillStyle='#fff';g.fillRect(0,0,W,H);break;
  case 'slideL':g.drawImage(a,-e*W,0);g.drawImage(b,W-e*W,0);break;
  case 'slideR':g.drawImage(a,e*W,0);g.drawImage(b,-W+e*W,0);break;
  case 'slideU':g.drawImage(a,0,-e*H);g.drawImage(b,0,H-e*H);break;
  case 'slideD':g.drawImage(a,0,e*H);g.drawImage(b,0,-H+e*H);break;
  case 'wipeL':g.drawImage(a,0,0);g.beginPath();g.rect(0,0,W*e,H);g.clip();g.drawImage(b,0,0);break;
  case 'wipeD':g.drawImage(a,0,0);g.beginPath();g.rect(0,0,W,H*e);g.clip();g.drawImage(b,0,0);break;
  case 'circle':g.drawImage(a,0,0);g.beginPath();g.arc(W/2,H/2,e*Math.hypot(W,H)/2+0.1,0,Math.PI*2);g.clip();g.drawImage(b,0,0);break;
  case 'zoomIn':drawScaled(g,a,1+e*.8,1-e,W,H);drawScaled(g,b,.85+.15*e,e,W,H);break;
  case 'zoomOut':drawScaled(g,a,1-e*.4,1-e,W,H);drawScaled(g,b,1.4-.4*e,e,W,H);break;
  case 'spin':if(p<.5){const q=easeIO(p*2);drawScaled(g,a,1-q*.95,1,W,H,q*Math.PI)}else{const q=easeIO((p-.5)*2);drawScaled(g,b,.05+.95*q,1,W,H,(q-1)*Math.PI)}break;
  case 'blur':{const bl=Math.sin(p*Math.PI)*24*k;g.filter=`blur(${bl.toFixed(1)}px)`;g.drawImage(a,0,0);g.globalAlpha=e;g.drawImage(b,0,0);break}
  case 'glitch':{g.drawImage(p<.5?a:b,0,0);const q=Math.floor(T*30),I=Math.sin(p*Math.PI);for(let i=0;i<14*I;i++){const y=rnd(q*7+i)*H,h=(6+rnd(q*3+i)*50)*k,dx=(rnd(q*5+i)-.5)*160*k*I;g.drawImage(rnd(q+i)>.5?a:b,0,y,W,h,dx,y,W,h)}
   g.fillStyle=`rgba(${rnd(q)>.5?'255,0,90':'0,255,220'},${.25*I})`;g.fillRect(0,0,W,H);break}
  default:g.drawImage(a,0,0);g.globalAlpha=e;g.drawImage(b,0,0);
 }
 g.restore();
}
function render(){
 const W=cv.width,H=cv.height,k=Math.min(W,H)/720,L=vLayout(),act=activeV(L);
 for(const r of act){const m=media.get(r.c.m);if(m&&m.kind==='video'&&getEl(m,r.i%2).el.readyState<2)return}
 if(act.length===0){ctx.fillStyle=S.bg;ctx.fillRect(0,0,W,H)}
 else if(act.length===1){const g=sizeOff(offA,W,H);drawClip(g,act[0],W,H,k);ctx.drawImage(offA,0,0)}
 else{const ga=sizeOff(offA,W,H),gb=sizeOff(offB,W,H);drawClip(ga,act[0],W,H,k);drawClip(gb,act[1],W,H,k);compose(act[0].c.tr.type,offA,offB,transP(act),W,H,k)}
 boxes.length=0;drawOverlays(W,H,k);drawTexts(W,H,k);
 if(!exporting&&!S.video.length&&!S.text.length&&!S.audio.length&&!S.over.length){
  ctx.save();ctx.fillStyle='#8b93a7';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`500 ${28*k}px "Be Vietnam Pro",Arial,sans-serif`;ctx.fillText('Bấm “Nhập tệp” để thêm video, ảnh, nhạc',W/2,H/2-18*k);
  ctx.font=`400 ${20*k}px "Be Vietnam Pro",Arial,sans-serif`;ctx.fillText('hoặc kéo thả tệp vào trang',W/2,H/2+22*k);ctx.restore();
 }
}
function rrect(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function drawOverlays(W,H,k){
 for(const o of S.over){
  const len=ovLen(o);if(T<o.start||T>=o.start+len)continue;const m=media.get(o.m);if(!m)continue;
  const s=srcOf(m,'o'+o.id);if(!s.sw||!s.ok&&m.kind==='video')continue;
  const w=o.w*W,h=w*s.sh/s.sw,cx=o.x*W,cy=o.y*H;
  ctx.save();ctx.globalAlpha=o.op*fadeK(o,T-o.start,len);ctx.translate(cx,cy);ctx.rotate((o.rot||0)*Math.PI/180);
  if(o.shape==='circle'){const r=Math.min(w,h)/2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();const z=2*r/Math.min(w,h);ctx.drawImage(s.src,-w*z/2,-h*z/2,w*z,h*z)}
  else{if(o.shape==='round'){rrect(ctx,-w/2,-h/2,w,h,Math.min(w,h)*0.08);ctx.clip()}ctx.drawImage(s.src,-w/2,-h/2,w,h)}
  ctx.restore();
  const bw=o.shape==='circle'?Math.min(w,h):w,bh=o.shape==='circle'?Math.min(w,h):h;
  const b={kind:'over',id:o.id,x:cx-bw/2,y:cy-bh/2,w:bw,h:bh};boxes.push(b);
  if(!exporting&&sel&&sel.id===o.id)selRect(b,k);
 }
}
function selRect(b,k){ctx.save();ctx.strokeStyle='#3ee6c4';ctx.lineWidth=2*k;ctx.setLineDash([8*k,6*k]);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.restore()}
function drawTexts(W,H,k){
 for(const x of S.text){
  if(T<x.start||T>=x.start+x.dur)continue;
  const lt=T-x.start;let a=1,sc=1,dy=0,str=x.text;const aout=clamp((x.dur-lt)/0.35,0,1);
  if(x.anim==='fade')a=Math.min(clamp(lt/0.4,0,1),aout);
  else if(x.anim==='pop'){const p=clamp(lt/0.35,0,1);sc=0.3+0.7*easeBack(p);a=Math.min(clamp(lt/0.12,0,1),aout)}
  else if(x.anim==='up'){const p=clamp(lt/0.5,0,1);dy=(1-easeOut(p))*50*k;a=Math.min(p,aout)}
  else if(x.anim==='type'){const ch=[...x.text];const n=Math.floor(clamp(lt/Math.max(0.4,Math.min(2.5,x.dur*0.6)),0,1)*ch.length);str=ch.slice(0,n).join('')}
  else if(x.anim==='bounce'){dy=-Math.abs(Math.sin(lt*Math.PI*2))*18*k}
  const fs=x.size*k;
  ctx.save();ctx.globalAlpha=a;ctx.font=`${x.bold?'700':'400'} ${fs}px "${x.font}", "Be Vietnam Pro", Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  const full=x.text.split('\n'),lines=str.split('\n'),lh=fs*1.22;
  const bw=Math.max(10,...full.map(l=>ctx.measureText(l).width)),bh=lh*full.length;
  const cx=x.x*W,cy=x.y*H+dy;ctx.translate(cx,cy);ctx.rotate((x.rot||0)*Math.PI/180);ctx.scale(sc,sc);
  const px=fs*0.35,py=fs*0.18;
  if(x.bgOn){ctx.fillStyle=x.bg;rrect(ctx,-bw/2-px,-bh/2-py,bw+px*2,bh+py*2,fs*0.22);ctx.fill()}
  lines.forEach((l,i)=>{const y=-bh/2+lh*(i+0.5);if(x.strokeOn){ctx.lineWidth=fs*0.16;ctx.lineJoin='round';ctx.strokeStyle=x.stroke;ctx.strokeText(l,0,y)}ctx.fillStyle=x.color;ctx.fillText(l,0,y)});
  ctx.restore();
  const b={kind:'text',id:x.id,x:cx-bw/2-px,y:cy-bh/2-py,w:bw+px*2,h:bh+py*2};boxes.push(b);
  if(!exporting&&sel&&sel.id===x.id)selRect(b,k);
 }
}

/* ---------- loop ---------- */
function loop(){
 if(playing){T=clockT0+(actx.currentTime-ctxT0);const tot=total();if(T>=tot){T=tot;pause();if(exporting)finishExport()}}
 if(!document.body.classList.contains('pm')||exporting){syncVideo();render()}
 if(playing||exporting){updTime();updPh(true)}
 if(exporting){const p=clamp(T/Math.max(0.01,expTotal),0,1);const b=$('#expBar');if(b)b.style.width=(p*100)+'%';const l=$('#expLbl');if(l)l.textContent=Math.round(p*100)+'% · '+fmt(T)+' / '+fmt(expTotal)}
 if(recState)recTick();
 requestAnimationFrame(loop);
}
function updTime(){$('#tCur').textContent=fmt(T);$('#tTot').textContent=fmt(total())}
function updPlay(){$('#playBtn').textContent=playing?'⏸':'▶'}
function updPh(follow){const x=T*pps;$('#ph').style.left=x+'px';if(follow){const sl=scroller.scrollLeft,w=scroller.clientWidth;if(x>sl+w-40||x<sl)scroller.scrollLeft=Math.max(0,x-60)}}

/* ---------- timeline ---------- */
const RV=60,RO=40,RT=30,RA=42;
function lanes(items,st,en){const s=[...items].sort((a,b)=>st(a)-st(b)),ends=[],map=new Map();for(const it of s){let l=ends.findIndex(e=>e<=st(it)+1e-6);if(l<0){l=ends.length;ends.push(0)}ends[l]=en(it);map.set(it.id,l)}return{map,n:Math.max(1,ends.length)}}
function niceStep(){for(const s of[0.5,1,2,5,10,15,30,60,120,300])if(s*pps>=70)return s;return 600}
function renderTimeline(){
 const tot=total(),width=Math.max((tot+10)*pps,scroller.clientWidth);inner.style.width=width+'px';
 const step=niceStep();let h='';for(let t=0;t*pps<width;t+=step)h+=`<div class="tick" style="left:${t*pps}px">${step<1?t.toFixed(1)+'s':fmtS(t)}</div>`;$('#ruler').innerHTML=h;
 const isSel=o=>sel&&sel.id===o.id&&sel.tr!=='trans'?' sel':'';
 const L=vLayout();let v='';
 for(const r of L){const c=r.c,m=media.get(c.m);const tag=(c.speed!==1?c.speed+'x · ':'')+(c.mute?'🔇 ':'')+(c.fx&&c.fx!=='none'?'✦ ':'');
  v+=`<div class="clip v${isSel(c)}" data-tr="video" data-id="${c.id}" style="left:${r.start*pps}px;width:${Math.max(4,r.d*pps)}px;${m&&m.thumb?`background-image:url(${m.thumb})`:''}"><span class="lb">${tag}${esc(m?m.name:'?')}</span><i class="h l"></i><i class="h r"></i></div>`}
 for(let i=0;i<L.length-1;i++){const r=L[i],has=r.c.tr&&r.c.tr.type!=='none';const x=(r.end-r.ov/2)*pps;
  v+=`<div class="trb${has?' on':''}${sel&&sel.tr==='trans'&&sel.id===r.c.id?' sel':''}" data-tid="${r.c.id}" style="left:${x}px" title="Chuyển cảnh">${has?'⧓':'＋'}</div>`}
 $('#trV').style.height=RV+'px';$('#trV').innerHTML=v;
 const LO=lanes(S.over,o=>o.start,o=>o.start+ovLen(o));let ov='';
 for(const o of S.over){const l=LO.map.get(o.id),m=media.get(o.m);ov+=`<div class="clip o${isSel(o)}" data-tr="over" data-id="${o.id}" style="left:${o.start*pps}px;width:${Math.max(4,ovLen(o)*pps)}px;top:${l*RO+3}px;height:${RO-6}px;${m&&m.thumb?`background-image:url(${m.thumb})`:''}"><span class="lb">${esc(m?m.name:'?')}</span><i class="h l"></i><i class="h r"></i></div>`}
 $('#trO').style.height=LO.n*RO+'px';$('#trO').innerHTML=ov;
 const LT=lanes(S.text,x=>x.start,x=>x.start+x.dur);let t='';
 for(const x of S.text){const l=LT.map.get(x.id);t+=`<div class="clip t${isSel(x)}" data-tr="text" data-id="${x.id}" style="left:${x.start*pps}px;width:${Math.max(4,x.dur*pps)}px;top:${l*RT+3}px;height:${RT-6}px"><span class="lb" style="top:2px">${esc(x.text.replace(/\n/g,' '))}</span><i class="h l"></i><i class="h r"></i></div>`}
 $('#trT').style.height=LT.n*RT+'px';$('#trT').innerHTML=t;
 const LA=lanes(S.audio,a=>a.start,a=>a.start+a.out-a.in);let au='';
 for(const a of S.audio){const l=LA.map.get(a.id),m=media.get(a.m),len=a.out-a.in;
  au+=`<div class="clip a${isSel(a)}" data-tr="audio" data-id="${a.id}" style="left:${a.start*pps}px;width:${Math.max(4,len*pps)}px;top:${l*RA+3}px;height:${RA-6}px;${m?`background-image:url(${m.wave});background-size:${m.duration*pps}px 100%;background-position:${-a.in*pps}px 0`:''}"><span class="lb">${esc(m?m.name:'?')}</span><i class="h l"></i><i class="h r"></i></div>`}
 $('#trA').style.height=LA.n*RA+'px';$('#trA').innerHTML=au;
 $('#tlLabels').innerHTML=`<div style="height:23px"></div><div style="height:${RV+1}px" title="Video">🎬</div><div style="height:${LO.n*RO+1}px" title="Lớp chèn đè">⧉</div><div style="height:${LT.n*RT+1}px" title="Chữ &amp; sticker">T</div><div style="height:${LA.n*RA+1}px" title="Nhạc &amp; ghi âm">🎵</div>`;
 updPh();
}
function snapT(v,id,len){
 const th=8/pps,c=[0,T];for(const r of vLayout())c.push(r.start,r.end);
 for(const x of S.text)if(x.id!==id)c.push(x.start,x.start+x.dur);
 for(const a of S.audio)if(a.id!==id)c.push(a.start,a.start+a.out-a.in);
 for(const o of S.over)if(o.id!==id)c.push(o.start,o.start+ovLen(o));
 let best=v,bd=th;for(const p of c){if(Math.abs(p-v)<bd){bd=Math.abs(p-v);best=p}if(len&&Math.abs(p-(v+len))<bd){bd=Math.abs(p-(v+len));best=p-len}}
 return Math.max(0,best);
}
let tdrag=null,scrubbing=false,dragObj=null;
const tAt=e=>(e.clientX-inner.getBoundingClientRect().left)/pps;
inner.addEventListener('pointerdown',e=>{
 if(e.button>0||exporting)return;
 const tb=e.target.closest('.trb');if(tb){sel={tr:'trans',id:tb.dataset.tid};renderProps();renderTimeline();e.preventDefault();return}
 const ce=e.target.closest('.clip');
 if(!ce){const onRuler=!!e.target.closest('#ruler');if(!onRuler&&sel){sel=null;renderProps();renderTimeline()}seekTo(tAt(e));if(e.pointerType==='mouse'||onRuler)scrubbing=true;return}
 const tr=ce.dataset.tr,id=ce.dataset.id,o=S[tr].find(x=>x.id===id);if(!o)return;
 const was=sel&&sel.id===id&&sel.tr===tr;sel={tr,id};
 const h=e.target.classList.contains('h')?(e.target.classList.contains('l')?'l':'r'):null;
 tdrag={tr,id,h,x0:e.clientX,orig:{...o},moved:false};
 if(!was){renderProps();renderTimeline()}
 e.preventDefault();
});
window.addEventListener('pointermove',e=>{
 if(tPinch)return;
 if(scrubbing){seekTo(tAt(e));return}
 if(dragObj){const p=cpt(e);dragObj.o.x=clamp((p.x-dragObj.dx)/cv.width,-.2,1.2);dragObj.o.y=clamp((p.y-dragObj.dy)/cv.height,-.2,1.2);return}
 if(!tdrag)return;
 const dxp=e.clientX-tdrag.x0;if(!tdrag.moved&&Math.abs(dxp)<4)return;
 if(!tdrag.moved){tdrag.moved=true;pushUndo()}
 applyDrag(tdrag,dxp/pps);
});
window.addEventListener('pointerup',e=>{
 scrubbing=false;
 if(dragObj){dragObj=null;changed(true)}
 if(tdrag){const d=tdrag;tdrag=null;if(d.moved){if(d.tr==='video'&&!d.h)finishReorder(d,e);changed()}}
});
function applyDrag(d,dx){
 const o=S[d.tr].find(x=>x.id===d.id);if(!o)return;const g=d.orig;const m=media.get(o.m);
 if(d.tr==='video'){
  const img=m&&m.kind==='image';
  if(!d.h){const el=inner.querySelector(`.clip[data-id="${d.id}"]`);if(el){el.style.transform=`translateX(${dx*pps}px)`;el.style.zIndex=5;el.style.opacity=.85}return}
  if(img)o.out=clamp(g.out+(d.h==='r'?dx:-dx),0.2,3600);
  else if(d.h==='l')o.in=clamp(g.in+dx*g.speed,0,g.out-0.1);
  else o.out=clamp(g.out+dx*g.speed,g.in+0.1,m?m.duration:g.out);
 }else if(d.tr==='text'){
  if(!d.h)o.start=snapT(Math.max(0,g.start+dx),d.id,g.dur);
  else if(d.h==='l'){const ns=clamp(snapT(g.start+dx,d.id),0,g.start+g.dur-0.2);o.start=ns;o.dur=g.dur-(ns-g.start)}
  else o.dur=Math.max(0.2,snapT(g.start+g.dur+dx,d.id)-g.start);
 }else{
  const len=g.out-g.in,img=m&&m.kind==='image';
  if(!d.h)o.start=snapT(Math.max(0,g.start+dx),d.id,len);
  else if(d.h==='l'){let dd=clamp(dx,img?-3600:-g.in,len-0.2);dd=Math.max(dd,-g.start);o.start=g.start+dd;if(img)o.out=g.out-dd;else o.in=g.in+dd}
  else o.out=clamp(g.out+dx,g.in+0.2,m&&m.kind!=='image'?m.duration:3600);
 }
 renderTimeline();updTime();
}
function finishReorder(d,e){
 const t=tAt(e),arr=S.video,i=arr.findIndex(c=>c.id===d.id);if(i<0)return;
 const[c]=arr.splice(i,1);let acc=0,ni=arr.length;
 for(let k=0;k<arr.length;k++){const dd=(arr[k].out-arr[k].in)/arr[k].speed;if(t<acc+dd/2){ni=k;break}acc+=dd}
 arr.splice(ni,0,c);
}
const tTouch=new Map();let tPinch=null;
scroller.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;tTouch.set(e.pointerId,e.clientX);if(tTouch.size===2){if(tdrag&&!tdrag.moved)tdrag=null;scrubbing=false;const xs=[...tTouch.values()];tPinch={d:Math.abs(xs[0]-xs[1])||1,pps,mid:(xs[0]+xs[1])/2,t:(((xs[0]+xs[1])/2)-inner.getBoundingClientRect().left)/pps}}},true);
window.addEventListener('pointermove',e=>{if(!tTouch.has(e.pointerId))return;tTouch.set(e.pointerId,e.clientX);if(tPinch&&tTouch.size===2){const xs=[...tTouch.values()],d=Math.abs(xs[0]-xs[1])||1;pps=clamp(tPinch.pps*d/tPinch.d,4,400);renderTimeline();scroller.scrollLeft=Math.max(0,tPinch.t*pps-(tPinch.mid-scroller.getBoundingClientRect().left))}},true);
['pointerup','pointercancel'].forEach(ev=>window.addEventListener(ev,e=>{tTouch.delete(e.pointerId);if(tTouch.size<2)tPinch=null},true));
scroller.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(e.deltaY<0?1.25:0.8)}},{passive:false});
function zoom(f){pps=clamp(pps*f,4,400);renderTimeline();updPh(true)}
function cpt(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height}}
cv.addEventListener('pointerdown',e=>{
 if(exporting)return;const p=cpt(e);
 for(let i=boxes.length-1;i>=0;i--){const b=boxes[i];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){
  const tr=b.kind==='over'?'over':'text',o=S[tr].find(t=>t.id===b.id);if(!o)continue;
  sel={tr,id:o.id};pushUndo();dragObj={o,dx:p.x-o.x*cv.width,dy:p.y-o.y*cv.height};renderProps();renderTimeline();e.preventDefault();return}}
 toggle();
});

/* ---------- actions ---------- */
function split(){
 let o=sel&&sel.tr!=='trans'?selObj():null,tr=o?sel.tr:null;
 if(!o){const r=curV();if(!r){toast('Đặt vạch đỏ lên một đoạn rồi bấm Tách');return}o=r.c;tr='video'}
 if(tr==='video'){const r=vLayout().find(r=>r.c.id===o.id);if(T<=r.start+0.05||T>=r.end-0.05){toast('Kéo vạch đỏ vào giữa đoạn cần tách');return}
  edit(()=>{const st=o.in+(T-r.start)*o.speed;const c2=JSON.parse(JSON.stringify(o));c2.id=uid();c2.in=st;c2.fi=0;o.out=st;o.fo=0;o.tr=null;S.video.splice(S.video.indexOf(o)+1,0,c2);sel={tr,id:c2.id}})}
 else if(tr==='text'){if(T<=o.start+0.05||T>=o.start+o.dur-0.05){toast('Kéo vạch đỏ vào giữa đoạn chữ');return}
  edit(()=>{const x2={...o,id:uid(),start:T,dur:o.start+o.dur-T};o.dur=T-o.start;S.text.push(x2);sel={tr,id:x2.id}})}
 else{const len=o.out-o.in;if(T<=o.start+0.05||T>=o.start+len-0.05){toast('Kéo vạch đỏ vào giữa đoạn');return}
  const m=media.get(o.m),img=m&&m.kind==='image';
  edit(()=>{const cut=T-o.start;const a2={...o,id:uid(),start:T,fi:0};if(img){a2.out=len-cut;o.out=cut}else{a2.in=o.in+cut;o.out=o.in+cut}o.fo=0;S[tr].push(a2);sel={tr,id:a2.id}})}
}
function delSel(){
 if(sel&&sel.tr==='trans'){const o=selObj();if(o)edit(()=>{o.tr=null;sel={tr:'video',id:o.id}});return}
 const o=selObj();if(!o){toast('Chọn một đoạn để xóa');return}edit(()=>{S[sel.tr]=S[sel.tr].filter(x=>x!==o);sel=null})}
function dupSel(){const o=selObj();if(!o||sel.tr==='trans'){toast('Chọn một đoạn để nhân bản');return}
 edit(()=>{const c=JSON.parse(JSON.stringify(o));c.id=uid();
  if(sel.tr==='video')S.video.splice(S.video.indexOf(o)+1,0,c);
  else if(sel.tr==='text'){c.start=o.start+o.dur;S.text.push(c)}
  else{c.start=o.start+o.out-o.in;S[sel.tr].push(c)}
  sel={tr:sel.tr,id:c.id}})}
function moveSel(dir){if(!sel||sel.tr!=='video'){toast('Chọn một đoạn video để dời');return}const i=S.video.findIndex(c=>c.id===sel.id),j=i+dir;if(j<0||j>=S.video.length)return;edit(()=>{const a=S.video;[a[i],a[j]]=[a[j],a[i]]})}
function newText(over){const x=Object.assign({id:uid(),text:'Nhập chữ ở đây',start:T,dur:3,x:.5,y:S.aspect==='9:16'?.7:.8,size:56,color:'#ffffff',font:'Be Vietnam Pro',bold:true,strokeOn:true,stroke:'#000000',bgOn:false,bg:'#000000',anim:'fade',rot:0},over||{});if(total()>0&&T>=total()-0.05)x.start=Math.max(0,T-3);return x}
function addText(){const x=newText();edit(()=>{S.text.push(x);sel={tr:'text',id:x.id}});setTimeout(()=>{const ta=$('#props textarea');if(ta){ta.focus();ta.select()}},30)}
function addSticker(){stickerPicker(e=>{const x=newText({text:e,size:130,strokeOn:false,anim:'pop',y:.4,x:.5+((S.text.length%3)-1)*.2});edit(()=>{S.text.push(x);sel={tr:'text',id:x.id}})})}
async function extractClipAudio(){
 if(!sel||sel.tr!=='video'){toast('Chọn một đoạn video trên dòng 🎬 trước');return}
 const c=selObj(),m=media.get(c.m);if(!m||m.kind!=='video'){toast('Đoạn này không phải video');return}
 if(c.speed!==1){toast('Hãy để tốc độ 1x trước khi tách âm thanh');return}
 let am=m.audioMid&&media.get(m.audioMid);
 if(!am){am=await extractFromVideoFile(m.file,m.name);if(!am)return;m.audioMid=am.id}
 const r=vLayout().find(r=>r.c.id===c.id);
 edit(()=>{const a={id:uid(),m:am.id,start:r.start,in:c.in,out:c.out,vol:c.vol,fi:0,fo:0};S.audio.push(a);c.mute=true;sel={tr:'audio',id:a.id}});
 toast('Đã tách âm thanh ra dòng 🎵 và tắt tiếng đoạn video');
}
document.querySelector('.tbar').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||exporting)return;
 ({split,dup:dupSel,del:delSel,left:()=>moveSel(-1),right:()=>moveSel(1),extract:extractClipAudio,text:addText,sticker:addSticker,music:()=>$('#fMusic').click(),voice:openVoice,trans:()=>{const L=vLayout();if(L.length<2){toast('Cần ít nhất 2 đoạn video để thêm chuyển cảnh');return}let r=L.find(r=>r.c.id===(sel&&sel.id))||L[0];if(r.i===L.length-1)r=L[r.i-1];sel={tr:'trans',id:r.c.id};renderProps();renderTimeline()},zin:()=>zoom(1.4),zout:()=>zoom(1/1.4)})[b.dataset.tb]?.();
});

/* ---------- voice recording ---------- */
let recState=null,voiceN=0,voicePlay=true;
function micBlocked(){
 if(window.self===window.top){modal(`<h2>🎙 Chưa có quyền dùng micro</h2><div class="hint">Trình duyệt đang chặn micro cho trang này.<br><br>Bấm vào <b>biểu tượng ổ khóa / cài đặt</b> bên trái thanh địa chỉ → mục <b>Micrô</b> → chọn <b>Cho phép</b>, rồi bấm “🎙 Thu âm” lại.</div><div class="btns"><button class="pri" id="mClose">Đã hiểu</button></div>`);$('#mClose').onclick=closeModal;return}
 modal(`<h2>🎙 Chưa dùng được micro ở đây</h2><div class="hint">Trang xem trước trên Claude <b>không cho phép trang web dùng micro</b>, nên không thu âm trực tiếp được ở đây.<br><br>Để thu âm, mở app bên ngoài:<ol style="padding-left:18px;margin:8px 0"><li>Tải tệp <b>dung-video.html</b> mà Claude gửi trong cuộc trò chuyện.</li><li>Mở tệp bằng <b>Chrome</b> (hoặc đăng lên Firebase Hosting như game của bạn).</li><li>Bấm “🎙 Thu âm” và chọn <b>Cho phép</b> khi trình duyệt hỏi quyền micro.</li></ol>Trong lúc đó bạn có thể ghi âm bằng app ghi âm của điện thoại rồi bấm “＋ Nhạc” để đưa file vào.</div><div class="btns"><button class="pri" id="mClose">Đã hiểu</button></div>`);
 $('#mClose').onclick=closeModal;
}
function openVoice(){
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){micBlocked();return}
 modal(`<h2>🎙 Thu âm giọng nói</h2><div class="hint">Bản thu sẽ được đặt tại vạch đỏ (${fmt(T)}) trên dòng 🎵.</div>
 <label class="line" style="margin:14px 0"><input type="checkbox" id="vPlay" ${voicePlay?'checked':''}><span>Phát video trong lúc thu (để lồng tiếng khớp hình). Nên đeo tai nghe.</span></label>
 <div class="btns"><button id="mClose">Hủy</button><button class="pri" id="vGo">● Bắt đầu thu</button></div>`);
 $('#mClose').onclick=closeModal;$('#vGo').onclick=startVoice;
}
async function startVoice(){
 voicePlay=$('#vPlay').checked;let st;
 try{st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch(e){console.warn(e);micBlocked();return}
 ensureAudio();await actx.resume();pause();
 const t=[['audio/webm;codecs=opus'],['audio/mp4'],['audio/webm']].map(x=>x[0]).find(x=>MediaRecorder.isTypeSupported(x));
 const r=new MediaRecorder(st,t?{mimeType:t}:undefined),parts=[];r.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};
 recState={r,st,t0:T,start:performance.now(),cancel:false};
 modal(`<h2>🎙 Đang thu âm…</h2><div class="recdot"><i></i><span id="recT">00:00.0</span></div><div class="hint">Nói vào micro. Bấm “Dừng” khi xong.</div><div class="btns"><button id="vCancel">Hủy</button><button class="pri" id="vStop">⏹ Dừng &amp; thêm vào video</button></div>`);
 $('#vCancel').onclick=()=>{recState.cancel=true;r.stop()};$('#vStop').onclick=()=>r.stop();
 r.onstop=async()=>{
  const rs=recState;recState=null;st.getTracks().forEach(x=>x.stop());pause();closeModal();
  if(rs.cancel){toast('Đã hủy thu âm');return}
  try{const blob=new Blob(parts,{type:r.mimeType||t||'audio/webm'});const buf=await decodeBuf(await blob.arrayBuffer());
   const m=addAudioMedia('🎙 Ghi âm '+(++voiceN),buf);renderLib();
   edit(()=>{const a={id:uid(),m:m.id,start:rs.t0,in:0,out:buf.duration,vol:1,fi:0,fo:0};S.audio.push(a);sel={tr:'audio',id:a.id}});
   toast('Đã thêm bản ghi âm vào dòng 🎵');
  }catch(e){console.error(e);toast('Không đọc được bản ghi âm')}
 };
 r.start(250);if(voicePlay&&total()>0){if(T>=total()-0.05)T=0;recState.t0=T;play()}
}
function recTick(){const el=$('#recT');if(el)el.textContent=fmt((performance.now()-recState.start)/1000)}

/* ---------- library ---------- */
function renderLib(){
 const items=[...media.values()];
 $('#mlist').innerHTML=items.length?items.map(m=>`<div class="mi" data-id="${m.id}">
  <div class="th${m.kind==='audio'?' au':''}" style="${m.kind==='audio'?`background-image:url(${m.wave})`:m.thumb?`background-image:url(${m.thumb})`:''}"><span class="du">${m.kind==='image'?'Ảnh':fmt(m.duration)}</span></div>
  <div class="nm" title="${esc(m.name)}">${esc(m.name)}</div>
  <div class="acts"><button data-a="add">＋ Thêm</button>${m.kind!=='audio'?'<button data-a="ov" title="Chèn đè lên video chính">⧉ Chèn đè</button>':''}${m.kind==='video'?'<button data-a="ex">🎵 Tách nhạc</button>':''}${m.kind==='image'?'<button data-a="ph">🖌 Sửa ảnh</button>':''}${m.kind==='audio'?'<button data-a="dl">⬇ Tải về</button>':''}</div></div>`).join(''):'<div class="empty">Chưa có tệp nào.<br>Bấm “Nhập tệp” ở trên.</div>';
}
$('#mlist').addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;const m=media.get(b.closest('.mi').dataset.id);if(!m)return;
 if(b.dataset.a==='add'){if(m.kind==='audio'&&T>=total()-0.05&&S.audio.length===0)T=0;edit(()=>pushToTimeline(m));toast(m.kind==='audio'?'Đã thêm nhạc tại vạch đỏ':'Đã thêm vào cuối video')}
 else if(b.dataset.a==='ov'){edit(()=>pushOverlay(m));toast('Đã chèn đè tại vạch đỏ. Kéo trên khung hình để đổi vị trí.')}
 else if(b.dataset.a==='ex'){let am=m.audioMid&&media.get(m.audioMid);if(!am){am=await extractFromVideoFile(m.file,m.name);if(am)m.audioMid=am.id}if(am)toast('Đã tách nhạc! Bấm “＋ Thêm” để chèn vào video, hoặc “⬇ Tải về”.')}
 else if(b.dataset.a==='ph'){setMode('photo');PE.openImageEl(m.img,m.name)}
 else if(b.dataset.a==='dl')downloadAudio(m.buffer,m.name);
});
$('#impBtn').onclick=()=>$('#fImp').click();
$('#exBtn').onclick=()=>$('#fEx').click();
$('#fImp').onchange=e=>{const f=[...e.target.files];e.target.value='';if(f.length)importFiles(f,S.video.length===0)};
$('#fEx').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const m=await extractFromVideoFile(f,f.name);if(m)toast('Đã tách nhạc! Bấm “＋ Thêm” để chèn vào video, hoặc “⬇ Tải về”.')};
$('#fMusic').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;ensureAudio();let m;
 if(isVideoFile(f))m=await extractFromVideoFile(f,f.name);
 else{try{toast('Đang đọc nhạc…');m=addAudioMedia(f.name,await decodeBuf(await f.arrayBuffer()));renderLib()}catch(err){toast('Không đọc được tệp nhạc này')}}
 if(m){edit(()=>pushToTimeline(m));toast('Đã thêm nhạc tại vạch đỏ')}};
let dragN=0;
document.addEventListener('dragenter',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){dragN++;$('#drop').classList.add('on')}});
document.addEventListener('dragleave',()=>{dragN=Math.max(0,dragN-1);if(!dragN)$('#drop').classList.remove('on')});
document.addEventListener('dragover',e=>e.preventDefault());
document.addEventListener('drop',e=>{e.preventDefault();dragN=0;$('#drop').classList.remove('on');const f=[...(e.dataTransfer?.files||[])];if(!f.length)return;
 if(document.body.classList.contains('pm')){const im=f.find(isImageFile);if(im)PE.openFile(im);return}
 importFiles(f,S.video.length===0)});

/* ---------- properties ---------- */
const props=$('#props');
function sl(label,k,min,max,step,val){const v=+val;return`<label class="row"><span>${label}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${v}"><b data-o="${k}">${fmtOut(k,v)}</b></label>`}
function fmtOut(k,v){if(k==='speed')return(+v).toFixed(2).replace(/\.?0+$/,'')+'x';if(/^(vol|zoom|op|w)$/.test(k))return Math.round(v*100)+'%';if(/^(fi|fo|out|tr\.d)$/.test(k))return(+v).toFixed(1)+'s';if(k==='f.h'||k==='rot')return v+'°';if(k==='f.blur')return(+v).toFixed(1);return v}
function chk(label,k,v){return`<label class="line"><input type="checkbox" data-k="${k}" ${v?'checked':''}><span>${label}</span></label>`}
function renderProps(){
 const o=selObj();let h='';
 if(!o){
  h=`<h3>Dự án</h3><div class="sub">Chọn một đoạn trên dòng thời gian để chỉnh sửa.</div>
  <div class="grp"><div class="gt">Tỉ lệ khung hình</div><div class="chips">${Object.keys(ASPECTS).map(a=>`<button data-aspect="${a}" class="${S.aspect===a?'on':''}">${a}${a==='9:16'?' (TikTok)':a==='16:9'?' (YouTube)':''}</button>`).join('')}</div></div>
  <div class="grp"><div class="gt">Cách đặt hình</div><div class="chips"><button data-fit="fit" class="${S.fit==='fit'?'on':''}">Vừa khung (có viền)</button><button data-fit="fill" class="${S.fit==='fill'?'on':''}">Lấp đầy (cắt bớt)</button></div>
  <label class="line" style="margin-top:10px"><input type="color" data-k="bg" value="${S.bg}"><span>Màu nền</span></label></div>
  <div class="grp"><div class="gt">Cách dùng nhanh</div><ul class="hint" style="padding-left:18px;margin:0">
  <li><b>Nhập tệp</b> → <b>＋ Thêm</b> để đưa vào dòng 🎬, <b>⧉ Chèn đè</b> để đặt hình nhỏ lên trên.</li>
  <li>Kéo <b>vạch đỏ</b> rồi bấm <b>✂ Tách</b>; chọn đoạn thừa và <b>🗑 Xóa</b>.</li>
  <li>Bấm nút <b>＋</b> tròn giữa hai đoạn video để thêm <b>chuyển cảnh</b>.</li>
  <li>Kéo <b>hai mép trắng</b> của đoạn đã chọn để cắt đầu/cuối.</li>
  <li><b>🎙 Thu âm</b> để lồng tiếng, <b>＋ Nhạc</b> nhận cả file video (tự tách tiếng).</li>
  <li>Kéo chữ, sticker, hình chèn đè trực tiếp trên khung hình.</li></ul></div>`;
 }else if(sel.tr==='trans'){
  const t=o.tr||{type:'none',d:0.6};
  h=`<h3>⧓ Chuyển cảnh</h3><div class="sub">Giữa đoạn ${S.video.indexOf(o)+1} và đoạn ${S.video.indexOf(o)+2}</div>
  <div class="grp"><div class="chips trgrid">${Object.entries(TRANS).map(([k,n])=>`<button data-trans="${k}" class="${t.type===k?'on':''}">${n}</button>`).join('')}</div></div>
  ${t.type!=='none'?`<div class="grp">${sl('Thời lượng','tr.d',0.2,2.5,0.1,t.d)}</div>`:''}
  <div class="grp"><button class="full" data-act="trall">Áp dụng cho tất cả các đoạn</button><div class="hint" style="margin-top:6px">Chuyển cảnh làm hai đoạn chồng lên nhau một chút, nên video sẽ ngắn đi bằng thời lượng chuyển cảnh.</div></div>`;
 }else if(sel.tr==='video'){
  const m=media.get(o.m),img=m&&m.kind==='image';
  h=`<h3>${img?'🖼 Ảnh':'🎬 Đoạn video'}</h3><div class="sub">${esc(m?m.name:'')} · dài ${fmt((o.out-o.in)/o.speed)}</div>
  ${img?`<div class="grp">${sl('Thời lượng','out',0.5,30,0.1,o.out)}</div>`:`<div class="grp"><div class="gt">Tốc độ</div>${sl('Tốc độ','speed',0.25,4,0.05,o.speed)}<div class="chips">${[0.5,1,1.5,2,3].map(v=>`<button data-set="speed" data-v="${v}" class="${o.speed===v?'on':''}">${v}x</button>`).join('')}</div></div>
  <div class="grp"><div class="gt">Âm thanh</div>${sl('Âm lượng','vol',0,2,0.05,o.vol)}${chk('Tắt tiếng đoạn này','mute',o.mute)}<button class="full" data-act="extract">🎵 Tách âm thanh ra dòng nhạc</button></div>`}
  <div class="grp"><div class="gt">Hiệu ứng</div><div class="chips">${Object.entries(VFX).map(([k,n])=>`<button data-set="fx" data-sv="${k}" class="${(o.fx||'none')===k?'on':''}">${n}</button>`).join('')}</div></div>
  <div class="grp"><div class="gt">Bộ lọc</div><div class="chips">${Object.keys(PRESETS).map(p=>`<button data-preset="${p}" class="${o.preset===p?'on':''}">${p}</button>`).join('')}</div>
  <div style="margin-top:8px">${sl('Độ sáng','f.b',30,200,1,o.f.b)}${sl('Tương phản','f.c',30,200,1,o.f.c)}${sl('Bão hòa','f.s',0,250,1,o.f.s)}${sl('Sắc màu','f.h',-180,180,1,o.f.h)}${sl('Ngả vàng','f.sep',0,100,1,o.f.sep)}${sl('Làm mờ','f.blur',0,8,0.1,o.f.blur)}</div></div>
  <div class="grp"><div class="gt">Hiện / ẩn dần</div>${sl('Hiện dần','fi',0,3,0.1,o.fi)}${sl('Mờ dần','fo',0,3,0.1,o.fo)}</div>
  <div class="grp"><div class="gt">Khung hình</div>${sl('Thu phóng','zoom',0.5,3,0.01,o.zoom||1)}<div class="chips"><button data-act="rot">⟳ Xoay 90°</button><button data-act="flip">⇋ Lật ngang</button><button data-act="resetf">Đặt lại</button></div></div>`;
 }else if(sel.tr==='over'){
  const m=media.get(o.m),vid=m&&m.kind==='video';
  h=`<h3>⧉ Lớp chèn đè</h3><div class="sub">${esc(m?m.name:'')} · Kéo trên khung hình để đổi vị trí.</div>
  <div class="grp">${sl('Kích thước','w',0.05,1.5,0.01,o.w)}${sl('Xoay','rot',-180,180,1,o.rot)}${sl('Độ đục','op',0.05,1,0.01,o.op)}
  <div class="gt" style="margin-top:8px">Hình dạng</div><div class="chips">${[['rect','Chữ nhật'],['round','Bo góc'],['circle','Tròn']].map(([k,n])=>`<button data-set="shape" data-sv="${k}" class="${o.shape===k?'on':''}">${n}</button>`).join('')}</div>
  <div class="gt" style="margin-top:10px">Vị trí nhanh</div><div class="chips">${[['↖',.22,.2],['↗',.78,.2],['↙',.22,.8],['↘',.78,.8],['Giữa',.5,.5]].map(([n,x,y])=>`<button data-oxy="${x},${y}">${n}</button>`).join('')}</div></div>
  ${img(m)?`<div class="grp">${sl('Thời lượng','out',0.5,60,0.1,o.out)}</div>`:''}
  ${vid?`<div class="grp"><div class="gt">Âm thanh</div>${sl('Âm lượng','vol',0,2,0.05,o.vol)}${chk('Tắt tiếng','mute',o.mute)}</div>`:''}
  <div class="grp">${sl('Hiện dần','fi',0,3,0.1,o.fi)}${sl('Mờ dần','fo',0,3,0.1,o.fo)}</div>`;
 }else if(sel.tr==='text'){
  h=`<h3>T Chữ / sticker</h3><div class="sub">Kéo trên khung hình để đổi vị trí.</div>
  <textarea data-k="text" rows="3">${esc(o.text)}</textarea>
  <div class="grp"><div class="gt">Kiểu có sẵn</div><div class="chips">${Object.keys(TSTYLES).map(s=>`<button data-tstyle="${s}">${s}</button>`).join('')}</div></div>
  <div class="grp"><div class="gt">Phông &amp; màu</div>
   <select data-k="font">${FONTS.map(f=>`<option ${o.font===f?'selected':''} style="font-family:'${f}'">${f}</option>`).join('')}</select>
   ${sl('Cỡ chữ','size',14,260,1,o.size)}${sl('Xoay','rot',-180,180,1,o.rot||0)}
   <label class="line"><input type="color" data-k="color" value="${o.color}"><span>Màu chữ</span><input type="checkbox" data-k="bold" ${o.bold?'checked':''}> Đậm</label>
   <label class="line"><input type="color" data-k="stroke" value="${o.stroke}"><span>Viền chữ</span><input type="checkbox" data-k="strokeOn" ${o.strokeOn?'checked':''}> Bật</label>
   <label class="line"><input type="color" data-k="bg" value="${o.bg}"><span>Nền chữ</span><input type="checkbox" data-k="bgOn" ${o.bgOn?'checked':''}> Bật</label></div>
  <div class="grp"><div class="gt">Hiệu ứng xuất hiện</div><select data-k="anim">${[['none','Không'],['fade','Hiện dần'],['pop','Bật nảy'],['up','Trượt lên'],['type','Gõ chữ'],['bounce','Nhún nhảy']].map(([v,n])=>`<option value="${v}" ${o.anim===v?'selected':''}>${n}</option>`).join('')}</select></div>
  <div class="grp"><div class="gt">Vị trí nhanh</div><div class="chips"><button data-pos="0.12">Trên</button><button data-pos="0.5">Giữa</button><button data-pos="0.85">Dưới</button></div></div>
  <div class="grp"><div class="gt">Thời gian</div><div class="two"><label>Bắt đầu (giây)<input type="number" data-k="start" min="0" step="0.1" value="${o.start.toFixed(1)}"></label><label>Kéo dài (giây)<input type="number" data-k="dur" min="0.2" step="0.1" value="${o.dur.toFixed(1)}"></label></div></div>`;
 }else{
  const m=media.get(o.m);
  h=`<h3>🎵 Nhạc / ghi âm</h3><div class="sub">${esc(m?m.name:'')} · dài ${fmt(o.out-o.in)}</div>
  <div class="grp">${sl('Âm lượng','vol',0,2,0.05,o.vol)}${sl('Hiện dần','fi',0,5,0.1,o.fi)}${sl('Mờ dần','fo',0,5,0.1,o.fo)}</div>
  <div class="grp"><div class="gt">Thời gian</div><div class="two"><label>Bắt đầu (giây)<input type="number" data-k="start" min="0" step="0.1" value="${o.start.toFixed(1)}"></label><label>Từ giây thứ (trong bài)<input type="number" data-k="in" min="0" step="0.1" value="${o.in.toFixed(1)}"></label></div></div>
  <div class="grp"><button class="full" data-act="dlclip">⬇ Tải đoạn này về máy</button><div class="hint" style="margin-top:6px">Kéo hai mép trắng trên dòng 🎵 để cắt đầu/cuối.</div></div>`;
 }
 props.innerHTML=h;
}
const img=m=>m&&m.kind==='image';
function setPath(o,k,v){const p=k.split('.');let t=o;for(let i=0;i<p.length-1;i++)t=t[p[i]];t[p[p.length-1]]=v}
function readVal(el){if(el.type==='checkbox')return el.checked;if(el.type==='range'||el.type==='number')return parseFloat(el.value);return el.value}
function onProp(e){
 const el=e.target,k=el.dataset.k;if(!k)return;
 if(el.type==='checkbox'&&e.type==='input')return;
 let v=readVal(el);if(typeof v==='number'&&isNaN(v))return;
 const o=selObj()||S;
 if(o!==S){if(k==='start')v=Math.max(0,v);if(k==='dur')v=Math.max(0.2,v);if(k==='in'&&sel.tr==='audio')v=clamp(v,0,o.out-0.2);if(k.startsWith('f.'))o.preset=''}
 edit(()=>setPath(o,k,v),'p'+(sel?sel.id:'')+k,true);
 const out=props.querySelector(`[data-o="${k}"]`);if(out)out.textContent=fmtOut(k,v);
 if(k==='font')document.fonts&&document.fonts.load(`700 40px "${v}"`).catch(()=>{});
}
props.addEventListener('input',onProp);props.addEventListener('change',onProp);
props.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const o=selObj();const d=b.dataset;
 if(d.aspect)edit(()=>S.aspect=d.aspect);
 else if(d.fit)edit(()=>S.fit=d.fit);
 else if(d.trans&&o)edit(()=>{o.tr=d.trans==='none'?null:{type:d.trans,d:(o.tr&&o.tr.d)||0.6}});
 else if(d.set&&o)edit(()=>o[d.set]=d.sv!==undefined?d.sv:parseFloat(d.v));
 else if(d.preset&&o)edit(()=>{o.f={...F0,...PRESETS[d.preset]};o.preset=d.preset});
 else if(d.tstyle&&o){edit(()=>Object.assign(o,TSTYLES[d.tstyle]));document.fonts&&document.fonts.load(`700 40px "${o.font}"`).catch(()=>{})}
 else if(d.pos&&o)edit(()=>{o.y=parseFloat(d.pos);o.x=.5});
 else if(d.oxy&&o){const[x,y]=d.oxy.split(',').map(Number);edit(()=>{o.x=x;o.y=y})}
 else if(d.act==='trall'&&o){const t=o.tr;edit(()=>S.video.forEach((c,i)=>{if(i<S.video.length-1)c.tr=t?{...t}:null}));toast('Đã áp dụng cho tất cả')}
 else if(d.act==='rot'&&o)edit(()=>o.rot=((o.rot||0)+90)%360);
 else if(d.act==='flip'&&o)edit(()=>o.flip=!o.flip);
 else if(d.act==='resetf'&&o)edit(()=>{o.rot=0;o.flip=false;o.zoom=1});
 else if(d.act==='extract')extractClipAudio();
 else if(d.act==='dlclip'&&o){const m=media.get(o.m);if(m)downloadAudio(sliceBuf(m.buffer,o.in,o.out),m.name+' (đoạn cắt)')}
});

/* ---------- audio file export ---------- */
const safeName=s=>String(s).replace(/^(🎵|🎙)\s*/,'').replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|]+/g,'').trim().slice(0,80)||'nhac';
function sliceBuf(b,a,z){const sr=b.sampleRate,s=Math.floor(a*sr),e=Math.min(b.length,Math.floor(z*sr)),n=Math.max(1,e-s);const o=actx.createBuffer(b.numberOfChannels,n,sr);for(let c=0;c<b.numberOfChannels;c++)o.copyToChannel(b.getChannelData(c).subarray(s,s+n),c);return o}
async function encodeAAC(buf){
 if(!window.AudioEncoder||!window.AudioData)throw new Error('no webcodecs');
 const ch=Math.min(2,buf.numberOfChannels),sr=buf.sampleRate,cfg={codec:'mp4a.40.2',sampleRate:sr,numberOfChannels:ch,bitrate:192000};
 const sup=await AudioEncoder.isConfigSupported(cfg);if(!sup.supported)throw new Error('aac unsupported');
 const{Muxer,ArrayBufferTarget}=await import('https://cdn.jsdelivr.net/npm/mp4-muxer@5/+esm');
 const muxer=new Muxer({target:new ArrayBufferTarget(),audio:{codec:'aac',numberOfChannels:ch,sampleRate:sr},fastStart:'in-memory'});
 let err=null;const enc=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>{err=e}});enc.configure(cfg);
 const N=buf.length,F=8192,chans=[...Array(ch)].map((_,i)=>buf.getChannelData(i));
 for(let off=0;off<N;off+=F){const n=Math.min(F,N-off),data=new Float32Array(n*ch);for(let c=0;c<ch;c++)data.set(chans[c].subarray(off,off+n),c*n);
  const ad=new AudioData({format:'f32-planar',sampleRate:sr,numberOfFrames:n,numberOfChannels:ch,timestamp:Math.round(off/sr*1e6),data});enc.encode(ad);ad.close();if(err)throw err;
  if(enc.encodeQueueSize>40)await new Promise(r=>setTimeout(r,0));const p=$('#expBar');if(p)p.style.width=(off/N*100)+'%'}
 await enc.flush();if(err)throw err;muxer.finalize();
 return{blob:new Blob([muxer.target.buffer],{type:'video/mp4'}),ext:'mp4'};
}
let audioRec=null;
function recordRealtime(buf){
 return new Promise((res,rej)=>{
  const types=[['audio/mp4','mp4'],['audio/webm;codecs=opus','webm'],['audio/webm','webm']];
  const t=window.MediaRecorder&&types.find(x=>MediaRecorder.isTypeSupported(x[0]));if(!t)return rej(new Error('no recorder'));
  const dest=actx.createMediaStreamDestination(),s=actx.createBufferSource();s.buffer=buf;s.connect(dest);
  const r=new MediaRecorder(dest.stream,{mimeType:t[0],audioBitsPerSecond:192000}),parts=[];
  r.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};
  const t0=actx.currentTime;const iv=setInterval(()=>{const p=$('#expBar');if(p)p.style.width=clamp((actx.currentTime-t0)/buf.duration*100,0,100)+'%';const l=$('#expLbl');if(l)l.textContent=fmt(actx.currentTime-t0)+' / '+fmt(buf.duration)},200);
  r.onstop=()=>{audioRec=null;clearInterval(iv);s.cancelled?rej(new Error('cancel')):res({blob:new Blob(parts,{type:t[0]}),ext:t[1]})};
  audioRec={stop(){s.cancelled=true;try{s.stop()}catch(e){}r.stop()}};
  r.start(1000);s.onended=()=>setTimeout(()=>{if(r.state!=='inactive')r.stop()},250);s.start();
 });
}
async function downloadAudio(buf,name){
 ensureAudio();await actx.resume();
 modal(`<h2>Đang chuẩn bị tệp nhạc…</h2><div class="hint">“${esc(safeName(name))}”</div><div class="bar"><i id="expBar"></i></div><div class="hint" id="expLbl"></div><div class="btns"><button id="mClose">Hủy</button></div>`);
 let cancelled=false;$('#mClose').onclick=()=>{cancelled=true;if(audioRec)audioRec.stop();closeModal()};
 let out=null;
 try{out=await encodeAAC(buf)}catch(e){console.warn('fast encode failed',e);if(cancelled)return;
  $('#expLbl').textContent='Trình duyệt này cần phát lại để ghi — mất thời gian bằng độ dài bài.';
  try{out=await recordRealtime(buf)}catch(e2){if(!cancelled){closeModal();toast('Trình duyệt này không hỗ trợ lưu nhạc. Hãy dùng Chrome hoặc Edge.')}return}}
 if(cancelled)return;
 const fname=safeName(name)+'.'+out.ext;
 modal(`<h2>✅ Tệp nhạc đã sẵn sàng</h2><div class="hint">${esc(fname)} · ${(out.blob.size/1048576).toFixed(1)} MB<br>Tệp chỉ chứa âm thanh, mở được bằng trình nghe nhạc trên điện thoại và máy tính.</div><div class="btns"><button id="mClose">Đóng</button>${saveBtns()}</div>`);
 $('#mClose').onclick=closeModal;bindSave(fname,out.blob,'audio');
}

/* ---------- video export ---------- */
let rec=null,recParts=[],expTotal=0,expMime=null,expResult=null,expQ=720;
function pickMime(){const c=[['video/mp4;codecs=avc1.640028,mp4a.40.2','mp4'],['video/mp4;codecs=avc1.42E01F,mp4a.40.2','mp4'],['video/mp4','mp4'],['video/webm;codecs=vp9,opus','webm'],['video/webm;codecs=vp8,opus','webm'],['video/webm','webm']];if(!window.MediaRecorder)return null;for(const[t,e]of c)if(MediaRecorder.isTypeSupported(t))return{type:t,ext:e};return null}
function openExport(){
 if(total()<0.1){toast('Chưa có gì để xuất. Hãy nhập video trước.');return}
 pause();expMime=pickMime();
 if(!expMime||!cv.captureStream){modal(`<h2>Không xuất được</h2><div class="hint">Trình duyệt này chưa hỗ trợ ghi video. Hãy dùng Chrome, Edge hoặc Cốc Cốc bản mới.</div><div class="btns"><button id="mClose">Đóng</button></div>`);$('#mClose').onclick=closeModal;return}
 const[w,h]=ASPECTS[S.aspect],dims=q=>{const s=q/720;return Math.round(w*s/2)*2+'×'+Math.round(h*s/2)*2};
 modal(`<h2>Xuất video</h2><div class="hint">Độ dài ${fmt(total())} · định dạng <b>${expMime.ext.toUpperCase()}</b></div>
 <div class="opt"><button data-q="720" class="${expQ===720?'on':''}">720p<br><small>${dims(720)}</small></button><button data-q="1080" class="${expQ===1080?'on':''}">1080p<br><small>${dims(1080)}</small></button></div>
 <div class="hint">⏱ Video được ghi theo thời gian thực: video dài 1 phút mất khoảng 1 phút. Giữ trang này mở và đừng chuyển tab trong lúc xuất.</div>
 <div class="btns"><button id="mClose">Hủy</button><button class="pri" id="mGo">Bắt đầu xuất</button></div>`);
 $('#mbox').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{expQ=+b.dataset.q;openExport()});
 $('#mClose').onclick=closeModal;$('#mGo').onclick=startExport;
}
async function startExport(){
 ensureAudio();await actx.resume();pause();
 const[w,h]=ASPECTS[S.aspect],s=expQ/720;cv.width=Math.round(w*s/2)*2;cv.height=Math.round(h*s/2)*2;
 T=0;const L=vLayout();if(L[0]){const m=media.get(L[0].c.m);if(m&&m.kind==='video'){const o=getEl(m,0);o.el.pause();await seekEl(o.el,L[0].c.in)}}
 expTotal=total();exporting=true;render();
 const tracks=[...cv.captureStream(30).getVideoTracks()];if(recDest)tracks.push(...recDest.stream.getAudioTracks());
 rec=new MediaRecorder(new MediaStream(tracks),{mimeType:expMime.type,videoBitsPerSecond:expQ>=1080?10e6:6e6,audioBitsPerSecond:192000});
 recParts=[];rec.ondataavailable=e=>{if(e.data.size)recParts.push(e.data)};
 rec.onstop=()=>showResult(new Blob(recParts,{type:expMime.type.split(';')[0]}));
 modal(`<h2>Đang xuất video…</h2><div class="hint">Đừng chuyển tab hoặc khóa màn hình.</div><div class="bar"><i id="expBar"></i></div><div class="hint" id="expLbl">0%</div><div class="btns"><button id="mCancel">Hủy xuất</button></div>`);
 $('#mCancel').onclick=cancelExport;
 spk.gain.value=0;rec.start(1000);play();
}
function finishExport(){exporting=false;spk.gain.value=1;if(rec&&rec.state!=='inactive')rec.stop();applyAspect()}
function cancelExport(){exporting=false;pause();spk.gain.value=1;if(rec){rec.onstop=null;if(rec.state!=='inactive')rec.stop()}applyAspect();closeModal();toast('Đã hủy xuất')}
function showResult(blob){
 if(expResult)URL.revokeObjectURL(expResult.url);
 const fname='video-'+new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')+'.'+expMime.ext;
 expResult={blob,url:URL.createObjectURL(blob),fname};
 modal(`<h2>✅ Xuất xong!</h2><div class="hint">${fname} · ${(blob.size/1048576).toFixed(1)} MB</div><video src="${expResult.url}" controls playsinline></video>
 <div class="btns"><button id="mClose">Đóng</button>${saveBtns()}</div>`);
 $('#mClose').onclick=closeModal;bindSave(fname,blob);
}

/* ---------- mode & wiring ---------- */
function setMode(m){
 const pm=m==='photo';document.body.classList.toggle('pm',pm);
 $('#modeV').classList.toggle('on',!pm);$('#modeP').classList.toggle('on',pm);
 $('#exportBtn').textContent=pm?'💾 Lưu ảnh':'⬆ Xuất video';
 if(pm){pause();PE.show()}else{renderTimeline();updUndo()}
}
$('#modeV').onclick=()=>setMode('video');$('#modeP').onclick=()=>setMode('photo');
$('#playBtn').onclick=toggle;$('#startBtn').onclick=()=>seekTo(0);
$('#undoBtn').onclick=()=>document.body.classList.contains('pm')?PE.undo():vUndo();
$('#redoBtn').onclick=()=>document.body.classList.contains('pm')?PE.redo():vRedo();
$('#exportBtn').onclick=()=>document.body.classList.contains('pm')?PE.save():openExport();
document.addEventListener('keydown',e=>{
 const tg=e.target;if(/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)&&tg.type!=='range'&&tg.type!=='checkbox')return;
 if(exporting||!$('#modal').classList.contains('hide'))return;
 const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey,pm=document.body.classList.contains('pm');
 if(mod&&k==='z'){e.preventDefault();if(pm)e.shiftKey?PE.redo():PE.undo();else e.shiftKey?vRedo():vUndo();return}
 if(mod&&k==='y'){e.preventDefault();pm?PE.redo():vRedo();return}
 if(pm){if(e.key==='Delete'||e.key==='Backspace')PE.delSel();return}
 if(e.code==='Space'){e.preventDefault();toggle()}
 else if(e.key==='Delete'||e.key==='Backspace'){if(sel){e.preventDefault();delSel()}}
 else if(k==='s'&&!mod)split();
 else if(e.key==='ArrowLeft'){e.preventDefault();seekTo(T-(e.shiftKey?1:1/30))}
 else if(e.key==='ArrowRight'){e.preventDefault();seekTo(T+(e.shiftKey?1:1/30))}
});
window.addEventListener('resize',()=>{if(!document.body.classList.contains('pm'))renderTimeline()});
renderLib();renderProps();renderTimeline();updUndo();updTime();
requestAnimationFrame(loop);
/* ---------- PWA ---------- */
window.onAndroidBack=()=>{if(!$('#modal').classList.contains('hide')){if(!exporting&&!recState)closeModal();return true}if(document.body.classList.contains('pm')){setMode('video');return true}return false};
if(navigator.userAgent.includes('Electron'))document.title='Dựng Video';
if(!AB&&!navigator.userAgent.includes('Electron')&&'serviceWorker'in navigator&&!inFrame&&(location.protocol==='https:'||/^(localhost|127\.)/.test(location.hostname)))navigator.serviceWorker.register('sw.js').catch(e=>console.warn('sw',e));
let installEv=null;const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEv=e;$('#installBtn').hidden=false});
window.addEventListener('appinstalled',()=>{$('#installBtn').hidden=true;toast('Đã cài app! Mở “Dựng Video” từ màn hình chính.')});
if(isIOS&&!inFrame&&!standalone&&location.protocol==='https:')$('#installBtn').hidden=false;
$('#installBtn').onclick=async()=>{
 if(installEv){installEv.prompt();const r=await installEv.userChoice;if(r.outcome==='accepted')$('#installBtn').hidden=true;installEv=null;return}
 modal(`<h2>📲 Cài app lên ${isIOS?'iPhone/iPad':'thiết bị'}</h2><div class="hint">${isIOS?'Mở trang này bằng <b>Safari</b>, bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên) → chọn <b>Thêm vào MH chính</b> → <b>Thêm</b>.':'Trên Chrome/Edge: bấm biểu tượng <b>cài đặt</b> ở cuối thanh địa chỉ, hoặc menu ⋮ → <b>Cài đặt ứng dụng</b> / <b>Thêm vào màn hình chính</b>.'}</div><div class="btns"><button class="pri" id="mClose">Đã hiểu</button></div>`);$('#mClose').onclick=closeModal;
};
