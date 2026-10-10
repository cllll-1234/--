(()=>{
  "use strict";

  const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
  const VW=960,VH=540,WORLD_W=5200,WORLD_H=920,STEP=1/60;
  canvas.width=VW;canvas.height=VH;ctx.imageSmoothingEnabled=false;
  const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const ui={level:$("#level"),objective:$("#objective"),materials:$("#materials"),rescues:$("#rescues"),repairs:$("#repairs"),clock:$("#clock"),deaths:$("#deaths"),pause:$("#pause"),sound:$("#sound"),toast:$("#toast"),achievement:$("#achievement-toast"),overlay:$("#overlay")};
  const ASSETS={
    hero:"images/game/generated/eren-spritesheet-alpha.png",
    background:"images/game/generated/cloudbound-ruins-level-concept-v1.png",
    wall:"images/game/generated/blackstone-wall-tileset-v1-clean-alpha.png",
    wood:"images/game/generated/wood-traversal-tileset-v1-clean-alpha.png",
    architecture:"images/game/generated/blackstone-architecture-tileset-v1-clean-alpha.png",
    mechanics:"images/game/generated/maneuver-anchors-hazards-v1-clean-alpha.png",
    titan:"images/game/generated/titan-threat-spritesheet-v1-clean-alpha.png"
  };
  const images={},loadImage=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("资源加载失败："+src));i.src=src});
  const PLATFORM=[
    {x:0,y:760,w:430,h:160,t:"stone"},{x:520,y:690,w:270,h:230,t:"wood"},{x:900,y:790,w:260,h:130,t:"stone"},
    {x:1260,y:650,w:300,h:270,t:"tower"},{x:1650,y:740,w:270,h:180,t:"wood"},{x:2010,y:590,w:310,h:330,t:"stone"},
    {x:2410,y:710,w:250,h:210,t:"wood"},{x:2750,y:500,w:310,h:420,t:"tower"},{x:3150,y:670,w:260,h:250,t:"stone"},
    {x:3500,y:560,w:290,h:360,t:"tower"},{x:3880,y:720,w:270,h:200,t:"wood"},{x:4240,y:500,w:290,h:420,t:"stone"},
    {x:4620,y:390,w:580,h:530,t:"gate"},
  ];
  const ANCHORS=[
    {x:385,y:515},{x:690,y:405},{x:1130,y:560},{x:1460,y:435},{x:1820,y:490},{x:2200,y:380},
    {x:2570,y:460},{x:2950,y:300},{x:3340,y:405},{x:3690,y:285},{x:4070,y:460},{x:4440,y:275},{x:4850,y:235}
  ];
  const CHECKPOINTS=[{x:90,y:728,id:0},{x:2050,y:558,id:1},{x:3530,y:528,id:2}],RESCUE_ZONE={x:4920,y:300,w:190,h:90};
  const GRAPPLE={maxRange:540,minLength:86,retractSpeed:210,pullAcceleration:930,liftBonus:165,springStrength:18,maxTension:1200,tangentAcceleration:360,maxSpeed:560,damping:.992};
  const FRAMES=[
    {x:45,y:12,w:130,h:306},{x:210,y:12,w:170,h:306},{x:412,y:34,w:190,h:282},{x:615,y:44,w:220,h:268},
    {x:15,y:350,w:330,h:286},{x:345,y:420,w:255,h:220},{x:625,y:420,w:190,h:230},{x:25,y:655,w:235,h:290},
    {x:280,y:650,w:210,h:300},{x:500,y:675,w:180,h:285},{x:650,y:730,w:190,h:220},{x:40,y:970,w:185,h:285},
    {x:275,y:970,w:295,h:290},{x:560,y:975,w:280,h:285}
  ];
  const ANIMS={idle:{frames:[0,1],fps:2},walk:{frames:[1,2],fps:8},run:{frames:[2,3],fps:11},jump:{frames:[4,5],fps:5},fall:{frames:[10],fps:1},dash:{frames:[7],fps:1},hurt:{frames:[9,10],fps:5}};
  const FR={titanIdle:{x:15,y:15,w:220,h:390},titanReach:{x:730,y:25,w:260,h:370},titanSweep:{x:960,y:25,w:340,h:380},titanGrab:{x:1290,y:20,w:230,h:380},anchor:{x:435,y:65,w:185,h:230},gas:{x:1115,y:350,w:350,h:210},rock:{x:850,y:585,w:180,h:180},gate:{x:325,y:570,w:400,h:220}};
  const keys=new Set(),pressed=new Set();let jumpHeld=false;
  const isDown=(...c)=>c.some(k=>keys.has(k)),wasPressed=(...c)=>c.some(k=>pressed.has(k));
  addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code))e.preventDefault();if(!keys.has(e.code))pressed.add(e.code);keys.add(e.code);if(["Space","KeyW","ArrowUp"].includes(e.code))jumpHeld=true;if(e.code==="KeyP"||e.code==="Escape")togglePause();if(e.code==="KeyR")restart()});
  addEventListener("keyup",e=>{keys.delete(e.code);if(["Space","KeyW","ArrowUp"].includes(e.code))jumpHeld=false});
  addEventListener("blur",()=>{keys.clear();jumpHeld=false});

  let player,camera,state,rocks=[],particles=[],titan,last=0,acc=0,mode="loading",toastClock=0,muted=false;
  function resetState(){
    state={time:105,hp:3,checkpoint:0,deaths:0,elapsed:0,complete:false,injured:false,titanHits:0,titanDamageTaken:false};
    player={x:90,y:728,w:24,h:32,vx:0,vy:0,grounded:false,coyote:0,buffer:0,face:1,gas:100,gasCooldown:0,grappleCooldown:0,grapple:null,hurt:0,anim:"idle",animTime:0};
    camera={x:0,y:250,shake:0};rocks=[];particles=[];titan={x:3380,y:820,vx:0,face:-1,state:"patrol",timer:2.8,hit:false,patrolMin:2860,patrolMax:4440};
  }
  function restart(){resetState();mode="play";hideOverlay();toast("墙外清剿重新开始")}
  function respawn(damage=true){
    if(damage){state.hp--;state.deaths++;state.injured=true}
    if(state.hp<=0){finish(false);return}
    const cp=CHECKPOINTS[state.checkpoint];player.x=cp.x;player.y=cp.y;player.vx=player.vy=0;player.grapple=null;player.hurt=.8;player.gas=Math.max(player.gas,45);camera.shake=.4;toast("同伴拉住了你 · 返回检查点");
  }
  function moveX(dx){player.x+=dx;for(const p of PLATFORM)if(overlap(player,p)){player.x=dx>0?p.x-player.w:p.x+p.w;player.vx=0}}
  function moveY(dy){player.y+=dy;for(const p of PLATFORM)if(overlap(player,p)){if(dy>0){player.y=p.y-player.h;player.grounded=true}else player.y=p.y+p.h;player.vy=0}}
  function setAnimation(name){if(player.anim!==name){player.anim=name;player.animTime=0}}
  function updateAnimation(dt){let name="idle";if(player.hurt>0)name="hurt";else if(!player.grounded)name=player.vy<0?"jump":"fall";else if(Math.abs(player.vx)>210)name="run";else if(Math.abs(player.vx)>18)name="walk";setAnimation(name);player.animTime+=dt}
  function movePlayer(dx,dy){const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/7));for(let i=0;i<steps;i++){moveX(dx/steps);moveY(dy/steps)}}
  function setAnim(name){if(player.anim!==name){player.anim=name;player.animTime=0}}
  function updateAnimation(dt){let next="idle";if(player.hurt>0)next="hurt";else if(!player.grounded)next=player.vy<0?"jump":"fall";else if(Math.abs(player.vx)>220)next="run";else if(Math.abs(player.vx)>18)next="walk";setAnim(next);player.animTime+=dt}
  function acquire(side){
    const px=player.x+player.w/2,py=player.y+10,candidates=ANCHORS.filter(a=>(a.x-px)*side>0&&Math.hypot(a.x-px,a.y-py)<=GRAPPLE.maxRange).sort((a,b)=>Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py));
    if(!candidates.length){toast("射程内没有锚点");return}
    const a=candidates[0],distance=Math.hypot(a.x-px,a.y-py);player.grapple={anchor:a,length:Math.max(GRAPPLE.minLength,distance*.94)};player.grappleCooldown=.14;burst(a.x,a.y,"#9edfff",12);tone(620,.06);
  }
  function release(){if(player.grapple){player.vx*=1.05;player.vy*=1.05;player.grapple=null;tone(260,.05)}}
  function updateGrapple(dt){
    player.grappleCooldown=Math.max(0,player.grappleCooldown-dt);
    if(player.grappleCooldown<=0&&wasPressed("KeyQ"))acquire(-1);if(player.grappleCooldown<=0&&wasPressed("KeyE"))acquire(1);if(wasPressed("KeyS","ArrowDown"))release();
    if(!player.grapple)return;
    const a=player.grapple.anchor,px=player.x+12,py=player.y+12,dx=a.x-px,dy=a.y-py,d=Math.max(1,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d;
    player.grapple.length=approach(player.grapple.length,GRAPPLE.minLength,GRAPPLE.retractSpeed*dt);
    player.vx+=nx*GRAPPLE.pullAcceleration*dt;player.vy+=ny*GRAPPLE.pullAcceleration*dt;
    if(dy<0)player.vy-=GRAPPLE.liftBonus*dt;
    const axis=(isDown("KeyD","ArrowRight")?1:0)-(isDown("KeyA","ArrowLeft")?1:0),tx=-ny,ty=nx;
    player.vx+=tx*axis*GRAPPLE.tangentAcceleration*dt;player.vy+=ty*axis*GRAPPLE.tangentAcceleration*dt;
    if(d>player.grapple.length){const excess=d-player.grapple.length;const tension=Math.min(GRAPPLE.maxTension,excess*GRAPPLE.springStrength);player.vx+=nx*tension*dt;player.vy+=ny*tension*dt;const outward=-(player.vx*nx+player.vy*ny);if(outward>0){const brake=Math.min(outward,760*dt);player.vx+=nx*brake;player.vy+=ny*brake}}
    const drag=Math.pow(GRAPPLE.damping,dt*60);player.vx*=drag;player.vy*=drag;const speed=Math.hypot(player.vx,player.vy);if(speed>GRAPPLE.maxSpeed){player.vx=player.vx/speed*GRAPPLE.maxSpeed;player.vy=player.vy/speed*GRAPPLE.maxSpeed}
  }
  function updatePhysics(dt){
    if(player.hurt>0){player.hurt-=dt;player.vy=Math.min(900,player.vy+1700*dt);player.grounded=false;movePlayer(player.vx*dt,player.vy*dt);updateAnimation(dt);return}
    const left=isDown("KeyA","ArrowLeft"),right=isDown("KeyD","ArrowRight"),axis=(right?1:0)-(left?1:0);if(axis)player.face=axis;
    player.buffer=Math.max(0,player.buffer-dt);if(wasPressed("Space","KeyW","ArrowUp"))player.buffer=.12;player.coyote=player.grounded?.1:Math.max(0,player.coyote-dt);
    if(player.buffer>0&&player.coyote>0){player.vy=-690;player.buffer=player.coyote=0;player.grounded=false}
    if(!jumpHeld&&player.vy<-135)player.vy=-135;
    player.vx+=axis*(player.grounded?2600:1650)*dt;if(!axis)player.vx=approach(player.vx,0,(player.grounded?2600:350)*dt);player.vx=clamp(player.vx,-275,275);
    player.vy=clamp(player.vy+2050*dt,-800,980);updateGrapple(dt);
    player.gasCooldown=Math.max(0,player.gasCooldown-dt);
    if(wasPressed("ShiftLeft","ShiftRight","KeyX")&&player.gas>=12&&player.gasCooldown<=0){const s=Math.hypot(player.vx,player.vy),dx=s>30?player.vx/s:player.face,dy=s>30?player.vy/s:-.2;player.vx+=dx*430;player.vy+=dy*430;player.gas-=12;player.gasCooldown=.22;burst(player.x+12,player.y+20,"#bfeeff",16);tone(520,.08)}
    if(player.grounded&&Math.abs(player.vx)<20)player.gas=Math.min(100,player.gas+10*dt);
    player.grounded=false;movePlayer(player.vx*dt,player.vy*dt);updateAnimation(dt);
    if(player.y>WORLD_H+70)respawn();
  }
  function approach(v,t,n){return v<t?Math.min(v+n,t):Math.max(v-n,t)}
  function titanAttack(){const roll=Math.random();titan.state=roll<.52?"sweep":roll<.8?"grab":"slam";titan.timer=titan.state==="sweep"?.98:titan.state==="grab"?1.18:1.05;titan.hit=false;titan.vx*=.18;toast(titan.state==="sweep"?"警告：巨人横扫":titan.state==="grab"?"警告：巨人抓取":"警告：巨人下砸")}
  function updateTitan(dt){
    const dx=player.x-titan.x,near=Math.abs(dx)<900&&player.x>2500&&player.x<4620,attacking=titan.state==="sweep"||titan.state==="grab"||titan.state==="slam";
    if(!attacking){titan.state=near?"chase":"patrol";let direction=near?Math.sign(dx||titan.face):titan.face;if(!near&&(titan.x<=titan.patrolMin+10||titan.x>=titan.patrolMax-10))direction=titan.x<titan.patrolMin+10?1:-1;titan.face=direction||titan.face;const target=titan.face*(near?195:85);titan.vx=approach(titan.vx,target,(near?360:150)*dt);titan.x=clamp(titan.x+titan.vx*dt,titan.patrolMin,titan.patrolMax);titan.timer-=dt;if(near&&Math.abs(dx)<350&&titan.timer<=0)titanAttack()}else titan.timer-=dt;
    const sweepHit={x:titan.face>0?titan.x+20:titan.x-300,y:570,w:300,h:170};
    const grabHit={x:titan.face>0?titan.x+30:titan.x-190,y:450,w:190,h:290};
    const slamHit={x:titan.x-155,y:650,w:310,h:250};
    if(titan.state==="sweep"&&titan.timer<.38&&!titan.hit&&overlap(player,sweepHit)){titan.hit=true;hurtPlayer(titan.face*420,-380,"titan")}
    if(titan.state==="grab"&&titan.timer<.44&&!titan.hit&&overlap(player,grabHit)){titan.hit=true;hurtPlayer(titan.face*300,-300,"titan")}
    if(titan.state==="slam"&&titan.timer<.4&&!titan.hit&&overlap(player,slamHit)){titan.hit=true;hurtPlayer(titan.face*180,-460,"titan")}
    if(attacking&&titan.timer<=0){titan.state="chase";titan.timer=1.05+Math.random()*.45}
  }
  function hurtPlayer(vx,vy,source="hazard"){if(source==="titan"){state.titanHits++;state.titanDamageTaken=true}if(player.hurt>0)return;state.hp--;state.injured=true;player.hurt=.8;player.grapple=null;player.vx=vx;player.vy=vy;camera.shake=.8;burst(player.x+12,player.y+12,"#c84d45",18);if(state.hp<=0)setTimeout(()=>finish(false),350)}
  function spawnRock(){const x=900+Math.random()*3700;rocks.push({x,y:50,w:36+Math.random()*28,h:36+Math.random()*28,vy:80,warn:.65,dead:false})}
  function updateRocks(dt){
    if(rocks.length<5&&Math.random()<dt*.8)spawnRock();for(const r of rocks){if(r.warn>0){r.warn-=dt;continue}r.vy+=1200*dt;r.y+=r.vy*dt;if(overlap(player,r)){r.dead=true;hurtPlayer((player.x<r.x?-1:1)*260,-300)}if(PLATFORM.some(p=>overlap(r,p))){r.dead=true;burst(r.x,r.y,"#b2aaa0",14)}}rocks=rocks.filter(r=>!r.dead&&r.y<WORLD_H+100)
  }
  function updateCheckpoint(){for(let i=CHECKPOINTS.length-1;i>=0;i--)if(player.x>=CHECKPOINTS[i].x&&i>state.checkpoint){state.checkpoint=i;player.gas=Math.min(100,player.gas+35);toast("检查点记录 · 瓦斯补给");break}}
  function update(dt){
    updateParticles(dt);if(mode!=="play")return;state.elapsed+=dt;state.time-=dt;if(state.time<=0){finish(false);return}
    updatePhysics(dt);updateTitan(dt);updateRocks(dt);updateCheckpoint();if(player.grounded&&player.hurt<=0&&overlap(player,RESCUE_ZONE)){finish(true);return}
    const tx=clamp(player.x-VW*.35,0,WORLD_W-VW),ty=clamp(player.y-VH*.58,0,WORLD_H-VH);camera.x+=(tx-camera.x)*Math.min(1,dt*4.5);camera.y+=(ty-camera.y)*Math.min(1,dt*3.5);camera.shake=Math.max(0,camera.shake-dt);toastClock=Math.max(0,toastClock-dt);if(!toastClock)ui.toast.classList.remove("show");updateHud()
  }
  function finish(success){if(mode==="result")return;mode="result";state.complete=success;if(success&&!state.titanDamageTaken)window.TitanAchievements?.unlockAchievement("titan_no_hit");try{localStorage.setItem("wall-rift-maneuver-result",JSON.stringify({maneuverCleared:success,injured:state.injured||!success,lainerInjured:state.injured||!success,time:state.elapsed,deaths:state.deaths,titanHits:state.titanHits,titanDamageTaken:state.titanDamageTaken}))}catch(_){}showOverlay(`<p class="kicker">${success?"MISSION COMPLETE":"MISSION CONTINUES"}</p><h1>${success?"抵达救援点":"被同伴救下"}</h1><p class="quote">${success?"莱纳落在残墙边。韩吉已经蹲在那具无垢巨人的后颈旁。":"钩索从雨幕中射来。莱纳醒来时，韩吉正准备检查那具巨人的尸体。"}</p><p class="highlight">${success?"清剿路线完成":"受伤状态已记录，剧情继续"}</p><div class="buttons"><button class="primary" data-action="continue-story">继续剧情</button><button data-action="restart">重新挑战</button></div>`)}
  function updateHud(){const gas=Math.max(0,Math.min(100,player.gas)),hp=Math.max(0,Math.min(3,state.hp));ui.materials.textContent=Math.ceil(gas)+"%";ui.rescues.textContent=hp+" / 3";ui.gasFill.style.width=gas+"%";ui.healthFill.style.width=(hp/3*100)+"%";ui.repairs.textContent=`${state.checkpoint+1}/3`;ui.clock.textContent=formatTime(state.time);ui.deaths.textContent=state.deaths;ui.objective.textContent=player.x<500?"Q / E 点按发射钩索 · S 松钩":player.x<2850?"利用锚点穿越断塔":player.x<4300?"摆脱追击中的巨人":"落到右侧蓝色救援区"}
  function configureHud(){ui.level.textContent="墙外清剿 · 立体机动";const spans=document.querySelectorAll("#hud .records>span");spans[0].className="hud-meter gas-meter";spans[0].innerHTML='<span class="meter-head"><strong>瓦斯</strong><b id="materials">100%</b></span><span class="meter-track"><i id="gas-fill"></i></span>';spans[1].className="hud-meter health-meter";spans[1].innerHTML='<span class="meter-head"><strong>生命</strong><b id="rescues">3 / 3</b></span><span class="meter-track"><i id="health-fill"></i></span>';spans[2].innerHTML='检查点 <b id="repairs">1/3</b>';ui.materials=$("#materials");ui.rescues=$("#rescues");ui.gasFill=$("#gas-fill");ui.healthFill=$("#health-fill");ui.repairs=$("#repairs");document.querySelector(".control-help").textContent="A / D 移动 · SPACE 跳跃 · Q / E 钩索 · S 松钩 · SHIFT 瓦斯推进 · R 重开"}
  function configureTouch(){
    const touch=$("#touch");touch.innerHTML='<div><button data-code="ArrowLeft">◀</button><button data-code="ArrowRight">▶</button><button data-code="Space">跳</button></div><div><button data-code="KeyQ">左钩</button><button data-code="KeyS">松</button><button data-code="KeyE">右钩</button><button data-code="ShiftLeft">气</button></div>';
    touch.querySelectorAll("button").forEach(button=>{const code=button.dataset.code;button.onpointerdown=event=>{event.preventDefault();if(!keys.has(code))pressed.add(code);keys.add(code);if(code==="Space")jumpHeld=true};const up=event=>{event.preventDefault();keys.delete(code);if(code==="Space")jumpHeld=false};button.onpointerup=up;button.onpointerleave=up;button.onpointercancel=up});
  }
  function formatTime(v){return`${Math.floor(Math.max(0,v)/60)}:${String(Math.floor(Math.max(0,v)%60)).padStart(2,"0")}`}
  function toast(text){ui.toast.textContent=text;ui.toast.classList.add("show");toastClock=2.1}
  let achievementToastTimer=0;
  function showAchievement(item){if(!ui.achievement)return;ui.achievement.innerHTML=`<span class="achievement-icon">${item.icon||"★"}</span><div><strong>${item.title}</strong><span>未被巨人击中并成功完成清剿</span></div>`;ui.achievement.classList.add("show");clearTimeout(achievementToastTimer);achievementToastTimer=setTimeout(()=>ui.achievement.classList.remove("show"),4200)}
  document.addEventListener("titan-achievement",event=>showAchievement(event.detail));
  function burst(x,y,color,count){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*210,vy:(Math.random()-.5)*210,life:.25+Math.random()*.45,color,size:2+Math.random()*3})}
  function updateParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=240*dt;p.life-=dt}particles=particles.filter(p=>p.life>0)}
  function tone(freq,dur){const settings=window.TitanSettings?window.TitanSettings.loadSettings():{sound:true,volume:100};if(muted||!settings.sound)return;try{const ac=tone.ac||(tone.ac=new(window.AudioContext||window.webkitAudioContext)()),o=ac.createOscillator(),g=ac.createGain(),volume=window.TitanSettings?window.TitanSettings.getVolume(.018):.018;o.type="square";o.frequency.value=freq;g.gain.setValueAtTime(Math.max(.0001,volume),ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+dur)}catch(_){}}
  function sprite(img,r,x,y,w,h,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,r.x,r.y,r.w,r.h,Math.round(x),Math.round(y),Math.round(w),Math.round(h));ctx.restore()}
  function drawBackground(){ctx.fillStyle="#111923";ctx.fillRect(0,0,VW,VH);const img=images.background,w=VW+WORLD_W*.1,h=w/img.width*img.height;ctx.globalAlpha=.68;ctx.drawImage(img,-camera.x*.1,-Math.min(Math.max(0,h-VH),camera.y*.08),w,h);ctx.globalAlpha=1;ctx.fillStyle="#17233266";ctx.fillRect(0,0,VW,VH)}
  function drawPlatform(p){const x=p.x-camera.x,y=p.y-camera.y;if(x+p.w<0||x>VW)return;ctx.save();ctx.beginPath();ctx.rect(x,y,p.w,p.h);ctx.clip();if(p.t==="wood"){for(let xx=x;xx<x+p.w;xx+=190)sprite(images.wood,{x:35,y:75,w:205,h:105},xx,y,205,95)}else{for(let yy=y;yy<y+p.h;yy+=95)for(let xx=x;xx<x+p.w;xx+=125)sprite(images.wall,{x:145,y:45,w:115,h:90},xx,yy,125,95,.96)}ctx.restore();if(p.t==="gate")sprite(images.architecture,FR.gate,x+p.w*.15,y+20,p.w*.72,210,.95)}
  function drawAnchor(a){const x=a.x-camera.x,y=a.y-camera.y;sprite(images.mechanics,FR.anchor,x-18,y-18,36,42,.95);if(player.grapple&&player.grapple.anchor===a){ctx.strokeStyle="#9ee7ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,25+Math.sin(performance.now()*.01)*4,0,Math.PI*2);ctx.stroke()}}
  function drawTitan(){if(player.x<2350)return;const x=titan.x-camera.x,y=titan.y-camera.y,r=titan.state==="sweep"?FR.titanSweep:titan.state==="grab"?FR.titanGrab:titan.state==="slam"?FR.titanGrab:titan.state==="chase"?FR.titanReach:FR.titanIdle,w=titan.state==="sweep"?330:220;ctx.save();ctx.translate(x,y);if(titan.face<0)ctx.scale(-1,1);sprite(images.titan,r,-w/2,-360,w,360,.94);ctx.restore();if((titan.state==="sweep"||titan.state==="grab"||titan.state==="slam")&&titan.timer>.4){ctx.fillStyle="#b6403630";const h=titan.state==="sweep"?{x:titan.face>0?titan.x+20:titan.x-300,y:570,w:300,h:170}:titan.state==="grab"?{x:titan.face>0?titan.x+30:titan.x-190,y:450,w:190,h:290}:{x:titan.x-155,y:650,w:310,h:250};ctx.fillRect(h.x-camera.x,h.y-camera.y,h.w,h.h)}}
  function drawPlayer(){
    const x=player.x+12-camera.x,y=player.y+32-camera.y,a=ANIMS[player.anim]||ANIMS.idle;
    const index=a.frames[Math.floor(player.animTime*a.fps)%a.frames.length],f=FRAMES[index];
    const h=(player.anim==="jump"||player.anim==="fall")?82*.94:82,w=f.w/f.h*h;
    ctx.save();ctx.translate(x,y);if(player.face<0)ctx.scale(-1,1);
    if(player.hurt>0&&Math.floor(player.hurt*12)%2===0)ctx.globalAlpha=.4;
    ctx.drawImage(images.hero,f.x,f.y,f.w,f.h,-w/2,-h,w,h);ctx.restore();
    if(player.grapple){const anchor=player.grapple.anchor;ctx.strokeStyle="#b7c8ce";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(anchor.x-camera.x,anchor.y-camera.y);ctx.stroke()}
  }
  function drawRescue(){const x=RESCUE_ZONE.x-camera.x,y=RESCUE_ZONE.y-camera.y,pulse=.55+Math.sin(performance.now()*.006)*.18;ctx.fillStyle=`rgba(76,185,225,${pulse*.22})`;ctx.fillRect(x,y,RESCUE_ZONE.w,RESCUE_ZONE.h);ctx.strokeStyle=`rgba(158,231,255,${pulse})`;ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,RESCUE_ZONE.w-4,RESCUE_ZONE.h-4)}
  function draw(){const sx=(Math.random()-.5)*camera.shake*20,sy=(Math.random()-.5)*camera.shake*12;ctx.save();ctx.translate(sx,sy);drawBackground();PLATFORM.forEach(drawPlatform);drawRescue();ANCHORS.forEach(drawAnchor);for(const r of rocks){const x=r.x-camera.x,y=r.y-camera.y;if(r.warn>0){ctx.fillStyle=`rgba(210,65,50,${.2+Math.sin(performance.now()*.02)*.12})`;ctx.beginPath();ctx.ellipse(x+20,Math.min(880,y+500)-camera.y,34,9,0,0,Math.PI*2);ctx.fill()}else sprite(images.mechanics,FR.rock,x,y,r.w,r.h)}drawTitan();for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-camera.x,p.y-camera.y,p.size,p.size)}ctx.globalAlpha=1;drawPlayer();ctx.restore()}
  function showOverlay(html){ui.overlay.innerHTML=`<article class="card">${html}</article>`;ui.overlay.classList.add("show")}
  function hideOverlay(){ui.overlay.classList.remove("show");ui.overlay.innerHTML=""}
  function togglePause(){if(mode==="play"){mode="pause";showOverlay('<p class="kicker">PAUSED</p><h1>立体机动暂停</h1><div class="buttons"><button class="primary" data-action="resume">继续</button><button data-action="restart">重新开始</button></div>')}else if(mode==="pause"){mode="play";hideOverlay()}}
  ui.overlay.addEventListener("click",e=>{const a=e.target.dataset.action;if(a==="continue-story")location.href="../../game.html?mode=maneuver-return";if(a==="start"||a==="restart")restart();if(a==="resume"){mode="play";hideOverlay()}});ui.pause.onclick=togglePause;ui.sound.onclick=()=>{muted=!muted;ui.sound.textContent=muted?"×":"♬"};
  function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;acc+=dt;while(acc>=STEP){update(STEP);acc-=STEP;pressed.clear()}draw();requestAnimationFrame(frame)}
  configureHud();configureTouch();resetState();
  Promise.all(Object.entries(ASSETS).map(async([k,v])=>images[k]=await loadImage(v))).then(()=>{mode="title";updateHud();showOverlay('<p class="kicker">WALL EXTERIOR / 01</p><h1>墙外清剿</h1><h2>立体机动闪避</h2><p class="quote">用 Q / E 钩住建筑锚点，S 松钩，Shift 消耗瓦斯推进。即使任务失败，剧情仍会继续。</p><div class="legend"><span><b>Q / E</b> 左右钩索</span><span><b>S</b> 松开钩索</span><span><b>SHIFT</b> 瓦斯推进</span><span><b>SPACE</b> 跳跃</span></div><div class="buttons"><button class="primary" data-action="start">开始清剿</button></div>');requestAnimationFrame(frame)}).catch(err=>showOverlay(`<h1>资源加载失败</h1><p>${err.message}</p>`));
})();

