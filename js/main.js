/* 全站入口模块：首页的新游戏、继续游戏与登录状态控制。 */
(function () {
  "use strict";

  function initializeNewGameSave() {
    const state = window.TitanSave.createInitialGameState();
    window.TitanAchievements.unlockAchievement("first_start");
    state.achievements = window.TitanAchievements.getAchievements();
    window.TitanSave.saveGame(state);
    return state;
  }

  function enterExistingPrologue() {
    location.replace("game.html?mode=continue");
  }

  function createAndStartNewGame() {
    if (window.TitanMenuBgm) window.TitanMenuBgm.stop();
    const state = initializeNewGameSave();
    const started = window.TitanIntro && window.TitanIntro.start({
      onIntroComplete: function () {
        state.flags.introPlayed = true;
        window.TitanSave.saveGame(state);
      },
      onComplete: enterExistingPrologue
    });
    if (!started) {
      state.flags.introPlayed = true;
      window.TitanSave.saveGame(state);
      enterExistingPrologue();
    }
  }

  function startNewGame() {
    const username = window.TitanSave.getCurrentUsername();
    const oldSave = window.TitanSave.loadGameSave();
    if (oldSave && !window.confirm("新的故事會覆蓋「" + username + "」的當前進度，確定繼續嗎？")) return;
    createAndStartNewGame();
  }

  function continueGame() {
    const save = window.TitanSave.loadGameSave();
    if (!save) {
      window.alert("目前還沒有存檔。請先選擇「新遊戲」踏入高牆。");
      return;
    }
    if (save.incompatible) {
      if (window.confirm("检测到旧版本存档，剧情系统已更新，需要重新开始游戏。\n\n点击“确定”重新开始。")) {
        window.TitanSave.clearGameSave();
        createAndStartNewGame();
      }
      return;
    }
    if (window.TitanMenuBgm) window.TitanMenuBgm.stop();
    location.replace("game.html?mode=continue");
  }

  function initializeHomeGate() {
    const entry = document.querySelector("#home-entry");
    const menu = document.querySelector(".home-menu");
    if (!entry || !menu) return;

    function enterHome() {
      if (!document.body.classList.contains("home-gate")) return;
      if (window.TitanMenuSfx) window.TitanMenuSfx.play("open");
      document.body.classList.remove("home-gate");
      document.body.classList.add("home-entered");
      entry.hidden = true;
      menu.focus({ preventScroll: true });
    }

    entry.addEventListener("click", enterHome);
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" || !document.body.classList.contains("home-gate")) return;
      event.preventDefault();
      enterHome();
    });
  }

  function updateUserStatus() {
    const status = document.querySelector("#user-status");
    const authButton = document.querySelector("#auth-button");
    if (!status || !authButton) return;
    const username = localStorage.getItem("TitanStory-current-user");
    status.textContent = username ? "當前身份：" + username : "當前身份：訪客（存檔將保存在訪客檔案）";
    if (username) {
      authButton.textContent = "退出登入";
      authButton.href = "#";
      authButton.addEventListener("click", function (event) {
        event.preventDefault();
        localStorage.removeItem("TitanStory-current-user");
        location.reload();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initializeHomeGate();
    const newButton = document.querySelector("#new-game");
    const continueButton = document.querySelector("#continue-game");
    if (newButton) newButton.addEventListener("click", startNewGame);
    if (continueButton) continueButton.addEventListener("click", continueGame);
    updateUserStatus();
    if (window.TitanMenuBgm) window.TitanMenuBgm.start();
  });
}());
