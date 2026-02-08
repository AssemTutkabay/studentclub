// public/index.js
import { apiFetch, getToken, logout, showMessage, hideMessage } from "/app.js";

const msg = document.getElementById("msg");
const authActions = document.getElementById("authActions");

const clubsGrid = document.getElementById("clubsGrid");
const clubsEmpty = document.getElementById("clubsEmpty");

const updatesHint = document.getElementById("updatesHint");
const updatesList = document.getElementById("updatesList");
const updatesEmpty = document.getElementById("updatesEmpty");
const refreshUpdatesBtn = document.getElementById("refreshUpdatesBtn");

// ===== UI helpers =====
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

    // Left side nav buttons
    const dash = document.createElement("a");
    dash.href = "/dashboard.html";
    dash.style.textDecoration = "none";
    dash.innerHTML = `<button class="secondary" type="button">Dashboard</button>`;
    authActions.appendChild(dash);

    if (!token) {
        authActions.insertAdjacentHTML(
            "beforeend",
            `
        <a href="/register.html" style="text-decoration:none;">
          <button class="secondary" type="button">Register</button>
        </a>
        <a href="/login.html" style="text-decoration:none;">
          <button class="secondary" type="button">Login</button>
        </a>
      `
        );
        return;
    }

    const btn = document.createElement("button");
    btn.className = "danger";
    btn.type = "button";
    btn.textContent = "Logout";
    btn.addEventListener("click", logout);
    authActions.appendChild(btn);
}

// ===== Clubs =====
function renderClubs(clubs) {
    clubsGrid.innerHTML = "";
    clubsEmpty.style.display = (!clubs || clubs.length === 0) ? "block" : "none";
    if (!clubs || clubs.length === 0) return;

    // красиво: на широком экране 3 колонки
    clubsGrid.classList.add("grid-3");

    for (const c of clubs) {
        const card = document.createElement("div");

        // FIX: используем твой "дорогой" стиль, а не .club
        card.className = "clubCard";

        card.innerHTML = `
      <div class="cover" aria-hidden="true"></div>
      <div class="content">
        <div class="title">${escapeHtml(c.title)}</div>
        <div class="desc">${escapeHtml(c.description || "")}</div>
        <div class="meta"><span>slug: <b>${escapeHtml(c.slug)}</b></span></div>
        <div class="actions" style="margin-top:10px;">
          <a href="/club.html?slug=${encodeURIComponent(c.slug)}" style="text-decoration:none;">
            <button type="button">Open</button>
          </a>
        </div>
      </div>
    `;

        clubsGrid.appendChild(card);
    }
}

async function loadClubs() {
    const data = await apiFetch("/api/clubs", { method: "GET" });
    renderClubs(data.clubs || []);
}

// ===== Updates =====
function renderUpdates(list) {
    updatesList.innerHTML = "";

    if (!list || list.length === 0) {
        updatesEmpty.style.display = "block";
        return;
    }
    updatesEmpty.style.display = "none";

    for (const r of list) {
        const div = document.createElement("div");

        // updates оставляем как простой блок (он уже норм)
        div.className = "item";

        div.innerHTML = `
      <div class="title">${escapeHtml(r.title)}</div>
      <div class="meta">
        <span>club: <b>${escapeHtml(r.clubSlug)}</b></span>
        <span>type: <b>${escapeHtml(r.type)}</b></span>
        <span>${escapeHtml(new Date(r.createdAt).toLocaleString())}</span>
      </div>
      ${
            r.type === "event"
                ? `<div class="small">date: ${escapeHtml(r.date || "-")} | location: ${escapeHtml(r.location || "-")}</div>`
                : ""
        }
      <div class="desc">${escapeHtml(r.description || "")}</div>
      <div class="actions" style="margin-top:10px;">
        <a href="/club.html?slug=${encodeURIComponent(r.clubSlug)}" style="text-decoration:none;">
          <button class="secondary" type="button">Open club</button>
        </a>
      </div>
    `;

        updatesList.appendChild(div);
    }
}

async function loadMyLatestUpdates() {
    const token = getToken();

    if (!token) {
        updatesHint.style.display = "block";
        updatesEmpty.style.display = "none";
        updatesList.innerHTML = "";
        return;
    }

    updatesHint.style.display = "none";

    const data = await apiFetch("/api/resource", { method: "GET" });
    const resources = data.resources || [];

    resources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const top = resources.slice(0, 6);

    renderUpdates(top);
}

// ===== Init =====
setAuthButtons();

try {
    await loadClubs();
} catch (e) {
    showMessage(msg, e.message || "Failed to load clubs", false);
}

try {
    await loadMyLatestUpdates();
} catch (e) {
    updatesHint.style.display = "block";
    updatesHint.textContent = "Login to see your latest updates.";
    updatesList.innerHTML = "";
    updatesEmpty.style.display = "none";
}

refreshUpdatesBtn.addEventListener("click", async () => {
    hideMessage(msg);
    try {
        await loadMyLatestUpdates();
        showMessage(msg, "Updated", true);
    } catch (e) {
        showMessage(msg, e.message || "Failed to load updates", false);
    }
});