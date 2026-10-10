/* 四个结局共用的演出与编辑工具。正式入口使用 from=story；预览不写剧情存档。 */
(function(){
"use strict";
const query=new URLSearchParams(location.search);
const key=query.get("ending")||query.get("edit")||"good";
const source=window.TitanEndingScripts[key];
const epilogueEngine=key==="hidden"?window.TitanHiddenEpilogue:key==="bad"?window.TitanBadEpilogue:key==="bad"?window.TitanBadEpilogue:key==="normal"?window.TitanNormalEpilogue:window.TitanGoodEpilogue;
if(!source){document.body.textContent="结局不存在，请检查入口。";return;}
// 新版好结局单独保存草稿，旧版台词草稿仍留在 v1 中。
const draftKey=(key==="hidden"&&source.epilogue?"TitanEndingDraft-hearing-v1-":key==="bad"&&source.epilogue?"TitanEndingDraft-museum-v1-":key==="bad"&&source.epilogue?"TitanEndingDraft-museum-v1-":key==="normal"&&source.epilogue?"TitanEndingDraft-snow-v1-":key==="good"?(source.epilogue&&source.epilogue.variant==="sea-20261009"?"TitanEndingDraft-v3-":"TitanEndingDraft-v2-"):"TitanEndingDraft-v1-")+key;
const clone=v=>JSON.parse(JSON.stringify(v));
let data=clone(source);
try{const draft=JSON.parse(localStorage.getItem(draftKey));if(query.get("from")!=="story"&&draft&&Array.isArray(draft.scenes)&&draft.scenes.length)data=draft;}catch(e){}
const $=id=>document.getElementById(id);
const backgrounds={city:"images/bg/city.png",training:"images/bg/training.png",street:"images/maps/street_sermon.webp",gate:"images/bg/gate.png",sea:"",black:""};
document.title=data.title+" · "+(query.has("edit")?"修改结局":"结局演出");
function safeImage(value){return typeof value==="string"&&/^(images\/)[^"'<>]+\.(png|jpe?g|webp|svg)$/i.test(value)?value:"";}
function validate(config){
 if(!config.title||!Array.isArray(config.scenes)||!config.scenes.length)throw new Error("请填写标题，至少保留一幕。");
 for(const s of config.scenes){
  if(!["narration","dialogue","monologue","card","exploration"].includes(s.kind))throw new Error("存在未知的文字类型。");
  if(s.kind==="exploration"){
   if(!["good","normal","bad","hidden"].includes(key))throw new Error("当前结局尚未配置探索地图。");
   epilogueEngine.validate(config.epilogue);
  }
  if(!Object.hasOwn(backgrounds,s.backdrop))throw new Error("存在未知的画面类型。");
  if(typeof s.text!=="string"||!s.text.trim())throw new Error("每一幕都需要文字。");
  if(!Number.isFinite(s.hold)||s.hold<2000||s.hold>60000)throw new Error("停留时间应在 2–60 秒之间。");
  if(s.image&&!safeImage(s.image))throw new Error("图片路径需为 images/ 下的图片文件。");
 }
 return config;
}
if(query.has("edit")){
 let epilogueEditor=null;
 $("editor").hidden=false;$("editor-title").textContent="修改 · "+data.title;
 $("edit-title").value=data.title;$("edit-subtitle").value=data.subtitle||"";$("design-note").textContent=data.note||"";
 Object.entries(window.TitanEndingScripts).forEach(([id,c])=>{
  const a=document.createElement("a");a.href="ending.html?edit="+id;a.textContent=c.title;if(id===key)a.setAttribute("aria-current","page");$("ending-tabs").append(a);
 });
 $("preview-draft").href="ending.html?ending="+key;
 function field(card,label,name,value,tag="input",options){
  const wrap=document.createElement("label");wrap.append(document.createTextNode(label));
  const input=document.createElement(tag);input.dataset.field=name;
  if(options)for(const [v,t] of options){const option=document.createElement("option");option.value=v;option.textContent=t;input.append(option);}
  input.value=value==null?"":value;
  if(name==="hold"){input.type="number";input.min=2;input.max=60;input.step=.5;}
  wrap.append(input);card.append(wrap);
 }
 function render(){
  $("scene-list").replaceChildren();
  data.scenes.forEach((s,i)=>{
   const card=document.createElement("section");card.className="edit-card"+(s.kind==="exploration"?" exploration-card":"");
   const head=document.createElement("div");head.className="card-head";
   const n=document.createElement("span");n.textContent=String(i+1).padStart(2,"0");head.append(n);
   for(const [label,delta] of [["上移",-1],["下移",1],["删除",0]]){
    const b=document.createElement("button");b.textContent=label;b.disabled=delta<0&&i===0||delta>0&&i===data.scenes.length-1||delta===0&&data.scenes.length===1;
    b.onclick=()=>{collect();if(delta){[data.scenes[i],data.scenes[i+delta]]=[data.scenes[i+delta],data.scenes[i]];}else data.scenes.splice(i,1);render();};head.append(b);
   }
   card.append(head);
   const grid=document.createElement("div");grid.className="edit-grid";
   const kinds=[["narration","旁白"],["dialogue","对白"],["monologue","独白"],["card","章节／收束字幕"]];
   if(["good","normal","bad","hidden"].includes(key))kinds.push(["exploration","探索地图（对话在下方修改）"]);
   field(grid,"文字类型","kind",s.kind,"select",kinds);
   field(grid,"发言者（独白留空）","speaker",s.speaker);
   field(grid,"停留秒数","hold",s.hold/1000);
   card.append(grid);
   field(card,"台词／旁白（可以换行）","text",s.text,"textarea");
   field(card,"画面","backdrop",s.backdrop,"select",[["city","城区"],["training","总部"],["street","地下街／街道"],["gate","城门"],["sea","海岸意境"],["black","黑幕"]]);
   field(card,"替换图片路径（可留空）","image",s.image||"");
   if(s.kind==="exploration"){const note=document.createElement("p");note.textContent="这一幕进入可操控地图，停留时间不自动计时。地图对话和地点在下方修改。";card.append(note);}
   $("scene-list").append(card);
  });
  if(["good","normal","bad","hidden"].includes(key)&&data.epilogue){$("epilogue-editor").hidden=false;epilogueEditor=epilogueEngine.mountEditor($("epilogue-editor"),data.epilogue);}
 }
 function collect(){
  data.title=$("edit-title").value.trim();data.subtitle=$("edit-subtitle").value.trim();
  data.scenes=[...$("scene-list").children].map(card=>{
   const values={};card.querySelectorAll("[data-field]").forEach(input=>{values[input.dataset.field]=input.dataset.field==="hold"?Number(input.value)*1000:input.value;});
   if(!values.image)delete values.image;return values;
  });
  if(epilogueEditor)data.epilogue=epilogueEditor.collect();
 }
 function save(){collect();validate(data);localStorage.setItem(draftKey,JSON.stringify(data));$("editor-status").textContent="草稿已保存；预览和本浏览器的正式演出会使用这份草稿。";}
 function action(fn){try{fn();}catch(e){$("editor-status").textContent=e.message;}}
 $("add-beat").onclick=()=>{collect();data.scenes.push({kind:"narration",speaker:"",text:"在这里写下一幕。",backdrop:"black",hold:6500});render();};
 $("save-draft").onclick=()=>action(save);
 $("preview-draft").onclick=e=>{try{save();}catch(err){e.preventDefault();$("editor-status").textContent=err.message;}};
 $("export").onclick=()=>action(()=>{
  save();const content="/* "+data.title+"：结局演出内容 */\nwindow.TitanEndingScripts = window.TitanEndingScripts || {};\nwindow.TitanEndingScripts."+key+" = "+JSON.stringify(data,null,2)+";\n";
  const url=URL.createObjectURL(new Blob([content],{type:"text/javascript;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=key+".js";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $("editor-status").textContent="已导出 "+key+".js；替换 js/endings/ 下的同名文件，才会同步给其他人。";
 });
 $("reset-draft").onclick=()=>{
  const previous=localStorage.getItem(draftKey);
  if(previous)localStorage.setItem(draftKey+"-previous",previous);
  localStorage.removeItem(draftKey);location.reload();
 };
 render();return;
}
try{validate(data);}catch(e){data=clone(source);}
$("player").hidden=false;$("ending-label").textContent=data.title;
$("preview-label").textContent=query.get("from")==="story"?"尾声":"结局预览 · 不写剧情存档";
$("edit-link").href="ending.html?edit="+key;
const audio=new Audio("audio/bgm/good_end.mp3");audio.loop=true;if(key==="good"){audio.id="ending-bgm";audio.hidden=true;document.body.appendChild(audio);}
let index=["good","normal","bad","hidden"].includes(key)&&query.get("part")==="epilogue"&&query.get("from")!=="story"?Math.max(0,data.scenes.findIndex(s=>s.kind==="exploration")):0;
let paused=false,started=false,finished=false,timer=null,remaining=0,deadline=0,transition=false;
let transitionGeneration=0;
let exploration=null,exploring=false;
const goodDialog=key==="good"?window.TitanGoodEndingDialog.create({onNext:()=>move(index+1),onSave:sceneIndex=>{localStorage.setItem("TitanGoodEndingIntro-"+(query.get("from")==="story"?"story":"preview"),JSON.stringify({scenes:JSON.stringify(data.scenes),index:sceneIndex}));}}):null;
if(goodDialog){document.querySelector(".player-header").hidden=true;document.querySelector(".play-controls").hidden=true;}
try{if(goodDialog&&query.get("part")!=="epilogue"){const saved=JSON.parse(localStorage.getItem("TitanGoodEndingIntro-"+(query.get("from")==="story"?"story":"preview")));if(saved&&saved.scenes===JSON.stringify(data.scenes)&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<data.scenes.length)index=saved.index;}}catch(error){}
const seaAmbience=key==="normal"&&data.epilogue?new Audio("audio/sfx/ending-normal-snow-wind.wav"):key==="good"&&data.epilogue&&data.epilogue.variant==="sea-20261009"?new Audio("audio/sfx/coastal-wind-surf.wav"):null;
let nightAmbience=false;
let creditsMusicActive=false;
let seaStarted=false;if(seaAmbience)seaAmbience.loop=true;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function syncAudio(){if(creditsMusicActive)return;const settings=window.TitanSettings.loadSettings();audio.volume=window.TitanSettings.getVolume(.38);if(!settings.music||!started||paused||finished||document.hidden)audio.pause();else audio.play().catch(()=>{});
 if(seaAmbience){seaAmbience.volume=window.TitanSettings.getVolume(key==="normal"?(nightAmbience?.1:.3):.5);if(!settings.sound||!seaStarted||paused||finished||document.hidden)seaAmbience.pause();else seaAmbience.play().catch(()=>{});}
}
function stopTimer(){if(timer!==null){clearTimeout(timer);timer=null;remaining=Math.max(0,deadline-performance.now());}}
function arm(){if(paused||finished||document.hidden||exploring||(goodDialog&&goodDialog.active()))return;deadline=performance.now()+remaining;timer=setTimeout(()=>{timer=null;move(index+1);},remaining);}
async function show(){
 transition=true;const generation=++transitionGeneration;$("beat").classList.remove("is-visible");
 if(!(goodDialog&&goodDialog.active()&&["narration","dialogue","monologue"].includes(data.scenes[index].kind)))await sleep(900);if(generation!==transitionGeneration||finished)return;
 const s=data.scenes[index];
 if(goodDialog)goodDialog.hide();
 if(s.kind==="exploration"){
  $("beat").className="";exploring=true;transition=false;seaStarted=true;syncAudio();
  if(!exploration)exploration=epilogueEngine.create(data.epilogue,{
   editUrl:"ending.html?edit="+key+"#epilogue-editor",
   onNight:()=>{nightAmbience=true;syncAudio();},
   preview:query.get("from")!=="story",
   onPause:togglePause,
   onComplete:()=>{exploring=false;move(index+1);}
  });
  exploration.start(paused);return;
 }
 const path=safeImage(s.image)||backgrounds[s.backdrop];
 if(goodDialog&&["narration","dialogue","monologue"].includes(s.kind)){
  $("beat").className="";transition=false;remaining=0;
  goodDialog.show(s,path,paused,index);return;
 }
 $("backdrop").className=s.image?"":s.backdrop;
 $("backdrop").style.backgroundImage=path?'url("'+path+'")':s.backdrop==="sea"?"":"none";
 $("backdrop").style.backgroundColor="#000";
 $("beat").className=s.kind;$("beat-speaker").textContent=s.kind==="dialogue"?s.speaker:"";$("beat-speaker").hidden=s.kind!=="dialogue"||!s.speaker;
 $("beat-text").textContent=s.text;$("position").textContent=(index+1)+" / "+data.scenes.length;
 $("previous").disabled=index===0;
 $("next").textContent=index===data.scenes.length-1?"进入片尾":"下一幕";
 requestAnimationFrame(()=>$("beat").classList.add("is-visible"));
 remaining=s.hold+900;transition=false;arm();
}
function move(to){if(transition||finished||!started||exploring)return;stopTimer();if(to>=data.scenes.length){finish();return;}index=Math.max(0,to);show();}
function togglePause(){if(!started||finished)return;paused=!paused;$("pause").textContent=paused?"继续":"暂停";if(paused)stopTimer();else if(!transition)arm();if(exploration&&exploring)exploration.setPaused(paused);if(goodDialog)goodDialog.setPaused(paused);syncAudio();}
async function finish(){
 if(finished)return;finished=true;if(key==="good")creditsMusicActive=true;++transitionGeneration;stopTimer();document.body.classList.add("is-finished");
 if(exploration)exploration.stop();if(goodDialog)goodDialog.hide();exploring=false;
 $("beat").classList.remove("is-visible");$("fade").classList.remove("is-open");
 const base=audio.volume;for(let i=1;i<=15;i++){if(key!=="good")audio.volume=base*(1-i/15);if(seaAmbience)seaAmbience.volume=window.TitanSettings.getVolume(key==="normal"?(nightAmbience?.1:.3):.5)*(1-i/15);await sleep(100);}if(key!=="good")audio.pause();if(seaAmbience)seaAmbience.pause();
 if(query.get("from")==="story"){
  const saved=window.TitanSave.loadGameSave();
  if(saved&&saved.state&&saved.state.currentScene==="ending_"+key+"_01"){
   saved.state.flags["chapter5_"+key+"_ending"]=true;saved.state.flags.chapter5_complete=true;
   window.TitanAchievements.unlockAchievement("ending_"+key);
   saved.state.achievements=window.TitanAchievements.getAchievements();window.TitanSave.saveGame(saved.state);
  }
 }
 await sleep(450);
 const creditsUrl="credits.html?ending="+encodeURIComponent(key)+"&title="+encodeURIComponent(data.title)+"&thought="+encodeURIComponent(data.subtitle||"");
 if(key==="good"){
  // Keep the same live audio element while the existing credits page takes over.
  creditsMusicActive=true;window.TitanCreditsMusic={audio:audio,baseVolume:.38};
  const frame=document.createElement("iframe");frame.title="尾声滚动字幕";
  frame.style.cssText="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647;background:#000";
  frame.setAttribute("allow","autoplay");frame.src=creditsUrl;
  frame.onload=()=>{frame.focus();$("player").hidden=true;};document.body.appendChild(frame);
 }else location.href=creditsUrl;
}
function startPresentation(){
 if(started)return;
 started=true;$("begin").hidden=true;
 $("fade").classList.add("is-open");syncAudio();show();
}
$("begin").onclick=startPresentation;
if(query.get("from")==="story"){
 document.querySelector(".player-header").hidden=true;
 document.querySelector(".play-controls").hidden=true;
}
// Start visually without a second gate. If audio needs a gesture, any normal
// interaction resumes it without displaying an extra playback screen.
document.addEventListener("pointerdown",()=>{if(started)syncAudio();},{passive:true});
document.addEventListener("keydown",()=>{if(started)syncAudio();});
startPresentation();
$("previous").onclick=()=>move(index-1);$("next").onclick=()=>move(index+1);$("pause").onclick=togglePause;
$("credits").onclick=finish;
document.addEventListener("keydown",e=>{
 if(exploring||(goodDialog&&goodDialog.active()))return;
 if(e.target.closest("a,button,input,textarea,select"))return;
 if(e.key==="Enter"){e.preventDefault();if(!started)$("begin").click();else move(index+1);}
 if(e.key===" "){e.preventDefault();togglePause();}
 if(e.key==="ArrowRight")move(index+1);if(e.key==="ArrowLeft")move(index-1);
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopTimer();else if(started&&!transition&&!finished)arm();syncAudio();});
window.addEventListener("titan-settings-changed",syncAudio);
window.addEventListener("pagehide",()=>{finished=true;stopTimer();audio.pause();if(seaAmbience)seaAmbience.pause();if(exploration)exploration.stop();if(goodDialog)goodDialog.hide();});
}());
