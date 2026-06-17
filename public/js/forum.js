const SERVER_URL = "http://localhost:3000";
let currentTopicId = null;

async function apiFetch(url, options = {}) {
    options.credentials = 'include';
    if (options.body && !options.headers) options.headers = { 'Content-Type': 'application/json' };
    try {
        const res = await fetch(url, options);
        return await res.json();
    } catch (err) { return { success: false, message: "Erreur serveur" }; }
}

function showView(viewId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
    if (viewId === 'view-home') renderTopics();
}

// --- THÈME ---
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
        if (themeToggle) themeToggle.textContent = (t === 'dark') ? '☀️' : '🌙';
    };
    applyTheme(localStorage.getItem('theme') || 'light');
    if (themeToggle) themeToggle.onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

// --- LOGIQUE FORUM ---
async function renderTopics() {
    const query = document.getElementById('search-input').value;
    const data = await apiFetch(`${SERVER_URL}/api/topics?search=${query}`);
    if (data.success) {
        document.getElementById('topics-list').innerHTML = data.topics.map(t => `
            <div class="topic-item" onclick="viewTopicDetail(${t.id})">
                <h3>${t.title}</h3>
                <p>État : ${t.state}</p>
            </div>
        `).join('');
    }
}

async function viewTopicDetail(id) {
    const data = await apiFetch(`${SERVER_URL}/api/topics/${id}`);
    if (!data.success) return;
    currentTopicId = id;
    const t = data.topic;
    document.getElementById('topic-detail-content').innerHTML = `
        <h2>${t.title}</h2>
        <div class="message main-post"><p>${t.body}</p></div>
        <h3>Réponses</h3>
        <div id="messages-list"></div>
    `;
    renderMessages(t.id);
    showView('view-topic-detail');
}

async function renderMessages(topicId) {
    const data = await apiFetch(`${SERVER_URL}/api/messages?topicId=${topicId}`);
    if (data.success) {
        document.getElementById('messages-list').innerHTML = data.messages.map(m => `
            <div class="message"><p>${m.body}</p><strong>Par ${m.username}</strong></div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    const user = localStorage.getItem('username');
    if (!user) { window.location.href = '/'; return; }
    document.getElementById('user-welcome').textContent = `Salut, ${user}`;

    document.getElementById('btn-logout').onclick = async () => {
        await apiFetch(`${SERVER_URL}/api/auth/logout`, { method: 'POST' });
        localStorage.clear();
        window.location.href = '/';
    };

    renderTopics();
});