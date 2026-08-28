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
  selectedLead: null,
};

const css = `
  :root{
    --bg:#f4efe6;--panel:#ffffff;--ink:#0f172a;--muted:#64748b;--line:rgba(15,23,42,.1);
    --blue:#1f3a8a;--purple:#6b4fd3;--beige:#f3e7d3;--shadow:0 18px 50px rgba(15,23,42,.12);
    font-family:'Inter',system-ui,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:linear-gradient(180deg,#eaf1ff 0%,#f8f4ee 40%,#f4efe6 100%);color:var(--ink);font-family:inherit}
  button,input,select,textarea{font:inherit}
  .shell{min-height:100vh}
  .topbar{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.84);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}
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
  .modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.55);display:grid;place-items:center;padding:16px;z-index:40}
  .modal{width:min(900px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.25);padding:18px}
  .modal-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}
  .modal-head h3{margin:0}
  .modal-close{border:none;background:#f3f4f6;border-radius:12px;padding:10px 12px;cursor:pointer}
  .detail-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}
  @media (max-width: 1200px){.stats{grid-template-columns:repeat(3,minmax(0,1fr))}.layout,.detail-grid{grid-template-columns:1fr}.side{position:static}}
  @media (max-width: 640px){.stats,.two,.three{grid-template-columns:1fr}.topbar-inner,.layout{padding:14px}.main{padding:16px}.hero h1{font-size:24px}}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

function toast(msg) {
  let box = document.querySelector(".toast");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast";
    Object.assign(box.style, {
      position: "fixed", right: "20px", bottom: "20px", zIndex: "50",
      padding: "14px 16px", borderRadius: "14px", background: "#111827", color: "#fff",
      boxShadow: "0 18px 40px rgba(0,0,0,.18)", display: "none",
    });
    document.body.append(box);
  }
  box.textContent = msg;
  box.style.display = "block";
  clearTimeout(box._t);
  box._t = setTimeout(() => (box.style.display = "none"), 2500);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
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

async function uploadFile(file, folder = "zengrid") {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  return api("/media/single", { method: "POST", body: form });
}

function printRecord(title, record) {
  const w = window.open("", "_blank", "width=900,height=1100");
  const amount = record.netEffectivePrice ?? record.paidAmount ?? record.taxableAmount ?? 0;
  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:0;padding:24px;background:#f6f1e8;color:#0f172a}
          .sheet{max-width:860px;margin:0 auto;background:#fff;border:1px solid #dbe1ea;border-radius:18px;padding:24px}
          .head{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #1f3a8a;padding-bottom:16px;margin-bottom:18px}
          .brand{font-size:22px;font-weight:800;color:#1f3a8a}
          .sub{color:#64748b;font-size:13px}
          .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed #e5e7eb}
          .label{color:#64748b}
          .value{font-weight:700}
          .amount{font-size:24px;font-weight:800;color:#6b4fd3}
          @media print{body{background:#fff}.sheet{border:none;padding:0}}
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="head">
            <div>
              <div class="brand">ZenGrid ${title}</div>
              <div class="sub">${record.leadName || record.customerName || "Lead Record"}</div>
            </div>
            <div class="sub">${new Date().toLocaleString()}</div>
          </div>
          <div class="row"><div class="label">Record No</div><div class="value">${record.quoteNo || record.paymentNo || record.invoiceNo || record._id || "—"}</div></div>
          <div class="row"><div class="label">Lead</div><div class="value">${record.leadName || record.customerName || "—"}</div></div>
          <div class="row"><div class="label">Mobile</div><div class="value">${record.phone || record.mobile || "—"}</div></div>
          <div class="row"><div class="label">Amount</div><div class="amount">₹${Number(amount || 0).toLocaleString("en-IN")}</div></div>
          <div class="row"><div class="label">Notes</div><div class="value">${record.note || "—"}</div></div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  w.document.close();
}

function modal(content) {
  const host = document.createElement("div");
  host.className = "modal-backdrop";
  host.innerHTML = `<div class="modal">${content}</div>`;
  host.addEventListener("click", (e) => { if (e.target === host) host.remove(); });
  document.body.append(host);
  return host;
}

function closeModal(el) { if (el) el.remove(); }

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
        <div class="brand" style="margin-bottom:18px">
          <div class="brand-mark"></div>
          <div><div class="brand-title">ZenGrid Admin</div><div class="brand-sub">Operations dashboard</div></div>
        </div>
        <h1 style="margin:0 0 6px">Admin Login</h1>
        <p class="muted" style="line-height:1.6;margin:0 0 18px">Manage leads, users, records, audit logs and workflow analytics.</p>
        <div class="grid" style="gap:12px">
          <div class="field"><label>Email</label><input id="email" placeholder="admin@company.com"/></div>
          <div class="field"><label>Password</label><input id="password" type="password" placeholder="********"/></div>
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

function rolePill(role) {
  return role === "admin" ? "purple" : role === "lrm" ? "beige" : "blue";
}

function statusPill(status) {
  return status === "active" ? "green" : status === "blocked" ? "red" : "beige";
}

function activityCardMarkup(items, labelKey, amountKey, recordType) {
  return items.map((item) => `
    <div class="card" style="margin-top:10px">
      <strong>${item[labelKey] || item.quoteNo || item.paymentNo || item.invoiceNo || "Record"}</strong>
      <div class="muted">₹${Number(item[amountKey] || 0).toLocaleString("en-IN")}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn btn-soft" data-print="${recordType}:${item._id}">Print</button>
      </div>
    </div>
  `).join("");
}

function openRecordModal(type) {
  const config = {
    quote: {
      title: "Create Quote",
      fields: [
        { name: "leadId", label: "Lead ID", type: "text" },
        { name: "quoteNo", label: "Quote No", type: "text" },
        { name: "totalAmount", label: "Total Amount", type: "number" },
        { name: "gstAmount", label: "GST Amount", type: "number" },
        { name: "netEffectivePrice", label: "Net Effective Price", type: "number" },
        { name: "note", label: "Note", type: "textarea" },
      ],
      endpoint: "/activities/quotes",
      method: "POST",
    },
    payment: {
      title: "Create Payment",
      fields: [
        { name: "leadId", label: "Lead ID", type: "text" },
        { name: "paymentNo", label: "Payment No", type: "text" },
        { name: "paidAmount", label: "Paid Amount", type: "number" },
        { name: "paymentMode", label: "Payment Mode", type: "text" },
        { name: "note", label: "Note", type: "textarea" },
      ],
      endpoint: "/activities/payments",
      method: "POST",
    },
    gst: {
      title: "Create GST Invoice",
      fields: [
        { name: "leadId", label: "Lead ID", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "taxableAmount", label: "Taxable Amount", type: "number" },
        { name: "gstAmount", label: "GST Amount", type: "number" },
        { name: "invoiceDate", label: "Invoice Date", type: "date" },
        { name: "note", label: "Note", type: "textarea" },
      ],
      endpoint: "/activities/gst",
      method: "POST",
    },
  }[type];
  const host = modal(`
    <form id="recordForm">
      <div class="modal-head"><h3>${config.title}</h3><button type="button" class="modal-close" data-close>Close</button></div>
      <div class="grid two">
        ${config.fields.map((f) => `<div class="field" style="${f.type === "textarea" ? "grid-column:1/-1" : ""}"><label>${f.label}</label>${f.type === "textarea" ? `<textarea name="${f.name}"></textarea>` : `<input name="${f.name}" type="${f.type}" />`}</div>`).join("")}
      </div>
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-soft" type="button" data-close>Cancel</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  `);
  host.querySelectorAll("[data-close]").forEach((el) => (el.onclick = () => closeModal(host)));
  host.querySelector("#recordForm").onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    const payload = {};
    Object.entries(body).forEach(([k, v]) => { if (v !== "") payload[k] = /^\d+(\.\d+)?$/.test(v) ? Number(v) : v; });
    const leadId = payload.leadId;
    delete payload.leadId;
    await api(`${config.endpoint}/${leadId}`, { method: config.method, body: JSON.stringify(payload) });
    toast(`${config.title} saved`);
    closeModal(host);
    loadData();
  };
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

function leadForm(lead = {}) {
  return `
    <div class="grid two">
      <div class="field"><label>Customer Name</label><input name="customerName" value="${lead.customerName || ""}" /></div>
      <div class="field"><label>Phone</label><input name="phone" value="${lead.phone || ""}" /></div>
      <div class="field"><label>Area</label><input name="area" value="${lead.area || ""}" /></div>
      <div class="field"><label>Locality</label><input name="locality" value="${lead.locality || ""}" /></div>
      <div class="field"><label>Monthly Bill</label><input name="monthlyBill" type="number" value="${lead.monthlyBill || ""}" /></div>
      <div class="field"><label>Source</label><select name="source">
        ${["website","social media","reference","walk-in","other"].map((v)=>`<option ${lead.source===v?"selected":""} value="${v}">${v}</option>`).join("")}
      </select></div>
      <div class="field"><label>Lead Status</label><select name="leadStatus">
        ${["New Lead","Contacted","Interested","Follow Up","Won","Lost","Not Interested"].map((v)=>`<option ${lead.leadStatus===v?"selected":""} value="${v}">${v}</option>`).join("")}
      </select></div>
      <div class="field"><label>Meeting Status</label><select name="meetingStatus">
        ${["assigned","started","done"].map((v)=>`<option ${lead.meetingStatus===v?"selected":""} value="${v}">${v}</option>`).join("")}
      </select></div>
      <div class="field"><label>Follow Up Date</label><input name="followUpDate" type="date" value="${lead.followUpDate ? String(lead.followUpDate).slice(0,10) : ""}" /></div>
      <div class="field"><label>Assigned To (User ID)</label><input name="assignedToUserId" value="${lead.assignedToUserId || ""}" /></div>
      <div class="field"><label>Assigned By (User ID)</label><input name="assignedByUserId" value="${lead.assignedByUserId || ""}" /></div>
      <div class="field" style="grid-column:1/-1"><label>Note</label><textarea name="note">${lead.note || ""}</textarea></div>
    </div>
  `;
}

function userForm(user = {}) {
  return `
    <div class="grid two">
      <div class="field"><label>First Name</label><input name="firstName" value="${user.firstName || ""}" /></div>
      <div class="field"><label>Last Name</label><input name="lastName" value="${user.lastName || ""}" /></div>
      <div class="field"><label>Phone Number</label><input name="phoneNumber" value="${user.phoneNumber || ""}" /></div>
      <div class="field"><label>Alternate Number</label><input name="alternateNumber" value="${user.alternateNumber || ""}" /></div>
      <div class="field"><label>Email</label><input name="email" value="${user.email || ""}" /></div>
      <div class="field"><label>Password</label><input name="password" type="password" /></div>
      <div class="field"><label>User Type</label><select name="userType">
        ${["admin","lrm","sc"].map((v)=>`<option ${user.userType===v?"selected":""} value="${v}">${v}</option>`).join("")}
      </select></div>
      <div class="field"><label>Status</label><select name="status">
        ${["active","inactive","blocked"].map((v)=>`<option ${user.status===v?"selected":""} value="${v}">${v}</option>`).join("")}
      </select></div>
      <div class="field" style="grid-column:1/-1"><label>Profile Image URL</label><input name="profileImage" value="${user.profileImage || ""}" /></div>
    </div>
  `;
}

async function saveLead(form, leadId) {
  const body = Object.fromEntries(new FormData(form).entries());
  const payload = {
    ...body,
    monthlyBill: body.monthlyBill ? Number(body.monthlyBill) : undefined,
  };
  const method = leadId ? "PATCH" : "POST";
  const path = leadId ? `/leads/${leadId}` : "/leads";
  await api(path, { method, body: JSON.stringify(payload) });
  toast("Lead saved");
  closeModal(form.closest(".modal-backdrop"));
  loadData();
}

async function saveUser(form, userId) {
  const body = Object.fromEntries(new FormData(form).entries());
  const method = userId ? "PATCH" : "POST";
  const path = userId ? `/users/${userId}` : "/users";
  const payload = { ...body };
  if (!payload.password) delete payload.password;
  await api(path, { method, body: JSON.stringify(payload) });
  toast("User saved");
  closeModal(form.closest(".modal-backdrop"));
  loadData();
}

async function addActivity(type, leadId, title) {
  const fields = {
    meetings: [{ name: "meetingDate", label: "Meeting Date", type: "date" }, { name: "meetingTime", label: "Meeting Time", type: "time" }, { name: "meetingNotes", label: "Notes", type: "textarea" }],
    quotes: [{ name: "totalAmount", label: "Total Amount", type: "number" }, { name: "gstAmount", label: "GST Amount", type: "number" }, { name: "netEffectivePrice", label: "Net Effective Price", type: "number" }, { name: "note", label: "Note", type: "textarea" }],
    payments: [{ name: "paidAmount", label: "Paid Amount", type: "number" }, { name: "paymentMode", label: "Payment Mode", type: "text" }, { name: "note", label: "Note", type: "textarea" }],
    gst: [{ name: "taxableAmount", label: "Taxable Amount", type: "number" }, { name: "gstAmount", label: "GST Amount", type: "number" }, { name: "invoiceDate", label: "Invoice Date", type: "date" }, { name: "note", label: "Note", type: "textarea" }],
  }[type];
  const host = modal(`
    <form id="activityForm">
      <div class="modal-head"><h3>${title}</h3><button type="button" class="modal-close" data-close>Close</button></div>
      <div class="grid two">
        ${fields.map((f) => `<div class="field" style="${f.type === "textarea" ? "grid-column:1/-1" : ""}"><label>${f.label}</label>${f.type === "textarea" ? `<textarea name="${f.name}"></textarea>` : `<input name="${f.name}" type="${f.type}" />`}</div>`).join("")}
      </div>
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-soft" type="button" data-close>Cancel</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  `);
  host.querySelector("[data-close]").onclick = () => closeModal(host);
  host.querySelector("#activityForm").onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    const payload = {};
    Object.entries(body).forEach(([k, v]) => { if (v !== "") payload[k] = /^\d+(\.\d+)?$/.test(v) ? Number(v) : v; });
    const endpoint = type === "meetings" ? "/activities/meetings" : type === "quotes" ? "/activities/quotes" : type === "payments" ? "/activities/payments" : "/activities/gst";
    await api(`${endpoint}/${leadId}`, { method: "POST", body: JSON.stringify(payload) });
    toast(`${title} saved`);
    closeModal(host);
    loadData();
  };
}

function leadDetails(lead) {
  const leadFollowUps = state.followUps.filter((f) => String(f.leadId) === String(lead._id));
  const leadMeetings = state.meetings.filter((m) => String(m.leadId) === String(lead._id));
  const leadQuotes = state.quotes.filter((q) => String(q.leadId) === String(lead._id));
  const leadPayments = state.payments.filter((p) => String(p.leadId) === String(lead._id));
  const leadGst = state.gst.filter((g) => String(g.leadId) === String(lead._id));
  const host = modal(`
    <div class="modal-head"><h3>${lead.customerName}</h3><button type="button" class="modal-close" data-close>Close</button></div>
    <div class="detail-grid">
      <div class="card">
        <div class="grid two">
          <div><div class="muted">Phone</div><strong>${lead.phone || "—"}</strong></div>
          <div><div class="muted">Area</div><strong>${lead.area || "—"}</strong></div>
          <div><div class="muted">Locality</div><strong>${lead.locality || "—"}</strong></div>
          <div><div class="muted">Monthly Bill</div><strong>${lead.monthlyBill || 0}</strong></div>
          <div><div class="muted">Source</div><strong>${lead.source || "—"}</strong></div>
          <div><div class="muted">Status</div><span class="pill ${statusPill(lead.status || "active")}">${lead.status || "active"}</span></div>
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" data-edit>Edit Lead</button>
          <button class="btn btn-soft" data-follow>Follow Up</button>
          <button class="btn btn-soft" data-meeting>Meeting</button>
          <button class="btn btn-soft" data-quote>Quote</button>
          <button class="btn btn-soft" data-payment>Payment</button>
          <button class="btn btn-soft" data-gst>GST</button>
        </div>
      </div>
      <div class="card">
        <h4 style="margin-top:0">Timeline</h4>
        <div class="muted">Follow ups: ${leadFollowUps.length}</div>
        <div class="muted">Meetings: ${leadMeetings.length}</div>
        <div class="muted">Quotes: ${leadQuotes.length}</div>
        <div class="muted">Payments: ${leadPayments.length}</div>
        <div class="muted">GST invoices: ${leadGst.length}</div>
      </div>
    </div>
  `);
  host.querySelector("[data-close]").onclick = () => closeModal(host);
  host.querySelector("[data-edit]").onclick = () => { closeModal(host); openLeadModal(lead); };
  host.querySelector("[data-follow]").onclick = () => { closeModal(host); openFollowModal(lead._id); };
  host.querySelector("[data-meeting]").onclick = () => { closeModal(host); addActivity("meetings", lead._id, "Add Meeting"); };
  host.querySelector("[data-quote]").onclick = () => { closeModal(host); addActivity("quotes", lead._id, "Add Quote"); };
  host.querySelector("[data-payment]").onclick = () => { closeModal(host); addActivity("payments", lead._id, "Add Payment"); };
  host.querySelector("[data-gst]").onclick = () => { closeModal(host); addActivity("gst", lead._id, "Add GST Invoice"); };
}

function openLeadModal(lead = {}) {
  const host = modal(`
    <form id="leadForm">
      <div class="modal-head"><h3>${lead._id ? "Edit Lead" : "Create Lead"}</h3><button type="button" class="modal-close" data-close>Close</button></div>
      ${leadForm(lead)}
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-soft" type="button" data-close>Cancel</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  `);
  host.querySelectorAll("[data-close]").forEach((el) => (el.onclick = () => closeModal(host)));
  host.querySelector("#leadForm").onsubmit = (e) => { e.preventDefault(); saveLead(e.target, lead._id); };
}

function openUserModal(user = {}) {
  const host = modal(`
    <form id="userForm">
      <div class="modal-head"><h3>${user._id ? "Edit User" : "Create User"}</h3><button type="button" class="modal-close" data-close>Close</button></div>
      ${userForm(user)}
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-soft" type="button" data-close>Cancel</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  `);
  host.querySelectorAll("[data-close]").forEach((el) => (el.onclick = () => closeModal(host)));
  host.querySelector("#userForm").onsubmit = (e) => { e.preventDefault(); saveUser(e.target, user._id); };
}

function openFollowModal(leadId) {
  const host = modal(`
    <form id="followForm">
      <div class="modal-head"><h3>Add Follow Up</h3><button type="button" class="modal-close" data-close>Close</button></div>
      <div class="grid two">
        <div class="field"><label>Follow Up Date</label><input name="followUpDate" type="date" /></div>
        <div class="field"><label>Status</label><select name="status">${["pending","done","cancelled"].map((v)=>`<option value="${v}">${v}</option>`).join("")}</select></div>
        <div class="field" style="grid-column:1/-1"><label>Note</label><textarea name="note"></textarea></div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-soft" type="button" data-close>Cancel</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  `);
  host.querySelectorAll("[data-close]").forEach((el) => (el.onclick = () => closeModal(host)));
  host.querySelector("#followForm").onsubmit = async (e) => {
    e.preventDefault();
    await api(`/followups/${leadId}`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) });
    toast("Follow up saved");
    closeModal(host);
    loadData();
  };
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
            <button class="btn btn-soft" id="createAction">${state.view === "users" ? "Add User" : state.view === "leads" ? "Add Lead" : "Quick Add"}</button>
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
          ${state.view === "leads" ? `
            <div class="toolbar" style="margin-bottom:14px">
              <input class="field search" id="searchLead" placeholder="Search lead name, phone, area, locality" />
              <button class="btn btn-soft" id="newLead">Create Lead</button>
            </div>
            ${renderTable(state.leads.map(l => `
              <tr>
                <td><strong>${l.customerName}</strong><div class="muted">${l.area || "—"} ${l.locality ? "• " + l.locality : ""}</div></td>
                <td>${l.phone}</td>
                <td>${l.source || "—"}</td>
                <td><span class="pill ${statusPill(l.status)}">${l.status || "active"}</span></td>
                <td><span class="pill ${pillFor(l.leadStatus)}">${l.leadStatus}</span></td>
                <td><button class="btn btn-soft" data-open="${l._id}">Open</button></td>
              </tr>
            `).join(""), ["Lead","Phone","Source","Status","Lead Status","Action"], 6, "No leads found.")}
          ` : ""}
          ${state.view === "users" ? `
            <div class="toolbar" style="margin-bottom:14px">
              <button class="btn btn-soft" id="newUser">Add User</button>
            </div>
            ${renderTable(state.users.map(u => `
              <tr>
                <td><strong>${u.firstName} ${u.lastName}</strong><div class="muted">${u.email}</div></td>
                <td>${u.phoneNumber}</td>
                <td><span class="pill ${rolePill(u.userType)}">${u.userType}</span></td>
                <td><span class="pill ${statusPill(u.status)}">${u.status}</span></td>
                <td><button class="btn btn-soft" data-user="${u._id}">Edit</button></td>
              </tr>
            `).join(""), ["User","Phone","Role","Status","Action"], 5, "No users found.")}
          ` : ""}
          ${state.view === "records" ? `
            <div class="toolbar" style="margin:16px 0">
              <button class="btn btn-primary" id="createQuote">New Quote</button>
              <button class="btn btn-soft" id="createPayment">New Payment</button>
              <button class="btn btn-soft" id="createGst">New GST Invoice</button>
            </div>
            <div class="grid two">
              <div class="card"><h3 style="margin-top:0">Quotes</h3>${state.quotes.map(q => `<div class="card" style="margin-top:10px"><strong>${q.quoteNo || "Quote"}</strong><div class="muted">${q.leadName || q.customerName || "—"} • ₹${Number(q.netEffectivePrice || 0).toLocaleString("en-IN")}</div></div>`).join("") || "<div class='empty'>No quotes</div>"}</div>
              <div class="card"><h3 style="margin-top:0">Payments</h3>${state.payments.map(p => `<div class="card" style="margin-top:10px"><strong>${p.paymentNo || "Payment"}</strong><div class="muted">${p.leadName || p.customerName || "—"} • ₹${Number(p.paidAmount || 0).toLocaleString("en-IN")}</div></div>`).join("") || "<div class='empty'>No payments</div>"}</div>
            </div>
            <div class="grid two" style="margin-top:14px">
              <div class="card"><h3 style="margin-top:0">GST Invoices</h3>${state.gst.map(g => `<div class="card" style="margin-top:10px"><strong>${g.invoiceNo || "Invoice"}</strong><div class="muted">${g.leadName || g.customerName || "—"} • ₹${Number(g.taxableAmount || 0).toLocaleString("en-IN")}</div></div>`).join("") || "<div class='empty'>No GST invoices</div>"}</div>
              <div class="card"><h3 style="margin-top:0">Meetings</h3>${state.meetings.map(m => `<div class="card" style="margin-top:10px"><strong>${m.leadName || m.customerName || "Lead"}</strong><div class="muted">${m.meetingDate || "—"} ${m.meetingTime || ""}</div></div>`).join("") || "<div class='empty'>No meetings</div>"}</div>
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
  document.querySelector("#createAction").onclick = () => {
    if (state.view === "users") return openUserModal();
    if (state.view === "leads") return openLeadModal();
    if (state.view === "records") return openRecordModal("quote");
    toast("Use a lead card to create records");
  };
  document.querySelector("#createQuote")?.addEventListener("click", () => openRecordModal("quote"));
  document.querySelector("#createPayment")?.addEventListener("click", () => openRecordModal("payment"));
  document.querySelector("#createGst")?.addEventListener("click", () => openRecordModal("gst"));
  document.querySelectorAll("[data-view]").forEach((b) => b.onclick = () => { state.view = b.dataset.view; render(); });
  document.querySelectorAll("[data-print]").forEach((btn) => {
    btn.onclick = () => {
      const [kind, id] = String(btn.dataset.print || "").split(":");
      const record = kind === "quote" ? state.quotes.find((x) => String(x._id) === id)
        : kind === "payment" ? state.payments.find((x) => String(x._id) === id)
        : state.gst.find((x) => String(x._id) === id);
      if (record) printRecord(kind === "quote" ? "Quote" : kind === "payment" ? "Receipt" : "GST Invoice", record);
    };
  });
  document.querySelector("#newLead")?.addEventListener("click", () => openLeadModal());
  document.querySelector("#newUser")?.addEventListener("click", () => openUserModal());
  document.querySelectorAll("[data-open]").forEach((btn) => btn.addEventListener("click", () => {
    const lead = state.leads.find((l) => String(l._id) === String(btn.dataset.open));
    if (lead) leadDetails(lead);
  }));
  document.querySelectorAll("[data-user]").forEach((btn) => btn.addEventListener("click", () => {
    const user = state.users.find((u) => String(u._id) === String(btn.dataset.user));
    if (user) openUserModal(user);
  }));
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
