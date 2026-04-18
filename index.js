// const BaseApi = "http://127.0.0.1:4444";
const BaseApi = "https://medsec.onrender.com";
const token = localStorage.getItem("authToken"); // saved at login

// DOM references
const managerTable = document.querySelector("#managerTable tbody");
const managerCountDisplay = document.getElementById("managerCount");
const modal = document.getElementById("modalOverlay");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

// --- UI LOGIC ---
function toggleModal(show) {
  modal.style.display = show ? "flex" : "none";
}

// Mobile sidebar toggle
menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// Close sidebar when clicking a nav item (on mobile)
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("open");
    }
  });
});

// --- API FUNCTIONS ---

// Load managers
async function loadManagers() {
  try {
    const res = await fetch(`${BaseApi}/api/managers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to load managers.");
      return;
    }

    managerTable.innerHTML = "";
    data.managers.forEach((m) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight: 600;">${m.name}</td>
        <td style="color: var(--text-muted)">${m.email}</td>
        <td>
          <div class="reset-area">
            <input type="text" placeholder="New Pass" id="reset-${m.id}">
            <button class="btn btn-primary" onclick="inlineReset('${m.email}', '${m.id}')">Update</button>
          </div>
        </td>
        <td class="text-right">
          <button class="btn btn-danger" onclick="removeManager('${m.id}')">Remove</button>
        </td>
      `;
      managerTable.appendChild(row);
    });

    managerCountDisplay.textContent = data.count;
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Error loading managers: " + err.message);
  }
}

// Register manager
document.getElementById("regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("regName").value,
    email: document.getElementById("regEmail").value,
    password: document.getElementById("regPass").value,
  };

  try {
    const res = await fetch(`${BaseApi}/api/register-manager`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Manager registered successfully.");
      toggleModal(false);
      e.target.reset();
      loadManagers();
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (err) {
    alert("Server error during registration: " + err.message);
  }
});

// Reset password
async function inlineReset(email, id) {
  const tempPass = document.getElementById(`reset-${id}`).value;
  if (!tempPass) return alert("Please type a temporary password first.");

  try {
    const res = await fetch(`${BaseApi}/api/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, tempPassword: tempPass }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Password updated for ${email}`);
      document.getElementById(`reset-${id}`).value = "";
    } else {
      alert(data.message || "Failed to reset password.");
    }
  } catch (err) {
    alert("Error resetting password: " + err.message);
  }
}

// Remove manager
async function removeManager(id) {
  if (confirm("Permanently remove this manager?")) {
    try {
      const res = await fetch(`${BaseApi}/api/delete-manager/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        loadManagers();
      } else {
        alert(data.message || "Failed to delete manager.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting manager: " + err.message);
    }
  }
}

// View audit logs
async function viewLoginHistory() {
  window.location.href = "audit.html";
}

// Initial load
loadManagers();
