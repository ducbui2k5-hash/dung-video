'use strict';
/* ================= photo editor ================= */
const PE=(()=>{
const cvs=$('#pcv'),g=cvs.getContext('2d'),opts=$('#pOpts');
const MAXS=2048;
const ADJ=[['exp','Độ sáng',-100,100],['con','Tương phản',-100,100],['sat','Bão hòa',-100,100],['warm','Nhiệt độ',-100,100],['tint','Sắc độ',-100,100],['hi','Vùng sáng',-100,100],['sh','Vùng tối',-100,100],['fade','Phai màu',0,100],['sharp','Độ nét',0,100]];
const EFX=[['vig','Tối 4 góc',0,100],['grain','Hạt phim',0,100],['leak','Ánh sáng rò',0,100],['rgb','Lệch màu',0,100],['tilt','Mờ trên & dưới',0,100]];
const KEYS=[...ADJ,...EFX].map(a=>a[0]);
const HSLR=[['red','Đỏ',0,'#ff3b30'],['orange','Cam',30,'#ff9500'],['yellow','Vàng',60,'#ffd400'],['green','Lục',120,'#34c759'],['aqua','Lục lam',180,'#00c7be'],['blue','Lam',230,'#007aff'],['purple','Tím',275,'#af52de'],['magenta','Hồng',320,'#ff2d92']];
const CPRE={'Tương phản S':{rgb:[[0,0],[64,46],[192,210],[255,255]]},'Mờ (matte)':{rgb:[[0,42],[128,128],[255,238]]},'Sáng lên':{rgb:[[0,0],[105,150],[255,255]]},'Tối đi':{rgb:[[0,0],[150,105],[255,255]]},'Cross process':{r:[[0,0],[64,40],[190,222],[255,255]],g:[[0,0],[64,52],[190,212],[255,255]],b:[[0,34],[255,222]]},'Phim ấm':{r:[[0,20],[128,140],[255,255]],b:[[0,0],[128,112],[255,230]],rgb:[[0,18],[255,245]]},'Phim lạnh':{r:[[0,0],[128,116],[255,240]],b:[[0,24],[128,142],[255,255]]},'Âm bản':{rgb:[[0,255],[255,0]]}};
function curveLUT(pts){
 const p=[...pts].sort((a,b)=>a[0]-b[0]),n=p.length,lut=new Uint8ClampedArray(256),xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),d=[],m=[];
 for(let i=0;i<n-1;i++)d[i]=(ys[i+1]-ys[i])/((xs[i+1]-xs[i])||1);
 m[0]=d[0];m[n-1]=d[n-2];for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
 for(let i=0;i<n-1;i++){if(d[i]===0){m[i]=m[i+1]=0;continue}const a=m[i]/d[i],b=m[i+1]/d[i],q=a*a+b*b;if(q>9){const t=3/Math.sqrt(q);m[i]=t*a*d[i];m[i+1]=t*b*d[i]}}
 let i=0;for(let x=0;x<256;x++){if(x<=xs[0]){lut[x]=ys[0];continue}if(x>=xs[n-1]){lut[x]=ys[n-1];continue}while(x>xs[i+1])i++;const h=xs[i+1]-xs[i],t=(x-xs[i])/h,t2=t*t,t3=t2*t;
  lut[x]=(2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1]}
 return lut;
}
const isIdC=p=>p.length===2&&p[0][0]===0&&p[0][1]===0&&p[1][0]===255&&p[1][1]===255;
const hueRGB=h=>{const f=n=>{const k=(n+h/30)%12;return 0.5-0.5*Math.max(-1,Math.min(k-3,9-k,1))};return[f(0)*255,f(8)*255,f(4)*255]};
const sstep=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
function hueOf(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return[0,0];let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;const l=(mx+mn)/510;return[h,d/255/(1-Math.abs(2*l-1)||1)]}
const hdist=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d};
function buildX(c){
 if(!c)return null;const X={};const cv=c.curves;
 if(!['rgb','r','g','b'].every(k=>isIdC(cv[k]))){const M=curveLUT(cv.rgb),R=curveLUT(cv.r),G=curveLUT(cv.g),B=curveLUT(cv.b);X.cr=new Uint8ClampedArray(256);X.cg=new Uint8ClampedArray(256);X.cb=new Uint8ClampedArray(256);for(let v=0;v<256;v++){X.cr[v]=R[M[v]];X.cg[v]=G[M[v]];X.cb[v]=B[M[v]]}}
 if(HSLR.some(r=>c.hsl[r[0]].some(v=>v)))X.hsl=HSLR.map(r=>c.hsl[r[0]]);
 if(c.gh)X.gh=c.gh;
 if(c.splash.on)X.splash=c.splash;
 if(c.repl.on)X.repl=c.repl;
 if(c.split.hs>0||c.split.ss>0){const k=0.45;X.split={h:hueRGB(c.split.hh).map(v=>(v-128)*c.split.hs/100*k),s:hueRGB(c.split.sh).map(v=>(v-128)*c.split.ss/100*k),bal:c.split.bal/100}}
 return Object.keys(X).length?X:null;
}
const HC=HSLR.map(r=>r[2]);
function hslW(h,out){out.fill(0);const n=HC.length;for(let i=0;i<n;i++){const a=HC[i],b=i<n-1?HC[i+1]:360;if(h>=a&&h<b){const t=(h-a)/(b-a),w=0.5+0.5*Math.cos(Math.PI*t);out[i]=w;out[(i+1)%n]=1-w;return out}}if(h<HC[0]){out[0]=1}return out}
const FILTERS={'Gốc':{},'Trong trẻo':{exp:8,con:10,sat:10,warm:-5},'Ấm áp':{warm:28,sat:10,fade:6},'Mát lạnh':{warm:-28,tint:-5,con:8},'Hồng phấn':{tint:14,warm:8,exp:6,fade:12},'Sáng da':{exp:12,warm:6,tint:6,sh:20,con:-5},'Rực rỡ':{sat:40,con:15},'Hoàng hôn':{warm:38,tint:8,sat:15,leak:25},'Film cũ':{fade:28,warm:16,sat:-22,grain:30,con:-6},'Vintage':{warm:22,fade:22,sat:-28,vig:28,grain:16},'Điện ảnh':{con:22,sat:-15,warm:-10,tint:5,vig:32},'Mờ ảo':{fade:32,exp:10,sat:-12},'Tối huyền bí':{exp:-16,con:26,sat:-22,vig:42},'Đen trắng':{sat:-100,con:18},'Đen trắng mềm':{sat:-100,fade:24,con:-8}};
const LAYOUTS={'2 dọc':[[0,0,.5,1],[.5,0,.5,1]],'2 ngang':[[0,0,1,.5],[0,.5,1,.5]],'3 dọc':[[0,0,1/3,1],[1/3,0,1/3,1],[2/3,0,1/3,1]],'1 + 2':[[0,0,.5,1],[.5,0,.5,.5],[.5,.5,.5,.5]],'2 + 1':[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,1,.5]],'4 ô':[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]],'1 + 3':[[0,0,1,.6],[0,.6,1/3,.4],[1/3,.6,1/3,.4],[2/3,.6,1/3,.4]],'6 ô':[[0,0,1/3,.5],[1/3,0,1/3,.5],[2/3,0,1/3,.5],[0,.5,1/3,.5],[1/3,.5,1/3,.5],[2/3,.5,1/3,.5]],'9 ô':[0,1,2].flatMap(r=>[0,1,2].map(c=>[c/3,r/3,1/3,1/3]))};
const BEAUTY={smooth:['✨','Mịn da','Tô lên vùng da để làm mịn, vẫn giữ đường nét.'],whiten:['🤍','Sáng da','Tô lên vùng da để làm sáng.'],heal:['🩹','Xóa mụn','Chạm vào nốt mụn / vết thâm để xóa.'],slim:['↔','Thon mặt','Kéo nhẹ từ ngoài má vào trong để thon gọn.'],eye:['👁','To mắt','Chạm vào giữa mắt để làm to. Chạm nhiều lần để tăng.'],shrink:['🔽','Thu nhỏ','Chạm vào vùng cần thu nhỏ (mũi, cằm…).'],blush:['🌸','Má hồng','Tô nhẹ lên gò má.'],lips:['💋','Tô son','Tô lên môi.']};
const TINTS={blush:['#ff7a9a','#ff9e80','#e86a8a','#ffb3c6'],lips:['#d6204e','#ff4f6d','#b0103a','#e8607a','#c2410c']};
const PTSTYLES={'Trắng viền đen':{color:'#ffffff',strokeOn:true,stroke:'#000000',bgOn:false,font:'Be Vietnam Pro',bold:true},'Vàng nổi':{color:'#ffd400',strokeOn:true,stroke:'#000000',bgOn:false,font:'Montserrat',bold:true},'Nền đen':{color:'#ffffff',strokeOn:false,bgOn:true,bg:'#000000',font:'Be Vietnam Pro',bold:true},'Nền trắng':{color:'#111111',strokeOn:false,bgOn:true,bg:'#ffffff',font:'Be Vietnam Pro',bold:true},'Hồng':{color:'#ff4fa3',strokeOn:true,stroke:'#ffffff',bgOn:false,font:'Lobster',bold:false},'Viết tay':{color:'#ffffff',strokeOn:true,stroke:'#1b1b1b',bgOn:false,font:'Dancing Script',bold:true},'Chữ ký':{color:'#ffffff',strokeOn:false,bgOn:false,font:'Pacifico',bold:false}};
const PALETTE=['#ffffff','#000000','#ff3b30','#ff9500','#ffd400','#34c759','#00c7be','#007aff','#af52de','#ff2d92'];
const IDC=()=>[[0,0],[255,255]];
const defColor=()=>({curves:{rgb:IDC(),r:IDC(),g:IDC(),b:IDC()},hsl:Object.fromEntries(HSLR.map(r=>[r[0],[0,0,0]])),gh:0,splash:{on:false,hue:0,tol:35,inv:false},repl:{on:false,from:0,to:200,tol:30,sat:0},split:{hh:40,hs:0,sh:220,ss:0,bal:0}});
const defState=()=>({adj:Object.fromEntries(KEYS.map(k=>[k,0]).concat([['tiltY',50]])),filter:'Gốc',fint:100,objs:[],frame:{type:'none',size:5,color:'#ffffff',aspect:'1:1'},col:defColor()});
let base=null,orig=null,name='anh',ver=0,st=defState(),tool='adjust',selId=null,undoS=[],redoS=[],lastK=null,lastT=0;
let col=null,crop=null,comparing=false,dirty=true,cursor=null,stroke=null,dragO=null,boxes=[],L=null,exporting=false;
let brush={mode:'smooth',size:28,str:60,color:'#ff7a9a'},drawB={color:'#ffffff',size:10,op:1,style:'pen'},blurB={mode:'blur',size:40,amt:60};
const proc=document.createElement('canvas');const caches=new Map();
const newC=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const cloneC=c=>{const n=newC(c.width,c.height);n.getContext('2d').drawImage(c,0,0);return n};
const bctx=()=>base.getContext('2d',{willReadFrequently:true});

/* ---------- open ---------- */
async function openFile(f){try{const url=URL.createObjectURL(f);const im=new Image();im.src=url;await im.decode();openImageEl(im,f.name)}catch(e){toast('Không mở được ảnh này')}}
function openImageEl(im,nm){
 resetView();
 const w0=im.naturalWidth||im.width,h0=im.naturalHeight||im.height,s=Math.min(1,MAXS/Math.max(w0,h0));
 const c=newC(Math.round(w0*s),Math.round(h0*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
 base=c;orig=cloneC(c);name=String(nm||'anh').replace(/\.[^.]+$/,'');ver++;st=defState();undoS=[];redoS=[];col=null;crop=null;selId=null;dirty=true;tool='adjust';
 caches.clear();renderTools();renderPanel();req();updU();
}
/* ---------- undo ---------- */
function pushU(key){const now=Date.now();if(key&&key===lastK&&now-lastT<900){lastT=now;return}lastK=key||null;lastT=now;undoS.push({base,st:JSON.stringify(st)});if(undoS.length>25)undoS.shift();redoS=[];updU()}
function destructive(){pushU();base=cloneC(base);ver++;dirty=true}
function restore(s){if(s.base!==base){base=s.base;ver++}st=JSON.parse(s.st);if(!st.col)st.col=defColor();dirty=true;selId=null;renderPanel();req();updU()}
function undo(){if(col||!undoS.length)return;redoS.push({base,st:JSON.stringify(st)});lastK=null;restore(undoS.pop())}
function redo(){if(col||!redoS.length)return;undoS.push({base,st:JSON.stringify(st)});lastK=null;restore(redoS.pop())}
function updU(){if(!document.body.classList.contains('pm'))return;$('#undoBtn').disabled=!undoS.length;$('#redoBtn').disabled=!redoS.length}

/* ---------- pixel processing ---------- */
function blurData(src,w,h,r){
 const a=new Float32Array(src),b=new Float32Array(src.length),n=2*r+1;
 for(let it=0;it<3;it++){
  for(let y=0;y<h;y++){const row=y*w;for(let c=0;c<4;c++){let v=0;for(let k=-r;k<=r;k++)v+=a[(row+clamp(k,0,w-1))*4+c];for(let x=0;x<w;x++){b[(row+x)*4+c]=v/n;v+=a[(row+Math.min(x+r+1,w-1))*4+c]-a[(row+Math.max(x-r,0))*4+c]}}}
  for(let x=0;x<w;x++){for(let c=0;c<4;c++){let v=0;for(let k=-r;k<=r;k++)v+=b[(clamp(k,0,h-1)*w+x)*4+c];for(let y=0;y<h;y++){a[(y*w+x)*4+c]=v/n;v+=b[(Math.min(y+r+1,h-1)*w+x)*4+c]-b[(Math.max(y-r,0)*w+x)*4+c]}}}
 }
 return new Uint8ClampedArray(a);
}
function getBlur(r){
 const key='b'+ver+':'+r;if(caches.has(key))return caches.get(key);
 const w=base.width,h=base.height,sc=r>=6?0.5:1,sw=Math.max(1,Math.round(w*sc)),sh=Math.max(1,Math.round(h*sc));
 const sm=newC(sw,sh),sg=sm.getContext('2d',{willReadFrequently:true});sg.drawImage(base,0,0,sw,sh);
 const id=sg.getImageData(0,0,sw,sh);id.data.set(blurData(id.data,sw,sh,Math.max(1,Math.round(r*sc))));sg.putImageData(id,0,0);
 const out=newC(w,h);const og=out.getContext('2d');og.imageSmoothingQuality='high';og.drawImage(sm,0,0,w,h);
 for(const k of caches.keys())if(!k.includes(':')||!k.slice(1).startsWith(String(ver)))caches.delete(k);
 caches.set(key,out);return out;
}
function getMosaic(cell){
 const key='m'+ver+':'+cell;if(caches.has(key))return caches.get(key);
 const w=base.width,h=base.height,sm=newC(Math.max(1,Math.ceil(w/cell)),Math.max(1,Math.ceil(h/cell)));sm.getContext('2d').drawImage(base,0,0,sm.width,sm.height);
 const out=newC(w,h),og=out.getContext('2d');og.imageSmoothingEnabled=false;og.drawImage(sm,0,0,sm.width*cell,sm.height*cell);caches.set(key,out);return out;
}
function effParams(filter,fint,adj){const p=FILTERS[filter]||{},E={};for(const k of KEYS)E[k]=(adj?adj[k]||0:0)+(p[k]||0)*fint/100;return E}
function processData(sd,w,h,E,bd,tiltY,X){
 const HW=new Float32Array(8);
 const out=new Uint8ClampedArray(sd.length);
 const lut=new Uint8ClampedArray(256),ex=Math.pow(2,E.exp/100),cf=1+E.con/100*(E.con>0?1:0.7),fd=E.fade/100;
 for(let v=0;v<256;v++){let x=v*ex;x=(x-128)*cf+128;x=x+(1-clamp(x,0,255)/255)*fd*75-fd*12;lut[v]=x}
 const sat=1+E.sat/100,wm=E.warm*0.35,tn=E.tint*0.25,hi=E.hi*0.5,sh=E.sh*0.5,vig=E.vig/100,gr=E.grain*0.7,lk=E.leak/100,rs=Math.round(E.rgb/100*Math.max(w,h)*0.006),tl=E.tilt/100,ty=tiltY/100*h;
 const cx=w/2,cy=h/2,md=Math.hypot(cx,cy);let seed=12345;
 for(let y=0;y<h;y++){
  let tw=0;if(tl>0&&bd){const band=h*0.2*(1.15-tl*0.75);tw=clamp((Math.abs(y-ty)-band)/(h*0.12),0,1)}
  const dy2=(y-cy)*(y-cy),gy=Math.max(0,1-y/(h*0.7));
  for(let x=0;x<w;x++){
   const i=(y*w+x)*4;let r,G,b;
   if(rs>0){r=sd[(y*w+Math.min(w-1,x+rs))*4];G=sd[i+1];b=sd[(y*w+Math.max(0,x-rs))*4+2]}else{r=sd[i];G=sd[i+1];b=sd[i+2]}
   if(tw>0){r+=(bd[i]-r)*tw;G+=(bd[i+1]-G)*tw;b+=(bd[i+2]-b)*tw;r|=0;G|=0;b|=0}
   r=lut[r];G=lut[G];b=lut[b];
   const Lm=0.299*r+0.587*G+0.114*b;
   if(hi!==0&&Lm>128){const t=(Lm-128)/127,d=hi*t*t;r+=d;G+=d;b+=d}
   if(sh!==0&&Lm<128){const t=(128-Lm)/128,d=sh*t*t;r+=d;G+=d;b+=d}
   if(sat!==1){const l2=0.299*r+0.587*G+0.114*b;r=l2+(r-l2)*sat;G=l2+(G-l2)*sat;b=l2+(b-l2)*sat}
   if(wm){r+=wm;b-=wm}if(tn){r+=tn*0.5;G-=tn;b+=tn*0.5}
   if(X){
    if(X.cr){r=X.cr[r<0?0:r>255?255:r|0];G=X.cg[G<0?0:G>255?255:G|0];b=X.cb[b<0?0:b>255?255:b|0]}
    if(X.hsl||X.gh||X.splash||X.repl){
     r=clamp(r,0,255)/255;G=clamp(G,0,255)/255;b=clamp(b,0,255)/255;
     const mx=Math.max(r,G,b),mn=Math.min(r,G,b),dd=mx-mn;let hh=0,ll=(mx+mn)/2,ss=dd?dd/(1-Math.abs(2*ll-1)||1):0;
     if(dd){hh=mx===r?((G-b)/dd)%6:mx===G?(b-r)/dd+2:(r-G)/dd+4;hh*=60;if(hh<0)hh+=360}
     if(X.splash||X.repl){var o0=hueOf(sd[i],sd[i+1],sd[i+2])}
     if(X.gh)hh+=X.gh;
     if(X.hsl&&dd){hslW(hh%360,HW);let dh=0,ds=0,dl=0;for(let q=0;q<8;q++)if(HW[q]){const v=X.hsl[q];dh+=v[0]*HW[q];ds+=v[1]*HW[q];dl+=v[2]*HW[q]}hh+=dh*0.3;ss*=1+ds/100;ll+=dl/100*0.3*Math.min(1,ss*2.5)}
     if(X.repl&&o0[1]>0.06){const wt=sstep((X.repl.tol-hdist(o0[0],X.repl.from))/(X.repl.tol*0.4))*Math.min(1,o0[1]*5);if(wt){let dhh=X.repl.to-X.repl.from;if(dhh>180)dhh-=360;if(dhh<-180)dhh+=360;hh+=dhh*wt;ss*=1+X.repl.sat/100*wt}}
     if(X.splash){let keep=o0[1]<0.08?0:sstep((X.splash.tol-hdist(o0[0],X.splash.hue))/(X.splash.tol*0.35))*Math.min(1,o0[1]*6);if(X.splash.inv)keep=1-keep;ss*=keep}
     ss=clamp(ss,0,1);ll=clamp(ll,0,1);hh=((hh%360)+360)%360;
     const C=(1-Math.abs(2*ll-1))*ss,Hp=hh/60,Xc=C*(1-Math.abs(Hp%2-1)),m0=ll-C/2;let r1=0,g1=0,b1=0;
     if(Hp<1){r1=C;g1=Xc}else if(Hp<2){r1=Xc;g1=C}else if(Hp<3){g1=C;b1=Xc}else if(Hp<4){g1=Xc;b1=C}else if(Hp<5){r1=Xc;b1=C}else{r1=C;b1=Xc}
     r=(r1+m0)*255;G=(g1+m0)*255;b=(b1+m0)*255;
    }
    if(X.split){const l=(0.299*r+0.587*G+0.114*b)/255,wh=sstep((l-0.35)/0.65)*(1+X.split.bal),ws=(1-sstep(l/0.65))*(1-X.split.bal);r+=X.split.h[0]*wh+X.split.s[0]*ws;G+=X.split.h[1]*wh+X.split.s[1]*ws;b+=X.split.h[2]*wh+X.split.s[2]*ws}
   }
   if(lk>0){const gx=Math.max(0,1-x/(w*0.55)),q=gx*gx*(0.5+0.5*gy)*lk;r+=q*140;G+=q*60;b-=q*10}
   if(vig>0){const d=Math.sqrt((x-cx)*(x-cx)+dy2)/md,f=1-vig*0.85*Math.pow(clamp((d-0.35)/0.6,0,1),1.6);r*=f;G*=f;b*=f}
   if(gr>0){seed=(seed*1103515245+12345)&0x7fffffff;const n=((seed>>16)/32768-0.5)*gr;r+=n;G+=n;b+=n}
   out[i]=r;out[i+1]=G;out[i+2]=b;out[i+3]=sd[i+3];
  }
 }
 if(E.sharp>0){const a=E.sharp/100*1.2,c=out.slice();for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;for(let k=0;k<3;k++)out[i+k]=c[i+k]*(1+4*a)-a*(c[i+k-4]+c[i+k+4]+c[i+k-w*4]+c[i+k+w*4])}}
 return out;
}
let fastMode=false,fastT=0;
function markFast(){fastMode=true;clearTimeout(fastT);fastT=setTimeout(()=>{fastMode=false;dirty=true;req()},280)}
function scaledData(src,w,h){if(src.width===w&&src.height===h)return src.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;const c=newC(w,h),cg=c.getContext('2d',{willReadFrequently:true});cg.drawImage(src,0,0,w,h);return cg.getImageData(0,0,w,h).data}
function process(fast){
 const s=fast?Math.min(1,900/Math.max(base.width,base.height)):1,w=Math.max(1,Math.round(base.width*s)),h=Math.max(1,Math.round(base.height*s));
 proc.width=w;proc.height=h;const pc=proc.getContext('2d');
 const E=effParams(st.filter,st.fint,st.adj),X=buildX(st.col);
 if(!X&&KEYS.every(k=>Math.abs(E[k])<0.01)){pc.drawImage(base,0,0,w,h);return}
 if(s<1){E.rgb*=1;E.grain*=0.8}
 const sd=scaledData(base,w,h);
 const bd=E.tilt>0?scaledData(getBlur(Math.max(4,Math.round(Math.max(base.width,base.height)*0.012))),w,h):null;
 const id=pc.createImageData(w,h);id.data.set(processData(sd,w,h,E,bd,st.adj.tiltY,X));pc.putImageData(id,0,0);
}
let thumbs={},thumbVer=-1;
function filterThumbs(){
 if(thumbVer===ver)return thumbs;thumbVer=ver;thumbs={};
 const s=96/Math.max(base.width,base.height),w=Math.max(1,Math.round(base.width*s)),h=Math.max(1,Math.round(base.height*s));
 const c=newC(w,h),cg=c.getContext('2d',{willReadFrequently:true});cg.drawImage(base,0,0,w,h);const sd=cg.getImageData(0,0,w,h);
 for(const f of Object.keys(FILTERS)){const id=new ImageData(processData(sd.data,w,h,effParams(f,100,null),null,50),w,h);cg.putImageData(id,0,0);thumbs[f]=c.toDataURL('image/jpeg',.8)}
 return thumbs;
}

/* ---------- layout & render ---------- */
function layout(){
 const iw=base.width,ih=base.height,f=st.frame,m=Math.min(iw,ih);let W=iw,H=ih,ix=0,iy=0,sw=iw,sh=ih;
 if(f.type==='border'){const p=Math.round(m*f.size/100);W=iw+2*p;H=ih+2*p;ix=iy=p}
 else if(f.type==='polaroid'){const p=Math.round(m*f.size/100)+4;W=iw+2*p;H=ih+p*5;ix=iy=p}
 else if(f.type==='blur'||f.type==='color'){const[a,b]=f.aspect.split(':').map(Number),R=a/b;if(iw/ih>R){W=iw;H=Math.round(iw/R)}else{H=ih;W=Math.round(ih*R)}
  const p=Math.min(W,H)*f.size/100,k=Math.min((W-2*p)/iw,(H-2*p)/ih);sw=iw*k;sh=ih*k;ix=(W-sw)/2;iy=(H-sh)/2}
 return{W,H,ix,iy,sw,sh,sc:sw/iw};
}
let reqd=false;function req(){if(!reqd){reqd=true;requestAnimationFrame(()=>{reqd=false;render()})}}
function render(){
 const pm=document.body.classList.contains('pm');if(!pm)return;
 $('#pEmpty').style.display=(base||col)?'none':'flex';cvs.style.display=(base||col)?'block':'none';
 if(col){renderCollage(g,false);return}
 if(!base)return;
 if(comparing){cvs.width=orig.width;cvs.height=orig.height;g.drawImage(orig,0,0);return}
 if(dirty){process(fastMode);dirty=false}
 if(tool==='crop'){renderCrop();return}
 L=layout();drawOut(g,L,true);
}
function drawOut(G,Lo,ui){
 const{W,H,ix,iy,sw,sh}=Lo,f=st.frame;
 if(G.canvas.width!==W||G.canvas.height!==H){G.canvas.width=W;G.canvas.height=H}
 G.save();G.clearRect(0,0,W,H);
 if(f.type==='blur'){const t=newC(48,Math.max(1,Math.round(48*proc.height/proc.width)));t.getContext('2d').drawImage(proc,0,0,t.width,t.height);const k=Math.max(W/t.width,H/t.height);G.imageSmoothingQuality='high';G.drawImage(t,(W-t.width*k)/2,(H-t.height*k)/2,t.width*k,t.height*k);G.fillStyle='rgba(0,0,0,.12)';G.fillRect(0,0,W,H)}
 else if(f.type!=='none'&&f.type!=='round'){G.fillStyle=f.color;G.fillRect(0,0,W,H)}
 if(f.type==='round'){rrect(G,ix,iy,sw,sh,Math.min(sw,sh)*f.size/100*1.6);G.clip()}
 else if(f.type==='blur'||f.type==='color'){G.shadowColor='rgba(0,0,0,.25)';G.shadowBlur=Math.min(W,H)*0.02}
 G.drawImage(proc,ix,iy,sw,sh);G.shadowBlur=0;
 if(stroke&&stroke.layer){G.globalAlpha=drawB.op;G.drawImage(stroke.layer,ix,iy,sw,sh);G.globalAlpha=1}
 G.restore();
 boxes=[];drawObjs(G,Lo,ui);
 if(ui&&cursor&&/^(beauty|draw|blur)$/.test(tool)){const r=brushR()*Lo.sc;G.save();G.strokeStyle='rgba(255,255,255,.9)';G.lineWidth=Math.max(1.5,W/600);G.beginPath();G.arc(cursor.x,cursor.y,r,0,Math.PI*2);G.stroke();G.strokeStyle='rgba(0,0,0,.6)';G.beginPath();G.arc(cursor.x,cursor.y,r+G.lineWidth,0,Math.PI*2);G.stroke();G.restore()}
}
function drawObjs(G,Lo,ui){
 const{ix,iy,sw,sh}=Lo,m=Math.min(sw,sh);
 for(const o of st.objs){
  const fs=o.size/1000*m,cx=ix+o.x*sw,cy=iy+o.y*sh;
  G.save();G.globalAlpha=o.op;G.font=`${o.bold?'700':'400'} ${fs}px "${o.font}", "Be Vietnam Pro", Arial, sans-serif`;G.textAlign='center';G.textBaseline='middle';
  const lines=o.text.split('\n'),lh=fs*1.22,bw=Math.max(10,...lines.map(l=>G.measureText(l).width)),bh=lh*lines.length,px=fs*0.35,py=fs*0.18;
  G.translate(cx,cy);G.rotate((o.rot||0)*Math.PI/180);
  if(o.bgOn){G.fillStyle=o.bg;rrect(G,-bw/2-px,-bh/2-py,bw+px*2,bh+py*2,fs*0.22);G.fill()}
  lines.forEach((l,i)=>{const y=-bh/2+lh*(i+0.5);if(o.strokeOn){G.lineWidth=fs*0.16;G.lineJoin='round';G.strokeStyle=o.stroke;G.strokeText(l,0,y)}G.fillStyle=o.color;G.fillText(l,0,y)});
  G.restore();
  const b={id:o.id,x:cx-bw/2-px,y:cy-bh/2-py,w:bw+px*2,h:bh+py*2};boxes.push(b);
  if(ui&&o.id===selId){G.save();G.strokeStyle='#3ee6c4';G.lineWidth=Math.max(2,G.canvas.width/500);G.setLineDash([10,7]);G.strokeRect(b.x,b.y,b.w,b.h);G.restore()}
 }
}
/* ---------- crop ---------- */
function coverScale(a,w,h){const c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));return Math.max((w*c+h*s)/w,(w*s+h*c)/h)}
function drawRotated(G,src,a,w,h){const k=coverScale(a,w,h);G.save();G.translate(w/2,h/2);G.rotate(a);G.scale(k,k);G.drawImage(src,-w/2,-h/2,w,h);G.restore()}
function renderCrop(){
 const w=base.width,h=base.height;if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}
 g.fillStyle='#000';g.fillRect(0,0,w,h);drawRotated(g,proc,crop.ang*Math.PI/180,w,h);
 const{x,y}=crop,cw=crop.w,ch=crop.h,lw=Math.max(2,w/400);
 g.save();g.fillStyle='rgba(0,0,0,.55)';g.beginPath();g.rect(0,0,w,h);g.rect(x,y+ch,cw,-ch);g.fill('evenodd');
 g.strokeStyle='#fff';g.lineWidth=lw;g.strokeRect(x,y,cw,ch);g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=lw/2;
 for(let i=1;i<3;i++){g.beginPath();g.moveTo(x+cw*i/3,y);g.lineTo(x+cw*i/3,y+ch);g.moveTo(x,y+ch*i/3);g.lineTo(x+cw,y+ch*i/3);g.stroke()}
 g.fillStyle='#3ee6c4';const hs=Math.max(14,w/45);for(const[px,py]of[[x,y],[x+cw,y],[x,y+ch],[x+cw,y+ch]])g.fillRect(px-hs/2,py-hs/2,hs,hs);g.restore();
}
function startCrop(){crop={x:0,y:0,w:base.width,h:base.height,ar:0,ang:0}}
function setCropAR(ar){crop.ar=ar;if(!ar){req();return}const w=base.width,h=base.height;let cw=w,ch=w/ar;if(ch>h){ch=h;cw=h*ar}crop.w=cw;crop.h=ch;crop.x=(w-cw)/2;crop.y=(h-ch)/2;req()}
function applyCrop(){
 const a=crop.ang*Math.PI/180,w=base.width,h=base.height,c=newC(Math.max(1,Math.round(crop.w)),Math.max(1,Math.round(crop.h))),cg=c.getContext('2d');
 cg.translate(-crop.x,-crop.y);drawRotated(cg,base,a,w,h);pushU();base=c;ver++;dirty=true;tool='adjust';crop=null;renderTools();renderPanel();req();updU();toast('Đã cắt ảnh');
}
function rot90(dir){const w=base.width,h=base.height,c=newC(h,w),cg=c.getContext('2d');cg.translate(h/2,w/2);cg.rotate(dir*Math.PI/2);cg.drawImage(base,-w/2,-h/2);pushU();base=c;ver++;dirty=true;const ar=crop?crop.ar:0;startCrop();if(ar)setCropAR(ar);req();updU()}
function flip(hz){const w=base.width,h=base.height,c=newC(w,h),cg=c.getContext('2d');cg.translate(hz?w:0,hz?0:h);cg.scale(hz?-1:1,hz?1:-1);cg.drawImage(base,0,0);pushU();base=c;ver++;dirty=true;req();updU()}

/* ---------- brushes ---------- */
function brushR(){const M=base?Math.max(base.width,base.height):1000;if(tool==='draw')return drawB.size/1000*M;if(tool==='blur')return blurB.size/1000*M;return brush.size/1000*M}
function region(cx,cy,R){const x0=Math.max(0,Math.floor(cx-R)),y0=Math.max(0,Math.floor(cy-R)),x1=Math.min(base.width,Math.ceil(cx+R)),y1=Math.min(base.height,Math.ceil(cy+R));return{x0,y0,w:x1-x0,h:y1-y0}}
function sampleBil(d,w,h,x,y,c){x=clamp(x,0,w-1);y=clamp(y,0,h-1);const x0=x|0,y0=y|0,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
 const a=d[(y0*w+x0)*4+c],b=d[(y0*w+x1)*4+c],e=d[(y1*w+x0)*4+c],f=d[(y1*w+x1)*4+c];return(a*(1-fx)+b*fx)*(1-fy)+(e*(1-fx)+f*fx)*fy}
function hexRGB(h){const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]}
function softLight(a,b){return b<.5?a-(1-2*b)*a*(1-a):a+(2*b-1)*((a<=.25?((16*a-12)*a+4)*a:Math.sqrt(a))-a)}
function dab(cx,cy){
 const R=brushR(),rg=region(cx,cy,R);if(rg.w<1||rg.h<1)return;const B=bctx(),id=B.getImageData(rg.x0,rg.y0,rg.w,rg.h),d=id.data,str=brush.str/100,mode=brush.mode;
 let bl=null;if(mode==='smooth')bl=stroke.blur.getContext('2d',{willReadFrequently:true}).getImageData(rg.x0,rg.y0,rg.w,rg.h).data;
 const tc=(mode==='blush'||mode==='lips')?hexRGB(brush.color).map(v=>v/255):null;
 for(let y=0;y<rg.h;y++)for(let x=0;x<rg.w;x++){
  const dx=rg.x0+x-cx,dy=rg.y0+y-cy,dd=(dx*dx+dy*dy)/(R*R);if(dd>=1)continue;const f=(1-dd)*(1-dd),i=(y*rg.w+x)*4;
  if(mode==='smooth'){const df=Math.abs(0.299*(bl[i]-d[i])+0.587*(bl[i+1]-d[i+1])+0.114*(bl[i+2]-d[i+2])),w=f*str*0.45*Math.exp(-(df*df)/(2*22*22));for(let c=0;c<3;c++)d[i+c]+= (bl[i+c]-d[i+c])*w}
  else if(mode==='whiten'){const w=f*str*0.12;d[i]+=(255-d[i])*w;d[i+1]+=(255-d[i+1])*w;d[i+2]+=(255-d[i+2])*w*1.05}
  else if(tc){const w=f*str*0.1;for(let c=0;c<3;c++){const a=d[i+c]/255;d[i+c]+=(softLight(a,tc[c])*255-d[i+c])*w*(mode==='lips'?1.6:1)}}
 }
 B.putImageData(id,rg.x0,rg.y0);
}
function heal(cx,cy){
 const R=brushR(),rg=region(cx,cy,R+2);if(rg.w<3||rg.h<3)return;const B=bctx(),id=B.getImageData(rg.x0,rg.y0,rg.w,rg.h),d=id.data,s=d.slice(),W=rg.w,H=rg.h,lx=cx-rg.x0,ly=cy-rg.y0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const px=x-lx,py=y-ly,dist=Math.hypot(px,py);if(dist>=R)continue;
  const hx=Math.sqrt(R*R-py*py),vy=Math.sqrt(R*R-px*px),th=(px+hx)/(2*hx||1),tv=(py+vy)/(2*vy||1),f=clamp((R-dist)/(R*0.3),0,1),i=(y*W+x)*4,n=(Math.random()-.5)*3;
  for(let c=0;c<3;c++){const hv=sampleBil(s,W,H,lx-hx,y,c)*(1-th)+sampleBil(s,W,H,lx+hx,y,c)*th,vv=sampleBil(s,W,H,x,ly-vy,c)*(1-tv)+sampleBil(s,W,H,x,ly+vy,c)*tv;d[i+c]+=((hv+vv)/2+n-d[i+c])*f}}
 B.putImageData(id,rg.x0,rg.y0);
}
function warpPush(cx,cy,mx,my){
 const R=brushR(),pad=Math.ceil(Math.hypot(mx,my))+2,rg=region(cx,cy,R+pad);if(rg.w<2||rg.h<2)return;
 const B=bctx(),id=B.getImageData(rg.x0,rg.y0,rg.w,rg.h),d=id.data,s=d.slice(),W=rg.w,H=rg.h,str=0.35+brush.str/100*0.65;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=rg.x0+x-cx,dy=rg.y0+y-cy,dd=(dx*dx+dy*dy)/(R*R);if(dd>=1)continue;const f=(1-dd)*(1-dd)*str,sx=x-mx*f,sy=y-my*f,i=(y*W+x)*4;for(let c=0;c<4;c++)d[i+c]=sampleBil(s,W,H,sx,sy,c)}
 B.putImageData(id,rg.x0,rg.y0);
}
function bulge(cx,cy,sgn){
 const R=brushR()*1.4,rg=region(cx,cy,R+2);if(rg.w<2||rg.h<2)return;const B=bctx(),id=B.getImageData(rg.x0,rg.y0,rg.w,rg.h),d=id.data,s=d.slice(),W=rg.w,H=rg.h,lx=cx-rg.x0,ly=cy-rg.y0,S=sgn*(0.08+brush.str/100*0.3);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const vx=x-lx,vy=y-ly,dd=(vx*vx+vy*vy)/(R*R);if(dd>=1)continue;const k=1-S*(1-dd)*(1-dd),i=(y*W+x)*4;for(let c=0;c<4;c++)d[i+c]=sampleBil(s,W,H,lx+vx*k,ly+vy*k,c)}
 B.putImageData(id,rg.x0,rg.y0);
}
function blurDab(cx,cy){const R=brushR(),B=bctx();B.save();B.beginPath();B.arc(cx,cy,R,0,Math.PI*2);B.clip();B.drawImage(stroke.src,0,0);B.restore()}
function strokeTo(p){
 const last=stroke.last;const R=brushR(),step=Math.max(1,R*(tool==='draw'?0.1:0.3));
 if(tool==='beauty'&&brush.mode==='slim'){warpPush(p.x,p.y,p.x-last.x,p.y-last.y);stroke.last=p;dirty=true;markFast();req();return}
 if(tool==='draw'){stroke.pts.push(p);paintStroke();stroke.last=p;req();return}
 const dist=Math.hypot(p.x-last.x,p.y-last.y);let t=stroke.rem;
 while(t<=dist){const q={x:last.x+(p.x-last.x)*(dist?t/dist:0),y:last.y+(p.y-last.y)*(dist?t/dist:0)};tool==='blur'?blurDab(q.x,q.y):dab(q.x,q.y);t+=step}
 stroke.rem=t-dist;stroke.last=p;dirty=true;markFast();req();
}
function paintStroke(){
 const c=stroke.layer,G=c.getContext('2d'),pts=stroke.pts,M=Math.max(base.width,base.height),w=drawB.size/1000*M;
 G.clearRect(0,0,c.width,c.height);G.save();G.lineCap='round';G.lineJoin='round';G.lineWidth=w*2;
 if(drawB.style==='neon'){G.strokeStyle='#ffffff';G.shadowColor=drawB.color;G.shadowBlur=w*3;G.lineWidth=w*1.2}
 else if(drawB.style==='marker'){G.strokeStyle=drawB.color;G.globalAlpha=0.5;G.lineCap='square'}else G.strokeStyle=drawB.color;
 const path=()=>{G.beginPath();G.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length-1;i++){const mx=(pts[i].x+pts[i+1].x)/2,my=(pts[i].y+pts[i+1].y)/2;G.quadraticCurveTo(pts[i].x,pts[i].y,mx,my)}const l=pts[pts.length-1];G.lineTo(l.x+0.01,l.y)};
 path();G.stroke();if(drawB.style==='neon'){G.shadowBlur=w*1.2;G.stroke();G.shadowBlur=0;G.strokeStyle=drawB.color;G.globalAlpha=.55;G.lineWidth=w*2.4;path();G.stroke()}
 G.restore();
}

/* ---------- collage ---------- */
function colSize(){const[a,b]=col.aspect.split(':').map(Number);return[1600,Math.round(1600*b/a)]}
function cellRects(){const[W,H]=colSize(),gp=col.gap/100*Math.min(W,H)*0.25;return LAYOUTS[col.layout].map(([x,y,w,h])=>({x:x*(W-gp)+gp,y:y*(H-gp)+gp,w:w*(W-gp)-gp,h:h*(H-gp)-gp}))}
function renderCollage(G,final){
 const[W,H]=colSize();if(G.canvas.width!==W||G.canvas.height!==H){G.canvas.width=W;G.canvas.height=H}
 G.fillStyle=col.bg;G.fillRect(0,0,W,H);const R=cellRects();
 R.forEach((r,i)=>{const c=col.cells[i]||(col.cells[i]={img:null,ox:.5,oy:.5,z:1});G.save();rrect(G,r.x,r.y,r.w,r.h,col.rad/100*Math.min(r.w,r.h)*0.5);G.clip();
  if(c.img){const iw=c.img.naturalWidth,ih=c.img.naturalHeight,k=Math.max(r.w/iw,r.h/ih)*c.z,dw=iw*k,dh=ih*k;G.drawImage(c.img,r.x-(dw-r.w)*c.ox,r.y-(dh-r.h)*c.oy,dw,dh)}
  else if(!final){G.fillStyle='rgba(128,128,128,.25)';G.fillRect(r.x,r.y,r.w,r.h);G.fillStyle='#8b93a7';G.font=`500 ${Math.min(r.w,r.h)*0.09}px "Be Vietnam Pro",Arial`;G.textAlign='center';G.textBaseline='middle';G.fillText('＋ Chạm để chọn ảnh',r.x+r.w/2,r.y+r.h/2)}
  G.restore();
  if(!final&&col.sel===i){G.save();G.strokeStyle='#3ee6c4';G.lineWidth=6;G.strokeRect(r.x+3,r.y+3,r.w-6,r.h-6);G.restore()}});
}
let cellPick=-1;
function finishCollage(){if(!col.cells.some(c=>c&&c.img)){toast('Hãy chọn ít nhất một ảnh');return}const c=newC(1,1);renderCollage(c.getContext('2d'),true);col=null;openImageEl(c,'anh-ghep');toast('Đã ghép ảnh. Bạn có thể chỉnh tiếp.')}

/* ---------- view zoom (pinch / ctrl+wheel) ---------- */
const stage=$('#pStage');let view={s:1,x:0,y:0};const pT=new Map();let pinch=null;
function applyView(){cvs.style.transform=view.s===1&&!view.x&&!view.y?'':`translate(${view.x}px,${view.y}px) scale(${view.s})`;$('#pZoom').hidden=view.s===1&&!view.x&&!view.y;$('#pZoom').textContent='🔍 '+Math.round(view.s*100)+'% ↺'}
function resetView(){view={s:1,x:0,y:0};applyView()}
function zoomAt(f,cx,cy){const r=stage.getBoundingClientRect(),ox=cx-r.left-r.width/2,oy=cy-r.top-r.height/2,ns=clamp(view.s*f,1,8),k=ns/view.s;view.x=ox-(ox-view.x)*k;view.y=oy-(oy-view.y)*k;view.s=ns;if(ns===1){view.x=view.y=0}applyView()}
stage.addEventListener('wheel',e=>{if(!base&&!col)return;e.preventDefault();if(e.ctrlKey||e.metaKey)zoomAt(Math.exp(-e.deltaY*0.01),e.clientX,e.clientY);else if(view.s>1){view.x-=e.deltaX;view.y-=e.deltaY;applyView()}},{passive:false});
function abortStroke(){if(!stroke)return;stroke=null;const u=undoS.pop();if(u){base=u.base;ver++;dirty=true;caches.clear()}req();updU()}
cvs.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;pT.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pT.size===2){abortStroke();dragO=null;cdrag=null;const[a,b]=[...pT.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,s:view.s,x:view.x,y:view.y}}},true);
cvs.addEventListener('pointermove',e=>{if(!pT.has(e.pointerId))return;pT.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch&&pT.size>=2){const[a,b]=[...pT.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;view={s:pinch.s,x:pinch.x,y:pinch.y};zoomAt(d/pinch.d,pinch.mx,pinch.my);view.x+=mx-pinch.mx;view.y+=my-pinch.my;if(view.s===1){view.x=view.y=0}applyView();e.stopImmediatePropagation()}},true);
['pointerup','pointercancel'].forEach(ev=>cvs.addEventListener(ev,e=>{pT.delete(e.pointerId);if(pT.size<2&&pinch){pinch=null;e.stopImmediatePropagation()}},true));
$('#pZoom').onclick=resetView;

/* ---------- pointer ---------- */
function cpos(e){const r=cvs.getBoundingClientRect();return{x:(e.clientX-r.left)*cvs.width/r.width,y:(e.clientY-r.top)*cvs.height/r.height}}
const toImg=p=>({x:(p.x-L.ix)/L.sc,y:(p.y-L.iy)/L.sc});
let cdrag=null;
cvs.addEventListener('pointerdown',e=>{
 if(e.button>0||pinch)return;const p=cpos(e);e.preventDefault();
 if(col){const R=cellRects(),i=R.findIndex(r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h);if(i<0)return;col.sel=i;const c=col.cells[i];
  if(!c||!c.img){cellPick=i;$('#fCell').click()}else cdrag={i,p,ox:c.ox,oy:c.oy,r:R[i]};renderPanel();req();return}
 if(!base)return;
 if(tool==='crop'){const hs=Math.max(30,base.width/25),cs=[[crop.x,crop.y],[crop.x+crop.w,crop.y],[crop.x,crop.y+crop.h],[crop.x+crop.w,crop.y+crop.h]];const ci=cs.findIndex(([x,y])=>Math.abs(p.x-x)<hs&&Math.abs(p.y-y)<hs);
  if(ci>=0)cdrag={corner:ci,o:{...crop}};else if(p.x>crop.x&&p.x<crop.x+crop.w&&p.y>crop.y&&p.y<crop.y+crop.h)cdrag={move:true,p,o:{...crop}};return}
 for(let i=boxes.length-1;i>=0;i--){const b=boxes[i];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h&&/^(text|sticker|adjust|filter|effect|frame)$/.test(tool)){const o=st.objs.find(x=>x.id===b.id);if(!o)continue;selId=o.id;pushU();dragO={o,dx:p.x-(L.ix+o.x*L.sw),dy:p.y-(L.iy+o.y*L.sh)};if(tool!=='text'&&tool!=='sticker'){tool=/^\p{Extended_Pictographic}/u.test(o.text)?'sticker':'text';renderTools()}renderPanel();req();return}}
 if(tool==='color'&&(ctab==='splash'||ctab==='repl')){const q=toImg(p);if(q.x<0||q.y<0||q.x>=base.width||q.y>=base.height)return;const px=bctx().getImageData(q.x|0,q.y|0,1,1).data,[hh,ss]=hueOf(px[0],px[1],px[2]);
  if(ss<0.08){toast('Điểm này gần như không có màu, hãy chạm vào vùng có màu rõ hơn');return}
  pushU();if(ctab==='splash'){st.col.splash.hue=Math.round(hh);st.col.splash.on=true}else{st.col.repl.from=Math.round(hh);st.col.repl.on=true}dirty=true;renderPanel();req();updU();return}
 if(/^(text|sticker)$/.test(tool)&&selId){selId=null;renderPanel();req()}
 if(/^(beauty|draw|blur)$/.test(tool)){
  const q=toImg(p);destructive();stroke={last:q,rem:0,pts:[q]};
  if(tool==='beauty'){if(brush.mode==='heal'){heal(q.x,q.y);stroke=null;dirty=true;req();updU();return}
   if(brush.mode==='eye'||brush.mode==='shrink'){bulge(q.x,q.y,brush.mode==='eye'?1:-1);stroke=null;dirty=true;req();updU();return}
   if(brush.mode==='smooth')stroke.blur=getBlur(Math.max(3,Math.round(Math.max(base.width,base.height)*0.006)));
   if(brush.mode!=='slim')dab(q.x,q.y)}
  if(tool==='blur'){const M=Math.max(base.width,base.height);stroke.src=blurB.mode==='blur'?getBlur(Math.max(3,Math.round(M*blurB.amt/100*0.025))):getMosaic(Math.max(4,Math.round(M*blurB.amt/100*0.04)));blurDab(q.x,q.y)}
  if(tool==='draw'){stroke.layer=newC(base.width,base.height);paintStroke()}
  dirty=true;req();updU();cvs.setPointerCapture(e.pointerId);
 }
});
cvs.addEventListener('pointermove',e=>{
 if(pinch)return;const p=cpos(e);
 if(col&&cdrag){const c=col.cells[cdrag.i],r=cdrag.r,iw=c.img.naturalWidth,ih=c.img.naturalHeight,k=Math.max(r.w/iw,r.h/ih)*c.z,ex=iw*k-r.w,ey=ih*k-r.h;c.ox=ex>0?clamp(cdrag.ox-(p.x-cdrag.p.x)/ex,0,1):.5;c.oy=ey>0?clamp(cdrag.oy-(p.y-cdrag.p.y)/ey,0,1):.5;req();return}
 if(!base||col)return;
 if(tool==='crop'&&cdrag){const o=cdrag.o,w=base.width,h=base.height;
  if(cdrag.move){crop.x=clamp(o.x+p.x-cdrag.p.x,0,w-o.w);crop.y=clamp(o.y+p.y-cdrag.p.y,0,h-o.h)}
  else{const ci=cdrag.corner,ax=ci%2===0?o.x+o.w:o.x,ay=ci<2?o.y+o.h:o.y;let nx=clamp(p.x,0,w),ny=clamp(p.y,0,h);let cw=Math.max(20,Math.abs(nx-ax)),ch=Math.max(20,Math.abs(ny-ay));
   if(crop.ar){if(cw/ch>crop.ar)cw=ch*crop.ar;else ch=cw/crop.ar}
   crop.x=ci%2===0?ax-cw:ax;crop.y=ci<2?ay-ch:ay;if(crop.x<0||crop.y<0||crop.x+cw>w||crop.y+ch>h){crop.x=clamp(crop.x,0,w);crop.y=clamp(crop.y,0,h);cw=Math.min(cw,w-crop.x);ch=Math.min(ch,h-crop.y);if(crop.ar){if(cw/ch>crop.ar)cw=ch*crop.ar;else ch=cw/crop.ar}}
   crop.w=cw;crop.h=ch}
  req();return}
 if(dragO){dragO.o.x=(p.x-dragO.dx-L.ix)/L.sw;dragO.o.y=(p.y-dragO.dy-L.iy)/L.sh;req();return}
 if(/^(beauty|draw|blur)$/.test(tool)){cursor=p;if(stroke)strokeTo(toImg(p));else req()}
});
function endPtr(){
 cdrag=null;
 if(dragO){dragO=null;renderPanel()}
 if(stroke){if(tool==='draw'&&stroke.layer){const B=bctx();B.globalAlpha=drawB.op;B.drawImage(stroke.layer,0,0);B.globalAlpha=1;dirty=true}stroke=null;caches.clear();req()}
}
cvs.addEventListener('pointerup',endPtr);cvs.addEventListener('pointercancel',endPtr);
cvs.addEventListener('pointerleave',()=>{if(!stroke){cursor=null;req()}});

/* ---------- objects ---------- */
function addObj(o){pushU();const ob=Object.assign({id:uid(),text:'Nhập chữ',x:.5,y:.5,size:80,color:'#ffffff',font:'Be Vietnam Pro',bold:true,strokeOn:true,stroke:'#000000',bgOn:false,bg:'#000000',rot:0,op:1},o);st.objs.push(ob);selId=ob.id;renderPanel();req();updU();return ob}
function selObj(){return st.objs.find(o=>o.id===selId)||null}
function delSel(){const o=selObj();if(!o)return;pushU();st.objs=st.objs.filter(x=>x!==o);selId=null;renderPanel();req();updU()}

/* ---------- tools & panels ---------- */
const TOOLS=[['adjust','🎚','Điều chỉnh'],['filter','🎨','Bộ lọc'],['color','🌈','Màu sắc'],['crop','✂','Cắt & xoay'],['beauty','💄','Làm đẹp'],['text','T','Chữ'],['sticker','😀','Sticker'],['draw','🖌','Vẽ'],['blur','▦','Làm mờ / che'],['effect','✨','Hiệu ứng'],['frame','🖼','Khung'],['collage','▤','Ghép ảnh']];
function renderTools(){$('#pTools').innerHTML=TOOLS.map(([k,i,n])=>`<button data-pt="${k}" class="${(col?'collage':tool)===k?'on':''}"><i>${i}</i><span>${n}</span></button>`).join('')}
$('#pTools').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.pt;
 if(k==='collage'){if(!col)col={layout:'2 dọc',aspect:'1:1',gap:3,rad:0,bg:'#ffffff',cells:[],sel:-1}}
 else{if(col){col=null}if(!base){toast('Hãy mở một ảnh trước');renderTools();return}tool=k;if(k==='crop')startCrop();else crop=null}
 cursor=null;renderTools();renderPanel();req()});
const psl=(label,k,min,max,step,v,suf='')=>`<label class="row"><span>${label}</span><input type="range" data-pk="${k}" min="${min}" max="${max}" step="${step}" value="${v}"><b data-po="${k}">${Math.round(v*100)/100}${suf}</b></label>`;
function objPanel(o,isSt){
 if(isSt)return`<div class="grp"><div class="gt">Sticker đang chọn</div>${psl('Kích thước','o.size',40,900,1,o.size)}${psl('Xoay','o.rot',-180,180,1,o.rot,'°')}${psl('Độ đục','o.op',0.1,1,0.01,o.op)}<div class="chips"><button data-pa="odup">⧉ Nhân bản</button><button data-pa="odel">🗑 Xóa</button></div></div>`;
 return`<div class="grp"><div class="gt">Chữ đang chọn</div><textarea data-pk="o.text" rows="2">${esc(o.text)}</textarea>
 <div class="chips" style="margin:8px 0">${Object.keys(PTSTYLES).map(s=>`<button data-ps="${s}">${s}</button>`).join('')}</div>
 <select data-pk="o.font">${FONTS.map(f=>`<option ${o.font===f?'selected':''}>${f}</option>`).join('')}</select>
 ${psl('Cỡ chữ','o.size',20,400,1,o.size)}${psl('Xoay','o.rot',-180,180,1,o.rot,'°')}${psl('Độ đục','o.op',0.1,1,0.01,o.op)}
 <label class="line"><input type="color" data-pk="o.color" value="${o.color}"><span>Màu chữ</span><input type="checkbox" data-pk="o.bold" ${o.bold?'checked':''}> Đậm</label>
 <label class="line"><input type="color" data-pk="o.stroke" value="${o.stroke}"><span>Viền chữ</span><input type="checkbox" data-pk="o.strokeOn" ${o.strokeOn?'checked':''}> Bật</label>
 <label class="line"><input type="color" data-pk="o.bg" value="${o.bg}"><span>Nền chữ</span><input type="checkbox" data-pk="o.bgOn" ${o.bgOn?'checked':''}> Bật</label>
 <div class="chips"><button data-pa="odup">⧉ Nhân bản</button><button data-pa="odel">🗑 Xóa</button></div></div>`;
}
function renderPanel(){
 let h='';
 if(col){
  const c=col.sel>=0?col.cells[col.sel]:null;
  h=`<h3>▤ Ghép ảnh</h3><div class="sub">Chạm vào từng ô để chọn ảnh. Kéo trong ô để căn chỉnh.</div>
  <div class="grp"><div class="gt">Bố cục</div><div class="chips">${Object.keys(LAYOUTS).map(k=>`<button data-cl="${k}" class="${col.layout===k?'on':''}">${k}</button>`).join('')}</div></div>
  <div class="grp"><div class="gt">Tỉ lệ</div><div class="chips">${['1:1','4:5','3:4','9:16','16:9'].map(k=>`<button data-ca="${k}" class="${col.aspect===k?'on':''}">${k}</button>`).join('')}</div></div>
  <div class="grp">${psl('Khoảng cách','c.gap',0,20,1,col.gap)}${psl('Bo góc','c.rad',0,100,1,col.rad)}<label class="line"><input type="color" data-pk="c.bg" value="${col.bg}"><span>Màu nền</span></label></div>
  ${c&&c.img?`<div class="grp"><div class="gt">Ô đang chọn</div>${psl('Phóng to','cell.z',1,4,0.01,c.z)}<div class="chips"><button data-pa="cellnew">🔁 Đổi ảnh</button><button data-pa="celldel">🗑 Bỏ ảnh</button></div></div>`:''}
  <div class="grp"><button class="pri full" data-pa="colfin">✓ Hoàn tất ghép → chỉnh tiếp</button><button class="full" data-pa="colsave">💾 Lưu ảnh ghép</button><button class="full" data-pa="colx">Hủy ghép</button></div>`;
 }else if(!base){h=`<h3>Chỉnh ảnh</h3><div class="sub">Mở một ảnh để bắt đầu, hoặc chọn “Ghép ảnh”.</div>`}
 else if(tool==='adjust'){h=`<h3>🎚 Điều chỉnh</h3><div class="grp">${ADJ.map(([k,n,a,b])=>psl(n,'a.'+k,a,b,1,st.adj[k])).join('')}</div><button class="full" data-pa="resetadj">Đặt lại điều chỉnh</button>`}
 else if(tool==='filter'){const th=filterThumbs();h=`<h3>🎨 Bộ lọc</h3><div class="fgrid">${Object.keys(FILTERS).map(f=>`<button data-pf="${f}" class="${st.filter===f?'on':''}"><img src="${th[f]}" alt=""><span>${f}</span></button>`).join('')}</div>${st.filter!=='Gốc'?`<div class="grp">${psl('Cường độ','fint',0,100,1,st.fint,'%')}</div>`:''}`}
 else if(tool==='color')h=colorPanel();
 else if(tool==='crop'){h=`<h3>✂ Cắt & xoay</h3><div class="sub">Kéo 4 góc để cắt, kéo ở giữa để di chuyển khung.</div>
  <div class="grp"><div class="gt">Tỉ lệ</div><div class="chips">${[['Tự do',0],['1:1',1],['4:5',.8],['3:4',.75],['9:16',9/16],['16:9',16/9],['4:3',4/3]].map(([n,v])=>`<button data-car="${v}" class="${Math.abs(crop.ar-v)<1e-3?'on':''}">${n}</button>`).join('')}</div></div>
  <div class="grp">${psl('Làm thẳng','crop.ang',-45,45,0.5,crop.ang,'°')}<div class="chips"><button data-pa="rl">⟲ Xoay trái</button><button data-pa="rr">⟳ Xoay phải</button><button data-pa="fh">⇋ Lật ngang</button><button data-pa="fv">⇵ Lật dọc</button></div></div>
  <div class="grp"><button class="pri full" data-pa="cropok">✓ Áp dụng</button><button class="full" data-pa="cropx">Hủy</button></div>`}
 else if(tool==='beauty'){const b=BEAUTY[brush.mode];h=`<h3>💄 Làm đẹp</h3><div class="sub">Tự tô / chạm bằng tay để điều chỉnh.</div>
  <div class="bgrid">${Object.entries(BEAUTY).map(([k,[i,n]])=>`<button data-bm="${k}" class="${brush.mode===k?'on':''}"><i>${i}</i>${n}</button>`).join('')}</div>
  <div class="hint" style="margin:8px 0">👉 ${b[2]}</div>
  <div class="grp">${psl('Cỡ cọ','b.size',5,150,1,brush.size)}${psl('Cường độ','b.str',5,100,1,brush.str,'%')}
  ${TINTS[brush.mode]?`<div class="chips">${TINTS[brush.mode].map(c=>`<button data-bc="${c}" class="sw${brush.color===c?' on':''}" style="background:${c}"></button>`).join('')}<input type="color" data-pk="b.color" value="${brush.color}"></div>`:''}</div>
  <div class="hint">Mẹo: phóng to ảnh bằng cách xoay ngang điện thoại / mở rộng cửa sổ để tô chính xác hơn. Bấm Hoàn tác nếu lỡ tay.</div>`}
 else if(tool==='text'){const o=selObj();h=`<h3>T Chữ</h3><button class="pri full" data-pa="addtext">＋ Thêm chữ</button><div class="sub" style="margin-top:8px">Kéo chữ trên ảnh để đổi vị trí. Chạm vào chữ để sửa.</div>${o&&!isEmoji(o)?objPanel(o):''}`}
 else if(tool==='sticker'){const o=selObj();h=`<h3>😀 Sticker</h3><div class="sub">Chạm để thêm. Kéo trên ảnh để di chuyển.</div>${o&&isEmoji(o)?objPanel(o,true):''}${Object.entries(STICKERS).map(([k,v])=>`<div class="gt" style="margin-top:10px">${k}</div><div class="stk">${v.split(' ').map(e=>`<button data-st="${e}">${e}</button>`).join('')}</div>`).join('')}`}
 else if(tool==='draw'){h=`<h3>🖌 Vẽ</h3><div class="sub">Vẽ trực tiếp lên ảnh.</div>
  <div class="grp"><div class="gt">Kiểu bút</div><div class="chips">${[['pen','Bút thường'],['neon','Bút neon'],['marker','Bút dạ']].map(([k,n])=>`<button data-ds="${k}" class="${drawB.style===k?'on':''}">${n}</button>`).join('')}</div></div>
  <div class="grp"><div class="gt">Màu</div><div class="chips">${PALETTE.map(c=>`<button data-dc="${c}" class="sw${drawB.color===c?' on':''}" style="background:${c}"></button>`).join('')}<input type="color" data-pk="d.color" value="${drawB.color}"></div></div>
  <div class="grp">${psl('Cỡ bút','d.size',1,80,1,drawB.size)}${psl('Độ đục','d.op',0.1,1,0.01,drawB.op)}</div>`}
 else if(tool==='blur'){h=`<h3>▦ Làm mờ / che</h3><div class="sub">Tô lên vùng muốn che (biển số, mặt người, thông tin riêng…).</div>
  <div class="grp"><div class="chips">${[['blur','Làm mờ'],['mosaic','Khảm ô vuông']].map(([k,n])=>`<button data-bl="${k}" class="${blurB.mode===k?'on':''}">${n}</button>`).join('')}</div></div>
  <div class="grp">${psl('Cỡ cọ','l.size',5,200,1,blurB.size)}${psl('Mức độ','l.amt',10,100,1,blurB.amt,'%')}</div>`}
 else if(tool==='effect'){h=`<h3>✨ Hiệu ứng</h3><div class="grp">${EFX.map(([k,n,a,b])=>psl(n,'a.'+k,a,b,1,st.adj[k])).join('')}${st.adj.tilt>0?psl('Vị trí vùng nét','a.tiltY',0,100,1,st.adj.tiltY,'%'):''}</div><button class="full" data-pa="resetfx">Đặt lại hiệu ứng</button>`}
 else if(tool==='frame'){const f=st.frame;h=`<h3>🖼 Khung</h3><div class="grp"><div class="chips">${[['none','Không'],['border','Viền'],['polaroid','Polaroid'],['round','Bo góc'],['blur','Nền mờ'],['color','Nền màu']].map(([k,n])=>`<button data-fr="${k}" class="${f.type===k?'on':''}">${n}</button>`).join('')}</div></div>
  ${f.type!=='none'?`<div class="grp">${psl(f.type==='round'?'Độ bo':'Độ dày','f.size',0,20,0.5,f.size)}${/^(border|polaroid|color)$/.test(f.type)?`<div class="chips">${['#ffffff','#000000','#f5e6d3','#ffd6e0','#d6eaff','#e8ffd6'].map(c=>`<button data-fc="${c}" class="sw${f.color===c?' on':''}" style="background:${c}"></button>`).join('')}<input type="color" data-pk="f.color" value="${f.color}"></div>`:''}
  ${/^(blur|color)$/.test(f.type)?`<div class="gt" style="margin-top:10px">Tỉ lệ khung</div><div class="chips">${['1:1','4:5','9:16','16:9'].map(k=>`<button data-fa="${k}" class="${f.aspect===k?'on':''}">${k}</button>`).join('')}</div>`:''}</div>`:''}`}
 opts.innerHTML=h;
 if(tool==='color'&&ctab==='curve'&&!col&&base)initCurve();
}
let ctab='curve',cch='rgb',hslSel='red';
function colorPanel(){
 const c=st.col,tabs=[['curve','Đường cong'],['hsl','HSL'],['splash','Tách màu'],['repl','Đổi màu'],['tone','Tông màu']];
 let h=`<h3>🌈 Màu sắc</h3><div class="chips ctabs">${tabs.map(([k,n])=>`<button data-ct="${k}" class="${ctab===k?'on':''}">${n}</button>`).join('')}</div><div class="grp">`;
 if(ctab==='curve'){h+=`<div class="chips">${[['rgb','RGB','#e8eaf0'],['r','Đỏ','#ff5c5c'],['g','Lục','#4cd964'],['b','Lam','#4c9bff']].map(([k,n,cl])=>`<button data-cc="${k}" class="${cch===k?'on':''}" style="${cch===k?'':`color:${cl}`}">${n}</button>`).join('')}</div>
  <canvas id="curveCv" width="512" height="512"></canvas><div class="hint">Kéo các điểm để chỉnh. Chạm vào đường để thêm điểm, chạm đúp vào điểm để xóa.</div>
  <div class="gt" style="margin-top:10px">Mẫu có sẵn</div><div class="chips">${Object.keys(CPRE).map(k=>`<button data-cpre="${k}">${k}</button>`).join('')}</div>
  <div class="chips" style="margin-top:8px"><button data-pa="curvech">Đặt lại kênh này</button><button data-pa="curveall">Đặt lại tất cả</button></div>`}
 else if(ctab==='hsl'){const v=c.hsl[hslSel];h+=`<div class="hslrow">${HSLR.map(([k,n,_,cl])=>`<button data-hr="${k}" title="${n}" class="${hslSel===k?'on':''}" style="background:${cl}">${c.hsl[k].some(x=>x)?'•':''}</button>`).join('')}</div>
  <div class="sub" style="margin:6px 0 0">Màu đang chỉnh: <b>${HSLR.find(r=>r[0]===hslSel)[1]}</b></div>
  ${psl('Sắc màu','hs.'+hslSel+'.0',-100,100,1,v[0])}${psl('Độ bão hòa','hs.'+hslSel+'.1',-100,100,1,v[1])}${psl('Độ sáng','hs.'+hslSel+'.2',-100,100,1,v[2])}
  <div class="gt" style="margin-top:10px">Toàn bộ ảnh</div>${psl('Xoay màu','gh',-180,180,1,c.gh,'°')}
  <div class="chips" style="margin-top:8px"><button data-pa="hslone">Đặt lại màu này</button><button data-pa="hslall">Đặt lại tất cả</button></div>`}
 else if(ctab==='splash'){const s=c.splash;h+=`<div class="hint">Giữ lại một màu, phần còn lại thành đen trắng. <b>Chạm vào ảnh</b> để chọn màu cần giữ.</div>
  <label class="line" style="margin-top:10px"><input type="checkbox" data-pk="sp.on" ${s.on?'checked':''}><span>Bật tách màu</span></label>
  <div class="huebar"><i style="left:${s.hue/360*100}%"></i></div>${psl('Màu giữ lại','sp.hue',0,359,1,s.hue,'°')}${psl('Độ rộng','sp.tol',5,90,1,s.tol)}
  <label class="line"><input type="checkbox" data-pk="sp.inv" ${s.inv?'checked':''}><span>Đảo ngược (chỉ màu đó thành đen trắng)</span></label>`}
 else if(ctab==='repl'){const s=c.repl;h+=`<div class="hint">Đổi một màu thành màu khác (ví dụ áo đỏ → áo xanh). <b>Chạm vào ảnh</b> để chọn màu cần đổi.</div>
  <label class="line" style="margin-top:10px"><input type="checkbox" data-pk="rp.on" ${s.on?'checked':''}><span>Bật đổi màu</span></label>
  <div class="gt">Màu gốc</div><div class="huebar"><i style="left:${s.from/360*100}%"></i></div>${psl('Màu gốc','rp.from',0,359,1,s.from,'°')}
  <div class="gt">Đổi thành</div><div class="huebar"><i style="left:${s.to/360*100}%"></i></div>${psl('Màu mới','rp.to',0,359,1,s.to,'°')}
  ${psl('Độ rộng','rp.tol',5,90,1,s.tol)}${psl('Độ đậm','rp.sat',-100,100,1,s.sat)}`}
 else{const s=c.split;h+=`<div class="hint">Phủ một màu lên vùng sáng và một màu lên vùng tối, tạo tông ảnh kiểu phim.</div>
  <div class="gt" style="margin-top:10px">Vùng sáng</div><div class="huebar"><i style="left:${s.hh/360*100}%"></i></div>${psl('Màu','tn.hh',0,359,1,s.hh,'°')}${psl('Mức độ','tn.hs',0,100,1,s.hs)}
  <div class="gt">Vùng tối</div><div class="huebar"><i style="left:${s.sh/360*100}%"></i></div>${psl('Màu','tn.sh',0,359,1,s.sh,'°')}${psl('Mức độ','tn.ss',0,100,1,s.ss)}
  ${psl('Cân bằng','tn.bal',-100,100,1,s.bal)}
  <div class="gt">Tông gợi ý</div><div class="chips">${[['Cam – xanh ngọc',35,60,190,45],['Hồng – tím',330,45,260,40],['Vàng – lam',50,40,220,50],['Ấm áp',30,45,20,25]].map(([n,a,b,c2,d])=>`<button data-tone="${a},${b},${c2},${d}">${n}</button>`).join('')}</div>`}
 return h+'</div>';
}
let histC=null,histV=-1;
function histogram(){if(histV===ver&&histC)return histC;histV=ver;const s=200/Math.max(base.width,base.height),w=Math.max(1,Math.round(base.width*s)),h=Math.max(1,Math.round(base.height*s)),d=scaledData(base,w,h),H=new Float32Array(256);for(let i=0;i<d.length;i+=4)H[(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])|0]++;const mx=Math.max(...H);histC=H.map(v=>Math.sqrt(v/mx));return histC}
function drawCurve(){
 const c=$('#curveCv');if(!c)return;const G=c.getContext('2d'),S=512,P=16,sz=S-2*P,X=v=>P+v/255*sz,Y=v=>P+(255-v)/255*sz;
 G.clearRect(0,0,S,S);G.fillStyle='#0f1115';G.fillRect(P,P,sz,sz);
 const H=histogram();G.fillStyle='rgba(255,255,255,.1)';for(let i=0;i<256;i++){const hh=H[i]*sz;G.fillRect(X(i),P+sz-hh,sz/256+1,hh)}
 G.strokeStyle='#2a2f3a';G.lineWidth=1;for(let i=1;i<4;i++){G.beginPath();G.moveTo(X(i*64),P);G.lineTo(X(i*64),P+sz);G.moveTo(P,Y(i*64));G.lineTo(P+sz,Y(i*64));G.stroke()}
 G.strokeStyle='#3a4150';G.beginPath();G.moveTo(X(0),Y(0));G.lineTo(X(255),Y(255));G.stroke();
 const col={rgb:'#e8eaf0',r:'#ff5c5c',g:'#4cd964',b:'#4c9bff'};
 for(const k of['rgb','r','g','b']){const pts=st.col.curves[k];if(k!==cch&&isIdC(pts))continue;const L=curveLUT(pts);G.strokeStyle=col[k];G.globalAlpha=k===cch?1:.35;G.lineWidth=k===cch?3:2;G.beginPath();for(let x=0;x<256;x++){x?G.lineTo(X(x),Y(L[x])):G.moveTo(X(x),Y(L[x]))}G.stroke()}
 G.globalAlpha=1;for(const[x,y]of st.col.curves[cch]){G.fillStyle='#0f1115';G.strokeStyle=col[cch];G.lineWidth=3;G.beginPath();G.arc(X(x),Y(y),9,0,Math.PI*2);G.fill();G.stroke()}
}
function initCurve(){
 const c=$('#curveCv');drawCurve();let drag=-1,lastTap=0;
 const pos=e=>{const r=c.getBoundingClientRect(),S=512,P=16,sz=S-2*P;return[clamp(((e.clientX-r.left)*S/r.width-P)/sz*255,0,255),clamp(255-((e.clientY-r.top)*S/r.height-P)/sz*255,0,255)]};
 c.addEventListener('pointerdown',e=>{e.preventDefault();const[x,y]=pos(e),pts=st.col.curves[cch];pushU();
  let i=pts.findIndex(p=>Math.hypot(p[0]-x,p[1]-y)<14);
  const now=Date.now();if(i>0&&i<pts.length-1&&now-lastTap<350&&drag===-2){pts.splice(i,1);lastTap=0;drag=-1;dirty=true;markFast();drawCurve();req();return}lastTap=now;
  if(i<0){if(pts.some(p=>Math.abs(p[0]-x)<6))return;pts.push([Math.round(x),Math.round(y)]);pts.sort((a,b)=>a[0]-b[0]);i=pts.findIndex(p=>p[0]===Math.round(x))}
  drag=i;c.setPointerCapture(e.pointerId);dirty=true;markFast();drawCurve();req()});
 c.addEventListener('pointermove',e=>{if(drag<0)return;const[x,y]=pos(e),pts=st.col.curves[cch],n=pts.length;
  if(drag===0)pts[0]=[0,Math.round(y)];else if(drag===n-1)pts[n-1]=[255,Math.round(y)];else pts[drag]=[Math.round(clamp(x,pts[drag-1][0]+3,pts[drag+1][0]-3)),Math.round(y)];
  dirty=true;markFast();drawCurve();req()});
 const up=()=>{if(drag>=0){drag=-2;setTimeout(()=>{if(drag===-2)drag=-1},360)}};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
}
const isEmoji=o=>/^\p{Extended_Pictographic}/u.test(o.text)&&!o.strokeOn&&!o.bgOn;
function setK(k,v){
 const[a,b]=k.split('.');
 const parts=k.split('.');
 if(a==='a'){pushU('a'+b);st.adj[b]=v;dirty=true;markFast()}
 else if(a==='fint'){pushU('fint');st.fint=v;dirty=true;markFast()}
 else if(a==='hs'){pushU(k);st.col.hsl[b][+parts[2]]=v;dirty=true;markFast()}
 else if(a==='gh'){pushU(k);st.col.gh=v;dirty=true;markFast()}
 else if(a==='sp'||a==='rp'||a==='tn'){const o={sp:'splash',rp:'repl',tn:'split'}[a];pushU(k);st.col[o][b]=v;dirty=true;markFast()}
 else if(a==='o'){const o=selObj();if(!o)return;pushU('o'+o.id+b);o[b]=v}
 else if(a==='f'){pushU('f'+b);st.frame[b]=v}
 else if(a==='b')brush[b]=v;else if(a==='d')drawB[b]=v;else if(a==='l')blurB[b]=v;
 else if(a==='crop')crop[b]=v;
 else if(a==='c')col[b]=v;else if(a==='cell'){const c=col.cells[col.sel];if(c)c[b]=v}
 req();updU();
}
function onP(e){const el=e.target,k=el.dataset.pk;if(!k)return;if(el.type==='checkbox'&&e.type==='input')return;const v=el.type==='checkbox'?el.checked:(el.type==='range'?parseFloat(el.value):el.value);setK(k,v);const o=opts.querySelector(`[data-po="${k}"]`);if(o)o.textContent=Math.round(v*100)/100+(o.textContent.match(/[%°]$/)||[''])[0];if(/^(sp\.hue|rp\.from|rp\.to|tn\.hh|tn\.sh)$/.test(k)){const hb=el.closest('label')&&el.closest('label').previousElementSibling;if(hb&&hb.classList.contains('huebar'))hb.firstElementChild.style.left=v/360*100+'%'}if(k==='o.font')document.fonts&&document.fonts.load(`700 40px "${v}"`).then(req).catch(()=>{})}
opts.addEventListener('input',onP);opts.addEventListener('change',onP);
opts.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.pf){pushU();st.filter=d.pf;dirty=true;renderPanel()}
 else if(d.ct){ctab=d.ct;renderPanel()}
 else if(d.cc){cch=d.cc;renderPanel()}
 else if(d.hr){hslSel=d.hr;renderPanel()}
 else if(d.cpre){pushU();const p=CPRE[d.cpre];for(const k of['rgb','r','g','b'])st.col.curves[k]=JSON.parse(JSON.stringify(p[k]||IDC()));dirty=true;renderPanel()}
 else if(d.tone){pushU();const[a,b2,c2,e2]=d.tone.split(',').map(Number);Object.assign(st.col.split,{hh:a,hs:b2,sh:c2,ss:e2});dirty=true;renderPanel()}
 else if(d.bm){brush.mode=d.bm;if(TINTS[d.bm])brush.color=TINTS[d.bm][0];renderPanel()}
 else if(d.bc){brush.color=d.bc;renderPanel()}
 else if(d.ds){drawB.style=d.ds;renderPanel()}else if(d.dc){drawB.color=d.dc;renderPanel()}
 else if(d.bl){blurB.mode=d.bl;renderPanel()}
 else if(d.fr){pushU();st.frame.type=d.fr;if(d.fr==='round'&&st.frame.size<3)st.frame.size=6;renderPanel()}
 else if(d.fc){pushU();st.frame.color=d.fc;renderPanel()}else if(d.fa){pushU();st.frame.aspect=d.fa;renderPanel()}
 else if(d.car!==undefined){setCropAR(parseFloat(d.car));renderPanel()}
 else if(d.st){addObj({text:d.st,size:220,strokeOn:false,bold:false,x:.5+(Math.random()-.5)*.3,y:.5+(Math.random()-.5)*.3})}
 else if(d.ps){const o=selObj();if(o){pushU();Object.assign(o,PTSTYLES[d.ps]);document.fonts&&document.fonts.load(`700 40px "${o.font}"`).then(req).catch(()=>{});renderPanel()}}
 else if(d.cl){col.layout=d.cl;col.sel=-1;renderPanel()}else if(d.ca){col.aspect=d.ca;renderPanel()}
 else if(d.pa){const a=d.pa;
  if(a==='resetadj'){pushU();ADJ.forEach(([k])=>st.adj[k]=0);dirty=true;renderPanel()}
  else if(a==='curvech'){pushU();st.col.curves[cch]=IDC();dirty=true;renderPanel()}
  else if(a==='curveall'){pushU();st.col.curves={rgb:IDC(),r:IDC(),g:IDC(),b:IDC()};dirty=true;renderPanel()}
  else if(a==='hslone'){pushU();st.col.hsl[hslSel]=[0,0,0];dirty=true;renderPanel()}
  else if(a==='hslall'){pushU();HSLR.forEach(r=>st.col.hsl[r[0]]=[0,0,0]);st.col.gh=0;dirty=true;renderPanel()}
  else if(a==='resetfx'){pushU();EFX.forEach(([k])=>st.adj[k]=0);dirty=true;renderPanel()}
  else if(a==='rl'||a==='rr'){rot90(a==='rl'?-1:1);renderPanel()}
  else if(a==='fh'||a==='fv')flip(a==='fh');
  else if(a==='cropok')applyCrop();
  else if(a==='cropx'){tool='adjust';crop=null;renderTools();renderPanel()}
  else if(a==='addtext'){addObj({text:'Nhập chữ',y:.8});setTimeout(()=>{const t=opts.querySelector('textarea');if(t){t.focus();t.select()}},30)}
  else if(a==='odel')delSel();
  else if(a==='odup'){const o=selObj();if(o){const c={...o,id:undefined,x:o.x+.05,y:o.y+.05};delete c.id;addObj(c)}}
  else if(a==='colfin')finishCollage();
  else if(a==='colsave'){const c=newC(1,1);renderCollage(c.getContext('2d'),true);saveModal(c,'anh-ghep')}
  else if(a==='colx'){col=null;renderTools();renderPanel()}
  else if(a==='cellnew'){cellPick=col.sel;$('#fCell').click()}
  else if(a==='celldel'){col.cells[col.sel]={img:null,ox:.5,oy:.5,z:1};renderPanel()}
 }
 req();updU();
});
$('#fCell').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f||!col||cellPick<0)return;try{const im=new Image();im.src=URL.createObjectURL(f);await im.decode();col.cells[cellPick]={img:im,ox:.5,oy:.5,z:1};col.sel=cellPick;renderPanel();req()}catch(err){toast('Không mở được ảnh')}};
$('#fPhoto').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)openFile(f)};
$('#pOpen').onclick=$('#pOpen2').onclick=()=>$('#fPhoto').click();
$('#pColStart').onclick=()=>{col={layout:'2 dọc',aspect:'1:1',gap:3,rad:0,bg:'#ffffff',cells:[],sel:-1};renderTools();renderPanel();req()};
const cmp=$('#pCompare');
cmp.addEventListener('pointerdown',()=>{if(base&&!col){comparing=true;req()}});
['pointerup','pointerleave','pointercancel'].forEach(ev=>cmp.addEventListener(ev,()=>{if(comparing){comparing=false;req()}}));

/* ---------- output ---------- */
function outputCanvas(){clearTimeout(fastT);fastMode=false;process(false);dirty=false;const c=newC(1,1);drawOut(c.getContext('2d'),layout(),false);return c}
function save(){
 if(col){const c=newC(1,1);renderCollage(c.getContext('2d'),true);saveModal(c,'anh-ghep');return}
 if(!base){toast('Hãy mở một ảnh trước');return}
 if(tool==='crop'){toast('Bấm “Áp dụng” hoặc “Hủy” phần cắt ảnh trước');return}
 saveModal(outputCanvas(),safeName(name)+'-da-chinh');
}
function saveModal(c,nm,fm){
 fm=fm||'jpg';
 c.toBlob(bl=>{
  const fname=nm+'.'+fm;
  modal(`<h2>💾 Lưu ảnh</h2><div class="hint">${c.width}×${c.height} px · ${(bl.size/1048576).toFixed(1)} MB</div><div class="opt"><button data-fmt="jpg" class="${fm==='jpg'?'on':''}">JPG<br><small>nhẹ, dùng đăng mạng</small></button><button data-fmt="png" class="${fm==='png'?'on':''}">PNG<br><small>nét nhất, nặng hơn</small></button></div><div class="btns"><button id="mClose">Hủy</button>${saveBtns()}</div>`);
  $('#mbox').querySelectorAll('[data-fmt]').forEach(b=>b.onclick=()=>{if(b.dataset.fmt!==fm)saveModal(c,nm,b.dataset.fmt)});
  $('#mClose').onclick=closeModal;bindSave(fname,bl);
 },fm==='png'?'image/png':'image/jpeg',0.93);
}
$('#pToVideo').onclick=()=>{if(!base||col){toast('Hãy mở hoặc ghép xong một ảnh trước');return}const c=outputCanvas();c.toBlob(async bl=>{const m=await addImageMedia(bl,safeName(name)+' (đã chỉnh).jpg');renderLib();setMode('video');toast('Ảnh đã vào Thư viện video. Bấm “＋ Thêm” để chèn.')},'image/jpeg',0.93)};
function show(){renderTools();renderPanel();req();updU()}
return{show,openFile,openImageEl,undo,redo,save,delSel:()=>{if(selId)delSel()}};
})();
