/* 成就模块：保留通用解锁与渲染功能，只注册 Version 2.0 基础成就。 */
(function () {
  "use strict";

  const achievementList = [
    { id: "first_start", icon: "始", title: "新的开始", description: "第一次开始新剧情" },
    { id: "first_choice", icon: "择", title: "第一次选择", description: "第一次做出选择" },
    { id: "first_minigame", icon: "技", title: "初次挑战", description: "第一次完成小游戏" },
    { id: "relic_cross", icon: "遗", title: "不该出现的遗物", description: "在巨人身上发现属于人类的神秘十字架" },
    { id: "missing_people", icon: "名", title: "消失的人", description: "完成地下街调查" },
    { id: "outside_no_titans", icon: "海", title: "墙外没有巨人", description: "找到墙外资源勘探报告" },
    { id: "erased_people", icon: "册", title: "被抹去的人", description: "发现净化人员名册" },
    { id: "memory_restored", icon: "忆", title: "记忆复苏", description: "恢复莱纳关于破墙之日的记忆" },
    { id: "ending_good", icon: "晓", title: "破晓的黎明", description: "完成 Good Ending" },
    { id: "ending_bad", icon: "壁", title: "神权的走狗", description: "完成 Bad Ending" },
    { id: "ending_normal", icon: "默", title: "沉默者", description: "完成 Normal Ending" },
    { id: "ending_hidden", icon: "自", title: "自由的诅咒", description: "完成 Hidden Ending" }
  ];
  const validIds = achievementList.map(function (item) { return item.id; });

  function getKey() {
    const username = window.TitanSave ? window.TitanSave.getCurrentUsername() : (localStorage.getItem("TitanStory-current-user") || "guest");
    return "TitanStory-achievements-" + username;
  }

  function getAchievements() {
    try {
      const stored = JSON.parse(localStorage.getItem(getKey())) || [];
      const filtered = stored.filter(function (id) { return validIds.includes(id); });
      if (filtered.length !== stored.length) localStorage.setItem(getKey(), JSON.stringify(filtered));
      return filtered;
    }
    catch (error) { return []; }
  }

  function unlockAchievement(id) {
    if (!validIds.includes(id)) return false;
    const unlocked = getAchievements();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem(getKey(), JSON.stringify(unlocked));
      return true;
    }
    return false;
  }

  function renderAchievements() {
    const container = document.querySelector("#achievement-list");
    if (!container) return;
    const unlocked = getAchievements();
    container.innerHTML = achievementList.map(function (item) {
      const isUnlocked = unlocked.includes(item.id);
      return '<article class="achievement-card ' + (isUnlocked ? "unlocked" : "locked") + '">' +
        '<span class="achievement-icon" aria-hidden="true">' + (isUnlocked ? item.icon : "锁") + '</span>' +
        '<p class="achievement-state">' + (isUnlocked ? "已获得" : "尚未获得") + '</p>' +
        '<h2>' + item.title + '</h2><p>' + item.description + '</p></article>';
    }).join("");
  }

  window.TitanAchievements = { unlockAchievement: unlockAchievement, getAchievements: getAchievements, renderAchievements: renderAchievements };
  document.addEventListener("DOMContentLoaded", renderAchievements);
}());
