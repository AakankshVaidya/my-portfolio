/* ============================================================
   BADMINTON SCROLLYTELLING data embedded from analysis runs
   ============================================================ */

/* ---- DATA (from the analysis: women's singles) ---- */

// Silhouette scores by k, women's vs men's
var SIL = {
  W: [{k:2,s:0.197},{k:3,s:0.217},{k:4,s:0.208},{k:5,s:0.209},{k:6,s:0.195}],
  M: [{k:2,s:0.235},{k:3,s:0.146},{k:4,s:0.142},{k:5,s:0.123},{k:6,s:0.140}]
};

// Pressure trajectory: mean displacement by relative rally position
var TRAJ = [
  {pos:0.0, win:115.9, lose:117.4},
  {pos:0.1, win:151.9, lose:150.2},
  {pos:0.2, win:158.0, lose:156.4},
  {pos:0.3, win:156.9, lose:157.7},
  {pos:0.4, win:164.2, lose:165.7},
  {pos:0.5, win:164.7, lose:159.4},
  {pos:0.6, win:171.0, lose:171.1},
  {pos:0.7, win:170.9, lose:164.6},
  {pos:0.8, win:173.0, lose:167.6},
  {pos:0.9, win:177.3, lose:169.6},
  {pos:1.0, win:180.6, lose:191.1}
];

// Final-shot displacement by how the rally ended
var FIN = [
  {label:"opponent hit it OUT", val:232.8, out:true},
  {label:"opponent fell short", val:226.3, out:false},
  {label:"own placement winner", val:208.1, out:false},
  {label:"opponent misjudged", val:199.0, out:false},
  {label:"opponent netted it", val:175.4, out:false}
];

// Displacement over the final shots (from_end: 5 = earlier ... 0 = last shot)
var SETUP = [
  {fromEnd:5, win:155.4, lose:159.1},
  {fromEnd:4, win:161.6, lose:154.1},
  {fromEnd:3, win:160.0, lose:153.1},
  {fromEnd:2, win:172.3, lose:160.9},
  {fromEnd:1, win:163.2, lose:146.7},
  {fromEnd:0, win:204.2, lose:213.3}
];
var WIN_BASELINE = 159.4;  // winner's own average displacement across all shots

var WIN_CLR = "#4f9d8f", LOSE_CLR = "#D98324", GREEN = "#4f9d8f", GREEN2="#6fc3b2", ORANGE = "#D98324", GOLD = "#c9a84c", T2 = "#8a8f9c", T3 = "#4a4f5c";

/* ---- scroll progress helper ---- */
function getProgress(id){
  var el=document.getElementById(id);if(!el)return 0;
  var r=el.getBoundingClientRect();
  var si=-r.top;var ms=el.offsetHeight-window.innerHeight;
  if(ms<=0)return 0;
  return Math.max(0,Math.min(1,si/ms));
}

/* ============================================================
   ACT 1 SILHOUETTE (playstyle)
   ============================================================ */
var silReady=false, silLines={};
function setupSil(){
  document.getElementById('silNote').innerHTML='Higher means players fall into cleanly separated styles. <br><br>Women\u2019s singles peaks at just <span class="num">0.22</span> (k=3), which is weak. Men\u2019s singles drops off after k=2, where the \u201cbest\u201d split only pulls out <span class="num">3 outliers</span> rather than real playing styles.';
  var box=document.getElementById('silBox'),svg=d3.select('#silSvg'),leg=document.getElementById('silLeg');
  var r=box.getBoundingClientRect(),M={t:24,r:24,b:50,l:60};
  var W=r.width-M.l-M.r,H=r.height-M.t-M.b;if(W<50||H<50)return;
  svg.selectAll('*').remove();silLines={};
  var x=d3.scaleLinear().domain([2,6]).range([0,W]);
  var y=d3.scaleLinear().domain([0.1,0.6]).range([H,0]);
  var g=svg.append('g').attr('transform','translate('+M.l+','+M.t+')');

  // shaded bands: strong / weak
  g.append('rect').attr('x',0).attr('y',y(0.6)).attr('width',W).attr('height',y(0.5)-y(0.6)).attr('fill',GREEN).attr('opacity',0.05);
  g.append('rect').attr('x',0).attr('y',y(0.5)).attr('width',W).attr('height',y(0.25)-y(0.5)).attr('fill',ORANGE).attr('opacity',0.04);
  [0.5,0.25].forEach(function(t){
    g.append('line').attr('class','gridl').attr('x1',0).attr('x2',W).attr('y1',y(t)).attr('y2',y(t));
  });
  g.append('text').attr('x',W-4).attr('y',y(0.52)).attr('text-anchor','end').attr('fill',T3).attr('font-family','var(--fm)').attr('font-size','11px').attr('font-style','italic').text('strong separation');
  g.append('text').attr('x',W-4).attr('y',y(0.27)).attr('text-anchor','end').attr('fill',T3).attr('font-family','var(--fm)').attr('font-size','11px').attr('font-style','italic').text('weak separation');

  g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')));
  g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5));
  g.append('text').attr('x',W/2).attr('y',H+40).attr('text-anchor','middle').attr('fill',T2).attr('font-family','var(--fm)').attr('font-size','12px').text('number of playstyle groups (k)');

  var ln=d3.line().x(function(d){return x(d.k)}).y(function(d){return y(d.s)}).curve(d3.curveMonotoneX);
  [['W',GREEN,"women's singles"],['M',ORANGE,"men's singles"]].forEach(function(cfg){
    var path=g.append('path').datum(SIL[cfg[0]]).attr('d',ln).attr('fill','none').attr('stroke',cfg[1]).attr('stroke-width',3).attr('stroke-linecap','round');
    var len=path.node().getTotalLength();
    path.attr('stroke-dasharray',len).attr('stroke-dashoffset',len);
    silLines[cfg[0]]={path:path,len:len,g:g,x:x,y:y,clr:cfg[1],data:SIL[cfg[0]],dots:[]};
  });

  leg.innerHTML='<div class="leg-i"><span class="leg-d" style="background:'+GREEN+'"></span>women\u2019s singles</div><div class="leg-i"><span class="leg-d" style="background:'+ORANGE+'"></span>men\u2019s singles</div>';
  silReady=true;
}
function tickSil(){
  if(!silReady){var r=document.getElementById('silBox').getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)setupSil();}
  if(!silReady)return;
  var p=getProgress('secStyle');
  ['W','M'].forEach(function(k,i){
    var o=silLines[k];var lp=Math.max(0,Math.min(1,(p-i*0.12)/0.5));
    o.path.attr('stroke-dashoffset',o.len*(1-lp));
    // dots appear as line draws
    if(lp>0 && o.dots.length===0){
      o.data.forEach(function(d){o.dots.push(o.g.append('circle').attr('cx',o.x(d.k)).attr('cy',o.y(d.s)).attr('r',0).attr('fill',o.clr))});
    }
    if(o.dots.length){
      o.data.forEach(function(d,di){var dp=Math.max(0,Math.min(1,(lp-di/o.data.length)));o.dots[di].attr('r',dp*5)});
    }
  });
  document.getElementById('styleReveal').classList.toggle('on',p>0.75);
}

/* ============================================================
   ACT 2 PRESSURE TRAJECTORY (centerpiece)
   ============================================================ */
var trajReady=false, trajO={};
function setupTraj(){
  var box=document.getElementById('trajBox'),svg=d3.select('#trajSvg'),leg=document.getElementById('trajLeg'),tip=document.getElementById('trajTip');
  var r=box.getBoundingClientRect(),M={t:24,r:30,b:50,l:60};
  var W=r.width-M.l-M.r,H=r.height-M.t-M.b;if(W<50||H<50)return;
  svg.selectAll('*').remove();trajO={};
  var x=d3.scaleLinear().domain([0,1]).range([0,W]);
  var y=d3.scaleLinear().domain([110,200]).range([H,0]);
  var g=svg.append('g').attr('transform','translate('+M.l+','+M.t+')');
  g.selectAll('.gridl').data(y.ticks(5)).join('line').attr('class','gridl').attr('x1',0).attr('x2',W).attr('y1',function(d){return y(d)}).attr('y2',function(d){return y(d)});
  g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.axisBottom(x).ticks(5).tickFormat(function(d){return d===0?'first shot':(d===1?'last shot':d)}));
  g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5));
  g.append('text').attr('transform','rotate(-90)').attr('x',-H/2).attr('y',-44).attr('text-anchor','middle').attr('fill',T2).attr('font-family','var(--fm)').attr('font-size','12px').text('displacement applied');

  var lnW=d3.line().x(function(d){return x(d.pos)}).y(function(d){return y(d.win)}).curve(d3.curveMonotoneX);
  var lnL=d3.line().x(function(d){return x(d.pos)}).y(function(d){return y(d.lose)}).curve(d3.curveMonotoneX);
  var pW=g.append('path').datum(TRAJ).attr('d',lnW).attr('fill','none').attr('stroke',WIN_CLR).attr('stroke-width',3.2).attr('stroke-linecap','round');
  var pL=g.append('path').datum(TRAJ).attr('d',lnL).attr('fill','none').attr('stroke',LOSE_CLR).attr('stroke-width',3.2).attr('stroke-linecap','round');
  var lenW=pW.node().getTotalLength(),lenL=pL.node().getTotalLength();
  pW.attr('stroke-dasharray',lenW).attr('stroke-dashoffset',lenW);
  pL.attr('stroke-dasharray',lenL).attr('stroke-dashoffset',lenL);

  // annotation group (appears late)
  var ann=g.append('g').attr('opacity',0);
  ann.append('text').attr('x',x(0.36)).attr('y',y(150)).attr('fill',T2).attr('font-family','var(--fb)').attr('font-size','14px').attr('font-style','italic').attr('text-anchor','middle').text('lines overlap the whole rally');
  // arrow to the end split
  var ann2=g.append('g').attr('opacity',0);
  ann2.append('text').attr('x',x(0.98)).attr('y',y(196)).attr('fill',ORANGE).attr('font-family','var(--fb)').attr('font-size','13px').attr('font-weight','600').attr('text-anchor','end').text('loser overhits at the end');

  trajO={g:g,x:x,y:y,pW:pW,pL:pL,lenW:lenW,lenL:lenL,ann:ann,ann2:ann2,W:W,H:H,M:M,tip:tip};

  // hover
  g.append('rect').attr('width',W).attr('height',H).attr('fill','transparent').style('cursor','crosshair')
    .on('mousemove',function(ev){
      var mx=d3.pointer(ev)[0];var pos=Math.max(0,Math.min(1,x.invert(mx)));
      // nearest data point
      var idx=Math.round(pos*10);var d=TRAJ[idx];
      var h='<div class="ttip-d">'+(d.pos===0?'first shot':d.pos===1?'last shot':(Math.round(d.pos*100)+'% through rally'))+'</div>';
      h+='<div class="ttip-r"><span class="ttip-c" style="background:'+WIN_CLR+'"></span><span class="ttip-n">winners</span><span class="ttip-v">'+d.win.toFixed(0)+'</span></div>';
      h+='<div class="ttip-r"><span class="ttip-c" style="background:'+LOSE_CLR+'"></span><span class="ttip-n">losers</span><span class="ttip-v">'+d.lose.toFixed(0)+'</span></div>';
      tip.innerHTML=h;tip.style.opacity='1';
      var tw=tip.offsetWidth||160;tip.style.left=(x(d.pos)+M.l-tw/2)+'px';tip.style.top='30px';
    })
    .on('mouseleave',function(){tip.style.opacity='0'});

  leg.innerHTML='<div class="leg-i"><span class="leg-d" style="background:'+WIN_CLR+'"></span>rally winners</div><div class="leg-i"><span class="leg-d" style="background:'+LOSE_CLR+'"></span>rally losers</div>';
  document.getElementById('trajNote').innerHTML='Each point shows how far a player moved their opponent at that stage of the rally. <br><br>Watch the two lines. They stay close for most of the rally, with the winner pulling only slightly ahead in the final few shots before the <strong>last shot</strong> spikes.';
  trajReady=true;
}
function tickTraj(){
  if(!trajReady){var r=document.getElementById('trajBox').getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)setupTraj();}
  if(!trajReady)return;
  var p=getProgress('secPressure');
  var lp=Math.max(0,Math.min(1,p/0.55));
  trajO.pW.attr('stroke-dashoffset',trajO.lenW*(1-lp));
  trajO.pL.attr('stroke-dashoffset',trajO.lenL*(1-lp));
  trajO.ann.attr('opacity',Math.max(0,Math.min(1,(p-0.4)/0.15)));
  trajO.ann2.attr('opacity',Math.max(0,Math.min(1,(p-0.6)/0.15)));
  document.getElementById('pressureReveal').classList.toggle('on',p>0.72);
}

/* ============================================================
   ACT 2b SETUP SHOT (closing-shots trajectory)
   ============================================================ */
var setupReady=false, setupO={};
function setupSetup(){
  document.getElementById('setupNote').innerHTML='The dashed line is the winner\u2019s own average across the whole rally (<span class="num">159</span>). Their setup shot sits at <span class="num">163</span>, basically on it. <br><br>The winner-loser gap here is about <span class="num">16</span>, which is only <span class="num">0.2</span> standard deviations of shot-to-shot variation. Smaller than the line\u2019s own wiggle, so read it as noise, not a real edge.';
  var box=document.getElementById('setupBox'),svg=d3.select('#setupSvg'),leg=document.getElementById('setupLeg'),tip=document.getElementById('setupTip');
  var r=box.getBoundingClientRect(),M={t:24,r:30,b:50,l:60};
  var W=r.width-M.l-M.r,H=r.height-M.t-M.b;if(W<50||H<50)return;
  svg.selectAll('*').remove();setupO={};
  // x: from_end 5 (left) down to 0 (right) so the rally reads toward its end
  var x=d3.scaleLinear().domain([5,0]).range([0,W]);
  var y=d3.scaleLinear().domain([140,220]).range([H,0]);
  var g=svg.append('g').attr('transform','translate('+M.l+','+M.t+')');
  g.selectAll('.gridl').data(y.ticks(5)).join('line').attr('class','gridl').attr('x1',0).attr('x2',W).attr('y1',function(d){return y(d)}).attr('y2',function(d){return y(d)});
  g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.axisBottom(x).ticks(6).tickFormat(function(d){return d===0?'last shot':(d===1?'setup':d+' from end')}));
  g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5));
  g.append('text').attr('transform','rotate(-90)').attr('x',-H/2).attr('y',-44).attr('text-anchor','middle').attr('fill',T2).attr('font-family','var(--fm)').attr('font-size','12px').text('displacement applied');

  // winner baseline dashed line
  g.append('line').attr('x1',0).attr('x2',W).attr('y1',y(WIN_BASELINE)).attr('y2',y(WIN_BASELINE)).attr('stroke',GREEN2).attr('stroke-width',1.5).attr('stroke-dasharray','5,5').attr('opacity',0.5);
  g.append('text').attr('x',6).attr('y',y(WIN_BASELINE)-6).attr('fill',GREEN2).attr('font-family','var(--fm)').attr('font-size','11px').attr('opacity',0.7).text('winner\u2019s rally average');

  var lnW=d3.line().x(function(d){return x(d.fromEnd)}).y(function(d){return y(d.win)}).curve(d3.curveMonotoneX);
  var lnL=d3.line().x(function(d){return x(d.fromEnd)}).y(function(d){return y(d.lose)}).curve(d3.curveMonotoneX);
  var pW=g.append('path').datum(SETUP).attr('d',lnW).attr('fill','none').attr('stroke',WIN_CLR).attr('stroke-width',3.2).attr('stroke-linecap','round');
  var pL=g.append('path').datum(SETUP).attr('d',lnL).attr('fill','none').attr('stroke',LOSE_CLR).attr('stroke-width',3.2).attr('stroke-linecap','round');
  var lenW=pW.node().getTotalLength(),lenL=pL.node().getTotalLength();
  pW.attr('stroke-dasharray',lenW).attr('stroke-dashoffset',lenW);
  pL.attr('stroke-dasharray',lenL).attr('stroke-dashoffset',lenL);

  // marker dots for the setup shot (from_end = 1) added when revealed
  setupO={g:g,x:x,y:y,pW:pW,pL:pL,lenW:lenW,lenL:lenL,W:W,H:H,M:M,tip:tip,dots:false};

  g.append('rect').attr('width',W).attr('height',H).attr('fill','transparent').style('cursor','crosshair')
    .on('mousemove',function(ev){
      var mx=d3.pointer(ev)[0];var fe=Math.round(x.invert(mx));
      var d=SETUP.find(function(s){return s.fromEnd===fe});if(!d){tip.style.opacity='0';return;}
      var lbl=d.fromEnd===0?'last shot':(d.fromEnd===1?'setup shot':d.fromEnd+' shots from end');
      var h='<div class="ttip-d">'+lbl+'</div>';
      h+='<div class="ttip-r"><span class="ttip-c" style="background:'+WIN_CLR+'"></span><span class="ttip-n">winners</span><span class="ttip-v">'+d.win.toFixed(0)+'</span></div>';
      h+='<div class="ttip-r"><span class="ttip-c" style="background:'+LOSE_CLR+'"></span><span class="ttip-n">losers</span><span class="ttip-v">'+d.lose.toFixed(0)+'</span></div>';
      tip.innerHTML=h;tip.style.opacity='1';
      var tw=tip.offsetWidth||160;tip.style.left=(x(d.fromEnd)+M.l-tw/2)+'px';tip.style.top='30px';
    })
    .on('mouseleave',function(){tip.style.opacity='0'});

  leg.innerHTML='<div class="leg-i"><span class="leg-d" style="background:'+WIN_CLR+'"></span>rally winners</div><div class="leg-i"><span class="leg-d" style="background:'+LOSE_CLR+'"></span>rally losers</div>';
  setupReady=true;
}
function tickSetup(){
  if(!setupReady){var r=document.getElementById('setupBox').getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)setupSetup();}
  if(!setupReady)return;
  var p=getProgress('secSetup');
  var lp=Math.max(0,Math.min(1,p/0.55));
  setupO.pW.attr('stroke-dashoffset',setupO.lenW*(1-lp));
  setupO.pL.attr('stroke-dashoffset',setupO.lenL*(1-lp));
  // highlight the setup shot (from_end=1) once lines are mostly drawn
  if(lp>0.85 && !setupO.dots){
    setupO.dots=true;
    var d=SETUP.find(function(s){return s.fromEnd===1});
    setupO.g.append('circle').attr('cx',setupO.x(1)).attr('cy',setupO.y(d.win)).attr('r',6).attr('fill',WIN_CLR).attr('stroke','#06080c').attr('stroke-width',2);
  }
  document.getElementById('setupReveal').classList.toggle('on',p>0.72);
}

/* ============================================================
   ACT 3 FINAL SHOT BY ENDING (bars)
   ============================================================ */
var finReady=false, finBars=[];
function setupFin(){
  var box=document.getElementById('finBox'),svg=d3.select('#finSvg');
  var r=box.getBoundingClientRect(),M={t:20,r:60,b:40,l:170};
  var W=r.width-M.l-M.r,H=r.height-M.t-M.b;if(W<50||H<50)return;
  svg.selectAll('*').remove();finBars=[];
  var y=d3.scaleBand().domain(FIN.map(function(d){return d.label})).range([0,H]).padding(0.28);
  var x=d3.scaleLinear().domain([0,250]).range([0,W]);
  var g=svg.append('g').attr('transform','translate('+M.l+','+M.t+')');
  g.selectAll('.gridl').data(x.ticks(5)).join('line').attr('class','gridl').attr('y1',0).attr('y2',H).attr('x1',function(d){return x(d)}).attr('x2',function(d){return x(d)});
  g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.axisBottom(x).ticks(5));
  g.append('g').attr('class','axis').call(d3.axisLeft(y)).selectAll('text').style('font-size','12px').style('fill',function(d){var f=FIN.find(function(e){return e.label===d});return f&&f.out?ORANGE:T2});
  g.append('text').attr('x',W/2).attr('y',H+34).attr('text-anchor','middle').attr('fill',T2).attr('font-family','var(--fm)').attr('font-size','12px').text('displacement of the rally-ending shot');

  FIN.forEach(function(d){
    var rect=g.append('rect').attr('x',0).attr('y',y(d.label)).attr('height',y.bandwidth()).attr('width',0).attr('fill',d.out?ORANGE:GREEN).attr('opacity',d.out?0.95:0.8).attr('rx',3);
    var lbl=g.append('text').attr('x',0).attr('y',y(d.label)+y.bandwidth()/2+4).attr('fill',T2).attr('font-family','var(--fm)').attr('font-size','12px').attr('opacity',0).text(d.val.toFixed(0));
    finBars.push({rect:rect,lbl:lbl,d:d,x:x});
  });
  document.getElementById('finNote').innerHTML='When a player wins by <strong>forcing the opponent out</strong>, that final shot had moved them the farthest (<span class="num">233</span>). <br><br>When the opponent <strong>nets it instead</strong>, displacement is at its lowest (<span class="num">175</span>). The biggest shots tend to come from a player stretched into overhitting.';
  finReady=true;
}
function tickFin(){
  if(!finReady){var r=document.getElementById('finBox').getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)setupFin();}
  if(!finReady)return;
  var p=getProgress('secAnswer');
  finBars.forEach(function(o,i){
    var lp=Math.max(0,Math.min(1,(p-i*0.06)/0.45));
    o.rect.attr('width',o.x(o.d.val)*lp);
    o.lbl.attr('x',o.x(o.d.val)*lp+8).attr('opacity',lp);
  });
  document.getElementById('answerReveal').classList.toggle('on',p>0.7);
}

/* ============================================================
   FLYING SHUTTLECOCK between sections
   ============================================================ */
var shuttle=document.getElementById('shuttle');
function tickShuttle(){
  var vh=window.innerHeight, vw=window.innerWidth;
  // fly the shuttle while a pinned act is finishing (progress 0.88 -> 1.0)
  // and continuing briefly into the next section's start.
  var acts=['secStyle','secPressure','secSetup','secAnswer'];
  var show=false, tx=0, ty=0, rot=0;
  for(var i=0;i<acts.length;i++){
    var p=getProgress(acts[i]);
    if(p>0.80 && p<1){
      var t=(p-0.80)/0.20;            // 0..1 across the handoff
      var leftToRight=(i%2===0);
      var px=leftToRight?t:(1-t);
      show=true;
      tx=vw*(0.08+0.84*px);
      ty=vh*(0.60 - 0.30*Math.sin(t*Math.PI)); // arc through the open mid-screen band
      var dydx=(-0.30*Math.PI*Math.cos(t*Math.PI));
      var ang=Math.atan2(dydx*vh,(leftToRight?1:-1)*0.84*vw)*180/Math.PI;
      rot=ang+(leftToRight?0:180);
      break;
    }
  }
  if(show){shuttle.style.opacity='0.92';shuttle.style.transform='translate('+tx+'px,'+ty+'px) rotate('+rot+'deg)';}
  else{shuttle.style.opacity='0';}
}

/* ============================================================
   CONCLUSION reveal
   ============================================================ */
(function(){
  var sec=document.getElementById('sConc');
  new IntersectionObserver(function(e){if(e[0].isIntersecting)sec.classList.add('iv')},{threshold:0.2}).observe(sec);
})();

/* ============================================================
   MAIN LOOP
   ============================================================ */
var bar=document.getElementById('prog');
function safe(fn){try{fn();}catch(e){/* keep the loop alive if one chart errors */}}
function loop(){
  var total=document.documentElement.scrollHeight-window.innerHeight;
  bar.style.width=Math.min(window.scrollY/total*100,100)+'%';
  safe(tickSil);safe(tickTraj);safe(tickSetup);safe(tickFin);safe(tickShuttle);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('resize',function(){silReady=false;trajReady=false;setupReady=false;finReady=false;});
