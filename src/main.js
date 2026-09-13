const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:9191/api";
const app = document.querySelector("#app");

const leadStatuses = ["New Lead", "Contacted", "Interested", "Follow Up", "Not Available", "Not Picking Call", "Rescheduled", "Not Interested", "Won", "Lost"];
const floors = ["G", "G+1", "G+2", "G+3", "G+4", "G+5"];
const configLabels = {
  "system-size": "System Size",
  "solar-panel": "Solar Panels",
  inverter: "Inverters",
  "structure-type": "Structure Types",
  wiring: "Wiring",
  "tax-subsidy": "GST and Subsidy",
};
const configPages = {
  "system-sizes": { label: "System Sizes", type: "system-size", fields: ["name", "sizeKw", "systemPrice", "status"] },
  "solar-panels": { label: "Solar Panels", type: "solar-panel", fields: ["name", "watt", "status"] },
  inverters: { label: "Inverters", type: "inverter", fields: ["name", "status"] },
  structures: { label: "Structure Types", type: "structure-type", fields: ["name", "status"] },
  wiring: { label: "Wiring", type: "wiring", fields: ["name", "status"] },
  "tax-subsidies": { label: "GST and Subsidy", type: "tax-subsidy", fields: ["gstPercent", "centralSubsidy", "upnedaSubsidy", "status"] },
};

const state = {
  accessToken: localStorage.getItem("zg_admin_access") || "",
  refreshToken: localStorage.getItem("zg_admin_refresh") || "",
  user: JSON.parse(localStorage.getItem("zg_admin_user") || "null"),
  view: "dashboard",
  summary: {},
  leads: [],
  users: [],
  scs: [],
  lrms: [],
  configs: [],
  quotes: [],
  payments: [],
  gst: [],
  meetings: [],
  followUps: [],
  performance: { sc: [], lrm: [] },
  reports: [],
  configPage: "system-sizes",
  perfMode: "tiles",
};

const css = `
:root{--ink:#241a30;--muted:#6c6675;--line:#ddd8e6;--bg:#f4f2ee;--panel:#fff;--brand:#4c118f;--brand2:#2e0a57;--solar:#a8b79a;--green:#1c9a63;--purple:#7a59d1;--red:#d94b4b;--soft:#f1eafb;--shadow:0 18px 42px rgba(76,17,143,.10);font-family:Inter,Arial,sans-serif}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#f7f5f1 0%,#f1eef5 100%);color:var(--ink);font-family:inherit;font-size:14px}button,input,select,textarea{font:inherit}button{cursor:pointer}
.login{min-height:100vh;display:grid;place-items:center;padding:20px;background:linear-gradient(140deg,#4c118f 0%,#4c118f 52%,#a8b79a 52%,#a8b79a 100%)}
.loginbox{width:min(430px,100%);background:#fff;border:1px solid var(--line);border-radius:14px;padding:26px;box-shadow:0 26px 70px rgba(30,18,53,.24)}
.brand{display:flex;align-items:center;gap:12px;font-weight:900;letter-spacing:.1px}.mark{width:42px;height:42px;border-radius:10px;background:#0b0d14;box-shadow:0 10px 22px rgba(11,13,20,.18);position:relative}.mark:after{content:"";position:absolute;left:15px;top:9px;width:12px;height:23px;background:#f2c94c;clip-path:polygon(55% 0,0 53%,42% 53%,28% 100%,100% 40%,58% 40%)}
.shell{min-height:100vh;display:grid;grid-template-columns:258px minmax(0,1fr)}.side{background:linear-gradient(180deg,#4c118f 0%,#2e0a57 100%);color:#fff;padding:20px 16px;position:sticky;top:0;height:100vh;overflow:auto;box-shadow:18px 0 44px rgba(76,17,143,.12)}
.side .sub{font-size:11px;line-height:1.35;color:#d9e2d2;margin-top:4px;font-weight:700}.nav{display:grid;gap:7px;margin-top:28px}.nav button{border:1px solid transparent;background:transparent;color:#eee8f8;text-align:left;padding:11px 12px;border-radius:10px;font-weight:800}.nav button.active{background:rgba(255,255,255,.12);border-color:rgba(168,183,154,.30);color:#fff;box-shadow:inset 3px 0 0 var(--solar)}.nav button:hover{background:rgba(255,255,255,.10);color:#fff}
.main{padding:30px;overflow:auto;max-width:1480px;width:100%}.top{display:flex;align-items:flex-start;gap:14px;justify-content:space-between;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(76,17,143,.10)}.top h1{margin:0;font-size:28px;line-height:1.15;letter-spacing:0}.top p{margin:6px 0 0;color:var(--muted);font-size:13px;max-width:720px}
.btn.compact{min-height:30px;padding:6px 9px;font-size:11px;border-radius:7px;box-shadow:none}.btn.compact svg{width:13px;height:13px}.btn{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:10px;padding:9px 12px;font-weight:900;min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 6px 14px rgba(76,17,143,.05)}.btn:hover{border-color:#cfc5df;transform:translateY(-1px)}.primary{background:var(--solar);border-color:#94a783;color:#261044}.blue{background:var(--brand);border-color:var(--brand);color:#fff}.green{background:var(--green);border-color:var(--green);color:#fff}.danger{background:#fff2f2;border-color:#f0c9c9;color:var(--red)}.icon-btn{width:38px;min-width:38px;padding:0}.icon-btn svg{width:16px;height:16px;display:block}.btn.icon-only{gap:0}
.stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}.stat{position:relative;overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px;box-shadow:0 10px 24px rgba(76,17,143,.06)}.stat:before{content:"";position:absolute;left:0;top:0;right:0;height:4px;background:var(--brand)}.stat:nth-child(2n):before{background:#8fa57f}.stat:nth-child(3n):before{background:var(--green)}.k{font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:900}.v{font-size:24px;font-weight:950;margin-top:6px;letter-spacing:0;color:var(--brand)}
.grid{display:grid;gap:12px}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.three{grid-template-columns:repeat(3,minmax(0,1fr))}.card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px;box-shadow:0 10px 24px rgba(76,17,143,.06)}
.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0}.field{display:flex;flex-direction:column;gap:6px}.field label{font-size:11px;color:var(--muted);font-weight:900;text-transform:uppercase}.field input,.field select,.field textarea{border:1px solid var(--line);border-radius:10px;padding:11px;background:#fff;width:100%;outline:none}.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(76,17,143,.12)}.field textarea{min-height:82px;resize:vertical}
table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:10px;text-transform:uppercase;color:var(--muted);letter-spacing:.04em}.muted{color:var(--muted);font-size:12px}.pill{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:900;line-height:1.1}.pblue{background:#f1eafb;color:var(--brand)}.pgreen{background:#e8f6ef;color:#16694a}.porange{background:#eef3ea;color:#58674e}.pred{background:#fff1f1;color:var(--red)}.ppurple{background:#f1eafb;color:var(--purple)}
.lead-board{display:grid;gap:10px}.lead-row{position:relative;display:grid;grid-template-columns:minmax(220px,1.3fr) minmax(160px,.85fr) minmax(150px,.8fr) minmax(140px,.7fr) minmax(250px,1fr);gap:14px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px 16px 14px 18px;box-shadow:0 10px 24px rgba(76,17,143,.06)}.lead-row:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:#a8b79a;border-radius:10px 0 0 10px}.lead-row:hover{border-color:#c9c0d8;box-shadow:0 16px 32px rgba(76,17,143,.09)}.lead-head{display:flex;gap:12px;align-items:center}.avatar{width:42px;height:42px;border-radius:10px;background:#4c118f;color:#d9e2d2;font-weight:950;display:grid;place-items:center;flex:0 0 42px}.lead-name{font-size:15px;font-weight:950}.lead-id{font-size:11px;color:var(--brand);font-weight:900;margin-top:3px}.meta-title{font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:900;margin-bottom:4px}.meta-value{font-weight:800;line-height:1.35}.actions-row{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.actions-row .btn.compact{min-height:30px;padding:6px 9px;font-size:11px;border-radius:7px;box-shadow:none}.btn.compact svg{width:13px;height:13px}.btn{min-height:34px;padding:7px 10px}.lead-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 14px}.mini-stat{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;box-shadow:0 8px 18px rgba(76,17,143,.04)}.mini-stat b{display:block;font-size:18px;margin-top:4px;color:var(--brand)}
.doc-board{display:grid;gap:12px}.doc-card{position:relative;overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;box-shadow:0 10px 24px rgba(76,17,143,.06)}.doc-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:#a8b79a}.doc-card.latest{border-color:#a8b79a;box-shadow:inset 5px 0 0 #a8b79a,0 12px 26px rgba(76,17,143,.08)}.doc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.doc-title{display:flex;gap:11px;align-items:flex-start;min-width:0}.doc-icon{width:40px;height:40px;border-radius:10px;background:#f1eafb;color:#4c118f;display:grid;place-items:center;font-weight:950;flex:0 0 40px}.doc-no{font-size:14px;font-weight:950;color:#241a30;overflow-wrap:anywhere}.doc-amount{font-size:22px;font-weight:950;color:#4c118f;margin-top:10px}.doc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.doc-field{background:#f7f5f1;border:1px solid var(--line);border-radius:9px;padding:9px;min-width:0}.doc-field label{display:block;font-size:10px;font-weight:900;text-transform:uppercase;color:var(--muted);margin-bottom:3px}.doc-field span{display:block;font-size:12px;font-weight:900;overflow-wrap:anywhere}.doc-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
.modalback{position:fixed;inset:0;background:rgba(30,18,53,.68);display:grid;place-items:center;padding:16px;z-index:50}.modal{width:min(980px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;padding:18px;box-shadow:0 26px 64px rgba(30,18,53,.18);border:1px solid rgba(168,183,154,.35)}.modalhead{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px}.modalhead h2{margin:0;font-size:20px}.icon-close{width:34px;min-width:34px;height:34px;padding:0;border-radius:999px;background:#f7f5f1;border-color:#ded6ea;color:var(--brand)}.quote-paper{background:#fff;border:2px solid var(--brand);padding:18px;border-radius:14px}.quote-head{display:flex;justify-content:space-between;border-bottom:4px solid var(--solar);padding-bottom:12px;margin-bottom:12px}.quote-total{font-size:28px;font-weight:900;color:var(--green)}.empty{padding:28px;text-align:center;color:var(--muted);background:#faf9f5;border:1px dashed #a8b79a;border-radius:10px}
.bars{display:grid;gap:8px}.bar{height:28px;background:#f0eef7;border-radius:6px;overflow:hidden}.bar span{display:block;height:100%;background:linear-gradient(90deg,var(--brand),#8fa57f)}.subnav{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.subnav button{border:1px solid var(--line);background:#fff;padding:10px 12px;border-radius:10px;font-weight:800}.subnav button.active{background:var(--brand);border-color:var(--brand);color:#fff}
.doc-preview-modal{width:min(1120px,calc(100vw - 24px));height:min(92vh,980px);padding:14px}.doc-preview-frame{width:100%;height:calc(92vh - 76px);border:1px solid var(--line);border-radius:10px;background:#fff}.doc-actions{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}@media(max-width:1180px){.lead-row{grid-template-columns:1fr 1fr}.actions-row{justify-content:flex-start}.stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:900px){.shell{grid-template-columns:1fr}.side{height:auto;position:static}.main{padding:18px}.lead-filters{grid-template-columns:repeat(2,1fr)}.two,.three{grid-template-columns:1fr}}@media(max-width:600px){.stats,.lead-filters{grid-template-columns:1fr}.lead-row{grid-template-columns:1fr}.top{display:block}.main{padding:12px}}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

const rupee = (n) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const active = (type) => state.configs.filter((x) => x.type === type && x.status === "active");
const badge = (s) => s === "Won" || s === "done" || s === "active" ? "pgreen" : s === "Lost" || s === "Not Interested" ? "pred" : s === "Interested" ? "ppurple" : s === "Follow Up" || s === "Rescheduled" ? "porange" : "pblue";
const quoteTaxDefaults = () => active("tax-subsidy")[0] || { gstPercent: 8.9, centralSubsidy: 78000, upnedaSubsidy: 30000 };
const isAdmin = () => state.user?.userType === "admin";
const isLrm = () => state.user?.userType === "lrm";
const canManageCommercialDocs = () => isAdmin();
const leadKey = (leadId) => String(leadId?._id || leadId || "");
const cleanPhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);
const docContactActions = (type, row) => {
  const label = type === "quote" ? "Quotation" : type === "payment" ? "Payment Receipt" : "GST Invoice";
  const subject = encodeURIComponent(`${label} - ${row.quoteNo || row.paymentNo || row.invoiceNo || ""}`);
  const body = encodeURIComponent(`Hello ${row.leadName || row.customerName || ""}, please find your ${label.toLowerCase()}.`);
  const email = row.email ? `<button class="btn compact" data-email="${esc(row.email)}" data-subject="${subject}" data-body="${body}">Email</button>` : "";
  const whatsapp = row.whatsappNumber ? `<button class="btn compact green" data-send-wa="${cleanPhone(row.whatsappNumber || row.phone)}" data-wa-msg="${body}">WhatsApp</button>` : "";
  return `<div class="doc-actions"><button class="btn compact blue" data-doc="${type}:${row._id}">${icon("view")} View</button>${email}${whatsapp}</div>`;
};
const icon = (name) => ({
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
  assign: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="m10 14 11-11"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 3v6h6"/><path d="M12 7v5l3 3"/></svg>',
  quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18"/><path d="M6 7v14h12V7"/><path d="M9 11h6"/><path d="M9 15h6"/></svg>',
  payment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>',
  gst: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l4 4v14H3V3z"/><path d="M14 3v5h5"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>',
  add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>',
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
})[name] || "";

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (state.accessToken) headers.set("Authorization", `Bearer ${state.accessToken}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    Object.assign(el.style, { position: "fixed", right: "18px", bottom: "18px", background: "#10243D", color: "#fff", padding: "12px 14px", borderRadius: "8px", zIndex: 80 });
    document.body.append(el);
  }
  el.textContent = message;
  clearTimeout(el.t);
  el.t = setTimeout(() => el.remove(), 2600);
}

async function loadData() {
  if (!state.accessToken) return renderLogin();
  try {
    const me = await api("/auth/me");
    state.user = me.user;
    const leadEndpoint = isAdmin() ? "/leads" : "/leads/mine";
    const baseCalls = [
      api("/activities/summary"), api(leadEndpoint), api("/users/scs"), api("/config"),
    ];
    if (canManageCommercialDocs()) baseCalls.push(api("/activities/quotes"), api("/activities/payments"), api("/activities/gst"));
    baseCalls.push(api("/activities/meetings"), api("/followups"), api("/activities/performance"), api("/activities/daily-reports"));
    if (isAdmin()) baseCalls.splice(2, 0, api("/users"), api("/users/lrms"));
    const data = await Promise.all(baseCalls);
    const offset = isAdmin() ? 2 : 0;
    Object.assign(state, {
      summary: data[0].summary || {},
      leads: data[1].leads || [],
      users: isAdmin() ? data[2].users || [] : [],
      lrms: isAdmin() ? data[3].users || [] : [],
      scs: data[2 + offset].users || [],
      configs: data[3 + offset].items || [],
      quotes: canManageCommercialDocs() ? data[4 + offset].quotes || [] : [],
      payments: canManageCommercialDocs() ? data[5 + offset].payments || [] : [],
      gst: canManageCommercialDocs() ? data[6 + offset].invoices || [] : [],
      meetings: data[(canManageCommercialDocs() ? 7 : 4) + offset].meetings || [],
      followUps: data[(canManageCommercialDocs() ? 8 : 5) + offset].followUps || [],
      performance: data[(canManageCommercialDocs() ? 9 : 6) + offset] || { sc: [], lrm: [] },
      reports: data[(canManageCommercialDocs() ? 10 : 7) + offset].reports || [],
    });
    localStorage.setItem("zg_admin_user", JSON.stringify(state.user));
  } catch (e) {
    toast(e.message);
  }
  render();
}

function renderLogin() {
  app.innerHTML = `<div class="login"><div class="loginbox"><div class="brand"><div class="mark"></div><div>Zen Grid Solar<div class="sub">Admin CRM</div></div></div><h1>Login</h1><div class="grid"><div class="field"><label>Email</label><input id="email"></div><div class="field"><label>Password</label><input id="password" type="password"></div><button class="btn primary" id="loginBtn">Login</button></div></div></div>`;
  document.querySelector("#loginBtn").onclick = async () => {
    try {
      const data = await fetch(`${API_BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.value.trim(), password: password.value }) }).then((r) => r.json().then((d) => r.ok ? d : Promise.reject(d)));
      Object.assign(state, { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      localStorage.setItem("zg_admin_access", data.accessToken);
      localStorage.setItem("zg_admin_refresh", data.refreshToken);
      localStorage.setItem("zg_admin_user", JSON.stringify(data.user));
      loadData();
    } catch (e) { toast(e.message || "Login failed"); }
  };
}

function modal(title, body, onSave, wide = true) {
  const host = document.createElement("div");
  host.className = "modalback";
  host.innerHTML = `<form class="modal" style="${wide ? "" : "width:min(520px,100%)"}"><div class="modalhead"><h2>${title}</h2><button type="button" class="btn icon-btn icon-close" aria-label="Close" data-close>${icon("close")}</button></div>${body}<div class="toolbar" style="justify-content:flex-end"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div></form>`;
  document.body.append(host);
  host.querySelectorAll("[data-close]").forEach((b) => b.onclick = () => host.remove());
  host.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    try { await onSave(Object.fromEntries(new FormData(e.target).entries()), host); host.remove(); await loadData(); } catch (err) { toast(err.message); }
  };
}

function infoModal(title, body) {
  const host = document.createElement("div");
  host.className = "modalback";
  host.innerHTML = `<div class="modal"><div class="modalhead"><h2>${title}</h2><button type="button" class="btn icon-btn icon-close" aria-label="Close" data-close>${icon("close")}</button></div>${body}</div>`;
  document.body.append(host);
  host.querySelectorAll("[data-close]").forEach((b) => b.onclick = () => host.remove());
  return host;
}

function renderShell(content) {
  const nav = isAdmin()
    ? [["dashboard", "Admin Dashboard"], ["leads", "Lead Management"], ["team", "Team"], ["performance-sc", "SC Performance"], ["performance-lrm", "LRM Performance"], ["configuration", "Configuration"], ["records", "Records"]]
    : [["dashboard", "LRM Dashboard"], ["leads", "My Leads"], ["performance", "My Performance"], ["report", "Day-End Report"]];
  const accessLabel = isAdmin() ? "Admin full access" : "LRM workspace";
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand"><div class="mark"></div><div>Zen Grid Solar<div class="sub">${esc(state.user?.firstName || "User")} / ${accessLabel}</div></div></div><div class="nav">${nav.map(([id, label]) => `<button class="${state.view === id ? "active" : ""}" data-view="${id}">${label}</button>`).join("")}</div><button class="btn danger" style="margin-top:20px;width:100%" id="logout">Logout</button></aside><main class="main">${content}</main></div>`;
  document.querySelectorAll("[data-view]").forEach((b) => b.onclick = () => { state.view = b.dataset.view; render(); });
  document.querySelector("#logout").onclick = () => { localStorage.clear(); Object.assign(state, { accessToken: "", user: null }); renderLogin(); };
}

function top(title, sub, action = "") {
  return `<div class="top"><div><h1>${title}</h1><p>${sub}</p></div><div class="toolbar">${action}<button class="btn" id="refresh">Refresh</button></div></div>`;
}

function performanceTiles(rows, keys, type) {
  if (!rows.length) return `<div class="empty">No ${type} performance data</div>`;
  return `<div class="grid two">${rows.map((row) => `<div class="card"><div class="lead-head" style="align-items:flex-start"><div class="avatar">${esc((row.name || "?").slice(0, 1).toUpperCase())}</div><div><div class="lead-name">${esc(row.name || "-")}</div><div class="muted">${type === "sc" ? "Sales Counselor" : "Lead Relationship Manager"}</div></div></div><div class="grid two" style="margin-top:14px">${keys.map((k) => `<div class="mini-stat"><span class="k">${k}</span><b>${esc(String(row[k] ?? 0))}</b></div>`).join("")}</div></div>`).join("")}</div>`;
}

function performanceTable(rows, keys) {
  if (!rows.length) return `<div class="empty">No records found</div>`;
  return `<table><thead><tr>${keys.map((k) => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${keys.map((k) => `<td>${esc(String(r[k] ?? 0))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function stats() {
  const s = state.summary;
  return `<div class="stats">
    ${[["Total Leads", s.totalLeads], ["Won", s.won], ["Revenue", rupee(s.revenueTotal)], ["Pending", rupee(s.pendingAmount)], ["Quotations", s.totalQuotes], ["GST Invoices", s.totalGstInvoices]].map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v || 0}</div></div>`).join("")}
  </div>`;
}

function dashboardView() {
  if (isLrm()) return lrmDashboardView();
  const status = Object.entries(state.summary.leadStatus || {});
  const revenue = Object.entries(state.summary.monthlyRevenue || {});
  return `${top("Operations Dashboard", "Company KPIs, lead mix, revenue and recent payments.")}${stats()}
  <div class="grid two" style="margin-top:14px">
    <div class="card"><h3>Lead Status</h3><div class="bars">${status.map(([k, v]) => `<div>${esc(k)} (${v})</div><div class="bar"><span style="width:${Math.min(100, v * 12)}%"></span></div>`).join("") || `<div class="empty">No status data</div>`}</div></div>
    <div class="card"><h3>Monthly Revenue</h3><div class="bars">${revenue.map(([k, v]) => `<div>${k} - ${rupee(v)}</div><div class="bar"><span style="width:${Math.min(100, Number(v) / 10000)}%"></span></div>`).join("") || `<div class="empty">No revenue yet</div>`}</div></div>
  </div>
  <div class="card" style="margin-top:14px"><h3>5 Recent Payments</h3>${recordTable(state.summary.recentPayments || [], ["paymentNo", "leadName", "paidAmount", "paymentDate"])}</div>`;
}

function lrmDashboardView() {
  const s = state.summary;
  const connected = state.reports.reduce((sum, r) => sum + Number(r.connectedCalls || 0), 0);
  const calls = state.reports.reduce((sum, r) => sum + Number(r.totalCalls || 0), 0);
  const conversion = connected ? Math.round(((s.won || 0) / connected) * 100) : 0;
  const recent = state.leads.slice(0, 5);
  return `${top("LRM Dashboard", "Your leads, calls, scheduled meetings and closures.")}
  <div class="stats">
    ${[["My Leads", s.totalLeads], ["Assigned", state.leads.filter((l) => l.assignedToUserId).length], ["Connected Calls", connected], ["Total Calls", calls], ["Closed", s.won], ["Conversion", `${conversion}%`]].map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v || 0}</div></div>`).join("")}
  </div>
  <div class="grid two" style="margin-top:14px">
    <div class="card"><h3>Recent Leads</h3>${recent.map((l) => `<div class="card" style="margin-top:8px"><b>${esc(l.customerName)}</b><div class="muted">${esc(l.phone)} / ${esc(l.area)} / ${esc(l.leadStatus)}</div></div>`).join("") || `<div class="empty">No recent leads</div>`}</div>
    <div class="card"><h3>Available SC</h3>${state.scs.map((u) => `<div class="card" style="margin-top:8px"><b>${esc(u.firstName)} ${esc(u.lastName)}</b><div class="muted">${esc(u.phoneNumber)} / ${esc(u.status)}</div></div>`).join("") || `<div class="empty">No SC found</div>`}</div>
  </div>`;
}

function recordTable(rows, keys) {
  if (!rows.length) return `<div class="empty">No records found</div>`;
  return `<table><thead><tr>${keys.map((k) => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${keys.map((k) => `<td>${k.toLowerCase().includes("amount") ? rupee(r[k]) : esc(r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function leadHistory(id) {
  const lead = state.leads.find((l) => l._id === id);
  const quotes = state.quotes.filter((q) => String(q.leadId) === String(id));
  const payments = state.payments.filter((p) => String(p.leadId) === String(id));
  const gst = state.gst.filter((g) => String(g.leadId) === String(id));
  const body = `<div class="grid three"><div class="card"><h3>Quotations</h3>${documentCards(quotes, "quote")}</div><div class="card"><h3>Receipts</h3>${documentCards(payments, "payment")}</div><div class="card"><h3>GST Invoices</h3>${documentCards(gst, "gst")}</div></div>`;
  modal(`${lead?.customerName || "Lead"} History`, body, async () => {}, true);
  const save = document.querySelector(".modal .toolbar");
  if (save) save.remove();
  bindDocumentButtons();
  bindSendButtons();
}

function leadDetailModal(id) {
  const lead = state.leads.find((l) => l._id === id);
  if (!lead) return;
  const docs = [
    { label: "Quotes", count: state.quotes.filter((x) => leadKey(x.leadId) === id).length, type: "quote" },
    { label: "Receipts", count: state.payments.filter((x) => leadKey(x.leadId) === id).length, type: "payment" },
    { label: "GST", count: state.gst.filter((x) => leadKey(x.leadId) === id).length, type: "gst" },
  ];
  const body = `
    <div class="grid two">
      <div class="card">
        <div class="lead-head" style="align-items:flex-start">
          <div class="avatar">${esc((lead.customerName || "?").slice(0, 1).toUpperCase())}</div>
          <div>
            <div class="lead-name">${esc(lead.customerName || "-")}</div>
            <div class="lead-id">${esc(lead.leadId || "-")}</div>
            <div class="muted">${esc(lead.phone || "-")} / ${esc(lead.source || "-")}</div>
          </div>
        </div>
        <div class="grid two" style="margin-top:14px">
          <div><div class="meta-title">Lead Status</div><div><span class="pill ${badge(lead.leadStatus)}">${esc(lead.leadStatus || "-")}</span></div></div>
          <div><div class="meta-title">Monthly Bill</div><div class="meta-value">${lead.monthlyBill ? rupee(lead.monthlyBill) : "-"}</div></div>
          <div><div class="meta-title">Area</div><div class="meta-value">${esc(lead.area || "-")}</div></div>
          <div><div class="meta-title">Locality</div><div class="meta-value">${esc(lead.locality || "-")}</div></div>
          <div><div class="meta-title">Assigned By</div><div class="meta-value">${esc(lead.assignedBy || "Not set")}</div></div>
          <div><div class="meta-title">Assigned To</div><div class="meta-value">${esc(lead.assignedTo || "No SC")}</div></div>
          <div><div class="meta-title">Meeting</div><div class="meta-value">${esc(lead.meetingDate || "Not scheduled")}</div></div>
          <div><div class="meta-title">Time</div><div class="meta-value">${esc(lead.meetingTime || "-")}</div></div>
        </div>
        ${lead.note ? `<div class="card" style="margin-top:14px;background:#faf7ff"><div class="meta-title">Notes</div><div class="meta-value">${esc(lead.note)}</div></div>` : ""}
      </div>
      <div class="card">
        <h3>Lead Documents</h3>
        <div class="grid" style="gap:10px">
          ${docs.map((d) => `<div class="mini-stat"><span class="k">${d.label}</span><b>${d.count}</b><div class="toolbar" style="margin-top:8px"><button class="btn blue" data-open-doc="${d.type}">${icon("view")} View</button></div></div>`).join("")}
        </div>
      </div>
    </div>
  `;
  const host = infoModal("Lead Details", body);
  host.querySelectorAll("[data-open-doc]").forEach((b) => b.onclick = () => {
    host.remove();
    const type = b.dataset.openDoc;
    if (type === "quote") openQuote(id);
    if (type === "payment") openPayment(id);
    if (type === "gst") openGst(id);
  });
}

function leadRows() {
  const docButtons = (id) => canManageCommercialDocs() ? `
        <button class="btn icon-btn primary" title="Quote" aria-label="Quote" data-quote="${id}">${icon("quote")}</button>
        <button class="btn icon-btn green" title="Receipt" aria-label="Receipt" data-pay="${id}">${icon("payment")}</button>
        <button class="btn icon-btn" title="GST" aria-label="GST" data-gst="${id}">${icon("gst")}</button>` : "";
  return state.leads.map((l) => `
    <div class="lead-row" data-lead-open="${l._id}" role="button" tabindex="0">
      <div class="lead-head">
        <div class="avatar">${esc((l.customerName || "?").slice(0, 1).toUpperCase())}</div>
        <div>
          <div class="lead-name">${esc(l.customerName)}</div>
          <div class="lead-id">${esc(l.leadId || "-")} / ${esc(l.phone)}</div>
          <div class="muted">${l.whatsappNumber ? `WA ${esc(l.whatsappNumber)}` : ""}${l.email ? ` / ${esc(l.email)}` : ""}</div>
          <div class="muted">${esc([l.address, l.area, l.locality].filter(Boolean).join(", ") || "-")}</div>
        </div>
      </div>
      <div>
        <div class="meta-title">Pipeline</div>
        <div><span class="pill ${badge(l.leadStatus)}">${esc(l.leadStatus)}</span></div>
      </div>
      <div>
        <div class="meta-title">Ownership</div>
        <div class="meta-value">${esc(l.assignedTo || "No SC assigned")}</div>
        <div class="muted">${esc(l.assignedBy || "No LRM")}</div>
      </div>
      <div>
        <div class="meta-title">Meeting</div>
        <div class="meta-value">${esc(l.meetingDate || "Not scheduled")}</div>
        <div class="muted">${esc(l.meetingTime || "")} ${l.monthlyBill ? `/ ${rupee(l.monthlyBill)}` : ""}</div>
      </div>
      <div class="actions-row">
        <button class="btn icon-btn" title="Edit" aria-label="Edit" data-edit="${l._id}">${icon("edit")}</button>
        <button class="btn icon-btn blue" title="Assign" aria-label="Assign" data-assign="${l._id}">${icon("assign")}</button>
        <button class="btn icon-btn" title="History" aria-label="History" data-history="${l._id}">${icon("history")}</button>
${docButtons(l._id)}
      </div>
    </div>
  `).join("");
}

function leadsView() {
  const won = state.leads.filter((l) => l.leadStatus === "Won").length;
  const follow = state.leads.filter((l) => l.leadStatus === "Follow Up").length;
  const meetings = state.leads.filter((l) => l.meetingDate).length;
  const unassigned = state.leads.filter((l) => !l.assignedToUserId).length;
  return `${top("Lead Management", "Create, assign, update status, schedule follow-ups and generate records.", `<button class="btn primary" id="addLead">Add Lead</button>`)}
  <div class="lead-filters">
    <div class="mini-stat"><span class="k">Won</span><b>${won}</b></div>
    <div class="mini-stat"><span class="k">Follow Ups</span><b>${follow}</b></div>
    <div class="mini-stat"><span class="k">Meetings</span><b>${meetings}</b></div>
    <div class="mini-stat"><span class="k">Unassigned SC</span><b>${unassigned}</b></div>
  </div>
  <div class="lead-board">${leadRows() || `<div class="empty">No leads found</div>`}</div>`;
}

function leadForm(lead = {}) {
  const showAssignedBy = isAdmin();
  const assigneeFields = `<div class="field"><label>Assigned By (LRM)</label>${showAssignedBy ? `<select name="assignedByUserId" required><option value="">Select LRM</option>${state.lrms.map((u) => `<option value="${u._id}" ${String(lead.assignedByUserId || "") === String(u._id) ? "selected" : ""}>${esc(u.firstName)} ${esc(u.lastName)}</option>`).join("")}</select>` : `<input value="${esc(`${state.user?.firstName || ""} ${state.user?.lastName || ""}`.trim())}" disabled>`}</div><div class="field"><label>Assigned To (SC optional)</label><select name="assignedToUserId"><option value="">No SC yet</option>${state.scs.map((u) => `<option value="${u._id}" ${String(lead.assignedToUserId || "") === String(u._id) ? "selected" : ""}>${esc(u.firstName)} ${esc(u.lastName)}</option>`).join("")}</select></div>`;
  return `<div class="grid two">
    <div class="field"><label>Name</label><input name="customerName" required value="${esc(lead.customerName)}"></div><div class="field"><label>Phone</label><input name="phone" required value="${esc(lead.phone)}"></div>
    <div class="field"><label>WhatsApp Number</label><input name="whatsappNumber" value="${esc(lead.whatsappNumber)}"></div><div class="field"><label>Email</label><input type="email" name="email" value="${esc(lead.email)}"></div>
    <div class="field"><label>Address</label><input name="address" value="${esc(lead.address)}"></div><div class="field"><label>Area</label><input name="area" value="${esc(lead.area)}"></div><div class="field"><label>Locality</label><input name="locality" value="${esc(lead.locality)}"></div>
    ${assigneeFields}
    <div class="field"><label>Monthly Bill</label><input type="number" name="monthlyBill" value="${lead.monthlyBill || ""}"></div><div class="field"><label>Source</label><select name="source">${["Website", "Social Media", "Field Visit", "Import"].map((x) => `<option ${lead.source === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Status</label><select name="leadStatus">${leadStatuses.map((x) => `<option ${lead.leadStatus === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>Follow-up Date</label><input type="date" name="followUpDate" value="${esc(lead.followUpDate)}"></div>
    <div class="field"><label>Meeting Date</label><input type="date" name="meetingDate" value="${esc(lead.meetingDate)}"></div><div class="field"><label>Meeting Time</label><input type="time" name="meetingTime" value="${esc(lead.meetingTime)}"></div>
    <div class="field" style="grid-column:1/-1"><label>Notes</label><textarea name="note">${esc(lead.note)}</textarea></div></div>`;
}

function teamView() {
  return `${top("Team Management", "Admin can add only LRMs and SCs. No admin add feature exists.", `<button class="btn primary" id="addUser">Add LRM / SC</button>`)}
  <div class="card"><table><thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>${state.users.map((u) => `<tr><td><b>${esc(u.firstName)} ${esc(u.lastName)}</b><br>${esc(u.email)}</td><td>${esc(u.phoneNumber)}</td><td><span class="pill ${u.userType === "lrm" ? "porange" : "pblue"}">${u.userType}</span></td><td><span class="pill ${badge(u.status)}">${u.status}</span></td><td><button class="btn" data-user="${u._id}">Edit</button></td></tr>`).join("")}</tbody></table></div>`;
}

function userForm(u = {}) {
  return `<div class="grid two"><div class="field"><label>First Name</label><input name="firstName" required value="${esc(u.firstName)}"></div><div class="field"><label>Last Name</label><input name="lastName" required value="${esc(u.lastName)}"></div><div class="field"><label>Phone</label><input name="phoneNumber" required value="${esc(u.phoneNumber)}"></div><div class="field"><label>Email</label><input name="email" required value="${esc(u.email)}"></div><div class="field"><label>Password</label><input type="password" name="password"></div><div class="field"><label>Role</label><select name="userType"><option value="lrm" ${u.userType === "lrm" ? "selected" : ""}>LRM</option><option value="sc" ${u.userType === "sc" ? "selected" : ""}>SC</option></select></div><div class="field"><label>Status</label><select name="status">${["active", "inactive", "blocked"].map((x) => `<option ${u.status === x ? "selected" : ""}>${x}</option>`).join("")}</select></div></div>`;
}

function configView() {
  const page = configPages[state.configPage] || configPages["system-sizes"];
  const rows = state.configs.filter((c) => c.type === page.type);
  return `${top("Configuration", "Each configuration master has its own page, fields and backend schema.", `<button class="btn primary" id="addConfig">Add ${page.label}</button>`)}
  <div class="subnav">${Object.entries(configPages).map(([key, cfg]) => `<button class="${state.configPage === key ? "active" : ""}" data-config-page="${key}">${cfg.label}</button>`).join("")}</div>
  <div class="card" style="overflow:auto"><h3>${page.label}</h3>${configTable(state.configPage, rows)}</div>`;
}

function configTable(pageKey, rows) {
  const fields = configPages[pageKey].fields;
  if (!rows.length) return `<div class="empty">No ${configPages[pageKey].label} records</div>`;
  return `<table><thead><tr>${fields.map((f) => `<th>${fieldLabel(f)}</th>`).join("")}<th>Action</th></tr></thead><tbody>${rows.map((r) => `<tr>${fields.map((f) => `<td>${f === "status" ? `<span class="pill ${badge(r.status)}">${r.status}</span>` : valueForField(r, f)}</td>`).join("")}<td><button class="btn" data-config="${r._id}">Edit</button></td></tr>`).join("")}</tbody></table>`;
}

function fieldLabel(field) {
  return ({ name: "Name", sizeKw: "System Size (kW)", systemPrice: "System Price", watt: "Watt", gstPercent: "GST %", centralSubsidy: "Central Subsidy", upnedaSubsidy: "UPNEDA Subsidy", status: "Status" })[field] || field;
}

function valueForField(row, field) {
  if (["systemPrice", "centralSubsidy", "upnedaSubsidy"].includes(field)) return rupee(row[field]);
  if (field === "watt") return `${Number(row[field] || 0)} W`;
  return esc(row[field]);
}

function configForm(pageKey, c = {}) {
  const fields = configPages[pageKey].fields;
  return `<div class="grid two">${fields.map((field) => {
    if (field === "status") return `<div class="field"><label>Status</label><select name="status"><option ${c.status === "active" ? "selected" : ""}>active</option><option ${c.status === "inactive" ? "selected" : ""}>inactive</option></select></div>`;
    const type = ["sizeKw", "systemPrice", "watt", "gstPercent", "centralSubsidy", "upnedaSubsidy"].includes(field) ? "number" : "text";
    const step = field === "gstPercent" ? ` step="0.01"` : "";
    return `<div class="field"><label>${fieldLabel(field)}</label><input name="${field}" type="${type}"${step} ${field === "name" ? "required" : ""} value="${esc(c[field])}"></div>`;
  }).join("")}</div>`;
}

function performanceView() {
  const title = isAdmin() ? "Team Performance" : "My Performance";
  const subtitle = isAdmin() ? "Separate pages for SC and LRM performance, each with tile and table layouts." : "Your LRM call performance and SC outcomes for leads assigned by you.";
  const mode = state.perfMode || "tiles";
  const controls = isAdmin()
    ? `<div class="subnav"><button class="${mode === "tiles" ? "active" : ""}" data-perf-mode="tiles">Tiles</button><button class="${mode === "table" ? "active" : ""}" data-perf-mode="table">Table</button></div>`
    : "";
  return `${top(title, subtitle, controls)}
  <div class="subnav">${isAdmin() ? `<button class="${state.view === "performance-sc" ? "active" : ""}" data-view="performance-sc">SC Performance</button><button class="${state.view === "performance-lrm" ? "active" : ""}" data-view="performance-lrm">LRM Performance</button>` : ""}</div>
  ${isAdmin() ? performanceShell() : lrmPerformanceShell()}`;
}

function performanceShell() {
  const scRows = state.performance.sc || [];
  const lrmRows = state.performance.lrm || [];
  const mode = state.perfMode || "tiles";
  const scView = mode === "tiles"
    ? performanceTiles(scRows, ["totalAssigned", "meetingsDone", "ordersClosed", "conversionPercentage"], "sc")
    : performanceTable(scRows, ["name", "totalAssigned", "meetingsDone", "ordersClosed", "conversionPercentage"]);
  const lrmView = mode === "tiles"
    ? performanceTiles(lrmRows, ["totalCalls", "connectedCalls", "meetingsScheduled", "meetingsDone", "ordersClosed", "conversionPercentage"], "lrm")
    : performanceTable(lrmRows, ["name", "totalCalls", "connectedCalls", "meetingsScheduled", "meetingsDone", "ordersClosed", "conversionPercentage"]);
  return `<div class="grid two"><div class="card"><h3>SC Performance</h3>${scView}</div><div class="card"><h3>LRM Performance</h3>${lrmView}</div></div>`;
}

function scPerformanceView() {
  const rows = state.performance.sc || [];
  const mode = state.perfMode || "tiles";
  return `${top("SC Performance", "Dedicated SC performance page with tile and table views.", `<div class="subnav"><button class="${mode === "tiles" ? "active" : ""}" data-perf-mode="tiles">Tiles</button><button class="${mode === "table" ? "active" : ""}" data-perf-mode="table">Table</button></div>`) }
  ${mode === "tiles" ? performanceTiles(rows, ["totalAssigned", "meetingsDone", "ordersClosed", "conversionPercentage"], "sc") : performanceTable(rows, ["name", "totalAssigned", "meetingsDone", "ordersClosed", "conversionPercentage"])}`;
}

function lrmPerformanceView() {
  const rows = state.performance.lrm || [];
  const mode = state.perfMode || "tiles";
  return `${top("LRM Performance", "Dedicated LRM performance page with tile and table views.", `<div class="subnav"><button class="${mode === "tiles" ? "active" : ""}" data-perf-mode="tiles">Tiles</button><button class="${mode === "table" ? "active" : ""}" data-perf-mode="table">Table</button></div>`) }
  ${mode === "tiles" ? performanceTiles(rows, ["totalCalls", "connectedCalls", "meetingsScheduled", "meetingsDone", "ordersClosed", "conversionPercentage"], "lrm") : performanceTable(rows, ["name", "totalCalls", "connectedCalls", "meetingsScheduled", "meetingsDone", "ordersClosed", "conversionPercentage"])}`;
}

function reportView() {
  return `${top("Day-End Report", "Enter total calls, connected calls, meetings scheduled, meetings done and orders closed.", `<button class="btn primary" id="addReport">Add Today Report</button>`)}
  <div class="card"><h3>Recent LRM Reports</h3>${recordTable(state.reports, ["reportDate", "totalCalls", "connectedCalls", "meetingsScheduled", "meetingsDone", "ordersClosed"])}</div>`;
}

function reportForm(r = {}) {
  return `<div class="grid two">
    <div class="field"><label>Date</label><input type="date" name="reportDate" value="${esc(r.reportDate || new Date().toISOString().slice(0,10))}"></div>
    <div class="field"><label>Total Calls</label><input type="number" name="totalCalls" value="${r.totalCalls || ""}"></div>
    <div class="field"><label>Connected Calls</label><input type="number" name="connectedCalls" value="${r.connectedCalls || ""}"></div>
    <div class="field"><label>Meetings Scheduled</label><input type="number" name="meetingsScheduled" value="${r.meetingsScheduled || ""}"></div>
    <div class="field"><label>Meetings Done</label><input type="number" name="meetingsDone" value="${r.meetingsDone || ""}"></div>
    <div class="field"><label>Orders Closed</label><input type="number" name="ordersClosed" value="${r.ordersClosed || ""}"></div>
    <div class="field" style="grid-column:1/-1"><label>Note</label><textarea name="note">${esc(r.note || "")}</textarea></div>
  </div>`;
}

function recordsView() {
  return `${top("Records", "Quotation, payment receipt, GST invoice and meeting history.")}
  <div class="grid three"><div class="card"><h3>Quotations</h3>${documentCards(state.quotes, "quote")}</div><div class="card"><h3>Payment Receipts</h3>${documentCards(state.payments, "payment")}</div><div class="card"><h3>GST Invoices</h3>${documentCards(state.gst, "gst")}</div></div>`;
}

function documentCards(rows, type) {
  if (!rows.length) return `<div class="empty">No records found</div>`;
  return `<div class="doc-board">${rows.map((r, index) => {
    const lead = state.leads.find((l) => leadKey(l._id) === leadKey(r.leadId));
    r = { ...r, email: r.email || lead?.email || "", whatsappNumber: r.whatsappNumber || lead?.whatsappNumber || "", phone: r.phone || lead?.phone || "" };
    const no = r.quoteNo || r.paymentNo || r.invoiceNo;
    const amount = type === "quote" ? r.netEffectivePrice : type === "payment" ? r.paidAmount : Number(r.taxableAmount || 0) + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0);
    const date = type === "payment" ? r.paymentDate || r.createdAt : r.createdAt;
    const fields = type === "quote"
      ? [["Lead", r.leadName], ["System Size", r.systemSize || "-"], ["Panel", r.panel || "-"], ["Date", fmtDocDate(date)]]
      : type === "payment"
        ? [["Lead", r.leadName], ["Mode", r.paymentMode || "-"], ["Balance Due", rupee(r.remainingAmount)], ["Date", fmtDocDate(date)]]
        : [["Lead", r.leadName], ["Taxable", rupee(r.taxableAmount)], ["Tax", rupee(Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0))], ["Date", fmtDocDate(date)]];
    return `<div class="doc-card ${index === 0 ? "latest" : ""}"><div class="doc-head"><div class="doc-title"><div class="doc-icon">${type === "quote" ? "Q" : type === "payment" ? "R" : "G"}</div><div><div class="doc-no">${esc(no)}</div><div class="muted">${index === 0 ? "Latest record" : "Previous record"}</div></div></div><span class="pill ${type === "payment" ? "pgreen" : type === "gst" ? "pblue" : "porange"}">${esc(type.toUpperCase())}</span></div><div class="doc-amount">${rupee(amount)}</div><div class="doc-grid">${fields.map(([label, value]) => `<div class="doc-field"><label>${label}</label><span>${esc(value)}</span></div>`).join("")}</div>${docContactActions(type, r)}</div>`;
  }).join("")}</div>`;
}

function bindDocumentButtons() {
  document.querySelectorAll("[data-doc]").forEach((b) => b.onclick = () => {
    const [type, id] = b.dataset.doc.split(":");
    const row = type === "quote" ? state.quotes.find((x) => x._id === id) : type === "payment" ? state.payments.find((x) => x._id === id) : state.gst.find((x) => x._id === id);
    if (!row) return toast("Record not found");
    if (type === "quote") viewQuotePdf(row);
    if (type === "payment") viewReceiptPdf(row);
    if (type === "gst") viewGstPdf(row);
  });
}

function bindSendButtons() {
  document.querySelectorAll("[data-send-wa]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); window.open(`https://wa.me/91${b.dataset.sendWa}?text=${b.dataset.waMsg || ""}`, "_blank"); });
  document.querySelectorAll("[data-email]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); location.href = `mailto:${b.dataset.email}?subject=${b.dataset.subject || ""}&body=${b.dataset.body || ""}`; });
}

function openAssign(id) {
  const lead = state.leads.find((l) => l._id === id);
  modal("Assign Lead", `<div class="field"><label>Assign to SC</label><select name="assignedToUserId" required>${state.scs.map((u) => `<option value="${u._id}">${esc(u.firstName)} ${esc(u.lastName)}</option>`).join("")}</select></div><div class="grid two" style="margin-top:12px"><div class="field"><label>Meeting Date</label><input type="date" name="meetingDate" value="${esc(lead?.meetingDate)}"></div><div class="field"><label>Meeting Time</label><input type="time" name="meetingTime" value="${esc(lead?.meetingTime)}"></div></div>`, (data) => api(`/leads/${id}/assign`, { method: "PATCH", body: JSON.stringify(data) }), false);
}

function openNewQuote(id) {
  const lead = state.leads.find((l) => l._id === id);
  const options = (type) => active(type).map((x) => `<option value="${x._id}" data-price="${x.systemPrice || 0}">${esc(x.name)}</option>`).join("");
  const tax = quoteTaxDefaults();
  modal("Generate Quotation", `<div class="quote-paper"><div class="quote-head"><div><b>Zen Grid Solar LLP</b><br>${esc(lead?.customerName)} / ${esc(lead?.phone)}</div><div>Quotation</div></div><div class="grid two"><div class="field"><label>System Size</label><select name="systemSizeConfigId" id="systemPick" required>${options("system-size")}</select></div><div class="field"><label>Base Price</label><input type="number" name="price" id="qPrice"></div><div class="field"><label>Solar Panel</label><select name="panelConfigId">${options("solar-panel")}</select></div><div class="field"><label>Inverter</label><select name="inverterConfigId">${options("inverter")}</select></div><div class="field"><label>Floor</label><select name="floor">${floors.map((x) => `<option>${x}</option>`)}</select></div><div class="field"><label>Structure</label><select name="structureConfigId">${options("structure-type")}</select></div><div class="field"><label>Wiring</label><select name="wiringConfigId">${options("wiring")}</select></div><div class="field"><label>Cleaning</label><select name="cleaning"><option>Yes</option><option>No</option></select></div><div class="field"><label>Overhead Price</label><input type="number" name="overheadPrice" value="0"></div><div class="field"><label>Extra Discount</label><input type="number" name="extraDiscount" value="0"></div><div class="field"><label>GST %</label><input type="number" name="gstPercent" value="${tax.gstPercent || 0}"></div><div class="field"><label>Central Subsidy</label><input type="number" name="subsidy1" value="${tax.centralSubsidy || 0}"></div><div class="field"><label>UPNEDA Subsidy</label><input type="number" name="subsidy2" value="${tax.upnedaSubsidy || 0}"></div><div class="field"><label>Send Later</label><select><option>Email and WhatsApp UI ready</option></select></div><div class="field" style="grid-column:1/-1"><label>Notes</label><textarea name="note"></textarea></div></div></div>`, async (data) => { const res = await api(`/activities/quotes/${id}`, { method: "POST", body: JSON.stringify(data) }); viewQuotePdf(res.quote); });
  const pick = document.querySelector("#systemPick"), price = document.querySelector("#qPrice");
  const setPrice = () => { price.value = pick.selectedOptions[0]?.dataset.price || 0; };
  pick.onchange = setPrice; setPrice();
}

function openNewPayment(id) {
  modal("Payment Receipt", `<div class="grid two"><div class="field"><label>Total Amount</label><input type="number" name="totalAmount" required></div><div class="field"><label>Paid Amount</label><input type="number" name="paidAmount" required></div><div class="field"><label>Payment Mode</label><select name="paymentMode"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option></select></div><div class="field"><label>Date</label><input type="date" name="paymentDate" value="${new Date().toISOString().slice(0,10)}"></div><div class="field" style="grid-column:1/-1"><label>Notes</label><textarea name="notes"></textarea></div></div>`, async (data) => { const res = await api(`/activities/payments/${id}`, { method: "POST", body: JSON.stringify(data) }); viewReceiptPdf(res.payment); }, false);
}

function openNewGst(id) {
  modal("GST Invoice", `<div class="grid two"><div class="field"><label>Customer GSTIN</label><input name="customerGSTIN"></div><div class="field"><label>PAN</label><input name="customerPAN"></div><div class="field"><label>Taxable Amount</label><input type="number" name="taxableAmount"></div><div class="field"><label>CGST</label><input type="number" name="cgst"></div><div class="field"><label>SGST</label><input type="number" name="sgst"></div><div class="field"><label>IGST</label><input type="number" name="igst"></div><div class="field" style="grid-column:1/-1"><label>Address</label><textarea name="address"></textarea></div></div>`, async (data) => { const res = await api(`/activities/gst/${id}`, { method: "POST", body: JSON.stringify(data) }); viewGstPdf(res.invoice); });
}

function leadDocs(id, type) {
  const lead = state.leads.find((l) => l._id === id);
  const rows = type === "quote" ? state.quotes.filter((q) => leadKey(q.leadId) === id) : type === "payment" ? state.payments.filter((p) => leadKey(p.leadId) === id) : state.gst.filter((g) => leadKey(g.leadId) === id);
  const title = type === "quote" ? "Quotations" : type === "payment" ? "Payment Receipts" : "GST Invoices";
  const addLabel = type === "quote" ? "Add New Quote" : type === "payment" ? "Add New Receipt" : "Add New GST";
  const addClass = type === "quote" ? "primary" : type === "payment" ? "green" : "blue";
  const cards = rows.map((rawRow) => {
    const r = { ...rawRow, email: rawRow.email || lead?.email || "", whatsappNumber: rawRow.whatsappNumber || lead?.whatsappNumber || "", phone: rawRow.phone || lead?.phone || "" };
    const no = r.quoteNo || r.paymentNo || r.invoiceNo;
    const amount = type === "quote" ? r.netEffectivePrice : type === "payment" ? r.paidAmount : Number(r.taxableAmount || 0) + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0);
    const fields = type === "quote"
      ? [["System Size", r.systemSize || "-"], ["Panel", r.panel || "-"], ["Inverter", r.inverter || "-"], ["Date", fmtDocDate(r.createdAt)]]
      : type === "payment"
        ? [["Mode", r.paymentMode || "-"], ["Total", rupee(r.totalAmount)], ["Balance Due", rupee(r.remainingAmount)], ["Date", fmtDocDate(r.paymentDate || r.createdAt)]]
        : [["Taxable", rupee(r.taxableAmount)], ["CGST/SGST", `${rupee(r.cgst)} / ${rupee(r.sgst)}`], ["IGST", rupee(r.igst)], ["Date", fmtDocDate(r.createdAt)]];
    return `<div class="doc-card"><div class="doc-head"><div class="doc-title"><div class="doc-icon">${type === "quote" ? "Q" : type === "payment" ? "R" : "G"}</div><div><div class="doc-no">${esc(no)}</div><div class="muted">${esc(r.leadName || lead?.customerName || "")}</div></div></div><span class="pill ${type === "payment" ? "pgreen" : type === "gst" ? "pblue" : "porange"}">${rupee(amount)}</span></div><div class="doc-grid">${fields.map(([label, value]) => `<div class="doc-field"><label>${label}</label><span>${esc(value)}</span></div>`).join("")}</div>${docContactActions(type, r)}</div>`;
  }).join("");
  const host = infoModal(`${title} - ${lead?.customerName || "Lead"}`, `<div class="top" style="margin-bottom:12px"><div><h1 style="font-size:20px">${title}</h1><p>${rows.length} previous record${rows.length === 1 ? "" : "s"}</p></div><div class="toolbar"><button class="btn ${addClass}" data-add-doc>${addLabel}</button></div></div><div class="doc-board">${cards || `<div class="empty">No previous ${title.toLowerCase()} for this lead</div>`}</div>`);
  host.querySelector("[data-add-doc]").onclick = () => {
    host.remove();
    if (type === "quote") openNewQuote(id);
    if (type === "payment") openNewPayment(id);
    if (type === "gst") openNewGst(id);
  };
  bindDocumentButtons();
  bindSendButtons();
}

function openQuote(id) {
  leadDocs(id, "quote");
}

function openPayment(id) {
  leadDocs(id, "payment");
}

function openGst(id) {
  leadDocs(id, "gst");
}

function fmtDocDate(value = new Date()) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()]} ${d.getFullYear()}`;
}

function numberWords(num) {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const words = (n) => n < 20 ? a[n] : n < 100 ? `${b[Math.floor(n / 10)]} ${a[n % 10]}`.trim() : `${a[Math.floor(n / 100)]} Hundred ${words(n % 100)}`.trim();
  const n = Math.round(Number(num || 0));
  if (!n) return "Zero";
  if (n < 1000) return words(n);
  if (n < 100000) return `${words(Math.floor(n / 1000))} Thousand ${words(n % 1000)}`.trim();
  return `${words(Math.floor(n / 100000))} Lakh ${words(n % 100000)}`.trim();
}

function zengridLogoMarkup(size = 34) {
  const bolt = Math.max(10, Math.round(size * 0.55));
  const stroke = Math.max(1.4, Math.round(size * 0.08) / 10);
  return `<div style="width:${size}px;height:${size}px;background:#0b0d14;border-radius:${Math.max(10, Math.round(size * 0.28))}px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 22px rgba(11,13,20,.18);"><svg viewBox="0 0 24 24" width="${bolt}" height="${bolt}" fill="none" stroke="#f5cb32" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg></div>`;
}

function openDocument(html, width = 980, height = 1100) {
  const host = document.createElement("div");
  host.className = "modalback doc-preview-back";
  host.innerHTML = `<div class="modal doc-preview-modal"><div class="modalhead"><h2>Document Preview</h2><button type="button" class="icon-close" data-close aria-label="Close">x</button></div><iframe class="doc-preview-frame" title="Document Preview"></iframe></div>`;
  document.body.append(host);
  host.querySelectorAll("[data-close]").forEach((b) => b.onclick = () => host.remove());
  const frame = host.querySelector("iframe");
  frame.srcdoc = html;
}

function viewQuotePdf(q) {
  const price = Number(q.price || 0);
  const discounts = Number(q.discount1 || 0) + Number(q.discount2 || 0) + Number(q.extraDiscount || 0);
  const netPrice = Number(q.netPrice || price - discounts);
  const netEff = Number(q.netEffectivePrice || 0);
  const panelWatt = Number(String(q.panel || "").match(/\d{3}/)?.[0] || 540);
  const panels = Math.max(1, Math.round((Number(String(q.systemSize || "").replace(/[^\d.]/g, "")) || 3) * 1000 / panelWatt));
  const dateStr = fmtDocDate(q.createdAt);
  const qNum = q.quoteNo || "ZGS-Q";
  openDocument(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Quote - ${esc(q.leadName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:"Plus Jakarta Sans",sans-serif;background:#fff;color:#0A0F1A;font-size:14px}.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;position:relative;overflow:hidden}.no-print{position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px}.no-print button{padding:.6rem 1.2rem;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px}.btn-print{background:#F5A623;color:#fff}.btn-close{background:#eee;color:#333}
  .cover{height:297mm;page-break-after:always;background:linear-gradient(135deg,#2D1B69 0%,#6B21A8 58%,#F5A623 58%,#F5A623 100%);color:#fff;padding:42mm 26mm}.cover h1{font-size:52px;line-height:1.05;margin-top:70mm;font-weight:800}.cover h1 span{color:#F5A623}.cover p{font-size:18px;color:rgba(255,255,255,.75);margin-top:14px}.cover-meta{position:absolute;left:26mm;right:26mm;bottom:28mm;display:flex;justify-content:space-between;color:rgba(255,255,255,.78);font-weight:700}
  .offer-page,.comp-page,.contact-page{padding:2.5rem;min-height:297mm;page-break-after:always}.warranty-page{padding:2rem 2.5rem;min-height:297mm;page-break-after:always}.page-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:1.25rem;border-bottom:2px solid #F5A623;margin-bottom:2rem}.logo-sm{display:flex;align-items:center;gap:.6rem}.logo-sm-txt{font-weight:800;font-size:1rem;color:#0A0F1A}.logo-sm-txt span{color:#F5A623}.qnum{font-size:11px;color:#6B7A90;font-weight:600;text-align:right}h2.section-title{font-size:1.5rem;font-weight:800;color:#0A0F1A;margin-bottom:.25rem}h2.section-title span{color:#F5A623}.customer-band{background:linear-gradient(90deg,#2D1B69,#6B21A8);border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;color:#fff}.cust-name{font-size:1.3rem;font-weight:800;margin-bottom:.2rem}.cust-meta{font-size:13px;color:rgba(255,255,255,0.6)}.specs-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.5rem}.spec-card{background:#F4F6F9;border-radius:10px;padding:.85rem 1rem;display:flex;align-items:center;gap:.75rem}.spec-icon{width:36px;height:36px;background:#FFF8EC;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}.spec-label{font-size:10.5px;color:#6B7A90;font-weight:600;text-transform:uppercase;letter-spacing:.5px}.spec-val{font-size:13.5px;font-weight:700;color:#0A0F1A}.price-table,.comp-table,.warranty-table{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1.5px solid #EEF1F6}.price-table th{background:#F4F6F9;padding:.65rem 1rem;text-align:left;font-size:11px;font-weight:700;color:#6B7A90;text-transform:uppercase;letter-spacing:.6px}.price-table th:last-child{text-align:right}.price-table td{padding:.7rem 1rem;font-size:13.5px;color:#1E2A3B;border-top:1px solid #EEF1F6}.price-table td:last-child{text-align:right;font-weight:600}.price-table td.disc{color:#E53935}.net-row td{background:#FFF8EC;font-weight:700;color:#0A0F1A;font-size:14px}.final-row td{background:#F5A623;color:#fff;font-weight:800;font-size:1rem}
  .comp-table{margin-top:1.5rem}.comp-table th{background:#4A0E80;color:#fff;padding:.65rem 1rem;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;text-align:left}.comp-table td{padding:.8rem 1rem;font-size:13px;color:#1E2A3B;border-top:1px solid #EEF1F6;vertical-align:top}.comp-table tr:nth-child(even) td{background:#F9FAFB}.comp-name{font-weight:700;color:#0A0F1A;margin-bottom:2px}.comp-sub{font-size:11.5px;color:#6B7A90}.warranty-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin:1rem 0}.w-card{border-radius:10px;padding:.75rem 1rem}.w-card.green{background:#E8FAF2;border:1.5px solid #00A85A}.w-card.red{background:#FFEBEB;border:1.5px solid #E53935}.w-card-title{font-weight:700;font-size:13px;margin-bottom:.5rem}.w-card.green .w-card-title{color:#005E30}.w-card.red .w-card-title{color:#7A1010}.w-card p{font-size:12px;color:#3D4E63;line-height:1.5}.warranty-table th{background:#F4F6F9;padding:.45rem 1rem;font-size:11px;font-weight:700;color:#6B7A90;text-transform:uppercase;letter-spacing:.6px;text-align:left}.warranty-table td{padding:.5rem 1rem;font-size:13px;color:#1E2A3B;border-top:1px solid #EEF1F6}.warranty-table td:last-child{font-weight:700;color:#00A85A}.tnc{margin-top:1rem;background:#F4F6F9;border-radius:10px;padding:.75rem 1.25rem;page-break-inside:avoid}.tnc-title{font-size:12px;font-weight:700;color:#3D4E63;margin-bottom:.5rem}.tnc ol{padding-left:1.25rem;font-size:12px;color:#6B7A90;line-height:1.7}.contact-band{background:linear-gradient(135deg,#2D1B69,#6B21A8);border-radius:16px;padding:2rem;color:#fff;margin-bottom:1.5rem;text-align:center}.contact-band h2{font-size:1.4rem;font-weight:800;margin-bottom:1.25rem}.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;text-align:left}.contact-item{background:rgba(255,255,255,0.1);border-radius:10px;padding:.85rem 1rem}.contact-item-label{font-size:10.5px;color:rgba(255,255,255,0.5);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.25rem}.contact-item-val{font-size:13.5px;font-weight:700;color:#fff}.bank-card{background:#F4F6F9;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1.25rem;border:1.5px solid #EEF1F6}.bank-card h3{font-size:13px;font-weight:700;color:#6B7A90;text-transform:uppercase;letter-spacing:.6px;margin-bottom:1rem}.bank-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}.bank-item label{font-size:11px;color:#9AAABB;display:block;margin-bottom:.2rem}.bank-item span{font-size:13.5px;font-weight:700;color:#0A0F1A}.footer-bar{background:#0A1628;border-radius:10px;padding:1rem 1.5rem;display:flex;justify-content:space-between;align-items:center;color:rgba(255,255,255,0.5);font-size:12px;margin-top:1.5rem}.footer-bar span{color:#F5A623;font-weight:600}@media print{.no-print{display:none!important}.page{margin:0;box-shadow:none}@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}}
  </style></head><body><div class="no-print"><button class="btn-close" onclick="window.close()">Close</button><button class="btn-print" onclick="window.print()">Print / Save PDF</button></div>
  <div class="page cover"><div class="logo-sm">${zengridLogoMarkup(50)}<div class="logo-sm-txt" style="color:#fff;font-size:22px">Zen Grid <span>Solar</span></div></div><h1>Solar Rooftop<br><span>Proposal</span></h1><p>Personalized quotation for ${esc(q.leadName)}</p><div class="cover-meta"><div>${esc(q.phone)}</div><div>${qNum}</div></div></div>
  <div class="page offer-page"><div class="page-header"><div class="logo-sm">${zengridLogoMarkup()}<div class="logo-sm-txt">Zen Grid <span>Solar</span></div></div><div class="qnum"><div>${qNum}</div><div>${dateStr}</div></div></div><h2 class="section-title">Commercial <span>Offer</span></h2><div class="customer-band"><div class="cust-name">${esc(q.leadName)}</div><div class="cust-meta">${esc(q.phone)} | ${esc(q.address || q.area || "Lucknow")} | Monthly Bill: ${rupee(q.monthlyBill)}</div></div><div class="specs-grid"><div class="spec-card"><div class="spec-icon">kW</div><div><div class="spec-label">System Size</div><div class="spec-val">${esc(q.systemSize)}</div></div></div><div class="spec-card"><div class="spec-icon">PV</div><div><div class="spec-label">Solar Panel</div><div class="spec-val">${esc(q.panel)}</div></div></div><div class="spec-card"><div class="spec-icon">INV</div><div><div class="spec-label">Inverter</div><div class="spec-val">${esc(q.inverter)}</div></div></div><div class="spec-card"><div class="spec-icon">ST</div><div><div class="spec-label">Structure / Floor</div><div class="spec-val">${esc(q.structure)} / ${esc(q.floor)}</div></div></div></div><table class="price-table"><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>Solar Rooftop System Price</td><td>${rupee(price)}</td></tr><tr><td class="disc">Discount</td><td class="disc">-${rupee(discounts)}</td></tr><tr><td>GST @ ${q.gstPercent || 0}%</td><td>${rupee(q.gstAmount)}</td></tr><tr class="net-row"><td>Net Price</td><td>${rupee(netPrice)}</td></tr><tr><td class="disc">Central Govt Subsidy</td><td class="disc">-${rupee(q.subsidy1)}</td></tr><tr><td class="disc">UPNEDA Subsidy</td><td class="disc">-${rupee(q.subsidy2)}</td></tr><tr class="final-row"><td>Net Effective Price</td><td>${rupee(netEff)}</td></tr></tbody></table></div>
  <div class="page comp-page"><div class="page-header"><div class="logo-sm">${zengridLogoMarkup()}<div class="logo-sm-txt">Zen Grid <span>Solar</span></div></div><div class="qnum"><div>${qNum}</div><div>${dateStr}</div></div></div><h2 class="section-title">System <span>Components</span></h2><table class="comp-table"><thead><tr><th>Component</th><th>Specification</th><th>Qty</th></tr></thead><tbody><tr><td><div class="comp-name">Solar Panels</div><div class="comp-sub">High efficiency photovoltaic modules</div></td><td>${esc(q.panel)}</td><td>${panels}</td></tr><tr><td><div class="comp-name">Inverter</div><div class="comp-sub">Grid tied inverter</div></td><td>${esc(q.inverter)}</td><td>1</td></tr><tr><td><div class="comp-name">Mounting Structure</div><div class="comp-sub">Rooftop installation structure</div></td><td>${esc(q.structure)}</td><td>As required</td></tr><tr><td><div class="comp-name">Wiring</div><div class="comp-sub">DC/AC wiring and accessories</div></td><td>${esc(q.wiring || "Standard")}</td><td>Complete</td></tr><tr><td><div class="comp-name">Cleaning</div><div class="comp-sub">Panel cleaning option</div></td><td>${esc(q.cleaning)}</td><td>-</td></tr></tbody></table></div>
  <div class="page warranty-page"><div class="page-header"><div class="logo-sm">${zengridLogoMarkup()}<div class="logo-sm-txt">Zen Grid <span>Solar</span></div></div><div class="qnum"><div>${qNum}</div><div>${dateStr}</div></div></div><h2 class="section-title">Warranty & <span>Terms</span></h2><div class="warranty-grid"><div class="w-card green"><div class="w-card-title">Included</div><p>Solar panels, inverter, mounting structure, wiring, standard installation and commissioning support.</p></div><div class="w-card red"><div class="w-card-title">Not Included</div><p>Any civil work, extra height work, approvals beyond standard scope, and customer-side pending documentation.</p></div></div><table class="warranty-table"><tr><th>Item</th><th>Warranty</th></tr><tr><td>Solar Panels</td><td>As per manufacturer</td></tr><tr><td>Inverter</td><td>As per manufacturer</td></tr><tr><td>Workmanship</td><td>Standard installation warranty</td></tr></table><div class="tnc"><div class="tnc-title">Terms and Conditions</div><ol><li>Subsidy is subject to government approval and documentation.</li><li>Final price may change after site survey if additional work is required.</li><li>Payment terms are applicable as agreed before installation.</li><li>${esc(q.note || "Quotation validity and execution terms as per company policy.")}</li></ol></div></div>
  <div class="page contact-page"><div class="page-header"><div class="logo-sm">${zengridLogoMarkup()}<div class="logo-sm-txt">Zen Grid <span>Solar</span></div></div><div class="qnum"><div>${qNum}</div><div>${dateStr}</div></div></div><h2 class="section-title" style="text-align:center;margin-bottom:1.5rem"><span>Contact</span> Us</h2><div class="contact-band"><h2>ZENGRID SOLAR LLP</h2><div class="contact-grid"><div class="contact-item"><div class="contact-item-label">Phone</div><div class="contact-item-val">+91 91700 09300</div></div><div class="contact-item"><div class="contact-item-label">Website</div><div class="contact-item-val">www.zengridsolar.com</div></div><div class="contact-item"><div class="contact-item-label">Email</div><div class="contact-item-val">info@zengridsolar.com</div></div><div class="contact-item"><div class="contact-item-label">Address</div><div class="contact-item-val">Lucknow, Uttar Pradesh</div></div></div></div><div class="bank-card"><h3>Bank Remittance</h3><div class="bank-grid"><div class="bank-item"><label>Account Name</label><span>ZENGRID SOLAR LLP</span></div><div class="bank-item"><label>Bank Name</label><span>ICICI Bank</span></div><div class="bank-item"><label>Account Number</label><span>696105500279</span></div><div class="bank-item"><label>IFSC Code</label><span>ICIC0006961</span></div><div class="bank-item"><label>Branch</label><span>Lucknow</span></div><div class="bank-item"><label>GSTIN</label><span>09AAEFZ4969R1ZW</span></div></div></div><div class="footer-bar"><div>Â© 2026 Zengrid Solar LLP - All Rights Reserved</div><div>Quote: <span>${qNum}</span> | Generated: ${dateStr}</div></div></div></body></html>`);
}

function viewReceiptPdf(p) {
  const isPaid = Number(p.remainingAmount || 0) === 0;
  openDocument(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Receipt - ${esc(p.leadName)}</title><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Plus Jakarta Sans",sans-serif;background:#f0f4f8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}.receipt{background:#fff;border-radius:16px;width:380px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12)}.receipt-head{background:linear-gradient(135deg,#2D1B69,#6B21A8);padding:1.5rem;text-align:center;color:#fff}.receipt-logo{margin:0 auto .75rem;display:flex;justify-content:center}.receipt-title{font-size:.85rem;opacity:.7;letter-spacing:1px;text-transform:uppercase;margin-bottom:.25rem}.receipt-id{font-size:.75rem;opacity:.5}.receipt-status{margin:.75rem auto 0;display:inline-block;padding:.35rem 1.25rem;border-radius:20px;font-size:.8rem;font-weight:700;letter-spacing:.5px}.status-partial{background:#FFF3CD;color:#856404}.status-full{background:#D1FAE5;color:#065F46}.receipt-cust{padding:1.25rem 1.5rem;border-bottom:1px dashed #E5E7EB}.cust-name{font-size:1rem;font-weight:700;color:#1F2937;margin-bottom:.2rem}.cust-meta{font-size:.8rem;color:#6B7280}.receipt-amounts{padding:1.25rem 1.5rem}.amt-row{display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid #F3F4F6;font-size:.875rem}.amt-label{color:#6B7280}.amt-val{font-weight:600;color:#1F2937}.amt-row.received .amt-val{color:#059669;font-size:1rem}.amt-row.remaining .amt-val{color:#DC2626;font-size:1rem}.receipt-meta{padding:1rem 1.5rem;background:#F9FAFB;font-size:.78rem;color:#6B7280;display:grid;grid-template-columns:1fr 1fr;gap:.4rem}.meta-item label{display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.5px;color:#9CA3AF;margin-bottom:.1rem}.meta-item span{font-weight:600;color:#374151}.receipt-foot{padding:1rem 1.5rem;text-align:center;border-top:1px dashed #E5E7EB}.receipt-foot p{font-size:.75rem;color:#9CA3AF;margin-bottom:.5rem}.no-print{position:fixed;top:16px;right:16px;display:flex;gap:8px}.no-print button{padding:.5rem 1rem;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px}.btn-p{background:#6B21A8;color:#fff}.btn-c{background:#eee;color:#333}@media print{.no-print{display:none!important}body{background:#fff;padding:0}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body><div class="no-print"><button class="btn-c" onclick="window.close()">Close</button><button class="btn-p" onclick="window.print()">Print</button></div><div class="receipt"><div class="receipt-head"><div class="receipt-logo">${zengridLogoMarkup(50)}</div><div class="receipt-title">Payment Receipt</div><div class="receipt-id">${esc(p.paymentNo)}</div><div class="receipt-status ${isPaid ? "status-full" : "status-partial"}">${isPaid ? "PAID IN FULL" : "PARTIAL PAYMENT"}</div></div><div class="receipt-cust"><div class="cust-name">${esc(p.leadName)}</div><div class="cust-meta">Phone: ${esc(p.phone || "-")} | ${esc(p.address || "Lucknow, Uttar Pradesh")}</div></div><div class="receipt-amounts"><div class="amt-row"><span class="amt-label">Total Quote Amount</span><span class="amt-val">${rupee(p.totalAmount)}</span></div><div class="amt-row received"><span class="amt-label">Amount Received</span><span class="amt-val">${rupee(p.paidAmount)}</span></div><div class="amt-row remaining"><span class="amt-label">Remaining Balance</span><span class="amt-val">${rupee(p.remainingAmount)}</span></div></div><div class="receipt-meta"><div class="meta-item"><label>Payment Mode</label><span>${esc(p.paymentMode || "Cash")}</span></div><div class="meta-item"><label>Date</label><span>${fmtDocDate(p.paymentDate)}</span></div><div class="meta-item"><label>Received By</label><span>${esc(p.receivedBy || "-")}</span></div>${p.notes ? `<div class="meta-item" style="grid-column:1/-1"><label>Notes</label><span>${esc(p.notes)}</span></div>` : ""}</div><div class="receipt-foot"><p>Zengrid Solar LLP - Lucknow, UP<br>zengridsolar.com</p><div style="font-size:11px;color:#9CA3AF;font-style:italic">Digital Receipt - No Signature Required</div></div></div></body></html>`, 500, 700);
}

function viewGstPdf(g) {
  const total = Number(g.taxableAmount || 0) + Number(g.cgst || 0) + Number(g.sgst || 0) + Number(g.igst || 0);
  openDocument(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>GST Invoice - ${esc(g.invoiceNo)}</title><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Plus Jakarta Sans",sans-serif;background:#F4F6F9;display:flex;align-items:flex-start;justify-content:center;padding:2rem;min-height:100vh}.invoice{background:#fff;width:210mm;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}.inv-head{background:#0A1628;padding:1.5rem 2rem;display:flex;justify-content:space-between;align-items:center}.inv-head-right{text-align:right;color:#fff}.inv-head-right h1{font-size:1.6rem;font-weight:800;color:#F5A623;letter-spacing:1px}.inv-head-right p{font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px}.gst-band{background:#185FA5;padding:.6rem 2rem;display:flex;justify-content:space-between;align-items:center}.gst-band span{color:#fff;font-size:12.5px;font-weight:600}.gst-band .gstin{color:#90CAF9;font-size:12px}.inv-body{padding:1.5rem 2rem}.parties{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;padding-bottom:1.25rem;border-bottom:1.5px solid #EEF1F6}.party-label{font-size:10px;font-weight:700;color:#9AAABB;text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem}.party-name{font-size:14px;font-weight:700;color:#0A0F1A;margin-bottom:.25rem}.party-det{font-size:12px;color:#4A5568;line-height:1.7}.inv-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;background:#F9FAFB;border-radius:8px;padding:1rem}.meta-item label{display:block;font-size:10px;color:#9AAABB;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:.2rem}.meta-item span{font-size:13px;font-weight:600;color:#0A0F1A}.inv-table{width:100%;border-collapse:collapse;margin-bottom:1.5rem;border-radius:8px;overflow:hidden;border:1px solid #EEF1F6}.inv-table thead tr{background:#0A1628}.inv-table th{padding:.65rem 1rem;font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:.5px;text-align:left}.inv-table th:last-child,.inv-table td:last-child{text-align:right}.inv-table th:nth-child(3),.inv-table td:nth-child(3){text-align:center}.inv-table td{padding:.8rem 1rem;font-size:13px;color:#1E2A3B;border-top:1px solid #EEF1F6}.tax-section{display:grid;grid-template-columns:1fr 280px;gap:1.5rem;margin-bottom:1.5rem}.tax-words{background:#F9FAFB;border-radius:8px;padding:1rem;font-size:12px;color:#4A5568;line-height:1.7}.tax-words strong{color:#0A0F1A;display:block;margin-bottom:.3rem;font-size:11px;text-transform:uppercase;letter-spacing:.5px}.tax-table{width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #EEF1F6}.tax-table td{padding:.55rem 1rem;font-size:13px;color:#1E2A3B;border-top:1px solid #EEF1F6}.tax-table td:last-child{text-align:right;font-weight:600}.tax-table tr.total-row td{background:#0A1628;color:#fff;font-weight:700;font-size:14px}.tax-table tr.total-row td:last-child{color:#F5A623;font-size:15px}.inv-notes{background:#FFF8EC;border-left:3px solid #F5A623;border-radius:0 8px 8px 0;padding:.85rem 1rem;margin-bottom:1.5rem;font-size:12px;color:#8C5800}.inv-foot{border-top:1.5px solid #EEF1F6;padding:1.25rem 2rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem}.bank-det{font-size:12px;color:#4A5568;line-height:2}.bank-det strong{color:#0A0F1A;font-size:11px;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:.3rem}.sign-box{text-align:right}.sign-box p{font-size:11px;color:#9AAABB;margin-bottom:2.5rem}.sign-line{border-top:1.5px solid #0A0F1A;padding-top:.4rem;font-size:12px;font-weight:700;color:#0A0F1A}.no-print{position:fixed;top:16px;right:16px;display:flex;gap:8px;z-index:999}.no-print button{padding:.5rem 1rem;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px}.btn-p{background:#185FA5;color:#fff}.btn-c{background:#eee;color:#333}@media print{.no-print{display:none!important}body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body><div class="no-print"><button class="btn-c" onclick="window.close()">Close</button><button class="btn-p" onclick="window.print()">Print / PDF</button></div><div class="invoice"><div class="inv-head"><div>${zengridLogoMarkup(55)}</div><div class="inv-head-right"><h1>TAX INVOICE</h1><p>Original for Recipient</p></div></div><div class="gst-band"><span>ZENGRID SOLAR LLP</span><span class="gstin">GSTIN: 09AAEFZ4969R1ZW | SAC/HSN: 9954</span></div><div class="inv-body"><div class="parties"><div><div class="party-label">Supplier (From)</div><div class="party-name">Zengrid Solar LLP</div><div class="party-det">Lucknow, Uttar Pradesh - 226001<br>GSTIN: 09AAEFZ4969R1ZW<br>Email: info@zengridsolar.com<br>Phone: +91 91700 09300</div></div><div><div class="party-label">Buyer (To)</div><div class="party-name">${esc(g.customerName || g.leadName)}</div><div class="party-det">${esc(g.address || "Lucknow, Uttar Pradesh")}<br>Phone: ${esc(g.phone)}${g.customerGSTIN ? `<br>GSTIN: ${esc(g.customerGSTIN)}` : ""}${g.customerPAN ? `<br>PAN: ${esc(g.customerPAN)}` : ""}</div></div></div><div class="inv-meta"><div class="meta-item"><label>Invoice No.</label><span>${esc(g.invoiceNo)}</span></div><div class="meta-item"><label>Invoice Date</label><span>${fmtDocDate(g.createdAt)}</span></div><div class="meta-item"><label>Place of Supply</label><span>Uttar Pradesh (09)</span></div></div><table class="inv-table"><thead><tr><th style="width:40px">#</th><th>Description of Supply</th><th style="width:80px">HSN/SAC</th><th style="width:60px">Qty</th><th style="width:110px">Unit Price</th><th style="width:120px">Taxable Amt</th></tr></thead><tbody><tr><td>1</td><td style="font-weight:600">Solar Rooftop System Installation<br><span style="font-size:11px;color:#6B7A90;font-weight:400">Solar panels, inverter, mounting structure, wiring & complete installation</span></td><td>9954</td><td style="text-align:center">1</td><td>${rupee(g.taxableAmount)}</td><td>${rupee(g.taxableAmount)}</td></tr></tbody></table><div class="tax-section"><div class="tax-words"><strong>Amount in words</strong>${numberWords(total)} Rupees Only<div style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid #EEF1F6;font-size:11px;color:#9AAABB">* CGST & SGST applicable as per GST Act. Subsidy from Govt. is separate and not included in this invoice.</div></div><table class="tax-table"><tr><td>Taxable Amount</td><td>${rupee(g.taxableAmount)}</td></tr><tr><td>CGST</td><td>${rupee(g.cgst)}</td></tr><tr><td>SGST</td><td>${rupee(g.sgst)}</td></tr><tr><td>IGST</td><td>${rupee(g.igst)}</td></tr><tr class="total-row"><td>Total Invoice Amount</td><td>${rupee(total)}</td></tr></table></div>${g.notes ? `<div class="inv-notes"><strong>Terms & Notes:</strong> ${esc(g.notes)}</div>` : ""}</div><div class="inv-foot"><div class="bank-det"><strong>Bank Details</strong>Account Name: ZENGRID SOLAR LLP<br>Bank: ICICI Bank | A/C: 696105500279<br>IFSC: ICIC0006961 | Branch: Lucknow</div><div class="sign-box"><p>For Zengrid Solar LLP</p><div class="sign-line">Authorized Signatory</div></div></div></div></body></html>`);
}

function bind() {
  document.querySelector("#refresh")?.addEventListener("click", loadData);
  document.querySelectorAll("[data-perf-mode]").forEach((b) => b.onclick = () => { state.perfMode = b.dataset.perfMode; render(); });
  document.querySelector("#addLead")?.addEventListener("click", () => modal("Add Lead", leadForm(), (data) => api("/leads", { method: "POST", body: JSON.stringify(data) })));
  document.querySelectorAll("[data-lead-open]").forEach((row) => {
    const open = () => leadDetailModal(row.dataset.leadOpen);
    row.onclick = (e) => {
      if (e.target.closest("button")) return;
      open();
    };
    row.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    };
  });
  document.querySelectorAll("[data-edit]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); const l = state.leads.find((x) => x._id === b.dataset.edit); modal("Edit Lead", leadForm(l), (data) => api(`/leads/${l._id}`, { method: "PATCH", body: JSON.stringify(data) })); });
  document.querySelectorAll("[data-assign]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); openAssign(b.dataset.assign); });
  document.querySelectorAll("[data-history]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); leadHistory(b.dataset.history); });
  document.querySelectorAll("[data-quote]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); openQuote(b.dataset.quote); });
  document.querySelectorAll("[data-pay]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); openPayment(b.dataset.pay); });
  document.querySelectorAll("[data-gst]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); openGst(b.dataset.gst); });
  bindSendButtons();
  document.querySelector("#addUser")?.addEventListener("click", () => modal("Add Team Member", userForm(), (data) => { if (!data.password) delete data.password; return api("/users", { method: "POST", body: JSON.stringify(data) }); }));
  document.querySelectorAll("[data-user]").forEach((b) => b.onclick = () => { const u = state.users.find((x) => x._id === b.dataset.user); modal("Edit Team Member", userForm(u), (data) => { if (!data.password) delete data.password; return api(`/users/${u._id}`, { method: "PATCH", body: JSON.stringify(data) }); }); });
  document.querySelectorAll("[data-config-page]").forEach((b) => b.onclick = () => { state.configPage = b.dataset.configPage; render(); });
  document.querySelector("#addConfig")?.addEventListener("click", () => {
    const pageKey = state.configPage;
    modal(`Add ${configPages[pageKey].label}`, configForm(pageKey), (data) => api(`/config/${pageKey}`, { method: "POST", body: JSON.stringify(data) }));
  });
  document.querySelectorAll("[data-config]").forEach((b) => b.onclick = () => {
    const pageKey = state.configPage;
    const c = state.configs.find((x) => x._id === b.dataset.config);
    modal(`Edit ${configPages[pageKey].label}`, configForm(pageKey, c), (data) => api(`/config/${pageKey}/${c._id}`, { method: "PATCH", body: JSON.stringify(data) }));
  });
  document.querySelector("#addReport")?.addEventListener("click", () => modal("Day-End Report", reportForm(), (data) => api("/activities/daily-reports", { method: "POST", body: JSON.stringify(data) })));
  bindDocumentButtons();
  bindSendButtons();
}

function render() {
  if (!state.accessToken || !state.user) return renderLogin();
  if (isLrm() && ["team", "configuration", "records"].includes(state.view)) state.view = "dashboard";
  if (!isAdmin() && ["performance-sc", "performance-lrm"].includes(state.view)) state.view = "performance";
  const views = {
    dashboard: dashboardView,
    leads: leadsView,
    team: teamView,
    configuration: configView,
    performance: performanceView,
    "performance-sc": scPerformanceView,
    "performance-lrm": lrmPerformanceView,
    records: recordsView,
    report: reportView,
  };
  renderShell((views[state.view] || dashboardView)());
  bind();
}

if (state.accessToken) loadData(); else renderLogin();
