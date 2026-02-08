
import { apiFetch, getToken, logout, showMessage, hideMessage, clearToken } from "/app.js";

// ===== Elements =====
const msg = document.getElementById("msg");
const authActions = document.getElementById("authActions");

const heroTitle = document.getElementById("clubTitle");
const heroDesc = document.getElementById("clubDesc");
const heroMeta = document.getElementById("clubMeta");

const joinCard = document.getElementById("joinCard");
let joinBtn = document.getElementById("joinBtn");

const createCard = document.getElementById("createCard");

const myResourcesCard = document.getElementById("myResources");
const myResourcesListEl = document.getElementById("myResourcesList");
const myResourcesEmptyEl = document.getElementById("myResourcesEmpty");

const clubFeedCard = document.getElementById("clubFeed");
const clubFeedListEl = document.getElementById("clubFeedList");
const clubFeedEmptyEl = document.getElementById("clubFeedEmpty");

const resourceForm = document.getElementById("resourceForm");
const typeEl = document.getElementById("type");
const eventFields = document.getElementById("eventFields");
const refreshBtn = document.getElementById("refreshBtn");

// ===== State =====
let currentUser = null;
let currentUserId = null;
let isJoined = false;

// ===== Helpers =====
function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("slug");
}

function setAuthButtons() {
    const token = getToken();
    authActions.innerHTML = "";

    if (!token) {
        authActions.innerHTML = `
      <a href="/register.html"><button class="secondary" type="button">Register</button></a>
      <a href="/login.html"><button class="secondary" type="button">Login</button></a>
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

function escapeHtml(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function updateEventFieldsVisibility() {
    const t = typeEl.value;
    eventFields.style.display = t === "event" ? "flex" : "none";
}

function replaceJoinBtn() {
    const newBtn = joinBtn.cloneNode(true);
    joinBtn.parentNode.replaceChild(newBtn, joinBtn);
    joinBtn = newBtn;
    return joinBtn;
}

// datetime-local -> ISO string (или null)
function toIsoFromDatetimeLocal(value) {
    const v = String(value || "").trim();
    if (!v) return null;
    const d = new Date(v); // datetime-local -> local time
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

// ===== UI states =====
function showLoggedOutState() {
    createCard.style.display = "none";
    myResourcesCard.style.display = "none";
    clubFeedCard.style.display = "none"; // FIX: feed private, logged-out не показываем

    joinCard.style.display = "block";
    joinBtn.textContent = "Login to join";

    const btn = replaceJoinBtn();
    btn.addEventListener("click", () => (window.location.href = "/login.html"));
}

function showJoinedState() {
    joinCard.style.display = "none";
    createCard.style.display = "block";
    myResourcesCard.style.display = "block";
    clubFeedCard.style.display = "block"; // feed показываем только joined
}

function showNotJoinedState(onJoin) {
    createCard.style.display = "none";
    myResourcesCard.style.display = "none";
    clubFeedCard.style.display = "none"; // FIX: feed private + joined-only

    joinCard.style.display = "block";
    joinBtn.textContent = "Join";

    const btn = replaceJoinBtn();
    btn.addEventListener("click", onJoin);
}

// ===== API calls =====
async function loadClub(slug) {
    const data = await apiFetch(`/api/clubs/${slug}`, { method: "GET" });
    const club = data.club;

    document.body.dataset.club = club.slug;

    document.title = `${club.title} | Student Clubs`;
    heroTitle.textContent = club.title;
    heroDesc.textContent = club.description || "";

    heroMeta.innerHTML = `
    <span class="badge accent">${escapeHtml(club.slug)}</span>
    <span class="badge">Student club</span>
  `;

    return club;
}

async function loadProfileIfLogged() {
    const token = getToken();
    if (!token) return { state: "no_token", user: null };

    try {
        const data = await apiFetch("/api/users/profile", { method: "GET" });
        return { state: "ok", user: data.user };
    } catch (_) {
        return { state: "invalid", user: null };
    }
}

async function joinClub(slug) {
    await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({ joinClubSlug: slug }),
    });
}

// CREATE (event/post)
async function createResource(slug) {
    const body = {
        clubSlug: slug,
        type: typeEl.value,
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
    };

    if (body.type === "event") {
        const dateLocal = document.getElementById("date").value;
        const iso = toIsoFromDatetimeLocal(dateLocal);
        if (iso) body.date = iso;

        body.location = document.getElementById("location").value;

        if (!body.date) {
            const err = new Error("Date is required for event");
            err.status = 400;
            throw err;
        }
        if (!String(body.location || "").trim() || String(body.location || "").trim().length < 2) {
            const err = new Error("Location must be at least 2 characters for event");
            err.status = 400;
            throw err;
        }
    }

    await apiFetch("/api/resource", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

async function loadMyResources(slug, currentUserId) {
    const data = await apiFetch("/api/resource", { method: "GET" });
    const mine = Array.isArray(data.resources) ? data.resources : [];

    const mineInThisClub = mine.filter((r) => {
        const sameClub = r.clubSlug === slug;
        const isMine = currentUserId ? String(r.owner) === String(currentUserId) : true;
        return sameClub && isMine;
    });

    renderMyResources(mineInThisClub, currentUserId);
}

async function loadClubFeed(slug) {
    const data = await apiFetch(`/api/resource/club/${slug}`, { method: "GET" });
    return Array.isArray(data.resources) ? data.resources : [];
}

// ===== Render =====
function renderMyResources(list, currentUserId) {
    myResourcesListEl.innerHTML = "";

    if (!list || list.length === 0) {
        myResourcesEmptyEl.style.display = "block";
        return;
    }

    myResourcesEmptyEl.style.display = "none";

    for (const r of list) {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
      <div class="title">${escapeHtml(r.title)}</div>
      <div class="meta">
        <span>type: <b>${escapeHtml(r.type)}</b></span>
        <span>id: <code>${escapeHtml(r._id)}</code></span>
      </div>
      <div class="desc">${escapeHtml(r.description || "")}</div>
      ${
            r.type === "event"
                ? `<div class="small">date: ${escapeHtml(r.date || "-")} | location: ${escapeHtml(r.location || "-")}</div>`
                : ""
        }
      <div class="actions" style="margin-top:10px;">
        <button class="secondary" data-action="edit" data-id="${escapeHtml(r._id)}" type="button">Edit</button>
        <button class="danger" data-action="delete" data-id="${escapeHtml(r._id)}" type="button">Delete</button>
      </div>
    `;

        div.addEventListener("click", async (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === "delete") {
                if (!confirm("Delete this resource?")) return;
                try {
                    await apiFetch(`/api/resource/${id}`, { method: "DELETE" });
                    showMessage(msg, "Deleted", true);
                    await initLoads();
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
                    const newDate = prompt("New date (ISO, example: 2026-02-10T10:00:00.000Z):", r.date || "");
                    if (newDate === null) return;
                    const newLoc = prompt("New location (min 2 chars):", r.location || "");
                    if (newLoc === null) return;

                    patch.date = String(newDate || "").trim();
                    patch.location = String(newLoc || "").trim();

                    if (!patch.date) {
                        showMessage(msg, "Date is required for event", false);
                        return;
                    }
                    if (!patch.location || patch.location.length < 2) {
                        showMessage(msg, "Location must be at least 2 characters", false);
                        return;
                    }
                }

                try {
                    await apiFetch(`/api/resource/${id}`, {
                        method: "PUT",
                        body: JSON.stringify(patch),
                    });
                    showMessage(msg, "Updated", true);
                    await initLoads();
                } catch (err) {
                    showMessage(msg, err.message || "Update failed", false);
                }
            }
        });

        myResourcesListEl.appendChild(div);
    }
}

function renderClubFeed(list, currentUserId) {
    clubFeedListEl.innerHTML = "";

    if (!list || list.length === 0) {
        clubFeedEmptyEl.style.display = "block";
        return;
    }

    clubFeedEmptyEl.style.display = "none";

    for (const r of list) {
        const isMine = currentUserId && String(r.owner) === String(currentUserId);

        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
      <div class="title">${escapeHtml(r.title)}</div>
      <div class="meta">
        <span>type: <b>${escapeHtml(r.type)}</b></span>
        <span>id: <code>${escapeHtml(r._id)}</code></span>
      </div>
      <div class="desc">${escapeHtml(r.description || "")}</div>
      ${
            r.type === "event"
                ? `<div class="small">date: ${escapeHtml(r.date || "-")} | location: ${escapeHtml(r.location || "-")}</div>`
                : ""
        }
      ${
            isMine
                ? `<div class="actions" style="margin-top:10px;">
              <button class="secondary" data-action="edit" data-id="${escapeHtml(r._id)}" type="button">Edit</button>
              <button class="danger" data-action="delete" data-id="${escapeHtml(r._id)}" type="button">Delete</button>
            </div>`
                : ""
        }
    `;

        div.addEventListener("click", async (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            if (!isMine) return;

            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === "delete") {
                if (!confirm("Delete this resource?")) return;
                try {
                    await apiFetch(`/api/resource/${id}`, { method: "DELETE" });
                    showMessage(msg, "Deleted", true);
                    await initLoads();
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
                    const newDate = prompt("New date (ISO, example: 2026-02-10T10:00:00.000Z):", r.date || "");
                    if (newDate === null) return;
                    const newLoc = prompt("New location (min 2 chars):", r.location || "");
                    if (newLoc === null) return;

                    patch.date = String(newDate || "").trim();
                    patch.location = String(newLoc || "").trim();

                    if (!patch.date) {
                        showMessage(msg, "Date is required for event", false);
                        return;
                    }
                    if (!patch.location || patch.location.length < 2) {
                        showMessage(msg, "Location must be at least 2 characters", false);
                        return;
                    }
                }

                try {
                    await apiFetch(`/api/resource/${id}`, {
                        method: "PUT",
                        body: JSON.stringify(patch),
                    });
                    showMessage(msg, "Updated", true);
                    await initLoads();
                } catch (err) {
                    showMessage(msg, err.message || "Update failed", false);
                }
            }
        });

        clubFeedListEl.appendChild(div);
    }
}

// ===== Init =====
setAuthButtons();

const currentSlug = getSlugFromUrl();
if (!currentSlug) {
    heroTitle.textContent = "Club not selected";
    heroDesc.textContent = "Open this page like: /club.html?slug=sports";
    heroMeta.textContent = "";
    joinCard.style.display = "none";
    createCard.style.display = "none";
    myResourcesCard.style.display = "none";
    clubFeedCard.style.display = "none";
    throw new Error("Missing slug");
}

// Public: load club
try {
    await loadClub(currentSlug);
} catch (err) {
    showMessage(msg, err.message || "Failed to load club", false);
    throw err;
}

// Profile -> state
const { state, user } = await loadProfileIfLogged();

if (state !== "ok" || !user) {
    if (state === "invalid") {
        try { clearToken(); } catch (_) {}
        setAuthButtons();
    }
    currentUser = null;
    currentUserId = null;
    isJoined = false;
    showLoggedOutState();
} else {
    currentUser = user;
    currentUserId = user._id || user.id || null;
    isJoined = Array.isArray(user.joinedClubs) && user.joinedClubs.includes(currentSlug);

    if (isJoined) {
        showJoinedState();
    } else {
        showNotJoinedState(async () => {
            hideMessage(msg);
            try {
                await joinClub(currentSlug);

                const prof = await apiFetch("/api/users/profile", { method: "GET" });
                currentUser = prof.user;
                currentUserId = prof.user._id || prof.user.id || null;
                isJoined = Array.isArray(prof.user.joinedClubs) && prof.user.joinedClubs.includes(currentSlug);

                showMessage(msg, "Joined successfully", true);

                if (isJoined) {
                    showJoinedState();
                    await initLoads();
                } else {
                    // на всякий случай
                    showNotJoinedState(() => {});
                }
            } catch (err) {
                showMessage(msg, err.message || "Join failed", false);
            }
        });
    }
}

// loaders for both sections
async function initLoads() {
    hideMessage(msg);

    // показываем/грузим секции только когда реально joined
    if (getToken() && isJoined) {
        try {
            await loadMyResources(currentSlug, currentUserId);
        } catch (err) {
            showMessage(msg, err.message || "Failed to load my resources", false);
        }

        try {
            const feed = await loadClubFeed(currentSlug);
            renderClubFeed(feed, currentUserId);
        } catch (err) {
            // если внезапно 403/401, скрываем (честнее, чем делать вид что пусто)
            clubFeedListEl.innerHTML = "";
            clubFeedEmptyEl.style.display = "block";
        }
    } else {
        myResourcesListEl.innerHTML = "";
        myResourcesEmptyEl.style.display = "none";
        clubFeedListEl.innerHTML = "";
        clubFeedEmptyEl.style.display = "none";
    }
}

// initial load of sections
await initLoads();

// form events
typeEl.addEventListener("change", updateEventFieldsVisibility);
updateEventFieldsVisibility();

resourceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(msg);

    try {
        await createResource(currentSlug);
        showMessage(msg, "Resource created", true);

        e.target.reset();
        updateEventFieldsVisibility();

        await initLoads();
    } catch (err) {
        showMessage(msg, err.message || "Create failed", false);
    }
});

refreshBtn.addEventListener("click", async () => {
    await initLoads();
});