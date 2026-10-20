// ===== SETUP: paste your Apps Script Web App URL and the 3 secret keys (must match Code.gs) =====
const API = "https://script.google.com/macros/s/AKfycbwEoNDXeUf2a7KRT8aZeV4JmsmQAKvpiydCAB3k0rsZt6RoeF9T9LWEwUYVJatNj2rk-w/exec";
const KEYS = ["Retsam@654321", "Ssehc#54321@Retsam$654321", "InfoTechFly/443"];
// ================================================================================================
const $ = (s, r = document) => r.querySelector(s), app = $("#app"), dlg = $("#dlg");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const S = { token: localStorage.itf_t || "", user: JSON.parse(localStorage.itf_u || "null") };
const D = { list: null, rec: {} };
const TYPES = { text: "Text", number: "Number", date: "Date", phone: "Phone", email: "Email" };
const INP = { text: "text", number: "number", date: "date", phone: "tel", email: "email" };
const TPL = {
  Gym: [["Date", "date"], ["Name", "text"], ["Fees", "number"], ["Phone Number", "phone"]],
  School: [["Student Name", "text"], ["Class", "text"], ["Fees", "number"], ["Phone Number", "phone"]],
  Shop: [["Date", "date"], ["Customer", "text"], ["Item", "text"], ["Amount", "number"], ["Phone Number", "phone"]],
  Teacher: [["Student", "text"], ["Subject", "text"], ["Date", "date"], ["Marks", "number"]]
};
const score = p => [p.length >= 8, /[a-z]/.test(p), /[A-Z]/.test(p), /\d/.test(p), /[^\w\s]/.test(p), p.length >= 12].filter(Boolean).length;

async function api(action, data = {}) {
  if (API.startsWith("PASTE")) throw new Error("Set your Web App URL in js/app.js first.");
  const r = await fetch(API, { method: "POST", body: new URLSearchParams({ action, token: S.token, k1: KEYS[0], k2: KEYS[1], k3: KEYS[2], ...data }) });
  const j = await r.json();
  if (j.status !== "success") { if (j.code === "auth") out(); throw new Error(j.message); }
  return j;
}
function toast(m, bad) { const t = $("#toast"); t.textContent = m; t.className = "on" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "", 2800); }
function save(r) { S.token = r.token; S.user = r.user; localStorage.itf_t = r.token; localStorage.itf_u = JSON.stringify(r.user); }
function out() { S.token = ""; S.user = null; D.list = null; D.rec = {}; localStorage.removeItem("itf_t"); localStorage.removeItem("itf_u"); location.hash = "#/login"; }
const pwf = (id, label, name, auto, strong) => `<label for="${id}">${label}</label><div class="pw"><input id="${id}" name="${name}" type="password" autocomplete="${auto}"${strong ? " data-s" : ""}><button type="button" class="eye" aria-label="Show or hide password">👁</button></div>${strong ? '<div class="meter"><i></i></div><small class="hint">Make a strong password: 8+ characters with upper and lower case, a number and a symbol.</small>' : ""}`;

document.addEventListener("click", e => {
  const b = e.target.closest(".eye"); if (b) { const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; b.textContent = i.type === "password" ? "👁" : "🙈"; }
});
document.addEventListener("input", e => {
  if (!e.target.matches("[data-s]")) return;
  const p = e.target.value, n = score(p), m = e.target.closest(".pw").nextElementSibling, h = m.nextElementSibling;
  m.firstChild.style.width = (p ? Math.max(n, 1) / 6 * 100 : 0) + "%"; m.dataset.l = n >= 5 ? "s" : n >= 3 ? "m" : "w";
  h.textContent = !p ? "Make a strong password: 8+ characters with upper and lower case, a number and a symbol." : n >= 5 ? "Strong password. Great!" : n >= 3 ? "Medium. Add more characters, a symbol or capitals." : "Weak. Please make a stronger password.";
});

function fh(sel, fn) {
  const f = $(sel), err = $(".err", f), b = $("button[type=submit]", f);
  f.onsubmit = async e => { e.preventDefault(); err.className = "err"; b.disabled = true; try { await fn(Object.fromEntries(new FormData(f))); } catch (x) { err.textContent = x.message; err.className = "err on"; } b.disabled = false; };
}
function modal(html) { dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); return dlg; }
dlg.addEventListener("click", e => { if (e.target === dlg || e.target.dataset.close != null) dlg.close(); });
function ask(msg, label = "Delete") {
  return new Promise(res => {
    modal(`<h2>Are you sure?</h2><p class="mute">${esc(msg)}</p><div class="row" style="margin-top:1.2rem"><button class="btn danger" id="y" style="flex:1">${label}</button><button class="btn ghost" data-close style="flex:1">Cancel</button></div>`);
    $("#y").onclick = () => { dlg.close(); res(true); }; dlg.onclose = () => res(false);
  });
}

// ---------- router ----------
const routes = [[/^#\/login$/, login], [/^#\/register$/, register], [/^#\/new$/, newDash], [/^#\/d\/([\w]+)$/, dash], [/^#\/profile$/, profile]];
async function router() {
  const h = location.hash || "#/", pub = h === "#/login" || h === "#/register";
  if (!S.token && !pub) return location.hash = "#/login";
  if (S.token && pub) return location.hash = "#/";
  $("#links").innerHTML = S.user ? `<a href="#/">Dashboards</a><a href="#/profile" class="me"><i class="av">${esc((S.user.name || "?")[0].toUpperCase())}</i><span>${esc(S.user.name)}</span></a>` : `<a href="#/login">Log in</a><a href="#/register" class="btn sm">Sign up</a>`;
  window.scrollTo(0, 0);
  try { for (const [re, fn] of routes) { const m = h.match(re); if (m) return await fn(m[1]); } await home(); }
  catch (e) { app.innerHTML = `<div class="wrap"><div class="panel"><h2>Something went wrong</h2><p class="mute">${esc(e.message)}</p><button class="btn" onclick="router()">Try again</button></div></div>`; }
}
addEventListener("hashchange", router); router();

// ---------- auth (email + password, then 6-digit email OTP) ----------
function login() {
  app.innerHTML = `<div class="wrap narrow"><div class="panel"><h2>Welcome back ✈</h2><form id="f"><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required>${pwf("p", "Password", "password", "current-password")}<div class="err"></div><button class="btn" type="submit">Continue</button></form><p class="alt">New here? <a href="#/register">Create an account</a></p></div></div>`;
  fh("#f", async d => { const r = await api("login", d); otp("login", r.email); });
}
function register() {
  app.innerHTML = `<div class="wrap narrow"><div class="panel"><h2>Create your account</h2><form id="f"><label for="n">Full name</label><input id="n" name="name" maxlength="40" autocomplete="name" required><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required>${pwf("p", "Password", "password", "new-password", 1)}<div class="err"></div><button class="btn" type="submit">Send verification code</button></form><p class="alt">Already registered? <a href="#/login">Log in</a></p></div></div>`;
  fh("#f", async d => {
    if (score(d.password) < 3 || d.password.length < 8) throw new Error("Please make a stronger password (8+ characters, with capitals, numbers or symbols).");
    const r = await api("register", d); otp("register", r.email);
  });
}

// 6-digit code screen shared by sign up and log in
function otp(purpose, email) {
  const reg = purpose === "register";
  app.innerHTML = `<div class="wrap narrow"><div class="panel otpbox"><div class="mail">✉️</div><h2>${reg ? "Verify your email" : "Enter login code"}</h2>
  <p class="mute">We sent a 6-digit code to<br><b>${esc(email)}</b></p>
  <form id="f"><input type="hidden" name="code"><div class="otp" id="boxes">${'<input inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Digit">'.repeat(6)}</div>
  <div class="err"></div><button class="btn" type="submit">${reg ? "Verify &amp; create account" : "Verify &amp; log in"}</button></form>
  <p class="alt"><button type="button" class="link" id="rs" disabled>Resend code</button> <span id="cd"></span></p>
  <p class="alt"><a href="#/${reg ? "register" : "login"}" id="bk">← Change email</a> · Code is valid for 10 minutes</p></div></div>`;
  const boxes = [...document.querySelectorAll("#boxes input")], f = $("#f"), hid = $("input[name=code]", f);
  const val = () => boxes.map(b => b.value).join("");
  const sync = () => { hid.value = val(); if (hid.value.length === 6) f.requestSubmit(); };
  boxes.forEach((b, i) => {
    b.addEventListener("input", () => { b.value = b.value.replace(/\D/g, "").slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); sync(); });
    b.addEventListener("keydown", e => {
      if (e.key === "Backspace" && !b.value && boxes[i - 1]) { boxes[i - 1].focus(); boxes[i - 1].value = ""; }
      if (e.key === "ArrowLeft" && boxes[i - 1]) boxes[i - 1].focus();
      if (e.key === "ArrowRight" && boxes[i + 1]) boxes[i + 1].focus();
    });
    b.addEventListener("focus", () => b.select());
    b.addEventListener("paste", e => {
      const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6); if (!t) return;
      e.preventDefault(); boxes.forEach((x, j) => x.value = t[j] || ""); boxes[Math.min(t.length, 5)].focus(); sync();
    });
  });
  boxes[0].focus();
  fh("#f", async d => {
    if (!/^\d{6}$/.test(d.code)) throw new Error("Enter the 6-digit code.");
    try { save(await api(reg ? "registerVerify" : "loginVerify", { email, code: d.code })); }
    catch (x) { boxes.forEach(b => b.value = ""); hid.value = ""; boxes[0].focus(); throw x; }
    toast(reg ? "Email verified. Welcome!" : "Logged in"); location.hash = "#/";
  });
  // resend with 30 second timer
  const rs = $("#rs"), cd = $("#cd"); let left = 30, tm;
  const tick = () => {
    if (!rs.isConnected) return clearInterval(tm);
    if (left > 0) { rs.disabled = true; cd.textContent = `in ${left}s`; left--; } else { rs.disabled = false; cd.textContent = ""; clearInterval(tm); }
  };
  const start = () => { left = 30; clearInterval(tm); tick(); tm = setInterval(tick, 1000); };
  start();
  rs.onclick = async () => {
    rs.disabled = true;
    try { await api("resend", { email, purpose }); toast("New code sent to your email"); boxes.forEach(b => b.value = ""); boxes[0].focus(); start(); }
    catch (x) { toast(x.message, 1); rs.disabled = false; }
  };
}

// ---------- home ----------
const dcard = d => `<a class="card" href="#/d/${d.id}"><h3>${esc(d.name)}</h3><p>${d.fields.map(f => esc(f.l)).join(" · ")}</p><p><b>${d.count}</b> records</p></a>`;
async function home() {
  app.innerHTML = `<section class="wrap"><div class="hd"><div><h1>Hello, ${esc(S.user.name.split(" ")[0])} 👋</h1><p class="mute">Your dashboards</p></div><a class="btn" href="#/new">＋ New Dashboard</a></div>
  <div class="search"><input id="q" type="search" placeholder="Search all dashboards by name, date, phone, fees or any value" aria-label="Search"></div><div id="res"></div></section>`;
  const draw = () => $("#res").innerHTML = `<div class="grid"><a class="card new" href="#/new"><span>＋</span>New Dashboard</a>${(D.list || []).map(dcard).join("")}</div>`;
  if (D.list) draw(); else $("#res").innerHTML = `<div class="grid">${'<div class="skel"></div>'.repeat(3)}</div>`;
  api("dashList").then(r => { D.list = r.items; if (!$("#q").value) draw(); });
  let t, seq = 0;
  $("#q").oninput = e => {
    clearTimeout(t); const q = e.target.value.trim();
    if (!q) return draw();
    t = setTimeout(async () => {
      const my = ++seq, r = await api("search", { q }).catch(x => (toast(x.message, 1), null)); if (!r || my !== seq) return;
      $("#res").innerHTML = r.items.map(x => `<a class="hit" href="#/d/${x.dashId}"><span class="tag">${esc(x.dash)}</span><b>${esc(x.title)}</b><small>${esc(x.text)}</small></a>`).join("") || `<div class="empty">No results for "${esc(q)}"</div>`;
    }, 250);
  };
}

// ---------- new dashboard ----------
function newDash() {
  const row = (l = "", t = "text") => `<div class="frow"><input placeholder="Field name (e.g. Fees)" maxlength="30" value="${esc(l)}" required><select>${Object.entries(TYPES).map(([k, v]) => `<option value="${k}"${k === t ? " selected" : ""}>${v}</option>`).join("")}</select><button type="button" class="x" aria-label="Remove field">✕</button></div>`;
  app.innerHTML = `<div class="wrap mid"><div class="panel"><h2>New Dashboard</h2><form id="f"><label for="dn">Dashboard name</label><input id="dn" name="name" maxlength="40" placeholder="e.g. My Gym" required>
  <label>Quick start</label><div class="chips">${Object.keys(TPL).map(k => `<button type="button" class="chip" data-t="${k}">${k}</button>`).join("")}</div>
  <label>Fields (the columns of your data)</label><div id="fl">${row("Date", "date") + row("Name") + row("Fees", "number") + row("Phone Number", "phone")}</div>
  <button type="button" class="btn ghost sm" id="add" style="margin-top:.8rem">＋ Add field</button><div class="err"></div><button class="btn" type="submit">Create dashboard</button></form></div></div>`;
  const fl = $("#fl");
  $("#add").onclick = () => { if (fl.children.length < 12) fl.insertAdjacentHTML("beforeend", row()); };
  fl.onclick = e => { if (e.target.classList.contains("x") && fl.children.length > 1) e.target.parentNode.remove(); };
  document.querySelector(".chips").onclick = e => { const k = e.target.dataset.t; if (k) { fl.innerHTML = TPL[k].map(a => row(...a)).join(""); if (!$("#dn").value) $("#dn").value = k; } };
  fh("#f", async d => {
    const fields = [...fl.children].map(r => ({ l: $("input", r).value.trim(), t: $("select", r).value })).filter(f => f.l);
    if (!fields.length) throw new Error("Add at least one field.");
    const r = await api("dashAdd", { name: d.name, fields: JSON.stringify(fields) }); D.list = null; toast("Dashboard created"); location.hash = "#/d/" + r.id;
  });
}

// ---------- dashboard ----------
async function dash(id) {
  if (!D.list) D.list = (await api("dashList")).items;
  const d = D.list.find(x => x.id === id); if (!d) return location.hash = "#/";
  let rows = D.rec[id] || [];
  app.innerHTML = `<section class="wrap"><div class="hd"><div><a href="#/" class="mute">← All dashboards</a><h1>${esc(d.name)}</h1></div><div class="row"><button class="btn" id="addr">＋ Add record</button><button class="btn danger" id="dd">Delete dashboard</button></div></div>
  <div class="search"><input id="q" type="search" placeholder="Search by ${esc(d.fields.map(f => f.l).join(", "))}. Tip: use Name:john" aria-label="Search"></div><div class="stats" id="st"></div><div id="tb"></div></section>`;
  const draw = () => {
    const q = $("#q").value.trim().toLowerCase(); let m = q.match(/^(.+?):(.+)$/), f = m && d.fields.find(x => x.l.toLowerCase().includes(m[1].trim()));
    const list = !q ? rows : rows.filter(r => f ? String(r.d[f.k] || "").toLowerCase().includes(m[2].trim()) : Object.values(r.d).join(" ").toLowerCase().includes(q));
    $("#st").innerHTML = `<span><b>${list.length}</b> of ${rows.length} records</span>`;
    $("#tb").innerHTML = list.length ? `<div class="tw"><table><thead><tr>${d.fields.map(f => `<th>${esc(f.l)}</th>`).join("")}<th></th></tr></thead><tbody>${list.map(r => `<tr>${d.fields.map(f => `<td data-l="${esc(f.l)}">${esc(r.d[f.k])}</td>`).join("")}<td class="act"><button class="ib" data-e="${r.id}" aria-label="Edit">✏️</button><button class="ib" data-x="${r.id}" aria-label="Delete">🗑️</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">${rows.length ? "No matching records." : "No records yet. Click “Add record” to start."}</div>`;
  };
  const sync = () => { d.count = rows.length; D.rec[id] = rows; draw(); };
  const form = (r) => modal(`<h2>${r ? "Edit record" : "Add record"}</h2><form id="rf">${d.fields.map((f, i) => `<label for="r${i}">${esc(f.l)}</label><input id="r${i}" name="${f.k}" type="${INP[f.t]}" ${f.t === "number" ? 'step="any"' : ""} maxlength="300" value="${esc(r ? r.d[f.k] : "")}">`).join("")}<div class="err"></div><button class="btn" type="submit">Save</button><button type="button" class="btn ghost" data-close style="width:100%">Cancel</button></form>`);
  $("#addr").onclick = () => { form(); fh("#rf", async data => {
    const rid = "r_" + Math.random().toString(36).slice(2, 12).padEnd(10, "0"), rec = { id: rid, d: data, c: new Date().toISOString() };
    rows = [rec, ...rows]; sync(); dlg.close();
    api("recAdd", { dashId: id, id: rid, data: JSON.stringify(data) }).catch(e => { rows = rows.filter(x => x.id !== rid); sync(); toast(e.message, 1); });
  }); };
  $("#tb").onclick = async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.e) { const r = rows.find(x => x.id === b.dataset.e); form(r); fh("#rf", async data => {
      const old = r.d; r.d = data; sync(); dlg.close();
      api("recEdit", { dashId: id, id: r.id, data: JSON.stringify(data) }).catch(x => { r.d = old; sync(); toast(x.message, 1); });
    }); }
    if (b.dataset.x && await ask("This record will be deleted permanently.")) {
      const bak = rows; rows = rows.filter(x => x.id !== b.dataset.x); sync();
      api("recDel", { dashId: id, id: b.dataset.x }).catch(x => { rows = bak; sync(); toast(x.message, 1); });
    }
  };
  $("#dd").onclick = async () => { if (await ask("This dashboard and all its records will be deleted permanently.")) { await api("dashDel", { id }); D.list = D.list.filter(x => x.id !== id); delete D.rec[id]; toast("Dashboard deleted"); location.hash = "#/"; } };
  $("#q").oninput = draw; draw();
  if (!D.rec[id]) $("#tb").innerHTML = '<div class="skel"></div>';
  const r = await api("recList", { dashId: id }); if (location.hash !== "#/d/" + id) return; rows = r.items; sync();
}

// ---------- profile ----------
async function profile() {
  const u = S.user;
  app.innerHTML = `<div class="wrap mid"><div class="phead"><i class="av">${esc(u.name[0].toUpperCase())}</i><div><h1>${esc(u.name)}</h1><p class="mute">${esc(u.email)} <span class="vbadge">✔ Verified</span></p></div><button class="btn ghost" id="lo" style="margin-left:auto">Log out</button></div>
  <div class="panel"><h2>Edit profile</h2><form id="f"><label for="n">Full name</label><input id="n" name="name" maxlength="40" value="${esc(u.name)}" required><label for="e">Email (verified, cannot be changed)</label><input id="e" type="email" value="${esc(u.email)}" disabled>
  ${pwf("cp", "Current password (only to change password)", "current", "current-password")}${pwf("np", "New password (leave blank to keep)", "password", "new-password", 1)}<div class="err"></div><button class="btn" type="submit">Save profile</button></form></div>
  <div class="panel" style="margin-top:1.5rem"><h2>Danger zone</h2><p class="mute">Deleting your account removes all your dashboards and data permanently.</p><button class="btn danger" id="da">Delete account</button></div></div>`;
  $("#lo").onclick = () => { api("logout").catch(() => {}); out(); };
  fh("#f", async d => {
    if (d.password && (score(d.password) < 3 || d.password.length < 8)) throw new Error("Please make a stronger password.");
    const r = await api("profile", d); S.user = r.user; localStorage.itf_u = JSON.stringify(r.user); toast("Profile saved"); router();
  });
  $("#da").onclick = () => {
    modal(`<h2>Delete account</h2><form id="df"><p class="mute">Enter your password to confirm. This cannot be undone.</p>${pwf("dp", "Password", "password", "current-password")}<div class="err"></div><button class="btn danger" type="submit" style="width:100%">Delete my account</button><button type="button" class="btn ghost" data-close style="width:100%">Cancel</button></form>`);
    fh("#df", async d => { await api("delAcc", d); dlg.close(); toast("Account deleted"); out(); });
  };
}

// ---------- protection (deterrent only) ----------
(() => {
  const stop = e => e.preventDefault();
  addEventListener("contextmenu", stop); addEventListener("dragstart", stop); addEventListener("copy", e => { if (!/INPUT|TEXTAREA/.test(e.target.tagName)) stop(e); });
  addEventListener("keydown", e => { const k = e.key.toLowerCase(); if (e.key === "F12" || (e.ctrlKey && e.shiftKey && "ijc".includes(k)) || (e.ctrlKey && "usp".includes(k)) || (e.metaKey && e.altKey && "iuj".includes(k))) stop(e); });
  setInterval(() => document.body.classList.toggle("locked", innerWidth > 800 && (outerWidth - innerWidth > 170 || outerHeight - innerHeight > 200)), 700);
})();