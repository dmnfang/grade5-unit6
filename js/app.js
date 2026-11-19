(() => {
  const IMG_DIR = "images/";
  const IMG_EXTS = ["png", "webp", "jpg", "jpeg"];
  const COUNTS = {mains: 3, sides: 2, desserts: 2, drinks: 2};
  const MAX = 3;                                   // items picked in speaking practice
  const TEAM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const QTY_OPTIONS = [1, 2, 3, 4, 5];             // items to order in time attack
  const ALL = Object.values(MENU).flat();

  const root = document.getElementById("root");
  const ic = (name, cls) => window.icon(name, cls);
  const imgUrl = {};                               // img name -> url once the file is found

  let state = {screen: "home", items: [], sel: [], shown: false};   // home | sp1 | sp2 | ta*
  let ta = {teams: 4, players: 5, qty: 3, roundLimit: "open", team: 0, pair: 0, rounds: [],
            running: false, elapsed: 0, t0: 0, timerId: 0, results: [], roundNo: 1, shown: false, collage: null};

  /* ---------- helpers ---------- */
  const shuffle = a => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const yen = n => "¥" + n.toLocaleString("en-US");
  const num = n => n.toLocaleString("en-US");
  const fmt = ms => {
    const t = Math.floor(ms / 100), m = Math.floor(t / 600), s = Math.floor((t % 600) / 10);
    return `${m}:${String(s).padStart(2, "0")}.${t % 10}`;
  };
  const chosen = () => state.sel.map(id => state.items.find(i => i.id === id));
  const picked = it => `<span class="picked">${esc(it.say)}</span>`;
  const listPicked = items => {
    const p = items.map(picked);
    if (p.length === 1) return p[0];
    if (p.length === 2) return `${p[0]} and ${p[1]}`;
    return `${p.slice(0, -1).join(", ")}, and ${p[p.length - 1]}`;
  };
  const sfx = (name, opts) => window.SFX && window.SFX.play(name, opts);

  // Look for images/<name>.png / .webp / .jpg / .jpeg
  function probe(name) {
    let i = 0;
    const t = new Image();
    const next = () => { if (i < IMG_EXTS.length) t.src = IMG_DIR + name + "." + IMG_EXTS[i++]; };
    t.onload = () => { imgUrl[name] = t.src; render(); };
    t.onerror = next;
    next();
  }
  const pic = it => {
    const u = imgUrl[it.img];
    return `<div class="pic">${u ? `<img src="${esc(u)}" alt="">` : `<span class="ph">${it.emoji}</span>`}</div>`;
  };
  const visual = it => imgUrl[it.img] ? `<img src="${esc(imgUrl[it.img])}" alt="">` : it.emoji;

  /* ---------- fullscreen / sound / home buttons ---------- */
  const docEl = document.documentElement;
  const FS_OK = !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen);
  const fsActive = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function toggleFullscreen() {
    try {
      if (fsActive()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (docEl.requestFullscreen || docEl.webkitRequestFullscreen).call(docEl);
    } catch (err) { /* not allowed here */ }
  }
  const fsButton = () => FS_OK
    ? `<button class="icon-btn" id="fs" aria-label="${fsActive() ? "Exit full screen" : "Full screen"}">${ic(fsActive() ? "corners-in" : "corners-out")}</button>`
    : "";
  const soundButton = () =>
    `<button class="icon-btn" id="snd" data-sound="none" aria-label="${SFX.isOn() ? "Turn sound off" : "Turn sound on"}">${ic(SFX.isOn() ? "speaker-high" : "speaker-slash")}</button>`;
  const homeButton = () => `<button class="icon-btn" id="home" data-sound="close" aria-label="Home">${ic("house")}</button>`;

  const topbar = (title, middle, right) =>
    `<header class="topbar"><h1 class="title">${title}</h1><div class="topbar-mid">${middle}</div>
       <div class="topbar-right">${right}</div></header>`;
  const avatar = (role, n) =>
    `<div class="avatar ${role}">${ic(role === "waiter" ? "chef-hat" : "user")}${n ? `<span class="badge-num">${n}</span>` : ""}</div>`;

  /* ---------- home ---------- */
  function renderHome() {
    root.className = "mode-home";
    root.innerHTML = topbar("5th Grade - At a restaurant", "", soundButton() + fsButton()) + `
      <main class="game-grid">
        <button class="game-card" data-game="speak" data-go="speak" data-sound="launch">
          <div class="game-art"><div class="art-speak">
            <div class="art-tile"><span>🍔</span><b>¥500</b></div>
            <div class="art-tile on"><span>🍟</span><b>¥300</b></div>
            <div class="art-tile"><span>🥤</span><b>¥200</b></div>
          </div></div>
          <div class="game-text">
            <h2 class="game-title">Speaking practice</h2>
            <p class="game-desc">Order three items from the menu, then ask how much it is.</p>
          </div>
          <span class="launch-btn">Play</span>
        </button>
        <button class="game-card" data-game="attack" data-go="attack" data-sound="launch">
          <div class="game-art"><div class="art-attack">${ic("timer")}<span class="art-time">0:42.3</span></div></div>
          <div class="game-text">
            <h2 class="game-title">Time attack</h2>
            <p class="game-desc">Teams race through orders, one pair at a time. Fastest team wins.</p>
          </div>
          <span class="launch-btn">Play</span>
        </button>
      </main>`;
  }

  /* ---------- speaking practice ---------- */
  function newMenu() {
    let id = 0;
    const items = [];
    for (const k of Object.keys(COUNTS)) {
      shuffle(MENU[k]).slice(0, COUNTS[k]).forEach(it => items.push({...it, id: id++, type: k}));
    }
    state = {screen: "sp1", items, sel: [], shown: false};
    render();
  }
  const blank = it => it ? picked(it) : "...";
  const orderLine = list =>
    `${blank(list[0])}, ${blank(list[1])}, and ${blank(list[2])}${list[2] ? "." : ""}`;

  function renderSp1() {
    const c = chosen();
    root.className = "mode-speak";
    root.innerHTML = topbar("5th Grade - At a restaurant", `<span class="counter">${c.length} / ${MAX}</span>`,
      `<button class="topbar-action" id="next" data-sound="nextCard" ${c.length < MAX ? "disabled" : ""}>Next</button>` +
      soundButton() + homeButton() + fsButton()) + `
      <main class="body">
        <section class="script-panel narrow">
          <div class="line">${avatar("waiter")}<p class="say">What would you like?</p></div>
          <div class="line">${avatar("customer")}<p class="say">I’d like ${orderLine(c)}</p></div>
          <p class="hint">Tap three items from the menu.</p>
        </section>
        <section class="right"><div class="menu-grid">${state.items.map(it => {
          const i = state.sel.indexOf(it.id);
          return `<button class="menu-card ${i >= 0 ? "selected" : ""}" data-id="${it.id}" data-sound="none" aria-pressed="${i >= 0}">
            <span class="badge">${i + 1}</span>${pic(it)}
            <span class="name">${esc(it.name)}</span><span class="price">${yen(it.price)}</span></button>`;
        }).join("")}</div></section>
      </main>`;
  }

  function renderSp2() {
    const c = chosen();
    const total = c.reduce((s, i) => s + i.price, 0);
    root.className = "mode-speak";
    root.innerHTML = topbar("5th Grade - At a restaurant", "",
      `<button class="topbar-action secondary" id="back" data-sound="close">Back</button>
       <button class="topbar-action" id="again" data-sound="modalOpen">Next menu</button>` +
      soundButton() + homeButton() + fsButton()) + `
      <main class="body">
        <section class="script-panel narrow">
          <div class="line">${avatar("customer")}<p class="say">How much is it?</p></div>
          <div class="line">${avatar("waiter")}
            <p class="say">It’s ${revealButton(state.shown, total)} yen.</p></div>
        </section>
        <section class="stack">${c.map(it => `
          <div class="menu-card">${pic(it)}
            <div class="info"><span class="name">${esc(it.name)}</span><span class="price">${yen(it.price)}</span></div>
          </div>`).join("")}</section>
      </main>`;
  }
  const revealButton = (shown, total) =>
    `<button class="reveal ${shown ? "shown" : ""}" id="reveal" data-sound="none" aria-label="Show the total">${shown ? num(total) : "?"}</button>`;

  /* ---------- time attack: settings ---------- */
  function buildRounds(count, qty) {
    return Array.from({length: count}, () => {
      const items = shuffle(ALL).slice(0, qty);
      return {items, total: items.reduce((s, i) => s + i.price, 0)};
    });
  }
  function stopTimer() { clearInterval(ta.timerId); ta.running = false; }

  function renderSetup() {
    const solo = ta.teams === 1;
    const pills = (key, opts, label = v => v) => opts.map(v =>
      `<button class="toggle-pill ${ta[key] === v ? "active" : ""}" data-set="${key}" data-val="${v}" data-sound="none">${label(v)}</button>`).join("");
    root.className = "mode-attack";
    root.innerHTML = topbar("Time attack", "", soundButton() + homeButton() + fsButton()) + `
      <main class="setup-body">
        <section class="setup-panel">
          <div class="panel-title">Team settings</div>
          <div class="settings-scroll">
            <div class="settings-block"><div class="settings-label">Teams</div>
              <div class="toggle-group">${pills("teams", TEAM_OPTIONS)}</div></div>
            ${solo ? `<div class="settings-block"><div class="settings-label">Rounds</div>
              <div class="toggle-group">${pills("roundLimit", ["open", 1, 2, 3, 4, 5], v => v === "open" ? "Unlimited" : v)}</div></div>` : ""}
            <div class="settings-block"><div class="settings-label">Players per team</div>
              <div class="toggle-group">${pills("players", PLAYER_OPTIONS)}</div></div>
            <div class="settings-block"><div class="settings-label">Items to order</div>
              <div class="toggle-group">${pills("qty", QTY_OPTIONS)}</div></div>
          </div>
          <button class="launch-btn" id="start" data-sound="launch">Start</button>
        </section>
      </main>`;
  }

  /* ---------- time attack: play ---------- */
  function startTeam(i, round = 1) {
    stopTimer();
    Object.assign(ta, {team: i, roundNo: round, pair: 0, rounds: buildRounds(ta.players, ta.qty), elapsed: 0, shown: false});
    state.screen = "taPlay";
    render();
  }
  function startTimer() {
    ta.t0 = performance.now();
    ta.running = true;
    ta.timerId = setInterval(() => {
      ta.elapsed = performance.now() - ta.t0;
      const el = document.getElementById("timer");
      if (el) el.textContent = fmt(ta.elapsed);
    }, 50);
    render();
  }
  const settingsButton = () => `<button class="topbar-action secondary" id="settings" data-sound="none">Settings</button>`;
  const pips = (total, current, allDone = false) =>
    `<div class="pips" aria-label="Pair ${current + 1} of ${total}">${Array.from({length: total}, (_, i) =>
      `<span class="pip ${allDone || i < current ? "done" : i === current ? "now" : ""}"></span>`).join("")}</div>`;
  const runTitle = () => ta.teams === 1 ? `Round ${ta.roundNo}` : `Team ${ta.team + 1}`;

  function renderPlay() {
    const r = ta.rounds[ta.pair];
    const last = ta.pair === ta.players - 1;
    const a = ta.pair + 1, b = last ? 1 : ta.pair + 2;       // the last pair wraps back to player 1
    const n = r.items.length;
    const cols = n <= 3 ? n : n === 4 ? 2 : 3;
    const line = (role, who, html) => `<div class="line">${avatar(role, who)}<p class="say">${html}</p></div>`;
    root.className = "mode-attack";
    root.innerHTML = topbar(runTitle(), pips(ta.players, ta.pair),
      (ta.running ? "" : `<button class="topbar-action" id="timerstart" data-sound="launch">Start timer</button>`) +
      settingsButton() + soundButton() + fsButton()) + `
      <main class="body">
        <section class="script-panel narrow">
          ${line("waiter", a, "What would you like?")}
          ${line("customer", b, `I’d like ${listPicked(r.items)}.`)}
          ${line("customer", b, "How much is it?")}
          ${line("waiter", a, `It’s ${revealButton(ta.shown, r.total)} yen.`)}
        </section>
        <section class="item-grid" style="--cols:${cols}">${r.items.map(it => `
          <div class="menu-card">${pic(it)}
            <span class="name">${esc(it.name)}</span><span class="price">${yen(it.price)}</span></div>`).join("")}</section>
      </main>
      <div class="go-bar">
        <div class="timer-box" id="timer">${fmt(ta.elapsed)}</div>
        ${last
          ? `<button class="big-btn finish" id="finish" data-sound="none" ${ta.running ? "" : "disabled"}>Finish</button>`
          : `<button class="big-btn" id="nextpair" data-sound="nextCard" ${ta.running ? "" : "disabled"}>Next</button>`}
      </div>`;
  }

  function finish() {
    if (!ta.running) return;
    const time = performance.now() - ta.t0;
    stopTimer();
    ta.elapsed = time;
    ta.results.push({team: ta.team, roundNo: ta.roundNo, time});
    // collage of everything this team ordered
    const all = ta.rounds.flatMap(r => r.items);
    const w = innerWidth - 120, h = Math.max(160, innerHeight - 500);
    const size = Math.max(24, Math.min(120, Math.floor(Math.sqrt((w * h) / all.length) * 0.9)));
    ta.collage = {size, h, list: shuffle(all).map(item => ({item, rot: Math.round(Math.random() * 24 - 12)}))};
    state.screen = "taFinish";
    sfx("celebration");
    for (let i = 0; i < Math.min(all.length, 40); i += 4) {
      setTimeout(() => sfx("tilePop", {rate: 0.9 + Math.random() * 0.5}), Math.min(i * 25, 1000));
    }
    render();
  }

  function renderFinish() {
    const solo = ta.teams === 1;
    const isLast = ta.team + 1 >= ta.teams;
    const atLimit = ta.roundLimit !== "open" && ta.roundNo >= ta.roundLimit;
    const c = ta.collage;
    root.className = "mode-attack";
    root.innerHTML = topbar(runTitle(), pips(ta.players, ta.players, true), settingsButton() + soundButton() + fsButton()) + `
      <main class="body">
        <section class="collage-panel">
          <div class="wow">Yum, what a feast!</div>
          <div class="final-time">${fmt(ta.elapsed)}</div>
          <div class="collage" style="height:${c.h}px">${c.list.map(({item, rot}, i) =>
            `<div class="cell" style="--s:${c.size}px;--rot:${rot}deg;animation-delay:${Math.min(i * 25, 1000)}ms">${visual(item)}</div>`).join("")}</div>
        </section>
      </main>
      <div class="go-bar">${solo && !atLimit
        ? `<button class="big-btn" id="revenge" data-sound="modalOpen">Revenge round</button>
           <button class="big-btn secondary" id="endgame" data-sound="targetSelect">End game</button>`
        : `<button class="big-btn" id="nextteam" data-sound="${isLast ? "targetSelect" : "modalOpen"}">${isLast ? "Display scores" : "Start next team"}</button>`}
      </div>`;
  }

  function showScores() { state.screen = "taScores"; sfx("allDone"); render(); }

  function renderScores() {
    const solo = ta.teams === 1;
    const ranked = solo ? ta.results : [...ta.results].sort((x, y) => x.time - y.time);
    const fastest = Math.min(...ta.results.map(r => r.time));
    root.className = "mode-attack";
    root.innerHTML = topbar("Scoreboard", "", settingsButton() + soundButton() + fsButton()) + `
      <main class="body">
        <ol class="score-list">${ranked.map((r, i) => solo
          ? `<li class="score-row solo ${r.time === fastest ? "fastest" : ""}"><span>Round ${r.roundNo}</span><span class="score-time">${fmt(r.time)}</span></li>`
          : `<li class="score-row ${i === 0 ? "first" : ""}"><span class="rank">${i + 1}</span><span>Team ${r.team + 1}</span><span class="score-time">${fmt(r.time)}</span></li>`).join("")}
        </ol>
      </main>`;
  }

  function newGame() { stopTimer(); ta.elapsed = 0; ta.results = []; state.screen = "taSetup"; render(); }
  function goHome() { stopTimer(); state.screen = "home"; render(); }

  /* ---------- render + events ---------- */
  const SCREENS = {home: renderHome, sp1: renderSp1, sp2: renderSp2, taSetup: renderSetup,
                   taPlay: renderPlay, taFinish: renderFinish, taScores: renderScores};
  function render() { SCREENS[state.screen](); }

  root.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t) return;
    const s = state.screen;

    // default click sound unless the button plays its own
    const snd = t.dataset.sound;
    if (snd !== "none") sfx(snd || "tap", snd ? {} : {rate: 0.85});

    if (t.dataset.go === "speak") newMenu();
    else if (t.dataset.go === "attack") { state.screen = "taSetup"; render(); }
    else if (t.id === "home") goHome();
    else if (t.id === "snd") { SFX.toggle(); sfx("tap", {rate: 0.85}); render(); }
    else if (t.id === "fs") toggleFullscreen();

    // speaking practice
    else if (t.classList.contains("menu-card") && s === "sp1") {
      const id = +t.dataset.id, i = state.sel.indexOf(id);
      if (i >= 0) { state.sel.splice(i, 1); sfx("toggle", {rate: 0.8}); }
      else if (state.sel.length < MAX) { state.sel.push(id); sfx("toggle", {rate: 1.2}); }
      else { t.classList.add("shake"); setTimeout(() => t.classList.remove("shake"), 400); return; }
      render();
    }
    else if (t.id === "next" && state.sel.length === MAX) { state.screen = "sp2"; state.shown = false; render(); }
    else if (t.id === "back") { state.screen = "sp1"; render(); }
    else if (t.id === "again") newMenu();
    else if (t.id === "reveal") {
      if (s === "sp2") { state.shown = !state.shown; sfx(state.shown ? "correct" : "close"); }
      else { ta.shown = !ta.shown; sfx(ta.shown ? "correct" : "close"); }
      render();
    }

    // time attack
    else if (t.dataset.set) {
      const v = t.dataset.val === "open" ? "open" : +t.dataset.val;
      ta[t.dataset.set] = v;
      sfx("tap", {rate: 1.1});
      render();
    }
    else if (t.id === "start") startTeam(0);
    else if (t.id === "timerstart") startTimer();
    else if (t.id === "nextpair") { ta.pair++; ta.shown = false; render(); }
    else if (t.id === "finish") finish();
    else if (t.id === "revenge") startTeam(0, ta.roundNo + 1);
    else if (t.id === "endgame") showScores();
    else if (t.id === "nextteam") {
      if (ta.team + 1 < ta.teams) startTeam(ta.team + 1); else showScores();
    }
    else if (t.id === "settings") {
      // two taps so a stray tap can't wipe a run
      if (t.classList.contains("armed")) { sfx("close"); newGame(); }
      else {
        sfx("tap", {rate: 0.85});
        t.classList.add("armed");
        t.textContent = "Tap again to reset";
        setTimeout(() => { if (t.isConnected) { t.classList.remove("armed"); t.textContent = "Settings"; } }, 3000);
      }
    }
  });

  document.addEventListener("fullscreenchange", render);
  document.addEventListener("webkitfullscreenchange", render);

  ALL.forEach(it => probe(it.img));
  render();
})();
