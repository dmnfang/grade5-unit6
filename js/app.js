(() => {
  const IMG_DIR = "images/";
  const IMG_EXTS = ["png", "webp", "jpg", "jpeg"];
  const COUNTS = {mains: 3, sides: 2, desserts: 2, drinks: 2};
  const MAX = 3;

  // Phosphor (fill)
  const ICON_WAITER = '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M240,112a56.06,56.06,0,0,0-56-56c-1.77,0-3.54.1-5.29.26a56,56,0,0,0-101.42,0C75.54,56.1,73.77,56,72,56A56,56,0,0,0,48,162.59V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V162.59A56.09,56.09,0,0,0,240,112Zm-87.76,30.06,8-32a8,8,0,0,1,15.52,3.88l-8,32A8,8,0,0,1,160,152a8.13,8.13,0,0,1-1.95-.24A8,8,0,0,1,152.24,142.06ZM120,112a8,8,0,0,1,16,0v32a8,8,0,0,1-16,0Zm-33.94-7.76a8,8,0,0,1,9.7,5.82l8,32a8,8,0,0,1-5.82,9.7,8.13,8.13,0,0,1-2,.24,8,8,0,0,1-7.75-6.06l-8-32A8,8,0,0,1,86.06,104.24ZM192,208H64V167.42a55.49,55.49,0,0,0,8,.58H184a55.49,55.49,0,0,0,8-.58Z"/></svg>';
  const ICON_CUSTOMER = '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z"/></svg>';

  const root = document.getElementById("root");
  const imgUrl = {};               // img name -> resolved url (once the file is found)
  let state = {screen: 1, items: [], sel: [], shown: false};

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
  const chosen = () => state.sel.map(id => state.items.find(i => i.id === id));

  // Look for images/<name>.png / .webp / .jpg / .jpeg
  function probe(name) {
    let i = 0;
    const t = new Image();
    const next = () => { if (i < IMG_EXTS.length) t.src = IMG_DIR + name + "." + IMG_EXTS[i++]; };
    t.onload = () => { imgUrl[name] = t.src; if (state.items.length) render(); };
    t.onerror = next;
    next();
  }

  function newMenu() {
    let id = 0;
    const items = [];
    for (const k of Object.keys(COUNTS)) {
      shuffle(MENU[k]).slice(0, COUNTS[k]).forEach(it => items.push({...it, id: id++, type: k}));
    }
    state = {screen: 1, items, sel: [], shown: false};
    render();
  }

  const pic = it => {
    const u = imgUrl[it.img];
    return `<div class="pic">${u ? `<img src="${esc(u)}" alt="">` : `<span class="ph">${it.emoji}</span>`}</div>`;
  };

  const blank = (it) => it
    ? `<span class="picked">${esc(it.say)}</span>`
    : "...";
  const orderLine = list =>
    `${blank(list[0])}, ${blank(list[1])}, and ${blank(list[2])}${list[2] ? "." : ""}`;

  const topbar = (counter, right) =>
    `<header class="topbar"><h1 class="title">5th Grade - At a restaurant</h1>
       <span class="counter">${counter}</span><div class="topbar-right">${right}</div></header>`;

  function render() {
    const c = chosen();
    if (state.screen === 1) {
      root.innerHTML = topbar(`${c.length} / ${MAX}`,
        `<button class="topbar-action" id="next" ${c.length < MAX ? "disabled" : ""}>Next</button>`) + `
        <main class="body">
          <section class="script-panel narrow">
            <div class="line"><div class="avatar waiter">${ICON_WAITER}</div><p class="say">What would you like?</p></div>
            <div class="line"><div class="avatar customer">${ICON_CUSTOMER}</div><p class="say">I’d like ${orderLine(c)}</p></div>
            <p class="hint">Tap three items from the menu.</p>
          </section>
          <section class="right"><div class="menu-grid">${state.items.map(it => {
            const i = state.sel.indexOf(it.id);
            return `<button class="menu-card ${i >= 0 ? "selected" : ""}" data-id="${it.id}" aria-pressed="${i >= 0}">
              <span class="badge">${i + 1}</span>${pic(it)}
              <span class="name">${esc(it.name)}</span><span class="price">${yen(it.price)}</span></button>`;
          }).join("")}</div></section>
        </main>`;
    } else {
      const total = c.reduce((s, i) => s + i.price, 0);
      root.innerHTML = topbar("",
        `<button class="topbar-action secondary" id="back">Back</button>
         <button class="topbar-action" id="again">Next menu</button>`) + `
        <main class="body">
          <section class="script-panel narrow">
            <div class="line"><div class="avatar customer">${ICON_CUSTOMER}</div><p class="say">How much is it?</p></div>
            <div class="line"><div class="avatar waiter">${ICON_WAITER}</div>
              <p class="say">It’s <button class="reveal ${state.shown ? "shown" : ""}" id="reveal" aria-label="Show the total">${state.shown ? total.toLocaleString("en-US") : "?"}</button> yen.</p></div>
          </section>
          <section class="stack">${c.map(it => `
            <div class="menu-card">${pic(it)}
              <div class="info"><span class="name">${esc(it.name)}</span><span class="price">${yen(it.price)}</span></div>
            </div>`).join("")}</section>
        </main>`;
    }
  }

  root.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.classList.contains("menu-card") && state.screen === 1) {
      const id = +t.dataset.id, i = state.sel.indexOf(id);
      if (i >= 0) state.sel.splice(i, 1);
      else if (state.sel.length < MAX) state.sel.push(id);
      else { t.classList.add("shake"); setTimeout(() => t.classList.remove("shake"), 400); return; }
      render();
    } else if (t.id === "next" && state.sel.length === MAX) { state.screen = 2; state.shown = false; render(); }
    else if (t.id === "back") { state.screen = 1; render(); }
    else if (t.id === "again") { newMenu(); }
    else if (t.id === "reveal") { state.shown = !state.shown; render(); }
  });

  // Small screens (phones): keep the 1180x820 layout and scale it down to fit
  function fit() {
    const w = innerWidth, h = innerHeight, s = Math.min(w / 1180, h / 820);
    if (s >= 1) { root.style.cssText = ""; return; }
    root.style.cssText = `position:absolute;top:0;left:0;width:1180px;height:820px;transform-origin:0 0;transform:translate(${(w - 1180 * s) / 2}px,${(h - 820 * s) / 2}px) scale(${s})`;
  }
  addEventListener("resize", fit);

  Object.values(MENU).flat().forEach(it => probe(it.img));
  newMenu();
  fit();
})();
