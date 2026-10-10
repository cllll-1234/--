/* 档案复原独立Debug控制台；只使用专用localStorage，不写正式存档。 */
(function () {
  "use strict";

  function initialize() {
    const status = document.querySelector("#archive-debug-status");
    document.querySelectorAll("[data-archive-stage]").forEach(function (button) {
      button.addEventListener("click", function () {
        status.textContent = "正在测试：" + button.textContent;
        window.TitanArchiveRestoration.startDebug(button.dataset.archiveStage).then(function (result) {
          status.textContent = result.success ? "测试完成；正式存档未受影响。" : "已退出测试，阶段进度保存在Debug命名空间。";
        });
      });
    });
    document.querySelector("#archive-debug-clear").addEventListener("click", function () {
      window.TitanArchiveRestoration.clearDebugProgress();
      status.textContent = "小游戏Debug存档已清除。";
    });
  }

  document.addEventListener("DOMContentLoaded", initialize);
}());
