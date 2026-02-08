// public/app.js

const TOKEN_KEY = "jwt_token";

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function showMessage(el, msg, ok = true) {
    if (!el) return;
    el.textContent = msg;
    el.className = "msg " + (ok ? "ok" : "bad");
    el.style.display = "block";
}

export function hideMessage(el) {
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
}

export async function apiFetch(path, options = {}) {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(path, { ...options, headers });

    // пытаемся вытащить json-ошибку от твоего errorHandler
    let data = null;
    try {
        data = await res.json();
    } catch (_) {}

    if (res.status === 401) {
        // токен нет/протух/невалиден
        clearToken();
        // если мы не на login/register, отправляем на логин
        const p = window.location.pathname;
        if (!p.endsWith("/login.html") && !p.endsWith("/register.html")) {
            window.location.href = "/login.html";
        }
    }

    if (!res.ok) {
        const message = (data && data.message) ? data.message : `HTTP ${res.status}`;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = "/login.html";
        return false;
    }

    // мягкая проверка, что токен реально работает
    try {
        await apiFetch("/api/users/profile", { method: "GET" });
        return true;
    } catch (e) {
        // apiFetch сам редиректнет на login при 401
        return false;
    }
}

export function logout() {
    clearToken();
    window.location.href = "/login.html";
}