// public/dashboard.js
import { apiFetch, getToken, logout, requireAuth, showMessage, hideMessage } from "/app.js";

// ===== Elements =====
const msg = document.getElementById("msg");
const authActions = document.getElementById("authActions");

const profileMeta = document.getElementById("profileMeta");
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("name");
const refreshProfileBtn = document.getElementById("refreshProfileBtn");

const clubsList = document.getElementById("clubsList");
const clubsEmpty = document.getElementById("clubsEmpty");

const resourcesList = document.getElementById("resourcesList");
const resourcesEmpty = document.getElementById("resourcesEmpty");
const refreshResourcesBtn = document.getElementById("refreshResourcesBtn");

// ===== Helpers =====
function escapeHtml(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setAuthButtons() {
    const token = getToken();
    authActions.innerHTML = "";

    if (!token) {
        authActions.innerHTML = `
      <a href="/register.html" style="text-decoration:none;"><button class="secondary" type="button">Register</button></a>
      <a href="/login.html" style="text-decoration:none;"><button class="secondary" type="button">Login</button></a>
    `;
        return;
    }

    const btn = document.createElement("button");
    btn.className = "danger";
    btn.type = "button";
    btn.textContent = "Logout";
    btn.addEventListener("click", logout);
    authActions.appendChild(btn);
}

// ===== API =====
async function loadProfile() {
    const data = await apiFetch("/api/users/profile", { method: "GET" });
    return data.user;
}

async function saveProfileName(name) {
    const data = await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({ name }),
    });
    return data.user;
}

async function loadResources() {
    const data = await apiFetch("/api/resource", { method: "GET" });
    return data.resources || [];
}

// ===== Render =====
function renderProfile(user) {
    profileMeta.innerHTML = `
    <div class="small">email: <b>${escapeHtml(user.email || "-")}</b></div>
    <div class="small">joinedClubs: <b>${escapeHtml((user.joinedClubs || []).join(", ") || "-")}</b></div>
  `;
    nameInput.value = user.name || "";
}

function renderJoinedClubs(joinedClubs) {
    clubsList.innerHTML = "";

    const list = Array.isArray(joinedClubs) ? joinedClubs : [];
    if (list.length === 0) {
        clubsEmpty.style.display = "block";
        return;
    }
    clubsEmpty.style.display = "none";

    for (const slug of list) {
        const div = document.createElement("div");
        div.className = "club";
        div.innerHTML = `
      <div class="title">${escapeHtml(slug)}</div>
      <div class="actions" style="margin-top:10px;">
        <a href="/club.html?slug=${encodeURIComponent(slug)}" style="text-decoration:none;">
          <button type="button">Open</button>
        </a>
      </div>
    `;
        clubsList.appendChild(div);
    }
}

function renderResources(list) {
    resourcesList.innerHTML = "";

    if (!list || list.length === 0) {
        resourcesEmpty.style.display = "block";
        return;
    }
    resourcesEmpty.style.display = "none";

    // createdAt desc
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    for (const r of list) {
        const div = document.createElement("div");
        div.className = "club";
        div.innerHTML = `
      <div class="title">${escapeHtml(r.title)}</div>
      <div class="meta">
        <span>club: <b>${escapeHtml(r.clubSlug)}</b></span>
        <span>type: <b>${escapeHtml(r.type)}</b></span>
        <span>id: <code>${escapeHtml(r._id)}</code></span>
      </div>
      ${r.type === "event"
            ? `<div class="small">date: ${escapeHtml(r.date || "-")} | location: ${escapeHtml(r.location || "-")}</div>`
            : ""
        }
      <div class="desc">${escapeHtml(r.description || "")}</div>

      <div class="actions" style="margin-top:10px;">
        <a href="/club.html?slug=${encodeURIComponent(r.clubSlug)}" style="text-decoration:none;">
          <button class="secondary" type="button">Open club</button>
        </a>
        <button class="secondary" data-action="edit" data-id="${r._id}" type="button">Edit</button>
        <button class="danger" data-action="delete" data-id="${r._id}" type="button">Delete</button>
      </div>
    `;

        div.addEventListener("click", async (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (!action || !id) return;

            if (action === "delete") {
                if (!confirm("Delete this resource?")) return;
                hideMessage(msg);
                try {
                    await apiFetch(`/api/resource/${id}`, { method: "DELETE" });
                    showMessage(msg, "Deleted", true);
                    await refreshResources();
                } catch (err) {
                    showMessage(msg, err.message || "Delete failed", false);
                }
            }

            if (action === "edit") {
                const newTitle = prompt("New title:", r.title);
                if (newTitle === null) return;

                const newDesc = prompt("New description:", r.description || "");
                if (newDesc === null) return;

                const patch = { title: newTitle, description: newDesc };

                if (r.type === "event") {
                    const newDate = prompt("New date (ISO):", r.date || "");
                    if (newDate === null) return;
                    const newLoc = prompt("New location:", r.location || "");
                    if (newLoc === null) return;
                    patch.date = newDate;
                    patch.location = newLoc;
                }

                hideMessage(msg);
                try {
                    await apiFetch(`/api/resource/${id}`, {
                        method: "PUT",
                        body: JSON.stringify(patch),
                    });
                    showMessage(msg, "Updated", true);
                    await refreshResources();
                } catch (err) {
                    showMessage(msg, err.message || "Update failed", false);
                }
            }
        });

        resourcesList.appendChild(div);
    }
}

// ===== Refresh =====
let currentUser = null;

async function refreshProfile() {
    currentUser = await loadProfile();
    renderProfile(currentUser);
    renderJoinedClubs(currentUser.joinedClubs);
}

async function refreshResources() {
    const resources = await loadResources();
    renderResources(resources);
}

// ===== Init =====
setAuthButtons();

// Dashboard должен быть приватным
const ok = await requireAuth();
if (!ok) {
    // requireAuth уже редиректит на login
    throw new Error("Not authenticated");
}

try {
    await refreshProfile();
    await refreshResources();
} catch (e) {
    showMessage(msg, e.message || "Failed to load dashboard", false);
}

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(msg);

    const name = nameInput.value.trim();
    if (!name) {
        showMessage(msg, "Name is required", false);
        return;
    }

    try {
        const user = await saveProfileName(name);
        currentUser = user;
        renderProfile(user);
        renderJoinedClubs(user.joinedClubs);
        showMessage(msg, "Profile updated", true);
    } catch (err) {
        showMessage(msg, err.message || "Update failed", false);
    }
});

refreshProfileBtn.addEventListener("click", async () => {
    hideMessage(msg);
    try {
        await refreshProfile();
        showMessage(msg, "Profile refreshed", true);
    } catch (e) {
        showMessage(msg, e.message || "Refresh failed", false);
    }
});

refreshResourcesBtn.addEventListener("click", async () => {
    hideMessage(msg);
    try {
        await refreshResources();
        showMessage(msg, "Resources refreshed", true);
    } catch (e) {
        showMessage(msg, e.message || "Refresh failed", false);
    }
});