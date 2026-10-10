/* 第五章守门者战斗的剧情返回通道；独立游玩时不接管战斗。 */
(function () {
  "use strict";

  if (new URLSearchParams(location.search).get("return") !== "story") return;

  const RESULT_KEY = "TitanStory-chapter5-guardian-boss-result";
  const RETURN_URL = "../../game.html?mode=guardian-boss-return";
  let finished = false;

  document.body.dataset.storyMode = "true";
  document.title = "第五章 · 守门者战";
  document.querySelector("#game").setAttribute("aria-label", "第五章守门者 Boss 战");
  document.querySelector(".boss-name strong").textContent = "十五米级守门者";
  document.querySelector(".briefing .eyebrow").textContent = "第五章 · 中央广场";
  document.querySelector("#briefing-title").textContent = "守门者之战";
  document.querySelector(".briefing-copy").textContent = "异常巨人挡住了通往广播塔的道路。躲避攻击、击破架势，再绕到后颈完成最后一击。战败后可重试，或按 Esc 返回剧情。";
  document.querySelector("#start-button").textContent = "开始战斗";

  const returnButton = document.createElement("button");
  returnButton.id = "story-return-button";
  returnButton.type = "button";
  returnButton.textContent = "返回剧情";
  document.body.appendChild(returnButton);

  function finish(success, detail) {
    if (finished) return;
    const snapshot = window.RPG && window.RPG.getActiveBossBattle && window.RPG.getActiveBossBattle()?.getState();
    const result = {
      type: "guardianBoss", status: "completed", completed: true, success: success,
      difficulty: (detail && detail.difficulty) || (snapshot && snapshot.difficulty) || "hard",
      elapsed: (detail && detail.elapsed) || (snapshot && snapshot.elapsed) || 0,
      retries: (detail && detail.retries) || (snapshot && snapshot.retries) || 0,
      stats: (detail && detail.stats) || (snapshot && snapshot.stats) || {}
    };
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(result)); }
    catch (error) {
      console.error("无法保存守门者战斗结果。", error);
      return;
    }
    finished = true;
    setTimeout(function () { location.href = RETURN_URL; }, success ? 1800 : 0);
  }

  document.addEventListener("gatekeeper:complete", function (event) { finish(true, event.detail); });
  document.addEventListener("gatekeeper:exit", function (event) {
    if (event.detail && event.detail.reason === "defeat") finish(false, event.detail);
  });
  returnButton.addEventListener("click", function () { finish(false, { reason: "withdrawn" }); });
}());
