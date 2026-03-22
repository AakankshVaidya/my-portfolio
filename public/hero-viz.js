// Hero Visualization Controller
(function() {
  'use strict';
  const DPR = window.devicePixelRatio || 1;
  let cardDragging = false;

  function setupCanvas(id) {
    const cv = document.getElementById(id);
    if (!cv) return null;
    const cx = cv.getContext('2d', { alpha: true });
    let w = 0, h = 0, lastW = 0, lastH = 0;
    function resize() {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      w = r.width; h = r.height;
      if (w !== lastW || h !== lastH) { cv.width = w * DPR; cv.height = h * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); lastW = w; lastH = h; }
      return true;
    }
    return { cv, cx, resize, w: () => w, h: () => h };
  }

  // ==================== NETWORK ====================
  (function() {
    const s = setupCanvas('networkCanvas'); if (!s) return;
    const { cv, cx } = s; let w=0,h=0,init=false;
    const N=12,nd=[],ed=[],es=new Set();
    for(let i=0;i<N;i++){const ne=1+Math.floor(Math.random()*3);for(let c=0;c<ne;c++){const j=Math.floor(Math.random()*N);if(j!==i){const k=Math.min(i,j)+'-'+Math.max(i,j);if(!es.has(k)){es.add(k);ed.push([i,j]);}}}}
    const cc=new Array(N).fill(0);ed.forEach(([a,b])=>{cc[a]++;cc[b]++;});const mc=Math.max(...cc,1);
    for(let i=0;i<N;i++){const cr=cc[i]/mc;nd.push({x:0,y:0,vx:0,vy:0,r:2.5+cr*5,opacity:0.3+cr*0.5});}
    let dn=null,nh=null;
    cv.addEventListener('mousedown',(e)=>{if(cardDragging)return;const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;let cl=null,cd=Infinity;for(const n of nd){const d=Math.hypot(n.x-mx,n.y-my);if(d<n.r+10&&d<cd){cl=n;cd=d;}}if(cl){e.stopPropagation();e.preventDefault();dn=cl;dn.vx=0;dn.vy=0;cv.style.cursor='grabbing';}});
    cv.addEventListener('mousemove',(e)=>{if(cardDragging)return;const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;if(dn){dn.x=mx;dn.y=my;dn.vx=0;dn.vy=0;}else{let f=false;for(const n of nd){if(Math.hypot(n.x-mx,n.y-my)<n.r+8){nh=n;cv.style.cursor='grab';f=true;break;}}if(!f){nh=null;cv.style.cursor='default';}}});
    cv.addEventListener('mouseup',()=>{if(dn){dn=null;cv.style.cursor=nh?'grab':'default';}});
    cv.addEventListener('mouseleave',()=>{dn=null;nh=null;cv.style.cursor='default';});
    function tick(){
      if(!s.resize()){requestAnimationFrame(tick);return;}w=s.w();h=s.h();
      if(!init){nd.forEach(n=>{n.x=8+Math.random()*(w-16);n.y=8+Math.random()*(h-16);});init=true;}
      cx.clearRect(0,0,w,h);
      for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const dx=nd[j].x-nd[i].x,dy=nd[j].y-nd[i].y,dist=Math.max(Math.hypot(dx,dy),1);const f=90/(dist*dist),fx=(dx/dist)*f,fy=(dy/dist)*f;if(nd[i]!==dn){nd[i].vx-=fx;nd[i].vy-=fy;}if(nd[j]!==dn){nd[j].vx+=fx;nd[j].vy+=fy;}}
      for(const[i,j]of ed){const dx=nd[j].x-nd[i].x,dy=nd[j].y-nd[i].y,dist=Math.max(Math.hypot(dx,dy),1);const f=(dist-65)*0.003,fx=(dx/dist)*f,fy=(dy/dist)*f;if(nd[i]!==dn){nd[i].vx+=fx;nd[i].vy+=fy;}if(nd[j]!==dn){nd[j].vx-=fx;nd[j].vy-=fy;}}
      for(const n of nd){if(n===dn)continue;n.vx+=(w/2-n.x)*0.0003;n.vy+=(h/2-n.y)*0.0006;n.vx*=0.9;n.vy*=0.9;n.x+=n.vx;n.y+=n.vy;n.x=Math.max(n.r+8,Math.min(w-n.r-8,n.x));n.y=Math.max(n.r+8,Math.min(h-n.r-8,n.y));}
      cx.lineWidth=1;cx.strokeStyle='rgba(200,168,124,.07)';cx.beginPath();const hl=[];
      for(const[i,j]of ed){const a=nd[i],b=nd[j];if(a===dn||b===dn||a===nh||b===nh){hl.push([i,j]);continue;}cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);}cx.stroke();
      for(const[i,j]of hl){const a=nd[i],b=nd[j],id=(a===dn||b===dn);cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.strokeStyle=id?'rgba(200,168,124,.35)':'rgba(200,168,124,.25)';cx.lineWidth=id?2.8:2;cx.stroke();}
      for(const n of nd){const id=(n===dn),ih=(n===nh),ic=(dn||nh)&&ed.some(([i,j])=>{const t=dn||nh;return(nd[i]===t&&nd[j]===n)||(nd[j]===t&&nd[i]===n);});let dr=n.r,dop=n.opacity;if(id){dr=n.r*1.4;dop=1;}else if(ih){dr=n.r*1.25;dop=0.95;}else if(ic){dr=n.r*1.1;dop=Math.min(n.opacity+0.25,0.9);}if(id||ih){cx.beginPath();cx.arc(n.x,n.y,dr+5,0,Math.PI*2);cx.fillStyle=`rgba(200,168,124,${id?0.1:0.06})`;cx.fill();}cx.beginPath();cx.arc(n.x,n.y,dr,0,Math.PI*2);cx.fillStyle=`rgba(200,168,124,${dop})`;cx.fill();}
      requestAnimationFrame(tick);}tick();
  })();

  // ==================== PREDICTION ====================
  (function(){
    const s=setupCanvas('predictionCanvas');if(!s)return;const{cv,cx}=s;let w=0,h=0,rmx=-1,smx=-1,hov=false;
    const NP=30,ad=[],po=[];for(let i=0;i<NP;i++){const t=i/(NP-1);ad.push(Math.max(8,Math.min(92,18+t*50+Math.sin(t*Math.PI*2)*10+Math.sin(t*Math.PI*3.7)*5+Math.cos(t*Math.PI*1.3)*7)));}for(let i=0;i<NP;i++)po.push(Math.sin(i*2.1)*0.5+Math.cos(i*1.3)*0.3+Math.sin(i*3.7)*0.2);
    cv.addEventListener('mouseenter',()=>{if(!cardDragging)hov=true;});cv.addEventListener('mouseleave',()=>{hov=false;rmx=-1;});cv.addEventListener('mousemove',(e)=>{if(cardDragging)return;rmx=e.clientX-cv.getBoundingClientRect().left;});
    const PL=10,PR=10,PT=14,PB=14;function xP(i){return PL+(i/(NP-1))*(w-PL-PR);}function yP(v){return PT+(1-v/100)*(h-PT-PB);}
    function dsl(pts,a,b){if(b-a<2){for(let i=a;i<=b;i++){const x=xP(i),y=yP(pts[i]);i===a?cx.moveTo(x,y):cx.lineTo(x,y);}return;}cx.moveTo(xP(a),yP(pts[a]));for(let i=a;i<b;i++){const x0=xP(i),y0=yP(pts[i]),x1=xP(i+1),y1=yP(pts[i+1]),cp=(x0+x1)/2;cx.bezierCurveTo(cp,y0,cp,y1,x1,y1);}}
    function draw(){if(!s.resize()){requestAnimationFrame(draw);return;}w=s.w();h=s.h();if(rmx>=0&&!cardDragging){if(smx<0)smx=rmx;else smx+=(rmx-smx)*0.12;}else if(cardDragging){smx=-1;rmx=-1;hov=false;}cx.clearRect(0,0,w,h);for(let v=20;v<=80;v+=20){cx.beginPath();cx.moveTo(PL,yP(v));cx.lineTo(w-PR,yP(v));cx.strokeStyle='rgba(200,168,124,.04)';cx.lineWidth=0.5;cx.stroke();}if(!hov||smx<0){cx.beginPath();dsl(ad,0,NP-1);cx.strokeStyle='rgba(200,168,124,.08)';cx.lineWidth=1;cx.stroke();cx.fillStyle='rgba(200,168,124,.15)';cx.font='10px Outfit';cx.textAlign='center';cx.fillText('Hover to train model',w/2,h/2+4);requestAnimationFrame(draw);return;}const pr=Math.max(0,Math.min(1,(smx-PL)/(w-PL-PR))),te=Math.min(Math.round(3+pr*(NP-4)),NP),acc=Math.min(0.97,Math.max(0.4,0.4+(te-3)/(NP-4)*0.57));const rem=NP-te,preds=[],up=[],lo=[];if(rem>0){const lv=ad[te-1],tr=te>3?(ad[te-1]-ad[te-4])/3:0,es=(1-acc)*18;for(let i=0;i<rem;i++){const t=(i+1)/Math.max(rem,1),off=po[te+i]*es,nv=lv+tr*(i+1)+off,pred=nv*(1-acc)+ad[te+i]*acc,cl=Math.max(8,Math.min(92,pred));preds.push(cl);const cw=es*(0.5+t*1.5);up.push(Math.min(96,cl+cw));lo.push(Math.max(4,cl-cw));}}if(preds.length>1){cx.beginPath();cx.moveTo(xP(te-1),yP(ad[te-1]));for(let i=0;i<up.length;i++){const x=xP(te+i),y=yP(up[i]);const cp=i===0?(xP(te-1)+x)/2:(xP(te+i-1)+x)/2;cx.bezierCurveTo(cp,i===0?yP(ad[te-1]):yP(up[i-1]),cp,y,x,y);}for(let i=lo.length-1;i>=0;i--){const x=xP(te+i),y=yP(lo[i]);if(i===lo.length-1)cx.lineTo(x,y);else{const cp=(xP(te+i+1)+x)/2;cx.bezierCurveTo(cp,yP(lo[i+1]),cp,y,x,y);}}cx.closePath();cx.fillStyle=`rgba(200,168,124,${0.03+acc*0.05})`;cx.fill();}cx.beginPath();dsl(ad,0,NP-1);cx.strokeStyle='rgba(200,168,124,.05)';cx.lineWidth=0.5;cx.stroke();if(te>1){cx.beginPath();dsl(ad,0,te-1);cx.strokeStyle='rgba(200,168,124,.65)';cx.lineWidth=1.5;cx.lineJoin='round';cx.lineCap='round';cx.stroke();for(let i=0;i<te;i++){cx.beginPath();cx.arc(xP(i),yP(ad[i]),1.5,0,Math.PI*2);cx.fillStyle='rgba(200,168,124,.4)';cx.fill();}}if(preds.length>1){cx.beginPath();cx.moveTo(xP(te-1),yP(ad[te-1]));for(let i=0;i<preds.length;i++){const x=xP(te+i),y=yP(preds[i]);const cp=i===0?(xP(te-1)+x)/2:(xP(te+i-1)+x)/2;cx.bezierCurveTo(cp,i===0?yP(ad[te-1]):yP(preds[i-1]),cp,y,x,y);}cx.strokeStyle=`rgba(200,168,124,${0.2+acc*0.3})`;cx.lineWidth=1.2;cx.setLineDash([5,4]);cx.stroke();cx.setLineDash([]);}const dx=xP(te-1);cx.beginPath();cx.moveTo(dx,PT);cx.lineTo(dx,h-PB);cx.strokeStyle='rgba(200,168,124,.1)';cx.lineWidth=0.5;cx.setLineDash([2,3]);cx.stroke();cx.setLineDash([]);cx.font='600 13px Outfit';cx.textAlign='right';cx.fillStyle=`rgba(${Math.round(210-acc*10)},${Math.round(130+acc*38)},${Math.round(100+acc*24)},${0.4+acc*0.45})`;cx.fillText(Math.round(acc*100)+'%',w-PR-2,PT+10);cx.font='7px Outfit';cx.fillStyle='rgba(200,168,124,.2)';cx.fillText('ACCURACY',w-PR-2,PT+20);cx.textAlign='center';cx.fillStyle='rgba(200,168,124,.15)';if(rem>2){cx.fillText('TRAIN',(PL+dx)/2,h-3);cx.fillText('PREDICT',(dx+w-PR)/2,h-3);}else cx.fillText('FULLY TRAINED',w/2,h-3);requestAnimationFrame(draw);}draw();
  })();

  // ==================== DISTRIBUTION ====================
  (function(){
    const s=setupCanvas('distCanvas');if(!s)return;const{cv,cx}=s;let w=0,h=0;
    const P={l:12,r:12,t:36,b:12};const data=[{label:'A',mean:.82,std:.06},{label:'B',mean:.55,std:.16},{label:'C',mean:.91,std:.04},{label:'D',mean:.42,std:.20},{label:'E',mean:.73,std:.09},{label:'F',mean:.67,std:.12},{label:'G',mean:.85,std:.05},{label:'H',mean:.60,std:.14},{label:'I',mean:.78,std:.07}];
    const ep=data.map(()=>0);let hi=-1;const st=performance.now();
    cv.addEventListener('mousemove',(e)=>{if(cardDragging)return;e.stopPropagation();const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,ba=w-P.l-P.r,bw=ba/data.length;let f=-1;for(let i=0;i<data.length;i++){if(mx>=P.l+i*bw&&mx<P.l+(i+1)*bw){f=i;break;}}hi=f;});
    cv.addEventListener('mouseleave',()=>{hi=-1;});function gauss(x,m,s2){return Math.exp(-0.5*((x-m)/s2)**2)/(s2*Math.sqrt(2*Math.PI));}
    function draw(){if(!s.resize()){requestAnimationFrame(draw);return;}w=s.w();h=s.h();const now=performance.now(),el=(now-st)/1000;cx.clearRect(0,0,w,h);const ba=w-P.l-P.r,bw=ba/data.length,bi=bw-6,mh=h-P.t-P.b,bl=h-P.b;cx.beginPath();cx.moveTo(P.l,bl);cx.lineTo(w-P.r,bl);cx.strokeStyle='rgba(200,168,124,.06)';cx.lineWidth=0.5;cx.stroke();if(cardDragging)hi=-1;for(let i=0;i<data.length;i++){const d=data[i],bx=P.l+i*bw+3,mx=bx+bi/2;const dl=0.3+i*0.08,at=Math.max(0,Math.min(1,(el-dl)/0.6)),ea=at<1?1-Math.pow(1-at,3):1;ep[i]+=((hi===i?1:0)-ep[i])*0.1;const e=ep[i];const bH=d.mean*mh*ea,bt=bl-bH,bo=(0.45+d.mean*0.35)*ea,chw=bi*0.4;if(e<0.01){cx.beginPath();cx.roundRect(bx,bt,bi,bH,[3,3,0,0]);cx.fillStyle=`rgba(200,168,124,${bo})`;cx.fill();}else{cx.beginPath();cx.roundRect(bx,bt,bi,bH,[3,3,0,0]);cx.fillStyle=`rgba(200,168,124,${bo*(1-e*0.5)})`;cx.fill();const lo=Math.max(0,d.mean-3*d.std),hv=Math.min(1,d.mean+3*d.std),pk=gauss(d.mean,d.mean,d.std),steps=30;cx.beginPath();for(let ss=0;ss<=steps;ss++){const t=ss/steps,v=lo+t*(hv-lo),y=bl-v*mh,pdf=gauss(v,d.mean,d.std)/pk,ox=pdf*chw*e;ss===0?cx.moveTo(mx+ox,y):cx.lineTo(mx+ox,y);}for(let ss=steps;ss>=0;ss--){const t=ss/steps,v=lo+t*(hv-lo),y=bl-v*mh,pdf=gauss(v,d.mean,d.std)/pk;cx.lineTo(mx-pdf*chw*e,y);}cx.closePath();cx.fillStyle=`rgba(200,168,124,${0.2*e*ea})`;cx.fill();[1,-1].forEach(dir=>{cx.beginPath();for(let ss=0;ss<=steps;ss++){const t=ss/steps,v=lo+t*(hv-lo),y=bl-v*mh,pdf=gauss(v,d.mean,d.std)/pk;ss===0?cx.moveTo(mx+pdf*chw*e*dir,y):cx.lineTo(mx+pdf*chw*e*dir,y);}cx.strokeStyle=`rgba(200,168,124,${0.35*e*ea})`;cx.lineWidth=0.8;cx.stroke();});const my=bl-d.mean*mh;cx.beginPath();cx.moveTo(mx-chw*e-2,my);cx.lineTo(mx+chw*e+2,my);cx.strokeStyle=`rgba(200,168,124,${0.5*e})`;cx.lineWidth=0.7;cx.setLineDash([2,2]);cx.stroke();cx.setLineDash([]);if(e>0.05){const np=i/(data.length-1),aa=Math.PI*(0.2+np*0.6),ar=32+e*10;const tx=mx+Math.cos(Math.PI-aa)*ar,ty=bt-12-Math.sin(aa)*ar;const cx2=Math.max(45,Math.min(w-45,tx)),cty=Math.max(14,ty);cx.beginPath();cx.moveTo(mx,bt-3);cx.quadraticCurveTo((mx+cx2)/2,Math.min(bt-3,cty)-12,cx2,cty+6);cx.strokeStyle=`rgba(200,168,124,${0.2*e})`;cx.lineWidth=0.7;cx.stroke();cx.beginPath();cx.arc(mx,bt-3,1.5,0,Math.PI*2);cx.fillStyle=`rgba(200,168,124,${0.4*e})`;cx.fill();cx.font='600 9px Outfit';cx.textAlign='center';cx.fillStyle=`rgba(200,168,124,${0.7*e})`;cx.fillText('Var '+d.label,cx2,cty-2);cx.font='7px Outfit';cx.fillStyle=`rgba(200,168,124,${0.5*e})`;cx.fillText('\u03BC='+d.mean.toFixed(2)+'  \u03C3='+d.std.toFixed(2),cx2,cty+7);}}}requestAnimationFrame(draw);}draw();
  })();

  // ==================== DONUT (CENTERED) ====================
  (function(){
    const s=setupCanvas('donutCanvas');if(!s)return;const{cv,cx}=s;let w=0,h=0;
    const segs=[{label:'Design',value:32,color:[200,168,124]},{label:'Data',value:28,color:[170,155,140]},{label:'Code',value:24,color:[150,140,125]},{label:'Research',value:16,color:[130,125,115]}];
    const total=segs.reduce((a,d)=>a+d.value,0);let hi2=-1;const st2=performance.now(),hp2=segs.map(()=>0);let dPct=0,cOp=0;

    cv.addEventListener('mousemove',(e)=>{
      if(cardDragging){hi2=-1;return;}e.stopPropagation();
      const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
      const ccx=w/2,ccy=h/2,oR=Math.min(w*0.3,h*0.42),iR=oR*0.55;
      const dist=Math.hypot(mx-ccx,my-ccy);
      if(dist<iR||dist>oR+8){hi2=-1;return;}
      let angle=Math.atan2(my-ccy,mx-ccx);if(angle<-Math.PI/2)angle+=Math.PI*2;
      let cum=-Math.PI/2;hi2=-1;
      for(let i=0;i<segs.length;i++){const sw=(segs[i].value/total)*Math.PI*2;let ca=angle;if(ca<-Math.PI/2)ca+=Math.PI*2;if(ca>=cum&&ca<cum+sw){hi2=i;break;}cum+=sw;}
    });
    cv.addEventListener('mouseleave',()=>{hi2=-1;});

    function draw(){
      if(!s.resize()){requestAnimationFrame(draw);return;}w=s.w();h=s.h();
      const now=performance.now(),el=(now-st2)/1000;cx.clearRect(0,0,w,h);
      if(cardDragging)hi2=-1;

      // Centered donut
      const ccx=w/2, ccy=h/2;
      const oR=Math.min(w*0.3, h*0.42), iR=oR*0.55, rW=oR-iR;
      const aP=Math.min(1,el/1.2),eP=1-Math.pow(1-aP,3),tS=Math.PI*2*eP;

      cx.beginPath();cx.arc(ccx,ccy,(oR+iR)/2,0,Math.PI*2);cx.strokeStyle='rgba(200,168,124,.04)';cx.lineWidth=rW;cx.stroke();

      let cum=-Math.PI/2;
      for(let i=0;i<segs.length;i++){
        const seg=segs[i],sw=(seg.value/total)*tS;
        hp2[i]+=((hi2===i?1:0)-hp2[i])*0.15;const hp=hp2[i];
        const eR=hp*4,dOR=oR+eR,dIR=iR-eR*0.3,dRW=dOR-dIR,dMR=(dOR+dIR)/2;
        const bO=0.5+(i===0?0.3:i===1?0.2:i===2?0.1:0),hB=hp*0.3,dim=(hi2>=0&&hi2!==i)?hp2[hi2]*0.25:0;
        const[r,g,b]=seg.color;
        cx.beginPath();cx.arc(ccx,ccy,dMR,cum,cum+sw);
        cx.strokeStyle=`rgba(${r},${g},${b},${(bO+hB-dim)*eP})`;cx.lineWidth=dRW;cx.lineCap='butt';cx.stroke();
        if(i<segs.length-1&&eP>0.5){cx.beginPath();cx.arc(ccx,ccy,dMR,cum+sw-0.02,cum+sw+0.02);cx.strokeStyle='rgba(10,10,12,.8)';cx.lineWidth=dRW+2;cx.stroke();}
        cum+=sw;
      }

      // Center text
      const targetPct=hi2>=0?segs[hi2].value:0;
      const targetOp=hi2>=0?1:0;
      dPct+=(targetPct-dPct)*0.15;
      cOp+=(targetOp-cOp)*0.15;

      if(cOp>0.02){
        cx.font=`600 ${Math.round(oR*0.5)}px Outfit`;cx.textAlign='center';cx.textBaseline='middle';
        cx.fillStyle=`rgba(200,168,124,${0.9*cOp})`;cx.fillText(Math.round(dPct)+'%',ccx,ccy-3);
        cx.font=`500 ${Math.max(10,Math.round(oR*0.18))}px Outfit`;
        cx.fillStyle=`rgba(200,168,124,${0.55*cOp})`;
        cx.fillText((hi2>=0?segs[hi2].label:'').toUpperCase(),ccx,ccy+oR*0.3);
      } else if(eP>0.8){
        // Bolder HOVER text
        cx.font=`500 ${Math.max(10,Math.round(oR*0.18))}px Outfit`;
        cx.textAlign='center';cx.textBaseline='middle';
        cx.fillStyle='rgba(200,168,124,.25)';
        cx.fillText('HOVER',ccx,ccy);
      }

      // Legend — positioned to the right of the donut
      if(eP>0.6){
        const legendX=ccx+oR+24;
        const legendStartY=ccy-(segs.length*22)/2;
        const lO=Math.min(1,(eP-0.6)/0.3);
        for(let i=0;i<segs.length;i++){
          const[r,g,b]=segs[i].color,ly=legendStartY+i*22,hp=hp2[i];
          const isActive=hi2===i;
          cx.beginPath();cx.arc(legendX,ly,4,0,Math.PI*2);
          cx.fillStyle=`rgba(${r},${g},${b},${(0.4+hp*0.5)*lO})`;cx.fill();
          cx.font=isActive?'600 11px Outfit':'400 10px Outfit';
          cx.textAlign='left';cx.textBaseline='middle';
          cx.fillStyle=`rgba(200,168,124,${(0.3+hp*0.5)*lO})`;
          cx.fillText(segs[i].label,legendX+12,ly);
          if(hp>0.1){cx.font='500 10px Outfit';cx.fillStyle=`rgba(200,168,124,${0.6*hp*lO})`;cx.fillText(segs[i].value+'%',legendX+70,ly);}
        }
      }
      requestAnimationFrame(draw);
    }draw();
  })();

  // ==================== CARD DRAG ====================
  (function(){
    const stack=document.getElementById('heroCardStack');if(!stack)return;const SH=172;let dc=null,os=null,ox=0,oy=0;
    function gs(){return Array.from(stack.querySelectorAll('.hero-card-slot'));}
    stack.addEventListener('mousedown',(e)=>{const c=e.target.closest('.hero-viz-card');if(!c||c.classList.contains('snapping'))return;if(e.target.tagName==='CANVAS')return;e.preventDefault();cardDragging=true;dc=c;os=c.closest('.hero-card-slot');const r=c.getBoundingClientRect();ox=e.clientX-r.left;oy=e.clientY-r.top;c.style.position='fixed';c.style.left=r.left+'px';c.style.top=r.top+'px';c.style.width=r.width+'px';c.style.height=r.height+'px';c.classList.add('dragging');c.classList.remove('snapping');document.body.appendChild(c);});
    document.addEventListener('mousemove',(e)=>{if(!dc)return;dc.style.left=(e.clientX-ox)+'px';dc.style.top=(e.clientY-oy)+'px';const cy=e.clientY-oy+80,sl=gs();let ti=-1,md=Infinity;sl.forEach((s,i)=>{const r=s.getBoundingClientRect();const d=Math.abs(cy-(r.top+r.height/2));if(d<md){md=d;ti=i;}});const oi=parseInt(os.dataset.slot);sl.forEach((s,i)=>{if(s===os)return;if(ti<=oi)s.style.transform=(i>=ti&&i<oi)?`translateY(${SH}px)`:'';else s.style.transform=(i>oi&&i<=ti)?`translateY(-${SH}px)`:'';});dc._ti=ti;});
    document.addEventListener('mouseup',()=>{if(!dc)return;const ti=dc._ti!==undefined?dc._ti:parseInt(os.dataset.slot);const oi=parseInt(os.dataset.slot);const sl=gs();sl.forEach(s=>{s.style.transition='none';s.style.transform='';});if(ti!==oi){const el=sl[oi];stack.removeChild(el);const u=Array.from(stack.querySelectorAll('.hero-card-slot'));if(ti>=u.length)stack.appendChild(el);else stack.insertBefore(el,u[ti]);Array.from(stack.querySelectorAll('.hero-card-slot')).forEach((s,i)=>{s.dataset.slot=i;});}void dc.offsetHeight;sl.forEach(s=>{s.style.transition='';});const ts=gs()[ti]||os;ts.appendChild(dc);const cl=parseFloat(dc.style.left),ct=parseFloat(dc.style.top);dc.style.position='absolute';dc.style.width='100%';dc.style.height='100%';const fr=dc.getBoundingClientRect();dc.style.transition='none';dc.style.transform=`translate(${cl-fr.left}px,${ct-fr.top}px) scale(1.04) rotate(1.5deg)`;dc.classList.remove('dragging');void dc.offsetHeight;dc.classList.add('snapping');dc.style.left='0';dc.style.top='0';dc.style.transform='translate(0,0) scale(1) rotate(0deg)';const c=dc;const fn=()=>{c.classList.remove('snapping');c.style.transform='';c.style.transition='';c.removeEventListener('transitionend',fn);};c.addEventListener('transitionend',fn);dc=null;os=null;setTimeout(()=>{cardDragging=false;},100);});
  })();
})();
