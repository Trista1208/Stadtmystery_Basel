const STORAGE_KEY = "cleancentive-silent-ferry-v1";

const state = loadState();

const app = document.querySelector("#app");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    if (!saved || saved.v !== 1) return freshState();
    if (!Array.isArray(saved.cleared)) saved.cleared = [];
    if (!Array.isArray(saved.picked)) saved.picked = [];
    if (saved.tab === "route") saved.tab = "ledger";
    return saved;
  } catch (err) {
    return freshState();
  }
}

function freshState() {
  return {
    v: 1,
    screen: "home",
    tab: "scene",
    team: "",
    party: "2",
    mode: "city",
    startedAt: null,
    stop: 0,
    phase: "clue",
    hints: {},
    patrols: [],
    statuses: {},
    gps: null,
    tries: 0,
    error: "",
    cleared: [],
    picked: []
  };
}

function save() {
  const copy = JSON.parse(JSON.stringify(state));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  } catch (err) {
    copy.patrols = copy.patrols.map((p) => ({ ...p, photo: "" }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      state.patrols.forEach((p) => { p.photo = ""; });
    } catch (err2) {
      /* The phone is out of room. The case still plays; photos are dropped. */
    }
  }
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function norm(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function currentStop() {
  return STOPS[state.stop];
}

function piecesOf(patrol) {
  if (!patrol) return 0;
  return TRASH_TYPES.reduce((sum, type) => {
    if (type.id === "hazard") return sum;
    return sum + (Number(patrol.counts[type.id]) || 0);
  }, 0);
}

function hazardsOf(patrol) {
  if (!patrol) return 0;
  return Number(patrol.counts.hazard) || 0;
}

function totalPieces() {
  return state.patrols.reduce((sum, patrol) => sum + piecesOf(patrol), 0);
}

function totalHazards() {
  return state.patrols.reduce((sum, patrol) => sum + hazardsOf(patrol), 0);
}

function statusFor(id) {
  return state.statuses[id] || "open";
}

function statusLabel(status) {
  return {
    open: "Open",
    cleared: "Cleared",
    suspicious: "Suspicious",
    prime: "Prime",
    accomplice: "Accomplice"
  }[status] || "Open";
}

function render() {
  document.body.classList.toggle("playing", state.screen === "play");
  document.body.classList.toggle("report", state.screen === "play" && state.phase === "certificate");
  if (state.screen !== "play") {
    destroyCityMap();
    app.className = "app";
    app.innerHTML = homeTemplate();
    bind();
    return;
  }
  app.className = "app stage";
  if (!document.querySelector("#citymap")) {
    app.innerHTML = stageShell();
    mountCityMap();
  }
  document.querySelector("#hud-brand").innerHTML = hudBrand();
  document.querySelector("#hud-stats").innerHTML = hudStats();
  document.querySelector("#tabs").innerHTML = tabButtons();
  document.querySelector("#dock").innerHTML = dockTemplate();
  document.querySelector("#main").innerHTML = mainTemplate();
  document.querySelector("#side").innerHTML = ledgerTemplate();
  bind();
  syncCityMap(false);
}

function homeTemplate() {
  const resumed = Boolean(state.startedAt);
  return `
    <header class="topbar">
      <div class="brand"><b>CLEANCENTIVE</b><span>Basel · a walking case</span></div>
      <div class="topmeta">Eight stops · about 2 km · litter is part of the plot</div>
    </header>
    <div class="grid-2">
      <section class="hero">
        <p class="kicker">The Silent Ferry</p>
        <h1>A murder on the Rhine. A city dressed as a mess.</h1>
        <p class="lede">Walk Basel’s old town as a Rhine witness. The case sits on a 3D map of the city, and the pillars are live illegal-dump reports from the Stadtreinigung.</p>
        <p class="quiet">Self-guided, like a palace mystery hunt: no actor, no tour group, clues in order. Cleancentive adds the patrol. In this story the litter is how the killer hid a chemical habit, and the city’s own waste grid is the evidence.</p>
        <ol class="steps">
          <li><span class="num">1</span><span>Gather at the red Rathaus. Read the chapter. Solve it from the building, or from the site plate if you are playing indoors.</span></li>
          <li><span class="num">2</span><span>File a block from the city grid if it sits near you, then bag what you actually find. An already-clean corner is a valid log. Do not invent trash.</span></li>
          <li><span class="num">3</span><span>Fly the route or walk it. Eight chapters, from the Rathaus to the Tinguely Fountain. Name the killer there.</span></li>
        </ol>
        <div class="note warn">
          <strong>On the street.</strong> Public paths only. Do not enter the Rhine. The stairs to the Pfalz are steep. Wear gloves. Never touch needles, chemicals, batteries, or anything that looks like a drum. Log those as a hazard and leave them. The murder is fiction. The ferry, the fountain, and the litter are real.
        </div>
      </section>
      <aside class="hero stack">
        <div>
          <p class="kicker">${resumed ? "Case still open" : "Open a case"}</p>
          <h2>${resumed ? esc(state.team) : "Name the team"}</h2>
          ${resumed ? `<p class="quiet">You are on chapter ${state.stop + 1} of ${STOPS.length}. The file is still on this phone.</p>
            <div class="row">
              <button class="btn primary" id="resume">Continue the hunt</button>
              <button class="btn ghost" id="reset">Start over</button>
            </div>` : formTemplate()}
        </div>
        <div class="side-card">
          <h3>Who does what</h3>
          <p class="quiet">Best with 2–4 people. One reads, one navigates, everyone patrols. Two teams can race: same route, separate logs. The city gets cleaner either way.</p>
        </div>
      </aside>
    </div>
  `;
}

function formTemplate() {
  return `
    <form class="form" id="start-form">
      <label>Team name
        <input type="text" name="team" maxlength="40" required placeholder="Ferry four, the courtyard, …">
      </label>
      <label>How many of you
        <select name="party">
          <option value="1">Solo</option>
          <option value="2" selected>2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 or more</option>
        </select>
      </label>
      <div>
        <span>How you are playing</span>
        <div class="mode">
          <label class="choice"><input type="radio" name="mode" value="city" checked> <span><b>On the Rhine</b><br><span class="quiet">Walk the pins. The phone can tell you how far off you are.</span></span></label>
          <label class="choice"><input type="radio" name="mode" value="table" > <span><b>Table read</b><br><span class="quiet">Play the whole case from a café. Site plates stand in for the plaques.</span></span></label>
        </div>
      </div>
      <p class="feedback bad" id="form-error" role="alert"></p>
      <button class="btn primary wide" type="submit">Open the notebook</button>
    </form>
  `;
}

function stageShell() {
  return `
    <div id="citymap"></div>
    <header class="hud">
      <div class="brand" id="hud-brand"></div>
      <div class="stats" id="hud-stats"></div>
    </header>
    <aside class="panel left">
      <div class="tabs" id="tabs" role="tablist"></div>
      <div id="main"></div>
    </aside>
    <aside class="panel right">
      <div id="side"></div>
    </aside>
    <div class="dock" id="dock"></div>
    <div id="toast" class="toast" hidden></div>
  `;
}

function hudBrand() {
  return `<span class="logo">◆</span> Cleancentive <span class="sub">The Silent Ferry</span>`;
}

function hudStats() {
  const reports = (CITY_FEED.dumps || []).reduce((sum, site) => sum + site.count, 0);
  const live = CITY_FEED.status === "live";
  const label = live ? "Live grid" : CITY_FEED.status === "loading" ? "Loading" : "Saved sample";
  return `
    <span>Pieces <b>${totalPieces()}</b></span>
    <span>Reports <b>${reports}</b></span>
    <span>Blocks <b>${state.cleared.length}</b></span>
    <span class="badge ${live ? "on" : ""}">${label}</span>
  `;
}

function tabButtons() {
  const narrow = window.matchMedia("(max-width: 900px)").matches;
  const tabs = [["scene", "Chapter"], ["file", "File"]];
  if (narrow) tabs.splice(1, 0, ["ledger", "Ledger"]);
  return tabs.map(([id, label]) => `<button type="button" role="tab" data-tab="${id}" aria-selected="${state.tab === id}">${label}</button>`).join("");
}

function dockTemplate() {
  return `
    <div class="progress" aria-hidden="true">
      ${STOPS.map((_, i) => `<i class="${i < state.stop ? "on" : ""} ${i === state.stop ? "now" : ""}"></i>`).join("")}
    </div>
    <button class="btn ghost" type="button" id="fly">Fly the route</button>
    <button class="btn ghost" type="button" id="refresh-feed">Refresh the grid</button>
  `;
}

function partyLabel() {
  if (state.party === "1") return "solo";
  if (state.party === "5") return "5 or more";
  return `${state.party} people`;
}

function mainTemplate() {
  if (state.tab === "ledger") return ledgerTemplate();
  if (state.tab === "file") return fileTemplate();
  if (state.phase === "certificate") return certificateTemplate();
  if (state.phase === "accuse") return accuseTemplate();
  if (state.phase === "patrol") return patrolTemplate();
  return clueTemplate();
}

function clueTemplate() {
  const stop = currentStop();
  const puzzle = stop.puzzle;
  return `
    <p class="kicker">Chapter ${stop.chapter} of VIII</p>
    <div class="place"><span>${esc(stop.place)}</span><span>${stop.minutesFromPrev ? esc(String(stop.minutesFromPrev)) + " min walk" : "Start"}</span></div>
    <h2>${esc(stop.name)}</h2>
    <p>${esc(stop.walk)}</p>
    <div class="ledger-note"><strong>City ledger.</strong> ${esc(CITY_NOTES[stop.id] || "")}</div>
    ${state.mode === "city" ? gpsBlock() : `<p class="quiet">Table read. The site plate below carries the fact you would check on the street. The pillars are still the live city grid.</p>`}
    ${stop.scene}
    <details ${state.mode === "table" ? "open" : ""}>
      <summary>Site plate</summary>
      <p>${esc(stop.plate)}</p>
    </details>
    <form class="form" id="puzzle-form">
      <p><strong>${esc(puzzle.prompt)}</strong></p>
      ${puzzle.type === "choice" ? choiceFields("answer", puzzle.choices) : `<input type="text" name="answer" autocomplete="off" placeholder="${esc(puzzle.placeholder || "")}" required>`}
      <p class="feedback ${state.error ? "bad" : ""}" role="status">${esc(state.error)}</p>
      <div class="row">
        <button class="btn primary" type="submit">Enter it in the file</button>
        <button class="btn ghost" type="button" id="hint">${state.hints[stop.id] ? "Hint" : "Ask for a hint"}</button>
      </div>
      ${state.hints[stop.id] ? `<p class="note">${esc(puzzle.hint)}</p>` : ""}
    </form>
  `;
}

function patrolTemplate() {
  const stop = currentStop();
  const seeded = pickedCounts();
  const fields = TRASH_TYPES.map((type) => `
    <label>${esc(type.label)}<small>${esc(type.hint)}</small></label>
    <input type="number" min="0" max="200" value="${seeded[type.id] || 0}" name="${esc(type.id)}" inputmode="numeric">
  `).join("");
  return `
    <p class="kicker">Patrol · chapter ${stop.chapter}</p>
    <div class="success"><strong>Logged.</strong> ${esc(stop.success)}</div>
    <h2>Clear the costume</h2>
    <p>${esc(stop.patrol)}</p>
    <p class="quiet">File a block from the Stadtreinigung grid if it is near this chapter. The counts start from those reports. Change them to what you actually bag. A hazard stays a report, not something you touch.</p>
    ${nearbyDumpChips()}
    <form class="form" id="patrol-form">
      <div class="patrol-grid">${fields}</div>
      <label class="checkline">
        <input type="checkbox" name="alreadyClean">
        <span>This spot is already clean. Log the patrol with nothing to lift.</span>
      </label>
      <label>Photo, optional. It stays on this phone.
        <input type="file" name="photo" accept="image/*" capture="environment">
      </label>
      <img alt="" class="photo-preview" id="photo-preview" hidden>
      <p class="feedback bad" role="alert">${esc(state.error)}</p>
      <button class="btn primary wide" type="submit">${state.stop === STOPS.length - 1 ? "Log patrol and close in" : "Log patrol and open the next chapter"}</button>
    </form>
  `;
}

function accuseTemplate() {
  const killerChoices = ACCUSATION.killer.choices.map((id) => {
    const person = SUSPECTS.find((s) => s.id === id);
    return { id, label: person.name };
  });
  const accompliceChoices = ACCUSATION.accomplice.choices.map((id) => {
    const person = SUSPECTS.find((s) => s.id === id);
    return { id, label: person.name };
  });
  return `
    <p class="kicker">The accusation</p>
    <h2>Name them, before the morning sweep.</h2>
    <p>You are at the Tinguely Fountain. The file is complete. Anna Vogt is waiting on the phone. Get all three answers right.</p>
    <form class="form" id="accuse-form">
      <fieldset>
        <legend><strong>${esc(ACCUSATION.killer.prompt)}</strong></legend>
        <div class="choices">${choiceFields("killer", killerChoices)}</div>
      </fieldset>
      <fieldset>
        <legend><strong>${esc(ACCUSATION.accomplice.prompt)}</strong></legend>
        <div class="choices">${choiceFields("accomplice", accompliceChoices)}</div>
      </fieldset>
      <fieldset>
        <legend><strong>${esc(ACCUSATION.motive.prompt)}</strong></legend>
        <div class="choices">${choiceFields("motive", ACCUSATION.motive.choices)}</div>
      </fieldset>
      <p class="feedback bad" role="alert">${esc(state.error)}</p>
      <button class="btn primary wide" type="submit">Deliver the verdict</button>
    </form>
  `;
}

function caseMinutes() {
  const end = state.closedAt || Date.now();
  const start = state.startedAt || end;
  return Math.max(1, Math.round((end - start) / 60000));
}

function totalsByType() {
  const totals = {};
  TRASH_TYPES.forEach((type) => { totals[type.id] = 0; });
  state.patrols.forEach((patrol) => {
    TRASH_TYPES.forEach((type) => {
      totals[type.id] += Number(patrol.counts && patrol.counts[type.id]) || 0;
    });
  });
  return totals;
}

function formatWhen(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function blockRecord(id) {
  const site = (CITY_FEED.dumps || []).find((row) => row.id === id);
  if (!site) {
    const [lat, lon] = String(id).split("|");
    return { title: `${lat}, ${lon}`, detail: "Filed from the city grid" };
  }
  const when = site.latest ? site.latest.slice(0, 10) : "";
  return {
    title: `${site.district || "Basel"} · ${topCategory(site)}`,
    detail: `${site.count} report${site.count === 1 ? "" : "s"} · ${when}`
  };
}

function reportText() {
  const totals = totalsByType();
  const lines = [
    "CLEANCENTIVE · BASEL",
    "Rhine Witness Report",
    "The Silent Ferry",
    "",
    `Team: ${state.team} (${partyLabel()})`,
    `Played: ${state.mode === "city" ? "On the Rhine" : "Table read"}`,
    `Opened: ${formatWhen(state.startedAt)}`,
    `Closed: ${formatWhen(state.closedAt)}`,
    `Time on the case: ${caseMinutes()} minutes`,
    `Accusation tries: ${state.tries}`,
    "",
    "FINDING",
    "Linus Kapp struck Elias Brenner on the Münster ferry landing.",
    "Nils Frei moved drum K-17 and lied about the fountain.",
    "The litter was there to disguise the drums and the murder as a slip.",
    "Greta Holz and Ida Gerber are cleared.",
    "",
    "WHAT WAS LIFTED"
  ];
  TRASH_TYPES.forEach((type) => {
    if (!totals[type.id]) return;
    lines.push(`- ${type.label}: ${totals[type.id]}`);
  });
  lines.push(`- Pieces bagged: ${totalPieces()}`);
  lines.push(`- Hazards reported, not touched: ${totalHazards()}`);
  lines.push("");
  lines.push("PATROL BY STOP");
  state.patrols.forEach((patrol) => {
    const stop = STOPS.find((item) => item.id === patrol.stopId);
    if (!stop) return;
    const note = patrol.alreadyClean ? "spot already clean" : `${piecesOf(patrol)} pieces`;
    lines.push(`- ${stop.chapter}. ${stop.name} (${stop.place}): ${note}; ${hazardsOf(patrol)} hazards`);
  });
  lines.push("");
  lines.push("CITY BLOCKS FILED");
  if (!state.cleared.length) lines.push("- None filed from the Stadtreinigung grid.");
  state.cleared.forEach((id) => {
    const block = blockRecord(id);
    lines.push(`- ${block.title} — ${block.detail}`);
  });
  lines.push("");
  lines.push("The dump pillars are Basel-Stadt open data, Stadtreinigung dataset 100070, snapped to a 50 metre grid.");
  lines.push("Bag what you lifted into a public bin.");
  return lines.join("\n");
}

function certificateTemplate() {
  const totals = totalsByType();
  const peak = Math.max(1, ...Object.values(totals));
  const bars = TRASH_TYPES.filter((type) => totals[type.id] > 0).map((type) => `
    <div class="bar-row">
      <span>${esc(type.label)}</span>
      <span class="bar"><i style="width:${Math.round(100 * totals[type.id] / peak)}%"></i></span>
      <b>${totals[type.id]}</b>
    </div>
  `).join("");
  const stops = state.patrols.map((patrol) => {
    const stop = STOPS.find((item) => item.id === patrol.stopId);
    if (!stop) return "";
    const note = patrol.alreadyClean ? "Spot already clean" : `${piecesOf(patrol)} piece${piecesOf(patrol) === 1 ? "" : "s"} bagged`;
    return `<li><b>${stop.chapter} · ${esc(stop.name)}</b><span>${esc(stop.place)} · ${esc(note)} · ${hazardsOf(patrol)} hazard${hazardsOf(patrol) === 1 ? "" : "s"}</span></li>`;
  }).join("");
  const blocks = state.cleared.map((id) => {
    const block = blockRecord(id);
    return `<li><b>${esc(block.title)}</b><span>${esc(block.detail)}</span></li>`;
  }).join("");
  return `
    <article class="cert report" id="witness-report">
      <div class="cert-top">
        <div>
          <p class="kicker">Cleancentive · Rhine Witness Report</p>
          <h2>The Silent Ferry is closed.</h2>
        </div>
        <div class="wax">CASE<br>CLOSED</div>
      </div>
      <p>Team <strong>${esc(state.team)}</strong>, ${esc(partyLabel())}. ${state.mode === "city" ? "Walked on the Rhine." : "Played as a table read."} Opened ${esc(formatWhen(state.startedAt))}. Closed ${esc(formatWhen(state.closedAt))}.</p>
      <h3>Finding</h3>
      <ul class="report-list">
        <li><b>Linus Kapp</b><span>Struck Elias Brenner on the ferry landing.</span></li>
        <li><b>Nils Frei</b><span>Moved drum K-17 and lied about the fountain.</span></li>
        <li><b>The litter</b><span>Disguised the drums, and the murder, as a slip.</span></li>
        <li><b>Cleared</b><span>Greta Holz and Ida Gerber.</span></li>
      </ul>
      <h3>What you lifted</h3>
      <div class="metrics">
        <div><b>${totalPieces()}</b><span>pieces bagged</span></div>
        <div><b>${totalHazards()}</b><span>hazards left alone</span></div>
        <div><b>${state.cleared.length}</b><span>city blocks filed</span></div>
        <div><b>${caseMinutes()}</b><span>minutes</span></div>
      </div>
      ${bars || `<p class="quiet">No pieces were logged. The patrols were marked already clean.</p>`}
      <h3>Patrol by stop</h3>
      <ol class="report-list">${stops}</ol>
      <h3>City blocks filed</h3>
      ${blocks ? `<ul class="report-list">${blocks}</ul>` : `<p class="quiet">No Stadtreinigung block was filed on this case.</p>`}
      ${VERDICT.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
      <p class="fine">Dump pillars are Basel-Stadt open data, dataset 100070, snapped to a 50 metre grid. Bag what you lifted into a public bin. This report stays on your phone until you download or print it.</p>
      <div class="row">
        <button class="btn primary" id="download-report" type="button">Download report</button>
        <button class="btn ghost" id="print-report" type="button">Print report</button>
        <button class="btn ghost" id="share" type="button">Share</button>
        <button class="btn ghost" id="reset" type="button">Open a new case</button>
      </div>
      <p class="feedback" id="share-note" role="status"></p>
    </article>
  `;
}

function ledgerTemplate() {
  const stop = currentStop();
  const sites = nearbyDumps(stop.lat, stop.lng, 450).slice(0, 6);
  const bins = nearbyBins(stop.lat, stop.lng, 700).slice(0, 3);
  const rows = sites.length ? sites.map((site) => {
    const dist = Math.round(haversine(stop.lat, stop.lng, site.lat, site.lon));
    const filed = state.cleared.includes(site.id);
    const held = state.picked.includes(site.id);
    const when = site.latest ? site.latest.slice(0, 10) : "";
    return `<li>
      <div class="dump-top"><b>${site.count}</b> <span>${esc(topCategory(site))}</span></div>
      <div class="quiet">${esc(site.district)} · ${dist} m · ${esc(when)}</div>
      <button type="button" class="btn small ${filed || held ? "ghost" : "primary"}" data-dump="${esc(site.id)}" ${filed ? "disabled" : ""}>${filed ? "In the file" : held ? "Filed for this patrol" : "File this block"}</button>
    </li>`;
  }).join("") : `<li class="quiet">No report inside 450 m of this chapter. The grid still stands on the map.</li>`;
  const binRows = bins.map((bin) => `<li><strong>${esc(bin.name)}</strong><div class="quiet">${esc(bin.kind)} · ${esc(bin.address)}</div></li>`).join("");
  const people = SUSPECTS.map((person) => {
    const status = statusFor(person.id);
    return `<article class="file-card">
      <span class="pill ${esc(status)}">${esc(statusLabel(status))}</span>
      <h3>${esc(person.name)}</h3>
      <p>${esc(person.role)}</p>
    </article>`;
  }).join("");
  return `
    <p class="kicker">City ledger</p>
    <h2>What the crews already logged</h2>
    <p class="quiet">${esc(CITY_FEED.note)}</p>
    <div class="kpis">
      <div class="kpi"><b>${(CITY_FEED.dumps || []).reduce((sum, site) => sum + site.count, 0)}</b><span>reports</span></div>
      <div class="kpi"><b>${CITY_FEED.dumps.length}</b><span>blocks</span></div>
      <div class="kpi"><b>${CITY_FEED.bins.length}</b><span>drop-offs</span></div>
      <div class="kpi"><b>${state.cleared.length}</b><span>filed</span></div>
    </div>
    <h3>Near ${esc(stop.place)}</h3>
    <ul class="dump-list">${rows}</ul>
    ${binRows ? `<h3>Legal drop-offs</h3><ul class="dump-list bins">${binRows}</ul>` : ""}
    <h3>The file</h3>
    ${people}
  `;
}

function nearbyDumpChips() {
  const stop = currentStop();
  const sites = nearbyDumps(stop.lat, stop.lng, 450).slice(0, 5);
  if (!sites.length) return `<p class="quiet">No Stadtreinigung report in this pocket right now. Log what you actually find.</p>`;
  return `<div class="chips">${sites.map((site) => {
    const filed = state.cleared.includes(site.id);
    const held = state.picked.includes(site.id);
    const dist = Math.round(haversine(stop.lat, stop.lng, site.lat, site.lon));
    return `<button type="button" class="chip ${held || filed ? "on" : ""}" data-dump="${esc(site.id)}" ${filed ? "disabled" : ""}>${held || filed ? "Filed" : "File"} · ${site.count} · ${esc(topCategory(site))} · ${dist} m</button>`;
  }).join("")}</div>`;
}

function pickedCounts() {
  const counts = {};
  TRASH_TYPES.forEach((type) => { counts[type.id] = 0; });
  state.picked.forEach((id) => {
    const site = CITY_FEED.dumps.find((row) => row.id === id);
    if (!site) return;
    const types = typeCounts(site);
    Object.entries(types).forEach(([type, n]) => {
      counts[type] = (counts[type] || 0) + n;
    });
  });
  return counts;
}

function fileTemplate() {
  const evidence = state.patrols.map((patrol) => {
    const stop = STOPS.find((s) => s.id === patrol.stopId);
    return `<article class="note">
      <p class="kicker">Chapter ${stop.chapter}</p>
      <h3>${esc(stop.evidence.title)}</h3>
      <p>${esc(stop.evidence.text)}</p>
      <p class="quiet">${piecesOf(patrol)} ${piecesOf(patrol) === 1 ? "piece" : "pieces"} · ${hazardsOf(patrol)} ${hazardsOf(patrol) === 1 ? "hazard" : "hazards"} reported${patrol.alreadyClean ? " · spot already clean" : ""}</p>
      ${patrol.photo ? `<img class="photo-preview" alt="Patrol photo from ${esc(stop.place)}" src="${patrol.photo}">` : ""}
    </article>`;
  }).join("");
  return `
    <p class="kicker">The file</p>
    <h2>What you can prove</h2>
    ${evidence || `<p class="quiet">Nothing filed yet. Solve the chapter in front of you, then patrol.</p>`}
    <div class="row" style="margin-top:12px">
      <button class="btn ghost" id="reset" type="button">Abandon this case</button>
    </div>
  `;
}

function sideTemplate() {
  const people = SUSPECTS.map((person) => {
    const status = statusFor(person.id);
    return `<article class="file-card">
      <span class="pill ${esc(status)}">${esc(statusLabel(status))}</span>
      <h3>${esc(person.name)}</h3>
      <p>${esc(person.role)}</p>
      <p>${esc(person.blurb)}</p>
    </article>`;
  }).join("");
  const pieces = totalPieces();
  return `
    <article class="stat">
      <b>${pieces} pieces</b>
      <span>${meterCopy(pieces)}</span>
    </article>
    ${people}
  `;
}

function meterCopy(pieces) {
  if (pieces === 0) return "The costume is still on the street.";
  if (pieces < 12) return "You have started pulling the costume apart.";
  if (pieces < 30) return "The morning sweep would notice this route.";
  return "The bank looks more like a city than a cover story.";
}

function gpsBlock() {
  const stop = currentStop();
  const gps = state.gps && state.gps.stopId === stop.id ? state.gps : null;
  return `<div class="gps"><span>${esc(gpsLine(stop, gps))}</span><button class="btn small ghost" type="button" id="gps">Where am I?</button></div>`;
}

function choiceFields(name, choices) {
  return choices.map((choice) => `
    <label class="choice">
      <input type="radio" name="${esc(name)}" value="${esc(choice.id)}" required>
      <span>${esc(choice.label)}</span>
    </label>
  `).join("");
}

function bind() {
  const start = document.querySelector("#start-form");
  if (start) start.addEventListener("submit", onStart);
  const resume = document.querySelector("#resume");
  if (resume) resume.addEventListener("click", () => {
    state.screen = "play";
    state.error = "";
    save();
    render();
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      state.error = "";
      save();
      render();
    });
  });
  const puzzle = document.querySelector("#puzzle-form");
  if (puzzle) puzzle.addEventListener("submit", onPuzzle);
  const hint = document.querySelector("#hint");
  if (hint) hint.addEventListener("click", () => {
    state.hints[currentStop().id] = true;
    save();
    render();
  });
  const patrol = document.querySelector("#patrol-form");
  if (patrol) {
    patrol.addEventListener("submit", onPatrol);
    const file = patrol.querySelector('input[type="file"]');
    file.addEventListener("change", () => previewPhoto(file));
  }
  const accuse = document.querySelector("#accuse-form");
  if (accuse) accuse.addEventListener("submit", onAccuse);
  const gps = document.querySelector("#gps");
  if (gps) gps.addEventListener("click", onGps);
  const share = document.querySelector("#share");
  if (share) share.addEventListener("click", onShare);
  const download = document.querySelector("#download-report");
  if (download) download.addEventListener("click", downloadReport);
  const print = document.querySelector("#print-report");
  if (print) print.addEventListener("click", () => window.print());
  const fly = document.querySelector("#fly");
  if (fly) fly.addEventListener("click", flyRoute);
  const refresh = document.querySelector("#refresh-feed");
  if (refresh) refresh.addEventListener("click", () => refreshCityFeed());
  document.querySelectorAll("[data-dump]").forEach((button) => {
    button.addEventListener("click", () => pickDump(button.dataset.dump));
  });
  document.querySelectorAll("#reset").forEach((button) => {
    button.addEventListener("click", onReset);
  });
}

function onStart(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const team = String(data.get("team") || "").trim();
  if (!team) return;
  state.team = team;
  state.party = String(data.get("party") || "2");
  state.mode = String(data.get("mode") || "city");
  state.startedAt = Date.now();
  state.screen = "play";
  state.tab = "scene";
  state.stop = 0;
  state.phase = "clue";
  state.hints = {};
  state.patrols = [];
  state.statuses = {};
  state.gps = null;
  state.tries = 0;
  state.error = "";
  state.cleared = [];
  state.picked = [];
  save();
  render();
}

function onPuzzle(event) {
  event.preventDefault();
  const stop = currentStop();
  const data = new FormData(event.target);
  let ok = false;
  if (stop.puzzle.type === "choice") {
    ok = data.get("answer") === stop.puzzle.correct;
  } else {
    ok = stop.puzzle.answers.includes(norm(data.get("answer")));
  }
  const feedback = event.target.querySelector(".feedback");
  if (!ok) {
    feedback.textContent = "The file doesn’t take that. Look again, or open the site plate.";
    feedback.className = "feedback bad";
    return;
  }
  state.error = "";
  state.phase = "patrol";
  save();
  render();
}

async function onPatrol(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const counts = {};
  TRASH_TYPES.forEach((type) => {
    counts[type.id] = clampCount(data.get(type.id));
  });
  const alreadyClean = data.get("alreadyClean") === "on";
  const lifted = TRASH_TYPES.reduce((sum, type) => sum + counts[type.id], 0);
  if (!alreadyClean && lifted === 0) {
    const feedback = event.target.querySelector(".feedback");
    feedback.textContent = "Log at least one piece, report a hazard, or mark the spot already clean.";
    return;
  }
  let photo = "";
  const file = data.get("photo");
  if (file && file.size) {
    try {
      photo = await compressImage(file);
    } catch (err) {
      photo = "";
    }
  }
  const stop = currentStop();
  state.patrols.push({ stopId: stop.id, counts, alreadyClean, photo, blocks: state.picked.slice() });
  state.picked.forEach((id) => {
    if (!state.cleared.includes(id)) state.cleared.push(id);
  });
  state.picked = [];
  Object.assign(state.statuses, stop.status);
  state.error = "";
  if (state.stop === STOPS.length - 1) {
    state.phase = "accuse";
  } else {
    state.stop += 1;
    state.phase = "clue";
    state.tab = "scene";
  }
  save();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function onAccuse(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  state.tries += 1;
  const ok = data.get("killer") === ACCUSATION.killer.correct
    && data.get("accomplice") === ACCUSATION.accomplice.correct
    && data.get("motive") === ACCUSATION.motive.correct;
  if (!ok) {
    const feedback = event.target.querySelector(".feedback");
    feedback.textContent = "Anna shakes her head. Read the ferry code, the kiosk log, and the fountain count in the file, then try again.";
    save();
    return;
  }
  state.error = "";
  state.closedAt = Date.now();
  state.phase = "certificate";
  state.tab = "scene";
  state.statuses.kapp = "prime";
  state.statuses.nils = "accomplice";
  save();
  render();
}

function gpsLine(stop, gps) {
  if (!gps) return "Check the pin when you think you have arrived.";
  if (gps.error) return gps.error;
  if (Number.isFinite(gps.meters)) {
    return gps.meters < 180
      ? `About ${gps.meters} m from the pin. You are in the right pocket of the old town.`
      : `About ${gps.meters} m from the pin. Old-town GPS wanders — if you can see ${stop.place}, stay and play.`;
  }
  return "Check the pin when you think you have arrived.";
}

function paintGps() {
  const span = document.querySelector(".gps span");
  if (!span) return;
  span.textContent = gpsLine(currentStop(), state.gps);
}

function onGps() {
  const stop = currentStop();
  const write = (gps) => {
    state.gps = gps;
    save();
    paintGps();
  };
  if (!navigator.geolocation) {
    write({ stopId: stop.id, error: "This phone won’t share a location. If you can see the place, keep going." });
    return;
  }
  write({ stopId: stop.id, error: "Checking the pin…" });
  navigator.geolocation.getCurrentPosition((pos) => {
    const meters = Math.round(distanceMeters(
      pos.coords.latitude,
      pos.coords.longitude,
      stop.lat,
      stop.lng
    ));
    write({ stopId: stop.id, meters });
  }, () => {
    write({ stopId: stop.id, error: "Location stayed off. Play from what you can see, or switch to a table read in a new case." });
  }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 });
}

function downloadReport() {
  const stamp = new Date(state.closedAt || Date.now()).toISOString().slice(0, 10);
  const blob = new Blob([reportText()], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `cleancentive-silent-ferry-${stamp}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function onShare() {
  const text = reportText();
  const note = document.querySelector("#share-note");
  try {
    if (navigator.share) {
      await navigator.share({ title: "Cleancentive — The Silent Ferry", text });
      return;
    }
  } catch (err) {
    if (err && err.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text);
    note.textContent = "Copied. Paste it wherever your group will see it.";
  } catch (err) {
    note.textContent = text;
  }
}

function onReset() {
  const sure = window.confirm("Close this case and wipe the log on this phone?");
  if (!sure) return;
  const next = freshState();
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, next);
  save();
  render();
}

function clampCount(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(200, n);
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 480 / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.62));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("photo"));
    };
    image.src = url;
  });
}

function previewPhoto(input) {
  const img = document.querySelector("#photo-preview");
  const file = input.files && input.files[0];
  if (!file) {
    img.hidden = true;
    return;
  }
  const url = URL.createObjectURL(file);
  img.src = url;
  img.hidden = false;
  img.onload = () => URL.revokeObjectURL(url);
}

function pickDump(id) {
  const site = CITY_FEED.dumps.find((row) => row.id === id);
  if (!site) return;
  if (state.cleared.includes(id)) {
    showToast("That block is already in the file.");
    focusSite(site);
    return;
  }
  const stop = currentStop();
  const dist = haversine(stop.lat, stop.lng, site.lat, site.lon);
  if (dist > 450) {
    showToast(`${Math.round(dist)} m from this chapter. It stays on the map until the walk arrives.`);
    focusSite(site);
    return;
  }
  if (state.phase !== "clue" && state.phase !== "patrol") {
    showToast("The case is closed. The grid is the record you walked.");
    focusSite(site);
    return;
  }
  if (!state.picked.includes(id)) state.picked.push(id);
  save();
  showToast(`Filed ${site.count} reports on this block. Adjust the patrol to what you actually bag.`, true);
  focusSite(site);
  render();
}

function showToast(text, good) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.hidden = false;
  el.textContent = text;
  el.className = good ? "toast good" : "toast";
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { el.hidden = true; }, 3400);
}

window.onCityFeed = () => {
  if (state.screen !== "play") return;
  const stats = document.querySelector("#hud-stats");
  if (stats) stats.innerHTML = hudStats();
  const side = document.querySelector("#side");
  if (side) side.innerHTML = ledgerTemplate();
  document.querySelectorAll("#side [data-dump]").forEach((button) => {
    button.addEventListener("click", () => pickDump(button.dataset.dump));
  });
  syncCityMap(false);
};

let cityMap = null;
let mapReady = false;
let stopMarkers = [];
let flownStop = null;
let flying = false;

function destroyCityMap() {
  stopMarkers = [];
  mapReady = false;
  flownStop = null;
  if (cityMap) {
    cityMap.remove();
    cityMap = null;
  }
}

async function mountCityMap() {
  const node = document.querySelector("#citymap");
  if (!node || typeof maplibregl === "undefined") {
    if (node) node.innerHTML = `<p class="map-fallback">The 3D map did not load. The chapters still work, and the ledger still lists the city grid.</p>`;
    return;
  }
  let style = { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#d5e4df" } }] };
  try {
    const response = await fetch("https://tiles.openfreemap.org/styles/liberty", { signal: AbortSignal.timeout(5000) });
    if (response.ok) style = await response.json();
  } catch (err) {
    /* A flat ground is enough if the tile style is out of reach. */
  }
  if (!document.querySelector("#citymap")) return;
  cityMap = new maplibregl.Map({
    container: "citymap",
    style,
    center: [7.59, 47.557],
    zoom: 15.1,
    pitch: 58,
    bearing: -18,
    antialias: true,
    attributionControl: { compact: true }
  });
  cityMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  cityMap.on("load", () => {
    mapReady = true;
    cityMap.addSource("route", { type: "geojson", data: emptyCollection() });
    cityMap.addLayer({ id: "route-glow", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#9e2b2b", "line-width": 12, "line-blur": 6, "line-opacity": 0.45 } });
    cityMap.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#f4efe4", "line-width": 3, "line-dasharray": [1.4, 1.1] } });
    cityMap.addSource("bins", { type: "geojson", data: emptyCollection() });
    cityMap.addLayer({ id: "bins", type: "circle", source: "bins", paint: { "circle-radius": 6, "circle-color": "#1f6f68", "circle-stroke-width": 2, "circle-stroke-color": "#f4efe4" } });
    cityMap.addSource("pillars", { type: "geojson", data: emptyCollection() });
    cityMap.addLayer({
      id: "pillars",
      type: "fill-extrusion",
      source: "pillars",
      paint: {
        "fill-extrusion-color": ["get", "color"],
        "fill-extrusion-height": ["get", "h"],
        "fill-extrusion-opacity": 0.9
      }
    });
    cityMap.on("click", "pillars", (event) => {
      const feature = event.features && event.features[0];
      if (feature) pickDump(feature.properties.id);
    });
    cityMap.on("click", "bins", (event) => {
      const feature = event.features && event.features[0];
      if (!feature) return;
      const props = feature.properties;
      new maplibregl.Popup({ offset: 12, closeButton: false })
        .setLngLat(event.lngLat)
        .setHTML(`<b>${esc(props.name)}</b><br>${esc(props.kind)}<br>${esc(props.address)}<br>Official drop-off. Use it.`)
        .addTo(cityMap);
    });
    cityMap.on("mouseenter", "pillars", () => { cityMap.getCanvas().style.cursor = "pointer"; });
    cityMap.on("mouseleave", "pillars", () => { cityMap.getCanvas().style.cursor = ""; });
    ensureStopMarkers();
    syncCityMap(true);
  });
}

function emptyCollection() {
  return { type: "FeatureCollection", features: [] };
}

function blockSquare(lon, lat) {
  const meters = 22;
  const dLat = meters / 111320;
  const dLon = meters / (111320 * Math.cos(lat * Math.PI / 180));
  return [[
    [lon - dLon, lat - dLat],
    [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat],
    [lon - dLon, lat + dLat],
    [lon - dLon, lat - dLat]
  ]];
}

const PILLAR_COLOR = {
  hazard: "#9e2b2b",
  metal: "#8a6a32",
  paper: "#c4a36a",
  plastic: "#1f6f68",
  glass: "#3d6b8a",
  food: "#5e8f4a",
  butts: "#5c5346",
  other: "#c46b4a"
};

function syncCityMap(forceFly) {
  if (!cityMap || !mapReady) return;
  const stop = currentStop();
  cityMap.getSource("route").setData({
    type: "Feature",
    geometry: { type: "LineString", coordinates: STOPS.map((item) => [item.lng, item.lat]) },
    properties: {}
  });
  cityMap.getSource("pillars").setData({
    type: "FeatureCollection",
    features: CITY_FEED.dumps.map((site) => {
      const filed = state.cleared.includes(site.id) || state.picked.includes(site.id);
      return {
        type: "Feature",
        properties: {
          id: site.id,
          color: filed ? "#1e6b45" : (PILLAR_COLOR[dominantType(site)] || "#c46b4a"),
          h: filed ? 8 : Math.min(96, 16 + site.count * 18)
        },
        geometry: { type: "Polygon", coordinates: blockSquare(site.lon, site.lat) }
      };
    })
  });
  cityMap.getSource("bins").setData({
    type: "FeatureCollection",
    features: CITY_FEED.bins.map((bin) => ({
      type: "Feature",
      properties: { name: bin.name, kind: bin.kind, address: bin.address },
      geometry: { type: "Point", coordinates: [bin.lon, bin.lat] }
    }))
  });
  ensureStopMarkers();
  if (forceFly || flownStop !== stop.id) {
    flownStop = stop.id;
    cityMap.easeTo({ center: [stop.lng, stop.lat], zoom: 16.05, pitch: 60, bearing: -18, duration: 900 });
  }
}

function ensureStopMarkers() {
  if (!cityMap) return;
  if (stopMarkers.length) {
    stopMarkers.forEach((entry, index) => { entry.el.className = beaconClass(index); });
    return;
  }
  STOPS.forEach((stop, index) => {
    const el = document.createElement("div");
    el.className = beaconClass(index);
    el.innerHTML = `<div class="ring"></div><div class="core">${stop.chapter}</div><div class="lbl">${esc(stop.name)}</div>`;
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      onBeacon(index);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([stop.lng, stop.lat]).addTo(cityMap);
    stopMarkers.push({ marker, el });
  });
}

function beaconClass(index) {
  if (index < state.stop) return "beacon done";
  if (index === state.stop) return "beacon now";
  return "beacon ahead";
}

function onBeacon(index) {
  const stop = STOPS[index];
  focusLngLat(stop.lng, stop.lat);
  if (index > state.stop) showToast("That chapter is still shut. Patrol the one in front of you.");
  else if (index < state.stop) showToast(`${stop.name} is already in the file.`);
  else showToast(stop.place);
}

function focusSite(site) {
  focusLngLat(site.lon, site.lat, 16.6);
}

function focusLngLat(lng, lat, zoom) {
  if (!cityMap) return;
  cityMap.easeTo({ center: [lng, lat], zoom: zoom || 16.2, pitch: 62, duration: 800 });
}

async function flyRoute() {
  if (!cityMap || flying) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stop = currentStop();
  if (reduce) {
    focusLngLat(stop.lng, stop.lat);
    return;
  }
  flying = true;
  const path = STOPS.slice(0, state.stop + 1);
  for (const item of path) {
    if (!cityMap) break;
    cityMap.easeTo({ center: [item.lng, item.lat], zoom: 16.2, pitch: 64, bearing: cityMap.getBearing() + 16, duration: 1400 });
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  flying = false;
}

refreshCityFeed();
render();
