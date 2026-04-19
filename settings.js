//const BaseApi = "http://127.0.0.1:4444";
const BaseApi = "https://medsec.onrender.com";
const token = localStorage.getItem("authToken");
const profileInfo = document.getElementById("profileInfo");

// Fetch user info
async function loadProfile() {
  try {
    const res = await fetch(`${BaseApi}/api/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (!res.ok) {
      profileInfo.innerHTML = `<p class="muted">${data.message || "Failed to load profile."}</p>`;
      return;
    }

    profileInfo.innerHTML = `
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Role:</strong> ${data.role}</p>
    `;
  } catch (err) {
    profileInfo.innerHTML = `<p class="muted">Error loading profile: ${err.message}</p>`;
  }
}

// Handle password change
document
  .getElementById("passwordForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPass = document.getElementById("currentPass").value;
    const newPass = document.getElementById("newPass").value;
    const confirmPass = document.getElementById("confirmPass").value;

    if (newPass !== confirmPass) {
      return alert("New passwords do not match.");
    }

    try {
      const res = await fetch(`${BaseApi}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Password updated successfully.");
        e.target.reset();
      } else {
        alert(data.message || "Failed to update password.");
      }
    } catch (err) {
      alert("Error updating password: " + err.message);
    }
  });

document.addEventListener("DOMContentLoaded", loadProfile);
