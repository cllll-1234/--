(function(){
  "use strict";
  const list=[
    {id:"enter_wall",icon:"墙",title:"初入城墙",description:"第一次踏入黑石城墙街区"},
    {id:"rescue_all",icon:"援",title:"一个都不能少",description:"用三种不同方式救出全部平民"},
    {id:"repair_all",icon:"铆",title:"修补工兵",description:"运送材料并封锁三处裂缝"},
    {id:"fast_route",icon:"时",title:"最短路线",description:"剩余30秒以上完成裂缝任务"},
    {id:"soldier_choice",icon:"刃",title:"我是士兵",description:"牺牲时间救出受困士兵"},
    {id:"titan_no_hit",icon:"雨",title:"雨幕中的幸存者",description:"在立体机动清剿中未被巨人击中并成功抵达救援区"}
  ];
  function key(){const name=window.TitanSave?.getCurrentUsername();return name?"TitanStory-achievements-"+encodeURIComponent(name):"TitanStory-achievements-offline"}
  function getAchievements(){const k=key();if(!k)return[];try{return JSON.parse(localStorage.getItem(k))||[]}catch(_){return[]}}
  function unlockAchievement(id){const k=key(),got=getAchievements(),item=list.find(a=>a.id===id);if(!k||!item||got.includes(id))return false;got.push(id);localStorage.setItem(k,JSON.stringify(got));document.dispatchEvent(new CustomEvent("titan-achievement",{detail:item}));return true}
  function renderAchievements(){const el=document.querySelector("#achievement-list");if(!el)return;const got=getAchievements();el.innerHTML=list.map(a=>`<article class="achievement-card ${got.includes(a.id)?"unlocked":"locked"}"><span class="achievement-icon">${got.includes(a.id)?a.icon:"锁"}</span><p class="achievement-state">${got.includes(a.id)?"已获得":"尚未获得"}</p><h2>${a.title}</h2><p>${a.description}</p></article>`).join("")}
  window.TitanAchievements={list,getAchievements,unlockAchievement,renderAchievements};document.addEventListener("DOMContentLoaded",renderAchievements);
}());
