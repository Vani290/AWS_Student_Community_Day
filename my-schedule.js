/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║   MY SCHEDULE — AWS Student Community Day at IGDTUW      ║
 * ║   Enhanced Edition — All features                        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Features:
 * - Bookmark sessions with confetti burst
 * - Personal notes per speaker (persisted)
 * - Schedule stats (sessions, companies, topics)
 * - Speaker bio / about in panel
 * - Interactive timeline view
 * - Browser reminders / notifications
 * - Export schedule as styled PNG
 * - Drag to reorder sessions
 * - Search & filter inside panel
 * - Smooth animations throughout
 * - Dark AWS theme (navy + orange)
 */

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & THEME
═══════════════════════════════════════════════════════════ */
const C = {
  orange:     "#FF9900",
  orangeD:    "#E07B00",
  orangeLight:"rgba(255,153,0,0.12)",
  navy:       "#1a1a2e",
  navyL:      "#16213e",
  navyLL:     "#0f3460",
  white:      "#ffffff",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.3)",
  border:     "rgba(255,255,255,0.08)",
  cardBg:     "rgba(255,255,255,0.04)",
  success:    "#22c55e",
  danger:     "#ef4444",
  KEY:        "aws_scd_v3",
};


/* ═══════════════════════════════════════════════════════════
   DATA STORE
═══════════════════════════════════════════════════════════ */
const Store = (() => {
  function load() {
    try { return JSON.parse(localStorage.getItem(C.KEY)) || { sessions: {}, order: [], notes: {}, reminders: {} }; }
    catch { return { sessions: {}, order: [], notes: {}, reminders: {} }; }
  }
  function save(d) { localStorage.setItem(C.KEY, JSON.stringify(d)); }

  return {
    has(id)       { return !!load().sessions[id]; },
    count()       { return Object.keys(load().sessions).length; },
    list()        { const d = load(); return (d.order.length ? d.order : Object.keys(d.sessions)).map(id => d.sessions[id]).filter(Boolean); },
    getNote(id)   { return load().notes[id] || ""; },
    getReminder(id){ return load().reminders[id] || null; },

    toggle(session) {
      const d = load();
      if (d.sessions[session.id]) {
        delete d.sessions[session.id];
        d.order = d.order.filter(x => x !== session.id);
        delete d.notes[session.id];
        delete d.reminders[session.id];
        save(d); return false;
      } else {
        d.sessions[session.id] = session;
        if (!d.order.includes(session.id)) d.order.push(session.id);
        save(d); return true;
      }
    },

    saveNote(id, text) {
      const d = load(); d.notes[id] = text; save(d);
    },

    saveReminder(id, time) {
      const d = load(); d.reminders[id] = time; save(d);
    },

    reorder(newOrder) {
      const d = load(); d.order = newOrder; save(d);
    },

    remove(id) {
      const d = load();
      delete d.sessions[id];
      d.order = d.order.filter(x => x !== id);
      delete d.notes[id];
      delete d.reminders[id];
      save(d);
    },

    clear() { localStorage.removeItem(C.KEY); },
  };
})();


/* ═══════════════════════════════════════════════════════════
   INJECT GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
function injectStyles() {
  if (document.getElementById("scd-styles")) return;
  const s = document.createElement("style");
  s.id = "scd-styles";
  s.textContent = `
    @keyframes scdSlideUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scdFadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes scdPop       { 0%{transform:scale(0.4)} 60%{transform:scale(1.18)} 100%{transform:scale(1)} }
    @keyframes scdShake     { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
    @keyframes scdPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(255,153,0,0.5)} 50%{box-shadow:0 0 0 8px rgba(255,153,0,0)} }
    @keyframes confettiFall { to{transform:translateY(110vh) rotate(720deg); opacity:0} }

    .scd-btn {
      position:absolute; top:10px; right:10px;
      width:34px; height:34px; border:none; border-radius:8px;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:all 0.22s cubic-bezier(0.34,1.4,0.64,1); z-index:10;
      backdrop-filter:blur(6px);
    }
    .scd-btn:hover { transform:scale(1.15) !important; }
    .scd-btn.active { animation:scdPulse 1s ease 1; }

    .scd-fab {
      position:fixed; bottom:28px; right:28px; z-index:9999;
      display:flex; align-items:center; gap:9px;
      padding:0 20px 0 16px; height:52px;
      background:${C.navy}; color:${C.white}; border:1px solid rgba(255,153,0,0.3);
      border-radius:100px; font-size:14px; font-weight:700; cursor:pointer;
      box-shadow:0 4px 24px rgba(255,153,0,0.35), 0 2px 8px rgba(0,0,0,0.4);
      font-family:inherit; transition:all 0.22s cubic-bezier(0.34,1.2,0.64,1);
    }
    .scd-fab:hover { transform:translateY(-4px) scale(1.03); box-shadow:0 10px 32px rgba(255,153,0,0.5); }

    .scd-badge {
      min-width:20px; height:20px; padding:0 5px; border-radius:100px;
      background:${C.orange}; color:#fff; font-size:11px; font-weight:800;
      display:none; align-items:center; justify-content:center;
      animation:scdPop 0.35s cubic-bezier(0.34,1.4,0.64,1);
    }

    .scd-overlay {
      position:fixed; inset:0; z-index:9997;
      background:rgba(0,0,0,0.65); backdrop-filter:blur(4px);
      display:none; animation:scdFadeIn 0.25s ease;
    }

    .scd-panel {
      position:fixed; top:0; right:0; width:420px; max-width:100vw;
      height:100vh; z-index:9998;
      background:${C.navy}; display:flex; flex-direction:column;
      transform:translateX(100%); transition:transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
      box-shadow:-10px 0 60px rgba(0,0,0,0.6); border-left:1px solid rgba(255,153,0,0.2);
    }
    .scd-panel.open { transform:translateX(0); }

    .scd-tab { 
      padding:8px 14px; border-radius:8px; font-size:12px; font-weight:700;
      border:none; cursor:pointer; transition:all 0.18s ease; font-family:inherit;
      letter-spacing:0.03em; text-transform:uppercase;
    }
    .scd-tab.active { background:${C.orange}; color:#fff; }
    .scd-tab:not(.active) { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.5); }
    .scd-tab:not(.active):hover { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8); }

    .scd-card {
      background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
      border-radius:14px; padding:15px 16px; margin-bottom:10px;
      animation:scdSlideUp 0.32s ease both; cursor:grab;
      transition:border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .scd-card:hover { border-color:rgba(255,153,0,0.35); box-shadow:0 4px 20px rgba(255,153,0,0.1); }
    .scd-card.dragging { opacity:0.4; cursor:grabbing; }
    .scd-card.drag-over { border-color:${C.orange}; box-shadow:0 0 0 2px rgba(255,153,0,0.3); }

    .scd-note-area {
      width:100%; margin-top:10px; padding:9px 12px;
      background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
      border-radius:9px; color:#fff; font-size:12px; font-family:inherit;
      resize:none; outline:none; transition:border-color 0.2s;
      line-height:1.6;
    }
    .scd-note-area:focus { border-color:rgba(255,153,0,0.5); }
    .scd-note-area::placeholder { color:rgba(255,255,255,0.25); }

    .scd-search {
      width:100%; padding:10px 14px 10px 38px;
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; color:#fff; font-size:13px; font-family:inherit;
      outline:none; transition:all 0.2s ease; box-sizing:border-box;
    }
    .scd-search:focus { border-color:rgba(255,153,0,0.5); background:rgba(255,255,255,0.08); }
    .scd-search::placeholder { color:rgba(255,255,255,0.3); }

    .scd-stat-card {
      background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
      border-radius:12px; padding:16px; flex:1; text-align:center;
      animation:scdSlideUp 0.3s ease both;
    }

    .scd-timeline-item {
      display:flex; gap:14px; padding:12px 0;
      animation:scdSlideUp 0.3s ease both;
    }

    .scd-reminder-btn {
      padding:5px 10px; border-radius:6px; font-size:11px; font-weight:700;
      border:1px solid rgba(255,153,0,0.4); background:transparent; color:${C.orange};
      cursor:pointer; font-family:inherit; transition:all 0.15s;
    }
    .scd-reminder-btn:hover { background:${C.orangeLight}; }
    .scd-reminder-btn.set { background:rgba(34,197,94,0.15); border-color:rgba(34,197,94,0.4); color:#22c55e; }

    .scd-remove-btn {
      width:28px; height:28px; flex-shrink:0; border:none; border-radius:6px;
      background:transparent; color:rgba(255,255,255,0.25); cursor:pointer;
      font-size:15px; display:flex; align-items:center; justify-content:center;
      transition:all 0.15s; font-family:inherit;
    }
    .scd-remove-btn:hover { background:rgba(239,68,68,0.15); color:#ef4444; }

    .scd-toast {
      position:fixed; bottom:100px; right:28px; z-index:99999;
      padding:11px 18px; border-radius:10px; font-size:13px; font-weight:600;
      color:#fff; background:${C.navyL}; max-width:300px;
      opacity:0; transform:translateY(10px) scale(0.96);
      transition:all 0.28s cubic-bezier(0.34,1.2,0.64,1);
      pointer-events:none; font-family:inherit;
      border-left:4px solid ${C.orange};
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
    }
    .scd-toast.show { opacity:1; transform:translateY(0) scale(1); }

    .scd-export-btn {
      flex:1; padding:10px; border-radius:9px; font-size:12px; font-weight:700;
      border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05);
      color:rgba(255,255,255,0.7); cursor:pointer; font-family:inherit; transition:all 0.15s;
      display:flex; align-items:center; justify-content:center; gap:6px;
    }
    .scd-export-btn:hover { background:rgba(255,153,0,0.12); border-color:rgba(255,153,0,0.4); color:${C.orange}; }

    .confetti-piece {
      position:fixed; top:-10px; z-index:999999; border-radius:2px;
      animation:confettiFall linear forwards; pointer-events:none;
    }

    /* Scrollbar */
    .scd-scroll::-webkit-scrollbar { width:4px; }
    .scd-scroll::-webkit-scrollbar-track { background:transparent; }
    .scd-scroll::-webkit-scrollbar-thumb { background:rgba(255,153,0,0.3); border-radius:4px; }

    @media(max-width:480px) {
      .scd-panel { width:100vw; }
      .scd-fab { bottom:20px; right:16px; padding:0 14px 0 12px; height:46px; font-size:13px; }
      .scd-toast { right:16px; left:16px; max-width:none; }
    }
  `;
  document.head.appendChild(s);
}


/* ═══════════════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════════════ */
function fireConfetti() {
  const colors = [C.orange, "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#fff"];
  for (let i = 0; i < 55; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    const size = Math.random() * 8 + 5;
    el.style.cssText = `
      left:${Math.random() * 100}vw;
      width:${size}px; height:${size * (Math.random() > 0.5 ? 1 : 2.5)}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${Math.random() * 1.5 + 1.2}s;
      animation-delay:${Math.random() * 0.5}s;
      transform:rotate(${Math.random() * 360}deg);
      opacity:${Math.random() * 0.5 + 0.5};
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}


/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
let _toastTimer;
function toast(msg, type = "success") {
  let el = document.getElementById("scd-toast");
  if (!el) return;
  clearTimeout(_toastTimer);
  el.textContent = msg;
  el.style.borderLeftColor = type === "remove" ? C.danger : type === "info" ? "#60a5fa" : C.orange;
  el.classList.add("show");
  _toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}


/* ═══════════════════════════════════════════════════════════
   PANEL STATE
═══════════════════════════════════════════════════════════ */
let activeTab = "sessions"; // sessions | stats | timeline
let searchQuery = "";
let _dragSrc = null;

function openPanel() {
  renderPanel();
  document.getElementById("scd-panel").classList.add("open");
  document.getElementById("scd-overlay").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closePanel() {
  document.getElementById("scd-panel").classList.remove("open");
  document.getElementById("scd-overlay").style.display = "none";
  document.body.style.overflow = "";
}


/* ═══════════════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════════════ */
function updateBadge() {
  const b = document.getElementById("scd-badge");
  if (!b) return;
  const n = Store.count();
  b.textContent = n;
  b.style.display = n > 0 ? "flex" : "none";
}


/* ═══════════════════════════════════════════════════════════
   RENDER PANEL
═══════════════════════════════════════════════════════════ */
function renderPanel() {
  const body = document.getElementById("scd-body");
  if (!body) return;
  if (activeTab === "sessions") renderSessions(body);
  else if (activeTab === "stats")    renderStats(body);
  else if (activeTab === "timeline") renderTimeline(body);
}

/* ── Sessions Tab ── */
function renderSessions(body) {
  const all = Store.list();
  const filtered = searchQuery
    ? all.filter(s =>
        `${s.name} ${s.topic} ${s.company}`.toLowerCase().includes(searchQuery.toLowerCase()))
    : all;

  body.innerHTML = "";

  if (all.length === 0) {
    body.innerHTML = `
      <div style="text-align:center;padding:60px 24px;">
        <div style="font-size:48px;margin-bottom:16px;opacity:0.3;">🔖</div>
        <p style="color:rgba(255,255,255,0.4);font-size:15px;font-weight:600;margin:0 0 6px;">No sessions saved yet</p>
        <p style="color:rgba(255,255,255,0.25);font-size:12px;line-height:1.6;">
          Click the bookmark icon on any speaker card to build your schedule.
        </p>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    body.innerHTML = `<div style="text-align:center;padding:40px 24px;color:rgba(255,255,255,0.3);font-size:13px;">
      No sessions match "<strong style="color:${C.orange}">${safe(searchQuery)}</strong>"
    </div>`;
    return;
  }

  filtered.forEach((session, i) => {
    const card = document.createElement("div");
    card.className = "scd-card";
    card.setAttribute("draggable", "true");
    card.setAttribute("data-id", session.id);
    card.style.animationDelay = `${i * 45}ms`;

    const note = Store.getNote(session.id);
    const reminder = Store.getReminder(session.id);

    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="
          width:38px;height:38px;flex-shrink:0;border-radius:50%;
          background:linear-gradient(135deg,${C.orange},${C.orangeD});
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:800;color:#fff;">
          ${session.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:14px;font-weight:700;color:#fff;margin:0 0 2px;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${safe(session.name)}
          </p>
          <p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0 0 7px;line-height:1.4;
            display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${safe(session.topic)}
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px;">
            ${session.company ? `<span style="padding:2px 8px;border-radius:100px;font-size:10.5px;font-weight:700;background:rgba(255,153,0,0.12);color:${C.orange};">${safe(session.company)}</span>` : ""}
            ${session.time ? `<span style="padding:2px 8px;border-radius:100px;font-size:10.5px;font-weight:700;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);">⏰ ${safe(session.time)}</span>` : ""}
          </div>
          <div style="display:flex;gap:7px;flex-wrap:wrap;">
            <button class="scd-reminder-btn${reminder ? " set" : ""}" data-remind="${session.id}" title="Set reminder">
              ${reminder ? "🔔 Reminder set" : "🔔 Set reminder"}
            </button>
            <button class="scd-reminder-btn" data-about="${session.id}" style="border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);">
              👤 About
            </button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
          <button class="scd-remove-btn" data-remove="${session.id}" title="Remove">✕</button>
          <span style="font-size:18px;color:rgba(255,255,255,0.15);cursor:grab;padding:2px 4px;" title="Drag to reorder">⠿</span>
        </div>
      </div>

      <!-- Notes area -->
      <div style="margin-top:10px;">
        <textarea class="scd-note-area" data-note="${session.id}" rows="2"
          placeholder="Add your personal notes for this session...">${safe(note)}</textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:4px;">
          <span style="font-size:10px;color:rgba(255,255,255,0.2);" data-note-status="${session.id}">
            ${note ? "✓ Saved" : ""}
          </span>
        </div>
      </div>`;

    // Note save (debounced)
    let noteTimer;
    card.querySelector(`[data-note="${session.id}"]`).addEventListener("input", function() {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        Store.saveNote(session.id, this.value);
        const status = card.querySelector(`[data-note-status="${session.id}"]`);
        if (status) { status.textContent = "✓ Saved"; }
      }, 600);
    });

    // Remove
    card.querySelector(`[data-remove]`).addEventListener("click", () => {
      Store.remove(session.id);
      card.style.transition = "all 0.25s ease";
      card.style.opacity = "0";
      card.style.transform = "translateX(20px)";
      setTimeout(() => { renderPanel(); updateBadge(); syncButtons(); }, 280);
      toast(`Removed "${session.name}"`, "remove");
    });

    // Reminder
    card.querySelector(`[data-remind]`).addEventListener("click", function() {
      showReminderModal(session);
    });

    // About
    card.querySelector(`[data-about]`).addEventListener("click", () => {
      showAboutModal(session);
    });

    // Drag & drop
    card.addEventListener("dragstart", () => {
      _dragSrc = session.id;
      setTimeout(() => card.classList.add("dragging"), 0);
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("dragover", e => { e.preventDefault(); card.classList.add("drag-over"); });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", e => {
      e.preventDefault();
      card.classList.remove("drag-over");
      if (_dragSrc && _dragSrc !== session.id) {
        const all = Store.list().map(s => s.id);
        const fromIdx = all.indexOf(_dragSrc);
        const toIdx = all.indexOf(session.id);
        all.splice(fromIdx, 1);
        all.splice(toIdx, 0, _dragSrc);
        Store.reorder(all);
        renderPanel();
        toast("Order updated", "info");
      }
    });

    body.appendChild(card);
  });
}

/* ── Stats Tab ── */
function renderStats(body) {
  const sessions = Store.list();
  body.innerHTML = "";

  if (sessions.length === 0) {
    body.innerHTML = `<div style="text-align:center;padding:60px 24px;color:rgba(255,255,255,0.3);font-size:13px;">
      Save some sessions first to see your stats!
    </div>`;
    return;
  }

  const companies = [...new Set(sessions.map(s => s.company).filter(Boolean))];
  const topics = sessions.map(s => s.topic).filter(Boolean);
  const withNotes = sessions.filter(s => Store.getNote(s.id)).length;
  const withReminders = sessions.filter(s => Store.getReminder(s.id)).length;

  body.innerHTML = `
    <!-- Summary cards -->
    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <div class="scd-stat-card" style="animation-delay:0ms">
        <div style="font-size:28px;font-weight:800;color:${C.orange}">${sessions.length}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Sessions</div>
      </div>
      <div class="scd-stat-card" style="animation-delay:60ms">
        <div style="font-size:28px;font-weight:800;color:${C.orange}">${companies.length}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Companies</div>
      </div>
      <div class="scd-stat-card" style="animation-delay:120ms">
        <div style="font-size:28px;font-weight:800;color:${C.orange}">${withNotes}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Notes</div>
      </div>
    </div>

    <!-- Reminders -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
      border-radius:12px;padding:14px 16px;margin-bottom:14px;animation:scdSlideUp 0.3s ease 0.1s both;">
      <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);
        text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">🔔 Reminders</div>
      ${withReminders > 0
        ? sessions.filter(s => Store.getReminder(s.id)).map(s => `
            <div style="display:flex;justify-content:space-between;align-items:center;
              padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="font-size:13px;color:#fff;font-weight:600;">${safe(s.name)}</span>
              <span style="font-size:11px;color:${C.orange};font-weight:700;">${Store.getReminder(s.id)}</span>
            </div>`).join("")
        : `<p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0;">No reminders set yet.</p>`
      }
    </div>

    <!-- Companies -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
      border-radius:12px;padding:14px 16px;margin-bottom:14px;animation:scdSlideUp 0.3s ease 0.15s both;">
      <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);
        text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">🏢 Companies represented</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${companies.map(c => `
          <span style="padding:4px 10px;border-radius:100px;font-size:11px;font-weight:700;
            background:rgba(255,153,0,0.1);color:${C.orange};border:1px solid rgba(255,153,0,0.2);">
            ${safe(c)}
          </span>`).join("")}
      </div>
    </div>

    <!-- Topic breakdown -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
      border-radius:12px;padding:14px 16px;animation:scdSlideUp 0.3s ease 0.2s both;">
      <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);
        text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">📋 Session topics</div>
      ${topics.map((t, i) => `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:600;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:75%;">${safe(t)}</span>
          </div>
          <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:100px;overflow:hidden;">
            <div style="height:100%;width:100%;background:linear-gradient(90deg,${C.orange},${C.orangeD});
              border-radius:100px;animation:scdSlideUp 0.5s ease ${i*60}ms both;"></div>
          </div>
        </div>`).join("")}
    </div>
  `;
}

/* ── Timeline Tab ── */
function renderTimeline(body) {
  const sessions = Store.list();
  body.innerHTML = "";

  if (sessions.length === 0) {
    body.innerHTML = `<div style="text-align:center;padding:60px 24px;color:rgba(255,255,255,0.3);font-size:13px;">
      Save sessions to see your day timeline!
    </div>`;
    return;
  }

  body.innerHTML = `
    <div style="padding:8px 0 16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="height:1px;flex:1;background:rgba(255,153,0,0.3);"></div>
        <span style="font-size:11px;font-weight:700;color:${C.orange};letter-spacing:0.08em;text-transform:uppercase;">
          📅 Feb 3, 2024 · IGDTUW, Delhi
        </span>
        <div style="height:1px;flex:1;background:rgba(255,153,0,0.3);"></div>
      </div>
      ${sessions.map((s, i) => `
        <div class="scd-timeline-item" style="animation-delay:${i*60}ms;">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
            <div style="width:14px;height:14px;border-radius:50%;
              background:${C.orange};border:2px solid ${C.navyL};
              box-shadow:0 0 0 3px rgba(255,153,0,0.25);flex-shrink:0;margin-top:3px;"></div>
            ${i < sessions.length - 1
              ? `<div style="width:2px;flex:1;min-height:40px;margin-top:4px;
                  background:linear-gradient(${C.orange},rgba(255,153,0,0.1));"></div>`
              : ""}
          </div>
          <div style="flex:1;padding-bottom:${i < sessions.length-1 ? "8px" : "0"};">
            <div style="font-size:10px;font-weight:700;color:${C.orange};
              letter-spacing:0.06em;text-transform:uppercase;margin-bottom:4px;">
              ${safe(s.time || `Session ${i+1}`)}
            </div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
              border-radius:10px;padding:11px 13px;">
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 3px;">${safe(s.name)}</p>
              <p style="font-size:11.5px;color:rgba(255,255,255,0.5);margin:0 0 7px;line-height:1.4;">${safe(s.topic)}</p>
              ${s.company ? `<span style="padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;
                background:rgba(255,153,0,0.1);color:${C.orange};">${safe(s.company)}</span>` : ""}
              ${Store.getNote(s.id) ? `
                <div style="margin-top:8px;padding:7px 10px;background:rgba(255,255,255,0.04);
                  border-left:2px solid ${C.orange};border-radius:0 6px 6px 0;">
                  <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:0;line-height:1.5;font-style:italic;">
                    📝 ${safe(Store.getNote(s.id))}
                  </p>
                </div>` : ""}
            </div>
          </div>
        </div>`).join("")}
    </div>`;
}


/* ═══════════════════════════════════════════════════════════
   ABOUT MODAL
═══════════════════════════════════════════════════════════ */
function showAboutModal(session) {
  const existing = document.getElementById("scd-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "scd-modal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);
    animation:scdFadeIn 0.2s ease;padding:20px;`;

  modal.innerHTML = `
    <div style="background:${C.navyL};border:1px solid rgba(255,153,0,0.3);
      border-radius:20px;padding:28px;max-width:380px;width:100%;
      animation:scdSlideUp 0.3s cubic-bezier(0.34,1.2,0.64,1);
      box-shadow:0 20px 60px rgba(0,0,0,0.6);">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <div style="width:52px;height:52px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,${C.orange},${C.orangeD});
          display:flex;align-items:center;justify-content:center;
          font-size:18px;font-weight:800;color:#fff;">
          ${session.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
        </div>
        <div>
          <h3 style="font-size:17px;font-weight:800;color:#fff;margin:0 0 3px;">${safe(session.name)}</h3>
          <p style="font-size:12px;color:${C.orange};font-weight:600;margin:0;">${safe(session.company)}</p>
        </div>
        <button onclick="document.getElementById('scd-modal').remove()" style="
          margin-left:auto;width:30px;height:30px;border:1px solid rgba(255,255,255,0.1);
          border-radius:8px;background:transparent;color:rgba(255,255,255,0.5);
          cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <div style="background:rgba(255,153,0,0.08);border:1px solid rgba(255,153,0,0.2);
        border-radius:12px;padding:14px;margin-bottom:16px;">
        <div style="font-size:10px;font-weight:700;color:${C.orange};text-transform:uppercase;
          letter-spacing:0.08em;margin-bottom:6px;">🎤 Session Topic</div>
        <p style="font-size:13px;color:#fff;margin:0;line-height:1.6;">${safe(session.topic)}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
          border-radius:10px;padding:11px;">
          <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:700;
            text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">🏢 Organization</div>
          <p style="font-size:12px;color:#fff;margin:0;font-weight:600;">${safe(session.company || "—")}</p>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
          border-radius:10px;padding:11px;">
          <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:700;
            text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">⏰ Time Slot</div>
          <p style="font-size:12px;color:#fff;margin:0;font-weight:600;">${safe(session.time || "TBD")}</p>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
        border-radius:10px;padding:13px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:700;
          text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">📝 Your Notes</div>
        <p style="font-size:12px;color:rgba(255,255,255,0.6);margin:0;font-style:italic;line-height:1.6;">
          ${Store.getNote(session.id) || "No notes yet. Add them from the Sessions tab."}
        </p>
      </div>
    </div>`;

  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}


/* ═══════════════════════════════════════════════════════════
   REMINDER MODAL
═══════════════════════════════════════════════════════════ */
function showReminderModal(session) {
  const existing = document.getElementById("scd-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "scd-modal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);
    animation:scdFadeIn 0.2s ease;padding:20px;`;

  const slots = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
  const current = Store.getReminder(session.id);

  modal.innerHTML = `
    <div style="background:${C.navyL};border:1px solid rgba(255,153,0,0.3);
      border-radius:20px;padding:28px;max-width:340px;width:100%;
      animation:scdSlideUp 0.3s cubic-bezier(0.34,1.2,0.64,1);
      box-shadow:0 20px 60px rgba(0,0,0,0.6);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <h3 style="font-size:17px;font-weight:800;color:#fff;margin:0;">🔔 Set Reminder</h3>
        <button onclick="document.getElementById('scd-modal').remove()" style="
          width:30px;height:30px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;
          background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;
          font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 20px;line-height:1.5;">
        Pick a reminder time for <strong style="color:#fff;">${safe(session.name)}</strong>'s session.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px;">
        ${slots.map(t => `
          <button onclick="setReminder('${session.id}','${t}')" style="
            padding:9px 6px;border-radius:9px;font-size:12px;font-weight:700;
            border:1px solid ${current===t ? C.orange : "rgba(255,255,255,0.1)"};
            background:${current===t ? C.orangeLight : "rgba(255,255,255,0.04)"};
            color:${current===t ? C.orange : "rgba(255,255,255,0.6)"};
            cursor:pointer;font-family:inherit;transition:all 0.15s;">
            ${t}
          </button>`).join("")}
      </div>
      ${current ? `
        <button onclick="clearReminder('${session.id}')" style="
          width:100%;padding:10px;border-radius:9px;font-size:12px;font-weight:700;
          border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.08);
          color:#ef4444;cursor:pointer;font-family:inherit;">
          Remove reminder
        </button>` : ""}
    </div>`;

  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

window.setReminder = function(id, time) {
  Store.saveReminder(id, time);
  document.getElementById("scd-modal")?.remove();
  renderPanel();
  toast(`🔔 Reminder set for ${time}`, "success");

  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(p => {
      if (p === "granted") toast("Notifications enabled!", "success");
    });
  }
};

window.clearReminder = function(id) {
  Store.saveReminder(id, null);
  document.getElementById("scd-modal")?.remove();
  renderPanel();
  toast("Reminder removed", "remove");
};


/* ═══════════════════════════════════════════════════════════
   EXPORT AS IMAGE
═══════════════════════════════════════════════════════════ */
function exportSchedule() {
  const sessions = Store.list();
  if (sessions.length === 0) { toast("Save some sessions first!", "remove"); return; }

  const canvas = document.createElement("canvas");
  const W = 600, ROW = 80, PAD = 32;
  canvas.width = W;
  canvas.height = PAD * 2 + 100 + sessions.length * ROW + 20;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Orange accent bar
  ctx.fillStyle = "#FF9900";
  ctx.fillRect(0, 0, W, 5);

  // Header
  ctx.fillStyle = "#FF9900";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("AWS STUDENT COMMUNITY DAY · IGDTUW", PAD, 36);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("My Personal Schedule", PAD, 64);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "12px sans-serif";
  ctx.fillText(`${sessions.length} session${sessions.length!==1?"s":""} · Feb 3, 2024`, PAD, 85);

  // Divider
  ctx.fillStyle = "rgba(255,153,0,0.3)";
  ctx.fillRect(PAD, 100, W - PAD*2, 1);

  // Sessions
  sessions.forEach((s, i) => {
    const y = 100 + PAD/2 + i * ROW;

    // Dot
    ctx.beginPath();
    ctx.arc(PAD + 8, y + ROW/2, 6, 0, Math.PI*2);
    ctx.fillStyle = "#FF9900";
    ctx.fill();

    // Line
    if (i < sessions.length - 1) {
      ctx.fillStyle = "rgba(255,153,0,0.2)";
      ctx.fillRect(PAD + 7, y + ROW/2 + 6, 2, ROW - 12);
    }

    const tx = PAD + 24;

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(s.name, tx, y + ROW/2 - 8);

    // Topic
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px sans-serif";
    const topic = s.topic.length > 55 ? s.topic.slice(0, 52) + "…" : s.topic;
    ctx.fillText(topic, tx, y + ROW/2 + 8);

    // Time chip
    if (s.time) {
      ctx.fillStyle = "rgba(255,153,0,0.15)";
      const tw = ctx.measureText(s.time).width + 16;
      roundRect(ctx, tx, y + ROW/2 + 18, tw, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#FF9900";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(s.time, tx + 8, y + ROW/2 + 30);
    }
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "11px sans-serif";
  ctx.fillText("Generated by AWS SCD · My Schedule Feature", PAD, canvas.height - 14);

  // Download
  const a = document.createElement("a");
  a.download = "my-aws-scd-schedule.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
  toast("📥 Schedule downloaded as PNG!", "success");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}


/* ═══════════════════════════════════════════════════════════
   INJECT FULL PANEL SHELL
═══════════════════════════════════════════════════════════ */
function injectShell() {
  if (document.getElementById("scd-fab")) return;

  // Toast
  const toastEl = document.createElement("div");
  toastEl.id = "scd-toast";
  toastEl.className = "scd-toast";
  document.body.appendChild(toastEl);

  // FAB
  const fab = document.createElement("button");
  fab.id = "scd-fab";
  fab.className = "scd-fab";
  fab.setAttribute("aria-label", "My Schedule");
  fab.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9900" stroke-width="2.5">
      <path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"/>
    </svg>
    My Schedule
    <span id="scd-badge" class="scd-badge">0</span>`;
  fab.addEventListener("click", openPanel);
  document.body.appendChild(fab);

  // Overlay
  const overlay = document.createElement("div");
  overlay.id = "scd-overlay";
  overlay.className = "scd-overlay";
  overlay.addEventListener("click", closePanel);
  document.body.appendChild(overlay);

  // Panel
  const panel = document.createElement("div");
  panel.id = "scd-panel";
  panel.className = "scd-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "My Schedule");

  panel.innerHTML = `
    <!-- Header -->
    <div style="padding:18px 18px 0;flex-shrink:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:9px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${C.orange}" stroke-width="2.5">
            <path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"/>
          </svg>
          <span style="font-size:18px;font-weight:800;color:#fff;">My Schedule</span>
        </div>
        <button id="scd-close" style="
          width:34px;height:34px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;
          background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;
          font-size:16px;display:flex;align-items:center;justify-content:center;
          transition:all 0.15s;">✕</button>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:6px;margin-bottom:14px;">
        <button class="scd-tab active" data-tab="sessions">Sessions</button>
        <button class="scd-tab" data-tab="stats">Stats</button>
        <button class="scd-tab" data-tab="timeline">Timeline</button>
      </div>

      <!-- Search (sessions tab only) -->
      <div id="scd-search-wrap" style="position:relative;margin-bottom:12px;">
        <svg style="position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none;"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="scd-search" class="scd-search" placeholder="Search saved sessions…" type="text"/>
      </div>
    </div>

    <!-- Body -->
    <div id="scd-body" class="scd-scroll" style="flex:1;overflow-y:auto;padding:0 18px;"></div>

    <!-- Footer -->
    <div style="padding:12px 18px 18px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;background:rgba(0,0,0,0.15);">
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="scd-export-btn" id="scd-export">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export PNG
        </button>
        <button class="scd-export-btn" id="scd-clear">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>
          </svg>
          Clear all
        </button>
      </div>
      <p style="font-size:10.5px;color:rgba(255,255,255,0.2);margin:0;text-align:center;">
        ✓ All data saved locally · Persists across refreshes
      </p>
    </div>`;

  document.body.appendChild(panel);

  // Tab switching
  panel.querySelectorAll(".scd-tab").forEach(btn => {
    btn.addEventListener("click", function() {
      panel.querySelectorAll(".scd-tab").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      activeTab = this.dataset.tab;
      const sw = document.getElementById("scd-search-wrap");
      if (sw) sw.style.display = activeTab === "sessions" ? "block" : "none";
      renderPanel();
    });
  });

  // Search
  panel.querySelector("#scd-search").addEventListener("input", function() {
    searchQuery = this.value;
    renderPanel();
  });

  // Close
  panel.querySelector("#scd-close").addEventListener("click", closePanel);

  // Export
  panel.querySelector("#scd-export").addEventListener("click", exportSchedule);

  // Clear
  panel.querySelector("#scd-clear").addEventListener("click", () => {
    if (Store.count() === 0) { toast("Nothing to clear!", "remove"); return; }
    if (confirm("Clear all saved sessions? This cannot be undone.")) {
      Store.clear();
      renderPanel();
      updateBadge();
      syncButtons();
      toast("Schedule cleared", "remove");
    }
  });

  // Escape
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });
}


/* ═══════════════════════════════════════════════════════════
   BOOKMARK BUTTONS ON SPEAKER CARDS
═══════════════════════════════════════════════════════════ */
function injectBookmarkButtons() {
  const cards = document.querySelectorAll(".speaker-card");
  if (!cards.length) return 0;

  cards.forEach(card => {
    if (card.querySelector(".scd-btn")) return;
    if (getComputedStyle(card).position === "static") card.style.position = "relative";

    const session = {
      id:      card.dataset.sessionId || slugify(card.querySelector("h3")?.textContent || String(Math.random())),
      name:    card.dataset.name      || card.querySelector("h3")?.textContent?.trim() || "Speaker",
      topic:   card.dataset.topic     || card.querySelector(".speaker-details p")?.textContent?.trim() || "",
      company: card.dataset.company   || "",
      time:    card.dataset.time      || "",
    };

    const btn = document.createElement("button");
    btn.className = "scd-btn";
    btn.setAttribute("aria-label", `Bookmark ${session.name}`);
    btn.setAttribute("title", `Save to My Schedule`);
    styleBtn(btn, Store.has(session.id));

    btn.addEventListener("click", e => {
      e.stopPropagation();
      const added = Store.toggle(session);
      styleBtn(btn, added);
      if (added) {
        btn.classList.add("active");
        setTimeout(() => btn.classList.remove("active"), 1000);
        fireConfetti();
        toast(`✓ "${session.name}" saved to schedule!`);
      } else {
        toast(`Removed "${session.name}"`, "remove");
      }
      updateBadge();
      if (document.getElementById("scd-panel")?.classList.contains("open")) renderPanel();
    });

    card.appendChild(btn);
  });

  return cards.length;
}

function styleBtn(btn, active) {
  btn.style.cssText = `
    position:absolute;top:10px;right:10px;width:34px;height:34px;
    border:none;border-radius:8px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    background:${active ? "rgba(255,153,0,0.2)" : "rgba(0,0,0,0.35)"};
    color:${active ? C.orange : "rgba(255,255,255,0.55)"};
    backdrop-filter:blur(6px);transition:all 0.22s cubic-bezier(0.34,1.4,0.64,1);z-index:10;`;
  btn.innerHTML = active
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="${C.orange}" stroke="${C.orange}" stroke-width="1.5"><path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"/></svg>`;
}

function syncButtons() {
  document.querySelectorAll(".scd-btn").forEach(btn => {
    const card = btn.closest(".speaker-card");
    if (card?.dataset.sessionId) styleBtn(btn, Store.has(card.dataset.sessionId));
  });
}


/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function safe(s) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(s || ""));
  return d.innerHTML;
}
function slugify(s) {
  return s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").slice(0,40);
}


/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
function init() {
  injectStyles();
  injectShell();
  updateBadge();

  const found = injectBookmarkButtons();

  if (found === 0) {
    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      if (injectBookmarkButtons() > 0 || tries > 30) {
        clearInterval(poll);
        updateBadge();
      }
    }, 500);

    const obs = new MutationObserver(() => { injectBookmarkButtons(); updateBadge(); });
    obs.observe(document.body, { childList: true, subtree: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}