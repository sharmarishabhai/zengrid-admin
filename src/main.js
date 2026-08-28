const API_BASE = "http://localhost:9191/api";
const app = document.querySelector("#app");
const state = {
  accessToken: localStorage.getItem("zg_admin_access") || "",
  refreshToken: localStorage.getItem("zg_admin_refresh") || "",
  user: JSON.parse(localStorage.getItem("zg_admin_user") || "null"),
  view: "dashboard",
  summary: null,
  leads: [],
  users: [],
  followUps: [],
  meetings: [],
  payments: [],
  quotes: [],
  gst: [],
  audits: [],
};

const css = `
  :root{
    --bg:#f6f1e8;--panel:#fff;--ink:#09111f;--muted:#6b7280;--line:rgba(15,23,42,.1);
    --blue:#1f3a8a;--purple:#6b4fd3;--beige:#f3e7d3;--shadow:0 18px 50px rgba(15,23,42,.12);
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:linear-gradient(180deg,#eef3ff 0%,#f8f4ee 42%,#f6f1e8 100%);color:var(--ink);font-family:inherit}
  .shell{min-height:100vh}
  .topbar{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.82);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}
  .topbar-inner{max-width:1600px;margin:0 auto;padding:18px 20px;display:flex;align-items:center;gap:14px}
  .brand{display:flex;align-items:center;gap:12px;font-weight:800}
  .brand-mark{width:46px;height:46px;border-radius:16px;background:linear-gradient(135deg,var(--blue),var(--purple));box-shadow:0 12px 30px rgba(31,58,138,.28)}
  .brand-title{font-size:18px;line-height:1}
  .brand-sub{font-size:12px;color:var(--muted);font-weight:600;margin-top:4px}
  .actions{margin-left:auto;display:flex;gap:10px;flex-wrap:wrap}
  .btn{border:none;border-radius:14px;padding:12px 16px;font-weight:700;cursor:pointer}
  .btn-primary{background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff}
  .btn-soft{background:#fff;border:1px solid var(--line);color:var(--ink)}
  .btn-danger{background:#fff0f0;border:1px solid rgba(214,69,69,.25);color:#b42318}
  .layout{max-width:1600px;margin:0 auto;padding:20px;display:grid;grid-template-columns:280px 1fr;gap:20px}
  .side,.main{background:rgba(255,255,255,.84);backdrop-filter:blur(16px);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow)}
  .side{padding:16px;position:sticky;top:92px;align-self:start}
  .nav{display:grid;gap:10px}
  .navbtn{padding:14px;border-radius:14px;border:1px solid transparent;background:#fff;cursor:pointer;text-align:left;font-weight:800}
  .navbtn.active{background:linear-gradient(135deg,#eef2ff,#f5ecff);border-color:rgba(31,58,138,.12);color:var(--blue)}
  .navmeta{font-size:12px;color:var(--muted);font-weight:600;margin-top:4px}
  .main{padding:20px;min-height:calc(100vh - 120px)}
  .hero{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding-bottom:18px}
  .hero h1{margin:0;font-size:30px}
  .hero p{margin:8px 0 0;color:var(--muted);line-height:1.6;max-width:980px}
  .stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px;margin:18px 0}
  .stat{background:linear-gradient(180deg,#fff,#fbfaf7);border:1px solid var(--line);border-radius:18px;padding:16px}
  .stat .k{font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
  .stat .v{font-size:28px;font-weight:800;margin-top:6px}
  .grid{display:grid;gap:14px}
  .two{grid-template-columns:repeat(2,minmax(0,1fr))}
  .three{grid-template-columns:repeat(3,minmax(0,1fr))}
  .field{display:flex;flex-direction:column;gap:8px}
  .field label{font-size:12px;color:var(--muted);font-weight:700}
  .field input,.field select,.field textarea{width:100%;padding:13px 14px;border-radius:14px;border:1px solid var(--line);background:#fff;outline:none}
  .field textarea{min-height:104px;resize:vertical}
  .toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .search{flex:1;min-width:240px}
  .card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px}
  .table{width:100%;border-collapse:collapse;border-radius:16px;overflow:hidden}
  .table th,.table td{padding:12px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
  .table th{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
  .pill{display:inline-flex;align-items:center;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:800}
  .blue{background:#e8eeff;color:var(--blue)}
  .purple{background:#f0eaff;color:var(--purple)}
  .beige{background:#f8efe0;color:#8b5e34}
  .green{background:#e8f7ef;color:#139c67}
  .red{background:#ffecec;color:#d64545}
  .muted{color:var(--muted)}
  .empty{padding:34px;text-align:center;color:var(--muted)}
  @media (max-width: 1200px){.stats{grid-template-columns:repeat(3,minmax(0,1fr))}.layout{grid-template-columns:1fr}.side{position:static}}
  @media (max-width: 640px){.stats,.two,.three{grid-template-columns:1fr}.topbar-inner,.layout{padding:14px}.main{padding:16px}.hero h1{font-size:24px}}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

function toast(msg) {
  let box = document.querySelector(".toast");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast";
    Object.assign(box.style, { position: "fixed", right: "20px", bottom: "20px", zIndex: "50", padding: "14px 16px", borderRadius: "14px", background: "#111827", color: "#fff", boxShadow: "0 18px 40px rgba(0,0,0,.18)", display: "none" });
    document.body.append(box);
  }
  box.textContent = msg;
  box.style.display = "block";
  clearTimeout(box._t);
  box._t = setTimeout(() => (box.style.display = "none"), 2500);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (state.accessToken) headers.set("Authorization", `Bearer ${state.accessToken}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401 && state.refreshToken) {
    const refreshed = await refresh();
    if (refreshed) return api(path, options);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function refresh() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: state.refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return false;
  state.accessToken = data.accessToken;
  localStorage.setItem("zg_admin_access", data.accessToken);
  return true;
}

async function loadData() {
  try {
    const [me, summary, leads, users, followUps, meetings, payments, quotes, gst, audits] = await Promise.all([
      api("/auth/me"),
      api("/activities/summary"),
      api("/leads"),
      api("/users/lrms"),
      api("/followups"),
      api("/activities/meetings"),
      api("/activities/payments"),
      api("/activities/quotes"),
      api("/activities/gst"),
      api("/audits"),
    ]);
    state.user = me.user;
    state.summary = summary.summary;
    state.leads = leads.leads || [];
    state.users = users.users || [];
    state.followUps = followUps.followUps || [];
    state.meetings = meetings.meetings || [];
    state.payments = payments.payments || [];
    state.quotes = quotes.quotes || [];
    state.gst = gst.invoices || [];
    state.audits = audits.logs || [];
  } catch (e) {
    toast(e.message);
  }
  render();
}

function loginView() {
  app.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;padding:20px">
      <div class="card" style="width:min(460px,100%);padding:28px;border-radius:28px">
        <div class="brand" style="margin-bottom:18px"><div class="brand-mark"></div><div><div class="brand-title">ZenGrid Admin</div><div class="brand-sub">Operations dashboard</div></div></div>
        <h1 style="margin:0 0 6px">Admin Login</h1>
        <p class="muted" style="line-height:1.6;margin:0 0 18px">Manage leads, users, records, audit logs and workflow analytics.</p>
        <div class="grid" style="gap:12px">
          <div class="field"><label>Email</label><input id="email" placeholder="admin@company.com"/></div>
          <div class="field"><label>Password</label><input id="password" type="password" placeholder="••••••••"/></div>
          <button class="btn btn-primary" id="loginBtn">Login</button>
        </div>
      </div>
    </div>
  `;
  document.querySelector("#loginBtn").onclick = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value.trim(), password: password.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      state.accessToken = data.accessToken;
      state.refreshToken = data.refreshToken;
      state.user = data.user;
      localStorage.setItem("zg_admin_access", data.accessToken);
      localStorage.setItem("zg_admin_refresh", data.refreshToken);
      localStorage.setItem("zg_admin_user", JSON.stringify(data.user));
      toast("Welcome back");
      loadData();
    } catch (e) {
      toast(e.message);
    }
  };
}

function pillFor(val) {
  const map = { Won: "green", "New Lead": "blue", "Follow Up": "beige", Interested: "purple", Contacted: "beige", Lost: "red", "Not Interested": "red", assigned: "blue", started: "beige", done: "green" };
  return map[val] || "blue";
}

function renderStats() {
  const s = state.summary || {};
  return `
    <div class="stats">
      <div class="stat"><div class="k">Leads</div><div class="v">${s.totalLeads || 0}</div></div>
      <div class="stat"><div class="k">Follow Ups</div><div class="v">${s.totalFollowUps || 0}</div></div>
      <div class="stat"><div class="k">Meetings</div><div class="v">${s.meetingsTotal || 0}</div></div>
      <div class="stat"><div class="k">Quotes</div><div class="v">${s.totalQuotes || 0}</div></div>
      <div class="stat"><div class="k">Payments</div><div class="v">${s.totalPayments || 0}</div></div>
      <div class="stat"><div class="k">Won</div><div class="v">${s.won || 0}</div></div>
    </div>
  `;
}

function renderTable(rows, headers, colspan, emptyText) {
  return `
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${colspan}"><div class="empty">${emptyText}</div></td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function render() {
  if (!state.accessToken || !state.user) return loginView();
  const navs = [
    ["dashboard", "Dashboard", "KPIs and daily operations"],
    ["leads", "Leads", "All pipeline records"],
    ["users", "Users", "Admins, LRMs and SCs"],
    ["records", "Records", "Quotes, payments, GST"],
    ["audits", "Audit Logs", "Change tracking"],
  ];
  app.innerHTML = `
    <div class="shell">
      <div class="topbar">
        <div class="topbar-inner">
          <div class="brand"><div class="brand-mark"></div><div><div class="brand-title">ZenGrid Admin</div><div class="brand-sub">${state.user.firstName} ${state.user.lastName}</div></div></div>
          <div class="actions">
            <button class="btn btn-soft" id="reload">Reload</button>
            <button class="btn btn-danger" id="logout">Logout</button>
          </div>
        </div>
      </div>
      <div class="layout">
        <aside class="side">
          <div class="nav">
            ${navs.map(([k, t, m]) => `<button class="navbtn ${state.view === k ? "active" : ""}" data-view="${k}">${t}<div class="navmeta">${m}</div></button>`).join("")}
          </div>
        </aside>
        <main class="main">
          <div class="hero">
            <div>
              <h1>${state.view === "dashboard" ? "Operations Dashboard" : state.view === "users" ? "User Management" : state.view === "records" ? "Record Center" : state.view === "audits" ? "Audit Trail" : "Lead Pipeline"}</h1>
              <p>Blue, dark, purple and beige interface tuned for a fast admin workflow with the same backend records and rules used by the CRM app.</p>
            </div>
          </div>
          ${renderStats()}
          ${state.view === "dashboard" ? `
            <div class="grid two">
              <div class="card"><h3 style="margin-top:0">Lead Health</h3><div class="muted">Today follow ups: ${state.summary?.followUpsToday || 0}</div><div class="muted">Overdue: ${state.summary?.overdueFollowUps || 0}</div></div>
              <div class="card"><h3 style="margin-top:0">Audit Summary</h3><div class="muted">Total logs: ${state.summary?.total || 0}</div><div class="muted">Lead actions: ${state.summary?.leadActions || 0}</div></div>
            </div>
          ` : ""}
          ${state.view === "leads" ? renderTable(state.leads.map(l => `
            <tr>
              <td><strong>${l.customerName}</strong><div class="muted">${l.area || "—"} ${l.locality ? "• " + l.locality : ""}</div></td>
              <td>${l.phone}</td>
              <td>${l.assignedTo || "—"}</td>
              <td><span class="pill ${pillFor(l.leadStatus)}">${l.leadStatus}</span></td>
              <td><span class="pill ${pillFor(l.meetingStatus)}">${l.meetingStatus || "assigned"}</span></td>
              <td>${l.followUpDate || "—"}</td>
            </tr>
          `).join(""), ["Lead","Phone","Assigned To","Status","Meeting","Follow Up"], 6, "No leads found.") : ""}
          ${state.view === "users" ? renderTable(state.users.map(u => `
            <tr>
              <td><strong>${u.firstName} ${u.lastName}</strong><div class="muted">${u.email}</div></td>
              <td>${u.phoneNumber}</td>
              <td><span class="pill ${u.userType === "admin" ? "purple" : u.userType === "lrm" ? "beige" : "blue"}">${u.userType}</span></td>
              <td><span class="pill ${u.status === "active" ? "green" : "red"}">${u.status}</span></td>
            </tr>
          `).join(""), ["User","Phone","Role","Status"], 4, "No users found.") : ""}
          ${state.view === "records" ? `
            <div class="grid two">
              <div class="card"><h3 style="margin-top:0">Quotes</h3>${state.quotes.map(q => `<div class="card" style="margin-top:10px"><strong>${q.quoteNo}</strong><div class="muted">${q.leadName} • ₹${Number(q.netEffectivePrice || 0).toLocaleString("en-IN")}</div></div>`).join("") || "<div class='empty'>No quotes</div>"}</div>
              <div class="card"><h3 style="margin-top:0">Payments</h3>${state.payments.map(p => `<div class="card" style="margin-top:10px"><strong>${p.paymentNo}</strong><div class="muted">${p.leadName} • ₹${Number(p.paidAmount || 0).toLocaleString("en-IN")}</div></div>`).join("") || "<div class='empty'>No payments</div>"}</div>
            </div>
            <div class="grid two" style="margin-top:14px">
              <div class="card"><h3 style="margin-top:0">GST Invoices</h3>${state.gst.map(g => `<div class="card" style="margin-top:10px"><strong>${g.invoiceNo}</strong><div class="muted">${g.leadName} • ₹${Number(g.taxableAmount || 0).toLocaleString("en-IN")}</div></div>`).join("") || "<div class='empty'>No GST invoices</div>"}</div>
              <div class="card"><h3 style="margin-top:0">Meetings</h3>${state.meetings.map(m => `<div class="card" style="margin-top:10px"><strong>${m.leadName}</strong><div class="muted">${m.meetingDate} ${m.meetingTime || ""}</div></div>`).join("") || "<div class='empty'>No meetings</div>"}</div>
            </div>
          ` : ""}
          ${state.view === "audits" ? renderTable(state.audits.map(a => `
            <tr>
              <td><strong>${a.action}</strong><div class="muted">${a.entityType}</div></td>
              <td>${a.entityId || "—"}</td>
              <td>${new Date(a.createdAt).toLocaleString()}</td>
            </tr>
          `).join(""), ["Action","Entity","Time"], 3, "No audit logs") : ""}
        </main>
      </div>
    </div>
  `;

  document.querySelector("#reload").onclick = loadData;
  document.querySelector("#logout").onclick = logout;
  document.querySelectorAll("[data-view]").forEach((b) => b.onclick = () => { state.view = b.dataset.view; render(); });
}

async function logout() {
  localStorage.removeItem("zg_admin_access");
  localStorage.removeItem("zg_admin_refresh");
  localStorage.removeItem("zg_admin_user");
  state.accessToken = "";
  state.refreshToken = "";
  state.user = null;
  render();
}

(async function boot() {
  if (state.accessToken && state.refreshToken) {
    const ok = await refresh();
    if (ok) {
      state.user = JSON.parse(localStorage.getItem("zg_admin_user") || "null");
      await loadData();
      return;
    }
  }
  render();
})();
