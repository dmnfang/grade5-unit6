/* sound.js: tiny SFX player using the shared Cardbox v3 SFX pack (sfx/ folder).
   SFX.play("tap", {rate: 0.85, volume: 1}); SFX.toggle(); SFX.isOn() */
window.SFX = (() => {
  const BASE = "sfx/";
  const FILES = {
    tap: "Tap.mp3", toggle: "Toggle.mp3", launch: "Launch.mp3", close: "Close.mp3",
    modalOpen: "Modal_open.mp3", nextCard: "Next_card.mp3", correct: "Correct.mp3",
    celebration: "Celebration.mp3", allDone: "All_done.mp3",
    tilePop: "Reveal_-_Tile_Pop.mp3", targetSelect: "Target_-_Select.mp3"
  };
  // Per-sound level, same values as Cardbox
  const GAIN = {tap: 0.55, toggle: 0.5, launch: 0.7, close: 0.6, modalOpen: 0.55, nextCard: 0.65,
                correct: 0.7, celebration: 0.4, allDone: 0.45, tilePop: 0.8, targetSelect: 0.6};
  const MASTER = 0.5;
  const KEY = "restaurant-sfx";

  let ctx = null, loading = null, on = true;
  const buffers = {};
  try { on = localStorage.getItem(KEY) !== "off"; } catch (e) { /* storage blocked */ }

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    if (!loading) {
      loading = Promise.all(Object.entries(FILES).map(async ([name, file]) => {
        try {
          const res = await fetch(BASE + file);
          const data = await res.arrayBuffer();
          buffers[name] = await new Promise((ok, fail) => ctx.decodeAudioData(data, ok, fail));
        } catch (e) { /* missing file: stay silent */ }
      }));
    }
  }

  function play(name, {rate = 1, volume = 1} = {}) {
    if (!on || !ctx || !buffers[name]) return;
    const src = ctx.createBufferSource();
    src.buffer = buffers[name];
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = MASTER * (GAIN[name] ?? 1) * volume;
    src.connect(gain).connect(ctx.destination);
    src.start();
  }

  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* ignore */ }
    return on;
  }

  document.addEventListener("pointerdown", unlock, {passive: true});
  return {play, toggle, isOn: () => on};
})();
