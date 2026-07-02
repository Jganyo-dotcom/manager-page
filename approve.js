const BaseApi = "https://medsec.onrender.com";
//const BaseApi = "https://medsec.onrender.com";
const token = localStorage.getItem("authToken"); // saved at login

document.addEventListener("DOMContentLoaded", () => {
  loadManagers();
  loadResets();
});

const socket = io("https://medsec.onrender.com", {
  auth: { token },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("managerAdded", (payload) => {
  console.log("New manager added:", payload);
  alert("New manager request received!");

  const table = document.getElementById("managerApprovals");

  // Create a new row for the single manager payload
  const row = document.createElement("tr");
  row.id = `row-${payload.id}`;
  row.innerHTML = `
    <td>${payload.name}</td>
    <td>${payload.email}</td>
    <td>${new Date(payload.createdAt).toLocaleString()}</td>
    <td class="text-right">
      <button class="approve-btn" onclick="approveManager('${payload.id}')">Approve</button>
    </td>
  `;
  table.appendChild(row);
});

socket.on("managerPasswordReset", (payload) => {
  console.log("manager password reset:", payload);
  alert("New password reset request received!");

  const table = document.getElementById("resetApprovals");

  // Create a new row for the single manager payload
  const row = document.createElement("tr");
  row.id = `row-${payload.id}`;
  row.innerHTML = `
    <td>${payload.name}</td>
    <td>${payload.email}</td>
    <td>${new Date(payload.createdAt).toLocaleString()}</td>
    <td>
      <button class="approve-btn" onclick="approveReset('${payload.id}')">Verify Reset</button>
    </td>
  `;
  table.appendChild(row);
});

async function loadManagers() {
  const res = await fetch(`${BaseApi}/api/pending-managers`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  console.log(data);

  const table = document.getElementById("managerApprovals");
  table.innerHTML = "";

  const managers = data.managers || []; // extract the array

  if (managers.length === 0) {
    table.innerHTML = `<tr><td colspan="4">No pending managers</td></tr>`;
    return;
  }

  managers.forEach((m) => {
    const row = document.createElement("tr");
    row.id = `row-${m.id}`;
    row.innerHTML = `
    <td>${m.name}</td>
    <td>${m.email}</td>
    <td>${new Date(m.createdAt).toLocaleString()}</td>
    <td class="text-right">
      <button class="approve-btn" onclick="approveManager('${m.id}')">Approve</button>
    </td>
  `;
    table.appendChild(row);
  });
}

// Approve a manager by ID
async function approveManager(id) {
  try {
    const res = await fetch(`${BaseApi}/api/approve-manager/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // make sure token is defined globally
      },
    });

    const data = await res.json();

    if (res.ok) {
      console.log("Manager approved:", data);

      // Option 1: remove the row from the table
      const row = document.getElementById(`row-${id}`);
      if (row) {
        row.remove();
      }

      // Option 2: show a success message
      alert(`Manager ${data.manager.name} approved successfully`);
    } else {
      throw new Error(data.message || "Failed to approve manager");
    }
  } catch (err) {
    console.error("Error approving manager:", err);
    alert("Error approving manager. Please try again.");
  }
}

async function loadResets() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Not authorized!");
    return;
  }

  const res = await fetch(`${BaseApi}/api/pending-resets`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  const resets = data.managers || []; // ✅ use managers array

  console.log("Resets:", resets);

  const table = document.getElementById("resetApprovals");
  table.innerHTML = "";

  if (resets.length === 0) {
    table.innerHTML = `<tr><td colspan="4">No pending resets</td></tr>`;
    return;
  }

  resets.forEach((r) => {
    const row = document.createElement("tr");
    row.id = `row-${r.id}`;
    row.innerHTML = `
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
      <td><button class="approve-btn" onclick="approveReset('${r.id}')">Verify Reset</button></td>
    `;
    table.appendChild(row);
  });
}

// async function approveManager(id) {
//   const res = await fetch(`/api/approve-manager/${id}`, { method: "POST" });
//   if (res.ok) {
//     document.getElementById(`row-${id}`).remove();
//     alert("Manager approved!");
//   }
// }

async function approveReset(id) {
  const confirmed = window.confirm("Do you want to approve this reset?");
  if (!confirmed) return;

  // Show loader
  const loader = document.getElementById("ios-loader");
  loader.style.display = "flex";

  try {
    const res = await fetch(`${BaseApi}/api/approve-reset/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to approve reset");
      return;
    }

    // Animate row removal
    const row = document.getElementById(`row-${id}`);
    if (row) {
      row.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      row.style.opacity = "0";
      row.style.transform = "translateX(20px)";
      setTimeout(() => row.remove(), 300);
    }

    alert(data.message || "Reset approved successfully!");
  } catch (err) {
    console.error("Error approving reset:", err);
    alert("Network error approving reset");
  } finally {
    // Hide loader
    loader.style.display = "none";
  }
}

socket.on("managerAdded", (manager) => {
  const table = document.getElementById("managerApprovals");
  const row = document.createElement("tr");
  row.id = `row-${manager.id}`;
  row.innerHTML = `
    <td>${manager.name}</td>
    <td>${manager.email}</td>
    <td>${new Date(manager.requestedAt).toLocaleString()}</td>
    <td><button onclick="approveManager('${manager.id}')">Approve</button></td>
  `;
  table.prepend(row); // add to top
});
