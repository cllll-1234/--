/* 普通结局探索尾声。访问记录只存在于本次演出，不参与主线结局判定。 */
(function () {
  "use strict";
  const clone = value => JSON.parse(JSON.stringify(value));
  const directions = ["up", "down", "left", "right"];
  const assets = {};
  directions.forEach(direction => {
    const suffix = direction[0].toUpperCase() + direction.slice(1);
    assets["idle" + suffix] = "images/explore/player/reiner-gold/reiner_idle_" + direction + ".png";
    assets["walk" + suffix] = Array.from({length: 2}, (_, i) => "images/explore/player/reiner-gold/reiner_walk_" + direction + "_" + (i + 1) + ".png");
  });
  const imagePath = value => typeof value === "string" && /^images\/[^"'<>]+\.(png|jpe?g|webp)$/i.test(value);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  function validate(config) {
    if (!config || !config.title || !imagePath(config.background)) throw new Error("请填写探索地图名称和 images/ 下的地图图片路径。");
    if (!Number.isFinite(config.width) || !Number.isFinite(config.height) || config.width < 400 || config.height < 300) throw new Error("地图尺寸无效。");
    if (!Array.isArray(config.points) || !config.points.length || new Set(config.points.map(p => p.id)).size !== config.points.length) throw new Error("探索地点需要唯一的编号。");
    function lines(value) { return Array.isArray(value) && value.length && value.every(s => typeof s.text === "string" && s.text.trim()); }
    if (!lines(config.intro) || !lines(config.closing) || !lines(config.beforeExit)) throw new Error("请保留探索开场、未点齐灯的提示和夜间收束对话。");
    for (const p of [config.spawn, config.departure]) if (!p || ![p.x,p.y].every(Number.isFinite)) throw new Error("地图入口或离场位置无效。");
    if (!config.points.some(p => p.id === config.purposeId) || !config.points.some(p => p.type === "exit")) throw new Error("请保留山口引路灯和驿站入口。");
    for (const p of config.points) {
      if (!p.name || !lines(p.dialogue) || (p.repeat && !lines(p.repeat))) throw new Error("每个探索地点至少需要一幕文字。");
      if (![p.x, p.y].every(Number.isFinite) || p.x < 0 || p.y < 0 || p.x + 44 > config.width || p.y + 56 > config.height) throw new Error("探索地点应在地图范围内。");
      if (p.sprite && !imagePath(p.sprite)) throw new Error("人物图片需在 images/ 下。");
    }
    for (const r of config.collisions || []) if (![r.x, r.y, r.width, r.height].every(Number.isFinite) || r.width < 0 || r.height < 0) throw new Error("地图障碍物尺寸无效。");
    if(config.requiredIds&&(!Array.isArray(config.requiredIds)||config.requiredIds.some(id=>!config.points.some(p=>p.id===id&&p.type==="lamp"))))throw new Error("请保留三盏引路灯的编号。");
    return config;
  }

  function mountEditor(container, config) {
    const draft = clone(config), values = {};
    container.className = "epilogue-edit-section";
    container.replaceChildren();
    const heading = document.createElement("h2"); heading.textContent = "入冬 · 探索地图与对话"; container.append(heading);
    const help = document.createElement("p"); help.className = "help";
    help.textContent = "每段为一幕，空行分隔。写成“发言者｜台词”；旁白和独白写“｜文字”，不会显示莱纳的名字。改完后，与上面的演出一起保存或导出。"; container.append(help);
    function field(parent, label, value, multiline) {
      const wrapper = document.createElement("label"), control = document.createElement(multiline ? "textarea" : "input");
      wrapper.append(document.createTextNode(label)); control.value = value == null ? "" : value; wrapper.append(control); parent.append(wrapper); return control;
    }
    const serialize = lines => lines.map(s => (s.speaker || "") + "｜" + s.text).join("\n\n");
    const parse = value => value.split(/\n\s*\n/).filter(s => s.trim()).map(block => {
      const at = block.indexOf("｜"); return {speaker: at < 0 ? "" : block.slice(0, at).trim(), text: (at < 0 ? block : block.slice(at + 1)).trim()};
    });
    values.title = field(container, "地图名称", draft.title);
    values.background = field(container, "地图图片路径", draft.background);
    values.dialogueBackground = field(container, "驿站对话背景图片", draft.dialogueBackground || "");
    values.finalImage = field(container, "敲门与开门的结尾图片", draft.finalImage || "");
    values.objective = field(container, "点灯前的提示", draft.objective);
    values.afterObjective = field(container, "三盏灯点亮后的提示", draft.afterObjective);
    values.intro = field(container, "进入避难站的对话", serialize(draft.intro), true);
    const points = draft.points.map(p => {
      const box = document.createElement("fieldset"), legend = document.createElement("legend"); legend.textContent = p.name; box.append(legend); container.append(box);
      const name = field(box, "地点／人物名称", p.name);
      const coordinates = document.createElement("div"); coordinates.className = "epilogue-edit-coordinates"; box.append(coordinates);
      const x = field(coordinates, "地图 X 坐标", p.x), y = field(coordinates, "地图 Y 坐标", p.y); x.type = y.type = "number";
      const sprite = field(box, "人物图片路径（物件留空）", p.sprite || "");
      const dialogue = field(box, "首次交谈／查看", serialize(p.dialogue), true);
      const repeat = field(box, "再次交谈／查看", serialize(p.repeat || p.dialogue), true);
      return {original: p, name, x, y, sprite, dialogue, repeat};
    });
    values.beforeExit = field(container, "未点齐灯时的提示", serialize(draft.beforeExit), true);
    values.closing = field(container, "确认离开后的收束对话", serialize(draft.closing), true);
    return {collect: () => {
      const result = clone(draft);
      for (const key of ["title", "background", "dialogueBackground", "finalImage", "objective", "afterObjective"]) result[key] = values[key].value.trim();
      result.intro = parse(values.intro.value).map((line,i)=>Object.assign({},draft.intro[i],line)); result.closing = parse(values.closing.value).map((line,i)=>Object.assign({},draft.closing[i],line));
      result.beforeExit = parse(values.beforeExit.value).map((line,i)=>Object.assign({},draft.beforeExit[i],line));
      result.points = points.map(p => Object.assign({}, p.original, {name: p.name.value.trim(), x: Number(p.x.value), y: Number(p.y.value), sprite: p.sprite.value.trim(), dialogue: parse(p.dialogue.value).map((line,i)=>Object.assign({},p.original.dialogue[i],line)), repeat: parse(p.repeat.value).map((line,i)=>Object.assign({},(p.original.repeat||p.original.dialogue)[i],line))}));
      return validate(result);
    }};
  }

  function create(config, options) {
    validate(config);
    const root = document.createElement("section"); root.id = "normal-epilogue"; root.hidden = true;
    root.innerHTML = '<div class="epilogue-viewport" tabindex="0" aria-label="尾声探索地图"><div class="epilogue-world"><div class="epilogue-player" data-direction="up"><img class="player-sprite" alt="莱纳" draggable="false"></div></div></div>' +
      '<div class="epilogue-cinema" hidden></div>' +
      '<div class="epilogue-dialog-stage" hidden><section class="character-layer"><img class="epilogue-portrait" alt="" hidden></section></div>' +
      '<header class="game-topbar"><span class="chapter-label">沉默者 · 入冬 · 城门安置区</span><nav class="game-controls" aria-label="游戏控制"><button class="button ghost epilogue-save">保存</button><button class="button ghost epilogue-settings-button">设置</button><a class="button ghost" href="index.html">返回主页</a></nav></header>' +
      '<aside class="explore-objective"><span>当前目标</span><strong class="epilogue-objective" aria-live="polite"></strong></aside><button class="epilogue-prompt" hidden></button><div class="epilogue-toast" role="status" hidden></div>' +
      '<div class="epilogue-touch" aria-label="移动控制"><button data-direction="up" aria-label="向上移动">↑</button><button data-direction="left" aria-label="向左移动">←</button><button data-direction="down" aria-label="向下移动">↓</button><button data-direction="right" aria-label="向右移动">→</button></div>' +
      '<section class="epilogue-talk dialog-area" aria-label="尾声对话" hidden><h1 class="speaker"></h1><div class="epilogue-dialog-box" role="button" tabindex="0" aria-label="对话框，点击显示全文或继续"><p class="epilogue-dialog-text" aria-live="polite"></p><div class="choices" hidden><button class="choice-button epilogue-stay">再停留一会</button><button class="choice-button epilogue-next">走向城门</button></div><span class="continue-hint" hidden>点击继续 ▼</span></div></section>' +
      '<section class="epilogue-settings" aria-label="设置" hidden><div><h2>设置</h2><label>文字速度 <input name="textSpeed" type="range" min="10" max="100" step="5"><output class="epilogue-speed-value"></output></label><label>音乐 <input name="music" type="checkbox"></label><label>音效 <input name="sound" type="checkbox"></label><label>音量 <input name="volume" type="range" min="0" max="100"><output class="epilogue-volume-value"></output></label><button class="epilogue-settings-close">返回游戏</button></div></section>' +
      '<div class="epilogue-paused" hidden><button>继续探索</button></div><div class="epilogue-screenfade"></div>';
    document.body.append(root);
    const $ = selector => root.querySelector(selector);
    const viewport = $(".epilogue-viewport"), world = $(".epilogue-world"), actor = $(".epilogue-player"), talk = $(".epilogue-talk"), text = $(".epilogue-dialog-text");
    world.style.width = config.width + "px"; world.style.height = config.height + "px"; world.style.backgroundImage = 'url("' + config.background + '")';
    $(".chapter-label").textContent = "沉默者 · 入冬 · " + config.title;
    viewport.setAttribute("aria-label",config.title+"探索地图");
    $(".epilogue-next").textContent=config.exitLabel||"走向城门";
    $(".epilogue-stay").textContent=config.stayLabel||"再停留一会";
    if(config.variant==="sea-20261009")root.classList.add("is-sea");
    const cinema=$(".epilogue-cinema");
    if(config.finalImage)cinema.style.backgroundImage='url("'+config.finalImage+'")';
    for(const path of [config.background,config.dialogueBackground,config.finalImage])if(path){const image=new Image();image.src=path;}
    const portraits = Object.assign({"莱纳":"images/characters/dialog/reiner_normal.png", "韩吉":"images/characters/dialog/hange_normal.png", "利威尔":"images/characters/dialog/levi_normal.png", "医疗兵":"images/characters/dialog/medic_normal.png", "幸存者":"images/characters/dialog/civilian_a.png", "卡尔的母亲":"images/characters/dialog/karl_mother_normal.png"}, config.dialoguePortraits || {});
    const checkpointKey = "TitanNormalEpilogue-checkpoint-" + (options.preview ? "preview" : "story");
    const signature = JSON.stringify(config);
    let conversationId = "intro", settingsOpen = false, toastTimer;
    let seaRevealed=!config.entrance, revealing=false, finalizing=false;
    function showToast(message) {clearTimeout(toastTimer);$(".epilogue-toast").textContent=message;$(".epilogue-toast").hidden=false;toastTimer=setTimeout(()=>$(".epilogue-toast").hidden=true,2200);}
    function saveCheckpoint() {
      if(leaving||finalizing||revealing)return;
      try {localStorage.setItem(checkpointKey,JSON.stringify({signature,position:{x:player.worldX,y:player.worldY},visited:[...visited],conversation:dialogue?conversationId:null,line:lineIndex,seaRevealed,initialExit:Boolean(dialogue&&config.points.some(p=>p.id===conversationId&&p.type==="exit"&&p.dialogue===dialogue.lines))}));showToast("进度已保存。");}
      catch(error){showToast("保存失败，请检查浏览器存储权限。");}
    }
    function refreshSettings(){const values=window.TitanSettings.loadSettings();for(const name of ["textSpeed","volume","music","sound"]){const input=$(".epilogue-settings [name="+name+"]");if(input.type==="checkbox")input.checked=values[name];else input.value=values[name];}$(".epilogue-speed-value").textContent=values.textSpeed+" ms/字";$(".epilogue-volume-value").textContent=values.volume+"%";}
    function closeSettings(){settingsOpen=false;$(".epilogue-settings").hidden=true;player.setActive(running&&!paused&&!settingsOpen&&!dialogue&&!leaving&&!finalizing&&!revealing);if(dialogue&&!paused)startTyping();if(dialogue)$(".epilogue-dialog-box").focus({preventScroll:true});else viewport.focus({preventScroll:true});}
    $(".epilogue-save").onclick=saveCheckpoint;
    $(".epilogue-settings-button").onclick=()=>{if(leaving||finalizing)return;settingsOpen=true;clearPath();player.setActive(false);stopTyping();refreshSettings();$(".epilogue-settings").hidden=false;$(".epilogue-settings-close").focus();};
    $(".epilogue-settings-close").onclick=closeSettings;
    $(".epilogue-settings").addEventListener("input",()=>{const values=window.TitanSettings.loadSettings();for(const name of ["textSpeed","volume","music","sound"]){const input=$(".epilogue-settings [name="+name+"]");values[name]=input.type==="checkbox"?input.checked:Number(input.value);}window.TitanSettings.saveSettings(values);refreshSettings();});
    const visited = new Set(), pointElements = new Map();
    const snow = document.createElement("div"); snow.className="snowfall";snow.setAttribute("aria-hidden","true");
    for(let i=0;i<24;i++){const flake=document.createElement("i");flake.style.cssText="left:"+(i*43%100)+"%;--drift:"+(i%2?32:-45)+"px;animation-delay:-"+(i*.83)+"s;animation-duration:"+(9+i%7)+"s";snow.append(flake);}root.append(snow);
    root.classList.add("is-snow");
    const knocks = new Audio("audio/sfx/ending-normal-door-knock.wav"),ignite = new Audio("audio/sfx/ending-normal-lamp.wav");
    let holdUntil=0;
    const sounds=[knocks,ignite];
    function sound(audio){if(!window.TitanSettings.loadSettings().sound)return;audio.currentTime=0;audio.volume=window.TitanSettings.getVolume(.65);audio.play().catch(()=>{});}
    window.addEventListener("titan-settings-changed",()=>sounds.forEach(a=>{a.volume=window.TitanSettings.getVolume(.65);if(!window.TitanSettings.loadSettings().sound)a.pause();}));
    const requirements=config.requiredIds||[config.purposeId];
    function complete(){return requirements.every(id=>visited.has(id));}
    function refreshLamps(){for(const p of config.points){if(p.type!=="lamp")continue;const el=pointElements.get(p.id);if(!el)continue;el.classList.toggle("is-lit",visited.has(p.id));el.querySelector(".epilogue-name").textContent=p.name+(visited.has(p.id)?" · 已点亮":"");}}
    function nightSound(state){if(options.onNight)options.onNight(state);}
    let running = false, leaving = false, paused = false, dialogue = null, lineIndex = 0, letters = [], letterIndex = 0, typeTimer = null;
    let nearest = null, path = [], pendingPoint = null, walkingFrame = 0, generation = 0;
    function foot(position) { return {x: position.worldX + 22, y: position.worldY + 46}; }
    function distance(position, p) { const f = foot(position); return Math.hypot(f.x - (p.x + 22), f.y - (p.y + 46)); }
    const interaction = {manager: {getState: () => ({flags: {}})}, update: update, interact: () => interact(nearest)};
    const player = new window.TitanPlayerController(actor, interaction); player.speed = 165;
    const map = {width: config.width, height: config.height, spawn: config.spawn, playerAssets: assets, collisions: clone(config.collisions || [])};
    for (const p of config.points) {
      const element = document.createElement("button"); element.className = "epilogue-entity" + (p.sprite ? "" : " is-object");
      element.style.left = p.x + "px"; element.style.top = p.y + "px"; element.style.zIndex = Math.round(p.y + 56);
      element.setAttribute("aria-label", p.prompt || (p.sprite ? "与" + p.name + "交谈" : "查看" + p.name));
      if(p.type==="lamp"){const glow=document.createElement("span");glow.className="lamp-glow";glow.style.left=(p.light.x-p.x)+"px";glow.style.top=(p.light.y-p.y)+"px";element.append(glow);}
      if (p.sprite) {
        const image = document.createElement("img"); image.src = p.sprite; image.alt = ""; image.draggable = false; element.append(image);
        map.collisions.push({x: p.x + 7, y: p.y + 38, width: 30, height: 17});
      }
      const label = document.createElement("span"); label.className = "epilogue-name"; label.textContent = p.name;if(p.type==="lamp"){label.style.bottom="auto";label.style.top=(p.light.y-p.y-40)+"px";} element.append(label);
      element.addEventListener("click", e => {e.stopPropagation(); if (running && !paused && !settingsOpen && !dialogue && !leaving && !finalizing && !revealing) walkTo(p.x, p.y, p);});
      world.append(element); pointElements.set(p.id, element);
    }
    for (const npc of config.residents || []) {
      const element = document.createElement("div"); element.className = "epilogue-entity"; element.style.pointerEvents = "none";
      element.style.left = npc.x + "px"; element.style.top = npc.y + "px"; element.style.zIndex = Math.round(npc.y + 56);
      const image = document.createElement("img"); image.src = npc.sprite; image.alt = ""; element.append(image); world.append(element);
      map.collisions.push({x: npc.x + 7, y: npc.y + 38, width: 30, height: 17});
    }
    player.setOnMove(position => {
      actor.style.zIndex = Math.round(position.worldY + 56);
      if(config.entrance&&!seaRevealed&&!dialogue&&!revealing&&position.worldY<config.entrance.revealY)revealSea();
      if(!seaRevealed&&!revealing)fit();
      followPath(position);
    });
    function fit() {
      let scale = Math.min(viewport.clientWidth / config.width, viewport.clientHeight / config.height);
      let x=(viewport.clientWidth-config.width*scale)/2,y=(viewport.clientHeight-config.height*scale)/2;
      if(config.entrance&&!seaRevealed){
        scale*=config.entrance.zoom||2.65;
        x=viewport.clientWidth*.5-(player.worldX+22)*scale;
        y=viewport.clientHeight*.72-(player.worldY+46)*scale;
        x=Math.min(0,Math.max(viewport.clientWidth-config.width*scale,x));
        y=Math.min(0,Math.max(viewport.clientHeight-config.height*scale,y));
      }
      world.style.transform="translate("+x+"px,"+y+"px) scale("+scale+")";
    }
    async function waitActive(ms,token=generation) {
      let elapsed=0,last=performance.now();
      while(elapsed<ms&&running&&token===generation){await delay(40);const now=performance.now();if(!paused&&!settingsOpen&&!document.hidden)elapsed+=Math.min(100,now-last);last=now;}
    }
    async function revealSea(){
      if(seaRevealed||revealing)return;
      const token=generation;revealing=true;clearPath();player.setActive(false);
      root.classList.remove("is-arriving");root.classList.add("is-revealing");
      seaRevealed=true;fit();
      await waitActive(config.entrance.hold||4200,token);if(token!==generation||!running)return;
      revealing=false;root.classList.remove("is-revealing");updateObjective();player.setActive(!paused&&!settingsOpen&&!dialogue);viewport.focus({preventScroll:true});
    }
    function clearPath() { path = []; pendingPoint = null; player.clearKeys(); }
    function update(position) {
      if (!running || paused || settingsOpen || dialogue || leaving || finalizing || revealing) { $(".epilogue-prompt").hidden = true; return; }
      const candidate = config.points.filter(p => distance(position, p) < (p.range || 125)).sort((a,b) => distance(position,a) - distance(position,b))[0] || null;
      if (candidate !== nearest) {
        nearest = candidate;
        for (const p of config.points) pointElements.get(p.id).classList.toggle("is-near", p === nearest);
      }
      $(".epilogue-prompt").hidden = !nearest;
      if (nearest) $(".epilogue-prompt").textContent = "[E] " + (nearest.prompt || (nearest.sprite ? "与" + nearest.name + "交谈" : "查看" + nearest.name));
    }
    function routeTo(targetX, targetY, targetPoint) {
      const cell = 24, sx = Math.round(player.worldX / cell), sy = Math.round(player.worldY / cell);
      const target = targetPoint ? {x: targetPoint.x, y: targetPoint.y} : {x: targetX, y: targetY};
      const heuristic = node => Math.hypot(node.x * cell - target.x, node.y * cell - target.y) / cell;
      const start = {x:sx, y:sy, g:0, parent:null}; start.h = heuristic(start);
      const open = [start], best = new Map([[sx+","+sy, 0]]); let steps = 0;
      while (open.length && steps++ < 6000) {
        open.sort((a,b) => (a.g+a.h) - (b.g+b.h)); const node = open.shift();
        const position = {worldX: node.x * cell, worldY: node.y * cell};
        if (node.g > best.get(node.x+","+node.y)) continue;
        const arrived = targetPoint ? distance(position, targetPoint) < 82 : Math.hypot(position.worldX-targetX,position.worldY-targetY) < cell;
        if (arrived && player.canOccupy(position)) {
          const result = []; let cursor = node;
          while (cursor) {result.unshift({x: cursor.x*cell, y: cursor.y*cell}); cursor = cursor.parent;}
          return result;
        }
        for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const x=node.x+dx,y=node.y+dy,id=x+","+y,g=node.g+1;
          if (x<0 || y<0 || x*cell>=config.width || y*cell>=config.height || (best.has(id) && best.get(id)<=g) || !player.canOccupy({worldX:x*cell,worldY:y*cell})) continue;
          const next = {x,y,g,parent:node}; next.h=heuristic(next); best.set(id,g); open.push(next);
        }
      }
      return [];
    }
    function walkTo(x,y,p) {
      clearPath(); viewport.focus({preventScroll:true});
      if (p && distance(player.position,p) < (p.range || 125)) {interact(p); return;}
      const route = routeTo(x,y,p);
      if (!route.length) { $(".epilogue-objective").textContent = "那里被挡住了，可以沿雪地小路绕过去。"; return; }
      path=route; pendingPoint=p||null; followPath(player.position);
    }
    function followPath(position) {
      if (!path.length || paused || settingsOpen || dialogue || leaving) return;
      if (pendingPoint && distance(position,pendingPoint)<92) {const p=pendingPoint; clearPath(); interact(p); return;}
      let target=path[0];
      while (target && Math.hypot(position.worldX-target.x,position.worldY-target.y)<5) {path.shift(); target=path[0];}
      if (!target) {clearPath(); return;}
      const dx=target.x-position.worldX,dy=target.y-position.worldY;
      const direction=Math.abs(dx)>3 ? (dx>0?"right":"left") : (dy>0?"down":"up");
      directions.forEach(d=>player.setDirectionPressed(d,d===direction));
    }
    viewport.addEventListener("click", e => {
      if (!running || paused || settingsOpen || dialogue || leaving || finalizing || revealing || e.target.closest("button")) return;
      const rect=world.getBoundingClientRect();
      const x=(e.clientX-rect.left)*config.width/rect.width-22,y=(e.clientY-rect.top)*config.height/rect.height-46;
      if(x>=0&&y>=0&&x<config.width&&y<config.height)walkTo(x,y);
    });
    function stopTyping() {if(typeTimer!==null){clearInterval(typeTimer);typeTimer=null;}}
    function startTyping() {
      if(paused||settingsOpen||letterIndex>=letters.length)return;
      typeTimer=setInterval(()=>{letterIndex++;text.textContent=letters.slice(0,letterIndex).join("");if(letterIndex>=letters.length){stopTyping();revealActions();}},window.TitanSettings ? window.TitanSettings.loadSettings().textSpeed : 40);
    }
    function revealActions(){const choosing=dialogue&&dialogue.choice&&lineIndex===dialogue.lines.length-1;$(".choices").hidden=!choosing;$(".continue-hint").hidden=Boolean(choosing);}
    function reveal() {stopTyping();letterIndex=letters.length;text.textContent=letters.join("");revealActions();}
    function showLine() {
      stopTyping(); const line=dialogue.lines[lineIndex],last=lineIndex===dialogue.lines.length-1;
      holdUntil=performance.now()+(line.minHold||0);
      if(line.sound==="knock")sound(knocks);
      if(conversationId==="closing"){nightSound(line.background==="black"?"quiet":"inside");if(line.cinematicView){cinema.hidden=false;root.classList.add("is-cinematic");cinema.style.backgroundImage='url("'+config.finalImage+'")';cinema.style.opacity="1";}}
      $(".speaker").textContent=line.speaker||"";$(".speaker").hidden=!line.speaker;
      const portrait=$(".epilogue-portrait"), image=line.character || portraits[line.speaker];
      portrait.hidden=!image;
      if(image){if(portrait.getAttribute("src")!==image){portrait.src=image;portrait.style.animation="none";void portrait.offsetWidth;portrait.style.animation="";}portrait.alt=line.speaker+"角色立绘";}else portrait.removeAttribute("src");
      const stage=$(".epilogue-dialog-stage");
      root.classList.toggle("is-map-talking",Boolean(line.mapView));
      stage.hidden=Boolean(line.mapView||line.cinematicView);
      if(line.background==="black"){stage.style.backgroundImage="none";stage.style.backgroundColor="#000";}
      else{stage.style.backgroundColor="";stage.style.backgroundImage='url("'+(line.background||config.dialogueBackground||(conversationId==="gate"||conversationId==="closing"?"images/bg/gate.png":"images/bg/city.png"))+'")';}
      letters=Array.from(line.text);letterIndex=0;text.textContent="";
      $(".choices").hidden=true;$(".continue-hint").hidden=true;
      startTyping();
    }
    function open(lines,onDone,choice) {
      clearPath();player.setActive(false);nearest=null;root.classList.add("is-talking");talk.hidden=false;$(".epilogue-dialog-stage").hidden=false;
      dialogue={lines,onDone,choice};lineIndex=0;showLine();$(".epilogue-dialog-box").focus({preventScroll:true});
    }
    function close(runDone) {
      stopTyping();const current=dialogue;dialogue=null;talk.hidden=true;$(".epilogue-dialog-stage").hidden=true;root.classList.remove("is-talking","is-map-talking");
      if(runDone&&current.onDone)current.onDone();
      if(!dialogue&&!leaving&&!finalizing&&!revealing&&running){player.setActive(!paused&&!settingsOpen);viewport.focus({preventScroll:true});update(player.position);}
    }
    function next() {
      if(!dialogue||paused||settingsOpen||leaving||performance.now()<holdUntil)return;
      if(letterIndex<letters.length){reveal();return;}
      if(dialogue.choice&&lineIndex===dialogue.lines.length-1)return;
      if(lineIndex+1<dialogue.lines.length){lineIndex++;showLine();}else close(true);
    }
    function updateObjective(){const count=requirements.filter(id=>visited.has(id)).length;$(".epilogue-objective").textContent=complete()?config.afterObjective:config.objective+"（"+count+"/"+requirements.length+"）";refreshLamps();}
    function interact(p) {
      if(!p||!running||dialogue||paused||settingsOpen||leaving||finalizing||revealing)return;
      conversationId=p.id;
      if(distance(player.position,p)> (p.range||125)){walkTo(p.x,p.y,p);return;}
      if(p.type==="exit") {
        if(!complete()){conversationId="beforeExit";open(config.beforeExit,()=>{});return;}
        const lines=visited.has(p.id)?(p.repeat||p.dialogue):p.dialogue;visited.add(p.id);
        open(lines,()=>{if(config.finalImage)beginNight();else{conversationId="closing";open(config.closing,leave);}},true);return;
      }
      const lines=visited.has(p.id)?(p.repeat||p.dialogue):p.dialogue;
      open(lines,()=>{
        const justLit=!visited.has(p.id);visited.add(p.id);updateObjective();
        if(p.type==="lamp"&&justLit){sound(ignite);showToast(complete()?"三盏引路灯都已点亮。":"引路灯已经点亮。");}
        if(p.afterMove){const element=pointElements.get(p.id);element.style.transform="translate("+(p.afterMove.x-p.x)+"px,"+(p.afterMove.y-p.y)+"px)";}
      });
    }
    async function beginNight(){
      if(finalizing)return;finalizing=true;clearPath();player.setActive(false);root.classList.add("is-finalizing");
      $(".epilogue-save").disabled=true;$(".epilogue-settings-button").disabled=true;
      const token=generation;leaving=true;$(".epilogue-screenfade").classList.add("is-black");
      await waitActive(1400,token);if(token!==generation||!running)return;
      nightSound("inside");$(".epilogue-screenfade").classList.remove("is-black");leaving=false;
      conversationId="closing";open(config.closing,finishNight);
    }
    async function finishNight(){
      const token=generation;leaving=true;talk.hidden=true;root.classList.remove("is-talking");
      await waitActive(6500,token);if(token!==generation||!running)return;
      $(".epilogue-screenfade").classList.add("is-black");await waitActive(2400,token);if(token!==generation||!running)return;
      localStorage.removeItem(checkpointKey);stop();options.onComplete();
    }
    async function leave() {
      leaving=true;player.setActive(false);clearPath();talk.hidden=true;$(".epilogue-dialog-stage").hidden=true;root.classList.remove("is-talking","is-map-talking");
      $(".epilogue-save").disabled=true;$(".epilogue-settings-button").disabled=true;
      const token=generation;
      async function walk(x,y,ms) {
        const from={x:player.worldX,y:player.worldY},start=performance.now();player.lastDirection="up";actor.classList.add("is-moving");
        await new Promise(resolve=>{function step(now){
          if(token!==generation){resolve();return;}const t=Math.min(1,(now-start)/ms);
          player.setWorldPosition(from.x+(x-from.x)*t,from.y+(y-from.y)*t);player.walkFrame=Math.floor((now-start)/140)%2+1;player.render();actor.style.zIndex=Math.round(player.worldY+56);
          if(t<1)walkingFrame=requestAnimationFrame(step);else resolve();
        }walkingFrame=requestAnimationFrame(step);});
      }
      await walk(config.departure.x,config.departure.y,900);if(token!==generation)return;
      await walk(config.departure.x,config.departure.endY,1900);if(token!==generation)return;
      actor.classList.remove("is-moving");$(".epilogue-screenfade").classList.add("is-black");await delay(1400);if(token!==generation)return;
      localStorage.removeItem(checkpointKey);stop();options.onComplete();
    }
    $(".epilogue-dialog-box").onclick=e=>{if(!e.target.closest(".choice-button"))next();};
    $(".epilogue-next").onclick=e=>{e.stopPropagation();if(!paused&&!settingsOpen&&letterIndex===letters.length)close(true);};
    $(".epilogue-stay").onclick=e=>{e.stopPropagation();if(!paused&&!settingsOpen)close(false);};
    $(".epilogue-prompt").onclick=()=>interact(nearest);
    $(".epilogue-paused button").onclick=options.onPause;
    document.addEventListener("keydown",e=>{
      if(!running||e.target.closest("input,textarea,select"))return;
      if(settingsOpen){if(e.key==="Escape"){e.preventDefault();closeSettings();}return;}
      if(leaving||revealing){if(e.key==="Escape"){e.preventDefault();options.onPause();}else if(["Enter"," ","e","E","w","a","s","d","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();return;}
      if(e.key==="Escape"){e.preventDefault();options.onPause();return;}
      if(dialogue&&["Enter"," "].includes(e.key)){
        if(e.repeat||(["Enter"," "].includes(e.key)&&e.target.closest("button,a")))return;e.preventDefault();next();return;
      }
      if(!dialogue&&e.key===" "){e.preventDefault();options.onPause();return;}
      if(!dialogue&&["w","a","s","d","W","A","S","D","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))clearPath();
    },true);
    window.addEventListener("resize",fit);
    function setPaused(value) {
      paused=Boolean(value);root.classList.toggle("is-paused",paused);$(".epilogue-paused").hidden=!paused;
      player.setActive(running&&!paused&&!settingsOpen&&!dialogue&&!leaving&&!finalizing&&!revealing);if(paused){stopTyping();sounds.forEach(a=>a.pause());}else if(dialogue)startTyping();
    }
    function start(value) {
      visited.clear();generation++;running=true;leaving=false;finalizing=false;revealing=false;seaRevealed=!config.entrance;cinema.hidden=true;root.classList.remove("is-cinematic","is-finalizing","is-revealing");root.classList.toggle("is-arriving",!seaRevealed);root.hidden=false;root.classList.remove("is-visible");document.body.classList.add("epilogue-active");
      $(".epilogue-screenfade").classList.remove("is-black");clearPath();player.setMap(map);player.lastDirection="up";player.render();fit();updateObjective();setPaused(value);
      $(".epilogue-save").disabled=false;$(".epilogue-settings-button").disabled=false;
      requestAnimationFrame(()=>root.classList.add("is-visible"));
      let saved;try{saved=JSON.parse(localStorage.getItem(checkpointKey));}catch(error){}
      if(saved&&saved.signature===signature&&saved.position&&Number.isFinite(saved.position.x)&&Number.isFinite(saved.position.y)){
        for(const id of saved.visited||[])if(config.points.some(p=>p.id===id))visited.add(id);
        seaRevealed=Boolean(saved.seaRevealed)||!config.entrance;root.classList.toggle("is-arriving",!seaRevealed);
        for(const p of config.points)if(visited.has(p.id)&&p.afterMove){const element=pointElements.get(p.id);element.style.transform="translate("+(p.afterMove.x-p.x)+"px,"+(p.afterMove.y-p.y)+"px)";}
        player.setWorldPosition(saved.position.x,saved.position.y);fit();updateObjective();
        if(saved.conversation==="intro"){conversationId="intro";open(config.intro,()=>{});}
        else if(saved.conversation==="closing"){conversationId="closing";open(config.closing,finishNight);}
        else if(saved.conversation==="beforeExit"){conversationId="beforeExit";open(config.beforeExit,()=>{});}
        else if(saved.conversation){const p=config.points.find(p=>p.id===saved.conversation);if(p){if(saved.initialExit)visited.delete(p.id);nearest=p;interact(p);}}
        if(dialogue){lineIndex=Math.max(0,Math.min(Number(saved.line)||0,dialogue.lines.length-1));showLine();}
        showToast("已恢复尾声进度。");
      }else{conversationId="intro";open(config.intro,()=>{});}
      if(!dialogue){player.setActive(!paused&&!revealing);viewport.focus({preventScroll:true});}
    }
    function stop() {
      sounds.forEach(a=>a.pause());generation++;running=false;leaving=false;settingsOpen=false;$(".epilogue-settings").hidden=true;clearTimeout(toastTimer);stopTyping();clearPath();dialogue=null;talk.hidden=true;$(".epilogue-dialog-stage").hidden=true;root.classList.remove("is-talking","is-map-talking");player.setActive(false);
      if(player.frame){cancelAnimationFrame(player.frame);player.frame=0;}if(walkingFrame){cancelAnimationFrame(walkingFrame);walkingFrame=0;}
      root.hidden=true;document.body.classList.remove("epilogue-active");
    }
    window.addEventListener("pagehide",stop);
    return {start,stop,setPaused};
  }
  window.TitanNormalEpilogue={validate,mountEditor,create};
}());
