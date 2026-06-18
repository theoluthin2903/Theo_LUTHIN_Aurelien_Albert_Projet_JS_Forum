const SERVER_URL = "http://localhost:3000";
let currentTopicId = null;

// --- UTILS ---
async function apiCall(url, method = 'GET', body = null) {
    const options = { method, credentials: 'include' };
    if (body) { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(body); }
    const res = await fetch(url, options);
    return await res.json();
}

function showView(viewId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
    if (viewId === 'view-home') { updateTagFilter(); renderTopics(); }
}

// --- THÈME ---
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const apply = (t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
        if (btn) btn.textContent = (t === 'dark') ? '☀️' : '🌙';
    };
    apply(localStorage.getItem('theme') || 'light');
    if (btn) btn.onclick = () => apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

// --- FT-10 : CATEGORIES DYNAMIQUES ---
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

// --- FT-4, 9, 10, 12 : RENDU LISTE ---
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
                    <p>Par <strong>${t.author_name || 'Anonyme'}</strong> • ${new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div class="topic-meta">
                    <span class="tag">${t.tags || 'Général'}</span>
                    <span class="state-badge ${t.state}">${t.state}</span>
                </div>
            </div>
        `).join('');
    }
}

// --- FT-4 & FT-6 : DETAIL TOPIC ---
async function viewTopicDetail(id) {
    const data = await apiCall(`${SERVER_URL}/api/topics/${id}`);
    if (!data.success) return;
    currentTopicId = id;
    const t = data.topic;
    const currentUserId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    const canDeleteTopic = (currentUserId == t.author_id || userRole === 'admin');

    document.getElementById('topic-detail-content').innerHTML = `
        <div class="topic-header-detail">
            <div>
                <h2>${t.title}</h2>
                <span class="tag">${t.tags ? t.tags.join(', ') : 'Général'}</span>
            </div>
            <span class="topic-state-label ${t.state}">${t.state}</span>
        </div>
        <div class="message main-post">
            <p>${t.body}</p>
            <div class="message-meta">
                Posté par <strong>${t.author_name}</strong> le ${new Date(t.created_at).toLocaleDateString()}
            </div>
        </div>
        <div class="topic-actions">
            ${canDeleteTopic ? `<button onclick="deleteTopic(${t.id})" class="btn-delete">Supprimer le sujet</button>` : ''}
        </div>
        <hr>
        <h3>Réponses</h3>
        <div id="messages-list"></div>
    `;
    renderMessages(id, t.author_id, t.state);
    showView('view-topic-detail');
}

// --- FT-5, 7, 8 : MESSAGES ---
async function renderMessages(topicId, topicAuthorId, topicState) {
    const data = await apiCall(`${SERVER_URL}/api/messages?topicId=${topicId}&limit=all`);
    const currentUserId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const list = document.getElementById('messages-list');

    if (data.success) {
        list.innerHTML = data.messages.length === 0 ? '<p>Aucune réponse pour le moment.</p>' : data.messages.map(m => {
            const isTopicOwner = currentUserId == topicAuthorId;
            const isMsgAuthor = currentUserId == m.author_id;
            const isAdmin = userRole === 'admin';

            return `
                <div class="message">
                    <p>${m.body}</p>               
                    <div class="message-meta">
                        Posté par <strong>${m.username}</strong> le ${new Date(m.created_at).toLocaleDateString()}
                        <div class="msg-actions">
                            <button onclick="vote(${m.id}, 'like')" class="btn-vote">👍 ${m.likes || 0}</button>
                            <button onclick="vote(${m.id}, 'dislike')" class="btn-vote">👎 ${m.dislikes || 0}</button>
                            ${(isMsgAuthor || isTopicOwner || isAdmin) ? `<button onclick="deleteMsg(${m.id})" class="btn-delete-message">🗑️</button>` : ''}
                            ${(isTopicOwner && !isMsgAuthor) ? `<button onclick="banUser(${m.author_id})" class="btn-delete-message">🚫 Ban</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Désactiver formulaire si fermé ou archivé
    const form = document.getElementById('add-message-form');
    if (form) form.classList.toggle('hidden', topicState !== 'ouvert');
}

// --- ACTIONS ---
async function vote(mId, type) { 
    await apiCall(`${SERVER_URL}/api/messages/vote`, 'POST', { messageId: mId, voteType: type });
    renderMessages(currentTopicId); 
}

async function deleteTopic(id) { 
    if(confirm("Supprimer définitivement ce sujet ?")) { 
        await apiCall(`${SERVER_URL}/api/topics/${id}`, 'DELETE'); 
        showView('view-home'); 
    } 
}

async function deleteMsg(id) { 
    if(confirm("Supprimer ce message ?")) { 
        await apiCall(`${SERVER_URL}/api/messages/${id}`, 'DELETE'); 
        viewTopicDetail(currentTopicId); 
    } 
}

async function banUser(uId) {
    if(confirm("Bannir cet utilisateur ? Ses messages seront masqués.")) {
        await apiCall(`${SERVER_URL}/api/admin/ban-user`, 'POST', { userId: uId });
        viewTopicDetail(currentTopicId);
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    const user = localStorage.getItem('username');
    if (!user) { window.location.href = '/'; return; }
    document.getElementById('user-welcome').textContent = `Salut, ${user}`;

    document.getElementById('btn-logout').onclick = async () => {
        await apiCall(`${SERVER_URL}/api/auth/logout`, 'POST');
        localStorage.clear(); window.location.href = '/';
    };

    document.getElementById('create-topic-form').onsubmit = async (e) => {
        e.preventDefault();
        const res = await apiCall(`${SERVER_URL}/api/topics`, 'POST', {
            title: document.getElementById('topic-title').value,
            body: document.getElementById('topic-body').value,
            tags: document.getElementById('topic-tags').value.split(',').map(t => t.trim())
        });
        if (res.success) { e.target.reset(); showView('view-home'); }
    };

    document.getElementById('add-message-form').onsubmit = async (e) => {
        e.preventDefault();
        const res = await apiCall(`${SERVER_URL}/api/messages`, 'POST', { topicId: currentTopicId, body: document.getElementById('msg-body').value });
        if (res.success) { document.getElementById('msg-body').value = ''; viewTopicDetail(currentTopicId); }
    };

    document.getElementById('btn-create-topic-nav').onclick = () => showView('view-create-topic');
    document.querySelectorAll('.btn-cancel').forEach(b => b.onclick = () => showView('view-home'));
    ['search-input', 'filter-tag', 'sort-order', 'page-size'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = el.onchange = renderTopics;
    });

    renderTopics();
});