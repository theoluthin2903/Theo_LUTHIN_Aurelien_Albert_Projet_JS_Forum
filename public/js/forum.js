// ==========================================
// 1. FONCTIONS GLOBALES ET UTILITAIRES
// ==========================================

function showView(viewId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    if (viewId === 'view-home') {
        updateTagFilter();
        renderTopics();
    }
    if (viewId === 'view-admin') renderAdmin();
}

let currentTopicId = null;

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function getBans() {
    return JSON.parse(localStorage.getItem('bans') || "{}");
}

function saveBans(bans) {
    localStorage.setItem('bans', JSON.stringify(bans));
}

function getStoredTopics() {
    return (JSON.parse(localStorage.getItem('topics') || "[]") || []).map(topic => ({
        state: topic.state || 'ouvert',
        messages: Array.isArray(topic.messages) ? topic.messages : [],
        likes: topic.likes || 0,
        dislikes: topic.dislikes || 0,
        userVotes: topic.userVotes || {}, 
        ...topic
    }));
}

function saveTopics(topics) {
    localStorage.setItem('topics', JSON.stringify(topics));
}

// Filtrer les topics visibles (exclure ceux des auteurs qui nous ont banni)
function getVisibleTopics() {
    const currentUser = getCurrentUser();
    const allTopics = getStoredTopics().filter(t => !t.fake && t.title && t.author);
    const bans = getBans();

    if (!currentUser) return allTopics;

    return allTopics.filter(t => {
        const authorBans = bans[t.author] || [];
        return !authorBans.includes(currentUser.username);
    });
}

// --- FONCTION : BANNISEMENT ---
function banUser(targetUsername) {
    const currentUser = getCurrentUser();
    if (!currentUser || targetUsername === currentUser.username) return;

    if (confirm(`Bannir ${targetUsername} ? Ses messages sur vos sujets seront supprimés.`)) {
        const bans = getBans();
        if (!bans[currentUser.username]) bans[currentUser.username] = [];
        if (!bans[currentUser.username].includes(targetUsername)) {
            bans[currentUser.username].push(targetUsername);
            saveBans(bans);
        }

        const topics = getStoredTopics();
        topics.forEach(topic => {
            if (topic.author === currentUser.username) {
                topic.messages = topic.messages.filter(m => m.author !== targetUsername);
            }
        });

        saveTopics(topics);
        showToast(`${targetUsername} banni.`);
        renderTopics();
        if (currentTopicId) viewTopicDetail(currentTopicId);
    }
}

// --- FONCTION : CATÉGORIES DYNAMIQUES ---
function updateTagFilter() {
    const select = document.getElementById('filter-tag');
    if (!select) return;
    const currentSelection = select.value;
    const topics = getVisibleTopics();
    
    let allTags = [];
    topics.forEach(t => {
        if (t.tag) {
            const splitTags = t.tag.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
            allTags.push(...splitTags);
        }
    });

    const uniqueTags = [...new Set(allTags)];
    select.innerHTML = '<option value="">Toutes les catégories</option>';
    uniqueTags.sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        select.appendChild(option);
    });
    if (uniqueTags.includes(currentSelection)) select.value = currentSelection;
}

// --- RENDU DE LA LISTE (AVEC PAGINATION CORRIGÉE) ---
window.renderTopics = function() {
    let topics = getVisibleTopics();
    const query = document.getElementById('search-input').value.toLowerCase();
    const tagFilter = document.getElementById('filter-tag').value;
    const sort = document.getElementById('sort-order').value;
    const pageSize = document.getElementById('page-size').value; // RECUPERATION PAGINATION

    // 1. Filtre Recherche & Tags
    topics = topics.filter(t => t.title.toLowerCase().includes(query) || (t.tag && t.tag.toLowerCase().includes(query)));
    
    // 2. Filtre Catégorie exacte
    if (tagFilter) {
        topics = topics.filter(t => t.tag && t.tag.split(',').map(s => s.trim()).includes(tagFilter));
    }
    
    // 3. Tri
    if (sort === 'newest') topics.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sort === 'popular') topics.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));

    // 4. PAGINATION (Le "Slice")
    if (pageSize !== 'all') {
        topics = topics.slice(0, parseInt(pageSize));
    }

    const list = document.getElementById('topics-list');
    list.innerHTML = topics.map(t => `
        <div class="topic-item" onclick="viewTopicDetail(${t.id})">
            <div class="topic-info">
                <h3>${t.title}</h3>
                <p>Par ${t.author} • ${new Date(t.date).toLocaleDateString()}</p>
            </div>
            <div class="topic-meta">
                <span class="tag">${t.tag || 'Général'}</span>
                <span class="state-badge ${t.state}">${t.state}</span>
                <span>👍 ${t.likes}</span>
                <span>👎 ${t.dislikes}</span>
            </div>
        </div>
    `).join('');
};

function viewTopicDetail(id) {
    const topics = getVisibleTopics();
    const topic = topics.find(t => t.id === id);
    const currentUser = getCurrentUser();

    if (!topic) {
        showView('view-home');
        return;
    }

    currentTopicId = id;
    const isOwner = currentUser && topic.author === currentUser.username;
    const isAdmin = currentUser && currentUser.role === 'admin';

    const detailZone = document.getElementById('topic-detail-content');
    detailZone.innerHTML = `
        <div class="topic-header-detail">
            <div>
                <h2>${topic.title}</h2>
                <span class="tag">${topic.tag}</span>
            </div>
            <span class="topic-state-label ${topic.state}">${topic.state}</span>
        </div>
        <div class="message main-post">
            <p>${topic.body}</p>
            <div class="message-meta">Posté par <strong>${topic.author}</strong> le ${new Date(topic.date).toLocaleDateString()}</div>
        </div>
        <div class="votes">
            <button onclick="handleVote(${topic.id}, 'like')" class="btn-vote">👍 Like (${topic.likes})</button>
            <button onclick="handleVote(${topic.id}, 'dislike')" class="btn-vote">👎 Dislike (${topic.dislikes})</button>
            ${isOwner ? `<button onclick="editTopic(${topic.id})" class="btn-accent">✏️ Modifier</button>` : ''}
            ${(isOwner || isAdmin) ? `<button onclick="deleteTopic(${topic.id})" class="btn-delete">Supprimer</button>` : ''}
        </div>
        ${isOwner ? `
            <div class="topic-state-actions">
                <button onclick="setTopicState(${topic.id}, 'ouvert')" class="btn-accent">Ouvrir</button>
                <button onclick="setTopicState(${topic.id}, 'ferme')" class="btn-accent">Fermer</button>
                <button onclick="setTopicState(${topic.id}, 'archivé')" class="btn-delete">Archiver</button>
            </div>
        ` : ''}
        <h3>Réponses</h3>
        <div id="messages-list"></div>
    `;
    showView('view-topic-detail');
    renderMessages(topic);
}

function renderMessages(topic) {
    const list = document.getElementById('messages-list');
    const currentUser = getCurrentUser();
    
    list.innerHTML = (topic.messages.length === 0) 
        ? '<p>Aucune réponse.</p>' 
        : topic.messages.map((m, i) => {
            const isOwner = currentUser && topic.author === currentUser.username;
            const isMsgAuthor = currentUser && m.author === currentUser.username;
            const isAdmin = currentUser && currentUser.role === 'admin';
            const deleteBtn = (isMsgAuthor || isOwner || isAdmin) ? `<button onclick="deleteMessage(${i})" class="btn-delete-message">🗑️</button>` : '';
            const banBtn = (isOwner && !isMsgAuthor) ? `<button onclick="banUser('${m.author}')" class="btn-delete-message">🚫 Ban</button>` : '';

            return `
                <div class="message">
                    <p>${m.body}</p>               
                    <div class="message-meta">
                        Posté par <strong>${m.author}</strong> le ${new Date(m.date).toLocaleDateString()}
                        <div class="msg-actions">${banBtn} ${deleteBtn}</div>
                    </div>
                </div>
            `;
        }).join('');

    const isClosed = topic.state !== 'ouvert';
    document.getElementById('msg-body').disabled = isClosed;
    document.querySelector('#add-message-form button').disabled = isClosed;
}

function handleVote(topicId, type) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const topics = getStoredTopics();
    const t = topics.find(topic => topic.id === topicId);
    if (!t) return;
    if (!t.userVotes) t.userVotes = {};
    const oldVote = t.userVotes[currentUser.username];
    if (oldVote === type) {
        delete t.userVotes[currentUser.username];
        type === 'like' ? t.likes-- : t.dislikes--;
    } else {
        if (oldVote === 'like') t.likes--;
        if (oldVote === 'dislike') t.dislikes--;
        t.userVotes[currentUser.username] = type;
        type === 'like' ? t.likes++ : t.dislikes++;
    }
    saveTopics(topics);
    viewTopicDetail(topicId);
}

function deleteTopic(id) {
    if (confirm("Supprimer ?")) {
        saveTopics(getStoredTopics().filter(t => t.id !== id));
        showView('view-home');
    }
}

function deleteMessage(index) {
    const topics = getStoredTopics();
    const t = topics.find(topic => topic.id === currentTopicId);
    t.messages.splice(index, 1);
    saveTopics(topics);
    renderMessages(t);
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setTopicState(id, state) {
    const topics = getStoredTopics();
    const idx = topics.findIndex(t => t.id === id);
    topics[idx].state = state;
    saveTopics(topics);
    viewTopicDetail(id);
}

function editTopic(id) {
    const t = getVisibleTopics().find(topic => topic.id === id);
    document.getElementById('edit-topic-title').value = t.title;
    document.getElementById('edit-topic-body').value = t.body;
    document.getElementById('edit-topic-tags').value = t.tag;
    document.getElementById('edit-topic-form').dataset.topicId = id;
    showView('view-edit-topic');
}

// ==========================================
// 2. INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) return window.location.href = 'index.html';
    
    document.getElementById('user-welcome').textContent = `Salut, ${user.username}`;
    if (user.role === 'admin') document.getElementById('btn-admin-dashboard').classList.remove('hidden');

    document.getElementById('btn-logout').onclick = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };
    document.getElementById('btn-create-topic-nav').onclick = () => showView('view-create-topic');
    document.getElementById('btn-admin-dashboard').onclick = () => showView('view-admin');
    document.querySelectorAll('.btn-cancel').forEach(b => b.onclick = () => showView('view-home'));
    
    // Listeners pour filtres et PAGINATION
    ['search-input', 'filter-tag', 'sort-order', 'page-size'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.oninput = () => renderTopics();
            el.onchange = () => renderTopics();
        }
    });

    document.getElementById('create-topic-form').onsubmit = (e) => {
        e.preventDefault();
        const topics = getStoredTopics();
        topics.push({
            id: Date.now(),
            title: document.getElementById('topic-title').value,
            body: document.getElementById('topic-body').value,
            tag: document.getElementById('topic-tags').value.trim() || "général",
            author: user.username,
            date: new Date().toISOString(),
            state: "ouvert",
            messages: [],
            likes: 0, dislikes: 0, userVotes: {}
        });
        saveTopics(topics);
        e.target.reset();
        showView('view-home');
    };

    document.getElementById('add-message-form').onsubmit = (e) => {
        e.preventDefault();
        const val = document.getElementById('msg-body').value.trim();
        if (!val) return;
        const topics = getStoredTopics();
        const t = topics.find(topic => topic.id === currentTopicId);
        t.messages.push({ author: user.username, body: val, date: new Date().toISOString() });
        saveTopics(topics);
        document.getElementById('msg-body').value = '';
        renderMessages(t);
    };

    document.getElementById('theme-toggle').onclick = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    updateTagFilter();
    renderTopics();
});