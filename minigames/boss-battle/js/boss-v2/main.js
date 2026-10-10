(function (global) {
  "use strict";
  let activeController = null;
  function startBossBattle(options) {
    if (activeController) activeController.destroy();
    const canvas = document.getElementById("game");
    if (!canvas) throw new Error("Boss battle requires #game canvas");
    const opts = Object.assign({ difficulty: "hard" }, options || {}), externalComplete = opts.onComplete, externalExit = opts.onExit;
    opts.onComplete = result => {
      document.dispatchEvent(new CustomEvent("gatekeeper:complete", { detail: result }));
      if (typeof externalComplete === "function") externalComplete(result);
      if (typeof global.onBossBattleComplete === "function" && global.onBossBattleComplete !== opts.onComplete) global.onBossBattleComplete(result);
    };
    opts.onExit = result => {
      document.dispatchEvent(new CustomEvent("gatekeeper:exit", { detail: result }));
      if (typeof externalExit === "function") externalExit(result);
    };
    const battle = new global.GatekeeperBattle(opts), view = new global.GatekeeperView(canvas, battle);
    const briefing = document.getElementById("briefing"), startButton = document.getElementById("start-button");
    let running = true, started = !briefing, raf = 0, last = performance.now(), accumulator = 0;
    function begin() {
      if (started) return;
      started = true; last = performance.now(); accumulator = 0;
      view.consumeEdges(); view.down.jump = false; view.down.skip = false;
      briefing.classList.add("dismissed"); canvas.focus?.();
    }
    if (startButton) startButton.addEventListener("click", begin);
    const beginOnSpace = event => { if (!started && (event.code === "Space" || event.code === "Enter")) { event.preventDefault(); begin(); } };
    global.addEventListener("keydown", beginOnSpace, { capture: true });
    function frame(now) {
      if (!running) return;
      accumulator += Math.min((now - last) / 1000, global.GATEKEEPER_CONFIG.maxFrame); last = now;
      const input = view.input(); let first = true, stepped = false;
      while (started && accumulator >= global.GATEKEEPER_CONFIG.fixedStep) {
        battle.step(global.GATEKEEPER_CONFIG.fixedStep, first ? input : Object.assign({}, input, { jumpPressed:false,dashPressed:false,grappleLeftPressed:false,grappleRightPressed:false,releasePressed:false,attackPressed:false,heavyPressed:false,bracePressed:false,transformPressed:false,skipPressed:false,acceptFailurePressed:false,qteKey:"" }));
        first = false; stepped = true; accumulator -= global.GATEKEEPER_CONFIG.fixedStep;
      }
      if (stepped) view.consumeEdges(); view.render(accumulator / global.GATEKEEPER_CONFIG.fixedStep); raf = requestAnimationFrame(frame);
    }
    activeController = { battle, view, start:begin, getState:()=>battle.snapshot(), retry:()=>battle.retry(), restart:m=>battle.restart(m||"human"), destroy:()=>{ running=false; cancelAnimationFrame(raf); global.removeEventListener("keydown", beginOnSpace, { capture: true }); view.destroy(); if(activeController?.battle===battle) activeController=null; } };
    raf = requestAnimationFrame(frame); return activeController;
  }
  global.startBossBattle = startBossBattle; global.RPG = global.RPG || {}; global.RPG.startBossBattle = startBossBattle; global.RPG.getActiveBossBattle = () => activeController;
  document.addEventListener("DOMContentLoaded", () => { if (document.body.dataset.autostart !== "false") startBossBattle({ difficulty: document.body.dataset.difficulty || "hard" }); });
}(window));

