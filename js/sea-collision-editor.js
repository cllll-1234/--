(function(){'use strict';
 const KEY='TitanSeaCollisionOverride-v1',source=window.TitanEndingScripts.good,c=source.epilogue;
 const $=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
 const fields=['x','y','width','height'],handles=['nw','n','ne','e','se','s','sw','w'];
 let rects=clone(c.collisions||[]),selected=-1,history=[],future=[],drag=null,saved=true;
 function valid(v){return v&&v.background===c.background&&v.variant===c.variant&&v.width===c.width&&v.height===c.height&&Array.isArray(v.collisions)&&v.collisions.every(r=>fields.every(k=>Number.isFinite(r[k]))&&r.x>=0&&r.y>=0&&r.width>=12&&r.height>=12&&r.x+r.width<=c.width&&r.y+r.height<=c.height);}
 try{const v=JSON.parse(localStorage.getItem(KEY));if(valid(v))rects=clone(v.collisions);}catch(e){}
 $('background').src=c.background;$('map').style.aspectRatio=c.width+'/'+c.height;
 function position(el,r){el.style.left=r.x/c.width*100+'%';el.style.top=r.y/c.height*100+'%';el.style.width=r.width/c.width*100+'%';el.style.height=r.height/c.height*100+'%';}
 function clamp(r){r.x=Math.round(Math.max(0,Math.min(c.width-12,r.x)));r.y=Math.round(Math.max(0,Math.min(c.height-12,r.y)));r.width=Math.round(Math.max(12,Math.min(c.width-r.x,r.width)));r.height=Math.round(Math.max(12,Math.min(c.height-r.y,r.height)));return r;}
 function status(t){$('status').textContent=t;}
 function checkpoint(){history.push(clone(rects));if(history.length>80)history.shift();future=[];saved=false;}
 function update(){const r=rects[selected];$('selection').textContent=r?'碰撞区域 '+(selected+1):'点击任意红框';for(const k of fields){$(k).disabled=!r;$(k).value=r?r[k]:'';}$('remove').disabled=!r;$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
 function render(){const host=$('rectangles');host.replaceChildren();rects.forEach((r,i)=>{const el=document.createElement('div');el.className='collision'+(i===selected?' selected':'');el.dataset.index=i;el.setAttribute('aria-label','碰撞区域 '+(i+1));position(el,r);const label=document.createElement('span');label.textContent=i+1;el.append(label);if(i===selected)for(const h of handles){const corner=document.createElement('div');corner.className='handle '+h;corner.dataset.handle=h;corner.setAttribute('aria-label','缩放 '+h);el.append(corner);}host.append(el);});update();}
 for(const p of [...c.points,...(c.residents||[])])if(p.sprite){const el=document.createElement('div');el.className='fixed';position(el,{x:p.x+7,y:p.y+38,width:30,height:17});const label=document.createElement('span');label.textContent=p.name||'人物';el.append(label);$('fixed').append(el);}
 $('spawn').style.left=(c.spawn.x+22)/c.width*100+'%';$('spawn').style.top=(c.spawn.y+46)/c.height*100+'%';
 $('map').addEventListener('pointerdown',e=>{const el=e.target.closest('.collision');if(!el)return;selected=Number(el.dataset.index);const mode=e.target.dataset.handle||'move';drag={changed:false,id:e.pointerId,x:e.clientX,y:e.clientY,start:clone(rects[selected]),mode};$('map').setPointerCapture(e.pointerId);e.preventDefault();render();});
 $('map').addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const box=$('map').getBoundingClientRect(),dx=(e.clientX-drag.x)*c.width/box.width,dy=(e.clientY-drag.y)*c.height/box.height,r=clone(drag.start),m=drag.mode;if(!drag.changed){if(Math.abs(dx)+Math.abs(dy)<1)return;checkpoint();drag.changed=true;}
  if(m==='move'){r.x=Math.max(0,Math.min(c.width-r.width,r.x+dx));r.y=Math.max(0,Math.min(c.height-r.height,r.y+dy));}else{let l=r.x,t=r.y,right=r.x+r.width,bottom=r.y+r.height;if(m.includes('w'))l=Math.max(0,Math.min(right-12,l+dx));if(m.includes('e'))right=Math.max(l+12,Math.min(c.width,right+dx));if(m.includes('n'))t=Math.max(0,Math.min(bottom-12,t+dy));if(m.includes('s'))bottom=Math.max(t+12,Math.min(c.height,bottom+dy));Object.assign(r,{x:l,y:t,width:right-l,height:bottom-t});}
  rects[selected]=clamp(r);position($('rectangles').children[selected],rects[selected]);update();status('未保存 · 拖动结束后点“保存并应用”');
 });
 function end(e){if(!drag||e.pointerId!==drag.id)return;drag=null;render();} $('map').addEventListener('pointerup',end);$('map').addEventListener('pointercancel',end);
 for(const k of fields)$(k).addEventListener('change',()=>{if(selected<0)return;const n=Number($(k).value);if(!Number.isFinite(n)){update();return;}checkpoint();rects[selected]=clamp({...rects[selected],[k]:n});render();status('未保存');});
 $('add').onclick=()=>{checkpoint();rects.push({x:Math.round(c.width*.45),y:Math.round(c.height*.5),width:140,height:90});selected=rects.length-1;render();status('已添加 · 可拖动移动');};
 $('remove').onclick=()=>{if(selected<0)return;checkpoint();rects.splice(selected,1);selected=Math.min(selected,rects.length-1);render();status('未保存');};
 $('undo').onclick=()=>{if(!history.length)return;future.push(clone(rects));rects=history.pop();selected=-1;saved=false;render();status('已撤销 · 未保存');};
 $('redo').onclick=()=>{if(!future.length)return;history.push(clone(rects));rects=future.pop();selected=-1;saved=false;render();status('已重做 · 未保存');};
 function save(){const value={variant:c.variant,background:c.background,width:c.width,height:c.height,collisions:rects};if(!valid(value))throw Error('请检查框的位置和尺寸');localStorage.setItem(KEY,JSON.stringify(value));saved=true;status('已保存并应用 · 刷新试玩页即可生效');}
 $('save').onclick=()=>{try{save();}catch(e){status('保存失败：'+e.message);}};
 $('preview').onclick=e=>{try{save();}catch(err){e.preventDefault();status('保存失败：'+err.message);}};
 $('export').onclick=()=>{const data=clone(source);data.epilogue.collisions=clone(rects);const blob=new Blob(['/* 好结局：仅修改海边碰撞区域 */\nwindow.TitanEndingScripts=window.TitanEndingScripts||{};\nwindow.TitanEndingScripts.good='+JSON.stringify(data,null,2)+';\n'],{type:'text/javascript;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='good.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('已导出 good.js · 替换同名文件后可分享给同学');};
 $('reset').onclick=()=>{checkpoint();rects=clone(c.collisions||[]);selected=-1;render();status('已恢复原版框 · 保存后应用，可撤销');};
 document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'redo':'undo').click();return;}if(e.key==='Delete'){e.preventDefault();$('remove').click();return;}if(selected>=0&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();checkpoint();const r=rects[selected],d=e.shiftKey?10:1;r.x+=e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0;r.y+=e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0;clamp(r);render();status('未保存');}});
 window.addEventListener('beforeunload',e=>{if(!saved){e.preventDefault();e.returnValue='';}});render();status('拖动和缩放红框即可修改；保存前不影响游戏。');
})();
