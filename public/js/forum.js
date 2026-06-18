const SERVER_URL = "http://localhost:3000";
let currentTopicId = null;

// Helper API
async function apiCall(url, method = 'GET', body = null) {
    const options = { method, credentials: 'include' };
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }
    try {
        const res = await fetch(url, options);
        return await res.json();
    } catch (err) { return { success: false, message: "Erreur réseau" }; }
}

function showView(viewId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
    if (viewId === 'view-home') { updateTagFilter(); renderTopics(); }
}

// --- GESTION DU THÈME (Même logique que l'auth) ---
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const apply = (t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
        if (btn) btn.textContent = (t === 'dark') ? '☀️' : '🌙';
    };
    apply(localStorage.getItem('theme') || 'light');
    if (btn) {
        btn.onclick = () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            apply(next);
        };
    }
}

// --- CATEGORIES DYNAMIQUES ---
async function updateTagFilter() {
    const select = document.getElementById('filter-tag');
    if (!select) return;
    const data = await apiCall(`${SERVER_URL}/api/topics?limit=all`);
    if (data.success) {
        const currentSelection = select.value;
        let allTags = [];
        data.topics.forEach(t => { if(t.tags) allTags.push(...t.tags.split(',').map(tag => tag.trim())); });
        const uniqueTags = [...new Set(allTags)].filter(t => t !== "");
        select.innerHTML = '<option value="">Toutes les catégories</option>';
        uniqueTags.sort().forEach(tag => {
            const opt = document.createElement('option');
            opt.value = tag; opt.textContent = tag; select.appendChild(opt);
        });
        select.value = currentSelection;
    }
}

// --- RENDU LISTE TOPICS ---
async function renderTopics() {
    const search = document.getElementById('search-input').value;
    const sort = document.getElementById('sort-order').value;
    const limit = document.getElementById('page-size').value;
    const tag = document.getElementById('filter-tag').value;

    const data = await apiCall(`${SERVER_URL}/api/topics?search=${search}&sort=${sort}&limit=${limit}&tag=${tag}`);
    if (data.success) {
        const list = document.getElementById('topics-list');
        list.innerHTML = data.topics.map(t => `
            <div class="topic-item" onclick="viewTopicDetail(${t.id})">
                <div class="topic-info">
                    <h3>${t.title}</h3>
                    <p>Par <strong>${t.author_name}</strong> • ${new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div class="topic-meta">
                    <span class="tag">${t.tags || 'Général'}</span>
                    <span class="state-badge ${t.state}">${t.state}</span>
                </div>
            </div>
        `).join('');
    }
}

// --- DETAIL TOPIC ---
async function viewTopicDetail(id) {
    const data = await apiCall(`${SERVER_URL}/api/topics/${id}`);
    if (!data.success) return;
    currentTopicId = id;
    const t = data.topic;
    const uid = localStorage.getItem('userId');

    document.getElementById('topic-detail-content').innerHTML = `
        <div class="topic-header-detail">
            <div>
                <h2>${t.title} <span class="state-badge ${t.state}">${t.state}</span></h2>
                <span class="tag">${t.tags ? t.tags.join(', ') : 'Général'}</span>
            </div>
            ${uid == t.author_id ? `
                <div class="owner-controls">
                    <button onclick="updateTopicState('ouvert')" class="btn-accent">Ouvrir</button>
                    <button onclick="updateTopicState('ferme')" class="btn-cancel">Fermer</button>
                    <button onclick="updateTopicState('archive')" class="btn-delete">Archiver</button>
                    <button onclick="setupEdit()" class="btn-accent">✏️ Modifier</button>
                    <button onclick="deleteTopic(${t.id})" class="btn-delete">🗑️ Supprimer</button>
                </div>
            ` : ''}
        </div>
        <div class="message main-post">
            <p>${t.body}</p>
            <div class="message-meta">Posté par <strong>${t.author_name}</strong> le ${new Date(t.created_at).toLocaleDateString()}</div>
        </div>
        <hr>
        <div class="msg-header">
            <h3>Réponses</h3>
            <div class="msg-filters">
                <select id="msg-sort" onchange="renderMessages(${id}, '${t.state}')">
                    <option value="recent">Plus récent</option>
                    <option value="oldest">Plus ancien</option>
                    <option value="popular">Plus populaire</option>
                </select>
                <select id="msg-limit" onchange="renderMessages(${id}, '${t.state}')">
                    <option value="10">10</option><option value="20">20</option><option value="30">30</option><option value="all">Tout</option>
                </select>
            </div>
        </div>
        <div id="messages-list"></div>
    `;
    renderMessages(id, t.state);
    showView('view-topic-detail');
}

async function renderMessages(topicId, topicState) {
    const sort = document.getElementById('msg-sort').value;
    const limit = document.getElementById('msg-limit').value;
    const data = await apiCall(`${SERVER_URL}/api/messages?topicId=${topicId}&sort=${sort}&limit=${limit}`);
    const list = document.getElementById('messages-list');
    const uid = localStorage.getItem('userId');

    if (data.success) {
        list.innerHTML = data.messages.length === 0 ? '<p>Aucune réponse.</p>' : data.messages.map(m => `
            <div class="message">
                <p>${m.body}</p>               
                <div class="message-meta">
                    Posté par <strong>${m.username}</strong> le ${new Date(m.created_at).toLocaleDateString()}
                    <div class="msg-actions">
                        <button onclick="vote(${m.id}, 'like')" class="btn-vote">👍 ${m.likes || 0}</button>
                        <button onclick="vote(${m.id}, 'dislike')" class="btn-vote">👎 ${m.dislikes || 0}</button>
                        ${uid == m.author_id ? `<button onclick="deleteMsg(${m.id})" class="btn-delete-message">🗑️</button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    const form = document.getElementById('add-message-form');
    if(form) form.style.display = (topicState === 'ouvert') ? 'block' : 'none';
}

// --- ACTIONS ---
async function updateTopicState(s) { await apiCall(`${SERVER_URL}/api/topics/${currentTopicId}`, 'PUT', { state: s }); viewTopicDetail(currentTopicId); }

async function setupEdit() {
    const data = await apiCall(`${SERVER_URL}/api/topics/${currentTopicId}`);
    const t = data.topic;
    document.getElementById('edit-topic-title').value = t.title;
    document.getElementById('edit-topic-body').value = t.body;
    document.getElementById('edit-topic-tags').value = t.tags ? t.tags.join(',') : '';
    showView('view-edit-topic');
}

async function vote(mId, type) { 
    await apiCall(`${SERVER_URL}/api/messages/vote`, 'POST', { messageId: mId, voteType: type });
    const res = await apiCall(`${SERVER_URL}/api/topics/${currentTopicId}`);
    renderMessages(currentTopicId, res.topic.state);
}

async function deleteTopic(id) { if(confirm("Supprimer ?")) { await apiCall(`${SERVER_URL}/api/topics/${id}`, 'DELETE'); showView('view-home'); } }
async function deleteMsg(id) { if(confirm("Supprimer ?")) { await apiCall(`${SERVER_URL}/api/messages/${id}`, 'DELETE'); const res = await apiCall(`${SERVER_URL}/api/topics/${currentTopicId}`); renderMessages(currentTopicId, res.topic.state); } }

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme(); // Charge le thème et l'applique
    updateTagFilter();

    const user = localStorage.getItem('username');
    if (!user) { window.location.href = '/'; return; }
    document.getElementById('user-welcome').textContent = `Salut, ${user}`;

    // DÉCONNEXION (MODIFIÉE POUR GARDER LE THÈME)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.onclick = async () => {
            await apiCall(`${SERVER_URL}/api/auth/logout`, 'POST');
            // On ne fait pas localStorage.clear() !
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
            window.location.href = '/';
        };
    }

    document.getElementById('create-topic-form').onsubmit = async (e) => {
        e.preventDefault();
        const res = await apiCall(`${SERVER_URL}/api/topics`, 'POST', {
            title: document.getElementById('topic-title').value,
            body: document.getElementById('topic-body').value,
            tags: document.getElementById('topic-tags').value.split(',').map(t => t.trim())
        });
        if (res.success) { e.target.reset(); updateTagFilter(); showView('view-home'); }
    };

    document.getElementById('edit-topic-form').onsubmit = async (e) => {
        e.preventDefault();
        await apiCall(`${SERVER_URL}/api/topics/${currentTopicId}`, 'PUT', {
            title: document.getElementById('edit-topic-title').value,
            body: document.getElementById('edit-topic-body').value,
            tags: document.getElementById('edit-topic-tags').value.split(',').map(t => t.trim())
        });
        viewTopicDetail(currentTopicId);
    };

    document.getElementById('add-message-form').onsubmit = async (e) => {
        e.preventDefault();
        await apiCall(`${SERVER_URL}/api/messages`, 'POST', { topicId: currentTopicId, body: document.getElementById('msg-body').value });
        document.getElementById('msg-body').value = '';
        const res = await apiCall(`${SERVER_URL}/api/topics/${currentTopicId}`);
        renderMessages(currentTopicId, res.topic.state);
    };

    document.getElementById('btn-create-topic-nav').onclick = () => showView('view-create-topic');
    document.querySelectorAll('.btn-cancel').forEach(b => b.onclick = () => showView('view-home'));
    
    ['search-input', 'page-size', 'filter-tag', 'sort-order'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onchange = el.oninput = renderTopics;
    });

    renderTopics();
});