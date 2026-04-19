//const BaseApi = "http://127.0.0.1:4444";
const BaseApi = "https://medsec.onrender.com";
const logBody = document.getElementById("logBody");
const resultCountEl = document.getElementById("resultCount"); // optional span in header
const paginationDiv = document.getElementById("pagination"); // add <div id="pagination"></div> under table

let allLogs = [];
let currentPage = 1;
const pageSize = 10;

async function loadAuditLogs() {
  logBody.innerHTML = `<tr><td colspan="4" class="center muted">Loading security logs…</td></tr>`;
  if (resultCountEl) resultCountEl.textContent = "Loading…";

  try {
    const token = localStorage.getItem("authToken");

    const res = await fetch(`${BaseApi}/api/login-history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await res.json();

    if (!res.ok) {
      const msg = payload.message || "Unauthorized access.";
      logBody.innerHTML = `<tr><td colspan="4" class="center muted">${msg}</td></tr>`;
      if (resultCountEl) resultCountEl.textContent = "0 results";
      return;
    }

    allLogs = Array.isArray(payload.history) ? payload.history : [];

    if (allLogs.length === 0) {
      logBody.innerHTML = `<tr><td colspan="4" class="center muted">No login history found.</td></tr>`;
      if (resultCountEl) resultCountEl.textContent = "0 results";
      return;
    }

    // Sort newest first
    allLogs.sort(
      (a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
    );

    currentPage = 1;
    renderPage(currentPage);
    renderPagination();
  } catch (err) {
    console.error("Audit log error:", err);
    logBody.innerHTML = `<tr><td colspan="4" class="center muted">Error loading audit data.</td></tr>`;
    if (resultCountEl) resultCountEl.textContent = "Error";
  }
}

function renderPage(page) {
  logBody.innerHTML = "";
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = allLogs.slice(start, end);

  pageItems.forEach((log) => {
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
    resultCountEl.textContent = `${allLogs.length} entr${allLogs.length === 1 ? "y" : "ies"} total`;
  }
}

function renderPagination() {
  const totalPages = Math.ceil(allLogs.length / pageSize);
  paginationDiv.innerHTML = "";

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderPage(currentPage);
    renderPagination();
  };
  paginationDiv.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.onclick = () => {
      currentPage = i;
      renderPage(currentPage);
      renderPagination();
    };
    paginationDiv.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderPage(currentPage);
    renderPagination();
  };
  paginationDiv.appendChild(nextBtn);
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
