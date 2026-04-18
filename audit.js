const BaseApi = "http://127.0.0.1:4444";
const logBody = document.getElementById("logBody");
const resultCountEl = document.getElementById("resultCount"); // optional if you add this span in header

async function loadAuditLogs() {
  logBody.innerHTML = `<tr><td colspan="4" class="center muted">Loading security logs…</td></tr>`;
  if (resultCountEl) resultCountEl.textContent = "Loading…";

  try {
    const token = localStorage.getItem("authToken"); // or however you store it

    const res = await fetch(`${BaseApi}/api/login-history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // attach your token here
      },
    });

    if (!res.ok) {
      // Show the actual message from the backend if available
      const msg = res.message || "Unauthorized access.";
      logBody.innerHTML = `<tr><td colspan="4" class="center muted">${msg}</td></tr>`;
      if (resultCountEl) resultCountEl.textContent = "0 results";
      return;
    }

    const payload = await res.json();
    const logs = Array.isArray(payload.history) ? payload.history : [];

    if (logs.length === 0) {
      logBody.innerHTML = `<tr><td colspan="4" class="center muted">No login history found.</td></tr>`;
      if (resultCountEl) resultCountEl.textContent = "0 results";
      return;
    }

    // Sort newest first
    logs.sort(
      (a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
    );

    renderLogs(logs);
  } catch (err) {
    console.error("Audit log error:", err);
    logBody.innerHTML = `<tr><td colspan="4" class="center muted">Error loading audit data.</td></tr>`;
    if (resultCountEl) resultCountEl.textContent = "Error";
  }
}

function renderLogs(logs) {
  logBody.innerHTML = "";
  logs.forEach((log) => {
    const staff = log.staff || {};
    const name = staff.name || "System";
    const email = staff.email || "-";
    const dateStr = log.date
      ? new Date(log.date).toLocaleString()
      : log.createdAt
        ? new Date(log.createdAt).toLocaleString()
        : log.time || "—";
    const statusRaw = (log.status || "success").toLowerCase();
    const isFail = ["failure", "failed", "error"].includes(statusRaw);
    const badgeClass = isFail ? "badge-failed" : "badge-success";
    const badgeText = isFail ? "Failed" : "Success";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Manager">${name}</td>
      <td data-label="Authentication Email">${email}</td>
      <td data-label="Event Timestamp">${dateStr}</td>
      <td data-label="Result">
        <span class="badge ${badgeClass}">
          <span class="badge-dot"></span>${badgeText}
        </span>
      </td>
    `;
    logBody.appendChild(row);
  });

  if (resultCountEl) {
    resultCountEl.textContent = `${logs.length} entr${logs.length === 1 ? "y" : "ies"} found`;
  }
}

function filterLogs() {
  const q = document.getElementById("logSearch").value.trim().toLowerCase();
  const rows = logBody.querySelectorAll("tr");
  let visible = 0;

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    const show = q === "" || text.includes(q);
    row.style.display = show ? "" : "none";
    if (show) visible++;
  });

  if (resultCountEl) {
    resultCountEl.textContent = `${visible} entr${visible === 1 ? "y" : "ies"} found`;
  }
}

document.addEventListener("DOMContentLoaded", loadAuditLogs);
