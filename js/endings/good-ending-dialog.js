/* 好结局开场沿用前文章节的 GAL 对话形式。 */
(function(){'use strict';
 window.TitanGoodEndingDialog={create(options){
  const root=document.createElement('section');root.id='good-ending-dialog';root.hidden=true;
  root.innerHTML='<div class="epilogue-dialog-stage"><section class="character-layer"><img class="epilogue-portrait" hidden alt=""></section></div><header class="game-topbar"><span class="chapter-label">破晓的黎明 · 广播结束后</span><nav class="game-controls" aria-label="游戏控制"><button class="button ghost save">保存</button><button class="button ghost settings">设置</button><a class="button ghost" href="index.html">返回主页</a></nav></header><section class="dialog-area" aria-label="结局对话"><h1 class="speaker" hidden></h1><div class="epilogue-dialog-box" role="button" tabindex="0" aria-label="对话框，点击显示全文或继续"><p class="epilogue-dialog-text"></p><span class="continue-hint" hidden>点击继续 ▼</span></div></section><section class="epilogue-settings" aria-label="设置" hidden><div><h2>设置</h2><label>文字速度<input name="textSpeed" type="range" min="10" max="100" step="5"><output class="speed"></output></label><label>音乐<input name="music" type="checkbox"></label><label>音效<input name="sound" type="checkbox"></label><label>音量<input name="volume" type="range" min="0" max="100"><output class="volume"></output></label><button class="close">返回游戏</button></div></section><div class="epilogue-toast" role="status" hidden></div>';
  document.body.append(root);const $=s=>root.querySelector(s),text=$('.epilogue-dialog-text'),box=$('.epilogue-dialog-box');
  const portraits={韩吉:'images/characters/dialog/hange_normal.png',莱纳:'images/characters/dialog/reiner_normal.png',利威尔:'images/characters/dialog/levi_normal.png'};
  let letters=[],at=0,timer=null,paused=false,settings=false,sceneIndex=0,toastTimer;
  function stop(){clearInterval(timer);timer=null;}
  function type(){stop();if(root.hidden||paused||settings||at>=letters.length)return;timer=setInterval(()=>{at++;text.textContent=letters.slice(0,at).join('');if(at>=letters.length){stop();$('.continue-hint').hidden=false;}},window.TitanSettings.loadSettings().textSpeed);}
  function advance(){if(root.hidden||paused||settings)return;if(at<letters.length){stop();at=letters.length;text.textContent=letters.join('');$('.continue-hint').hidden=false;}else options.onNext();}
  box.onclick=advance;
  document.addEventListener('keydown',e=>{
   if(root.hidden||settings||paused||!['Enter',' '].includes(e.key))return;
   if(e.target.closest('input,textarea,select,button,a'))return;
   e.preventDefault();e.stopPropagation();
   if(!e.repeat)advance();
  });
  function refresh(){const v=window.TitanSettings.loadSettings();for(const n of ['textSpeed','music','sound','volume']){const el=$('[name="'+n+'"]');if(el.type==='checkbox')el.checked=v[n];else el.value=v[n];}$('.speed').textContent=v.textSpeed+' ms/字';$('.volume').textContent=v.volume+'%';}
  $('.settings').onclick=()=>{settings=true;stop();refresh();$('.epilogue-settings').hidden=false;$('.close').focus();};
  $('.close').onclick=()=>{settings=false;$('.epilogue-settings').hidden=true;type();box.focus();};
  $('.epilogue-settings').oninput=()=>{const v=window.TitanSettings.loadSettings();for(const n of ['textSpeed','music','sound','volume']){const el=$('[name="'+n+'"]');v[n]=el.type==='checkbox'?el.checked:Number(el.value);}window.TitanSettings.saveSettings(v);refresh();};
  $('.save').onclick=()=>{options.onSave(sceneIndex);clearTimeout(toastTimer);$('.epilogue-toast').textContent='进度已保存。';$('.epilogue-toast').hidden=false;toastTimer=setTimeout(()=>$('.epilogue-toast').hidden=true,2200);};
  return {show(scene,path,isPaused,index){stop();sceneIndex=index;paused=isPaused;root.hidden=false;root.classList.add('is-visible');$('.epilogue-dialog-stage').style.backgroundImage=path?'url("'+path+'")':'none';const name=scene.kind==='dialogue'?scene.speaker:'';$('.speaker').textContent=name||'';$('.speaker').hidden=!name;const portrait=$('.epilogue-portrait'),src=portraits[name];portrait.hidden=!src;if(src){portrait.src=src;portrait.alt=name+'角色立绘';}else portrait.removeAttribute('src');letters=Array.from(scene.text);at=0;text.textContent='';$('.continue-hint').hidden=true;type();box.focus({preventScroll:true});},hide(){stop();root.hidden=true;settings=false;$('.epilogue-settings').hidden=true;},setPaused(v){paused=v;type();},advance,active:()=>!root.hidden};
 }};
})();
