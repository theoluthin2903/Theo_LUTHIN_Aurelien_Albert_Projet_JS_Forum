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

// Filtrer les topics : on cache les sujets des gens qui nous ont banni
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

// --- FONCTION : BANNISEMENT + SUPPRESSION DES MESSAGES ---
function banUser(targetUsername) {
    const currentUser = getCurrentUser();
    if (!currentUser || targetUsername === currentUser.username) return;

    const confirmMsg = `Bannir ${targetUsername} ?\n\nSes messages sur TOUS vos sujets seront supprimés et il ne pourra plus consulter votre contenu.`;
    
    if (confirm(confirmMsg)) {
        // 1. Ajouter à la liste noire
        const bans = getBans();
        if (!bans[currentUser.username]) bans[currentUser.username] = [];
        if (!bans[currentUser.username].includes(targetUsername)) {
            bans[currentUser.username].push(targetUsername);
            saveBans(bans);
        }

        // 2. Supprimer TOUS les messages de cet utilisateur sur les topics du propriétaire
        const topics = getStoredTopics();
        let countDeleted = 0;

        topics.forEach(topic => {
            if (topic.author === currentUser.username) {
                const initialCount = topic.messages.length;
                // On garde seulement les messages qui ne sont pas de l'utilisateur banni
                topic.messages = topic.messages.filter(m => m.author !== targetUsername);
                countDeleted += (initialCount - topic.messages.length);
            }
        });

        saveTopics(topics);
        showToast(`${targetUsername} banni. ${countDeleted} message(s) supprimé(s).`);
        
        // 3. Rafraîchir l'affichage
        if (currentTopicId) {
            const currentTopic = topics.find(t => t.id === currentTopicId);
            if (currentTopic) renderMessages(currentTopic);
        }
        renderTopics();
    }
}

// --- FONCTION : FILTRE DYNAMIQUE PAR CATÉGORIE (SPLIT MULTI-TAGS) ---
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

function setTopicState(id, state) {
    const currentUser = getCurrentUser();
    const topics = getStoredTopics();
    const index = topics.findIndex(t => t.id === id);
    if (index === -1 || !currentUser) return;
    if (currentUser.role !== 'admin' && topics[index].author !== currentUser.username) return;

    topics[index].state = state;
    saveTopics(topics);
    viewTopicDetail(id);
}

function viewTopicDetail(id) {
    const topics = getVisibleTopics();
    const topic = topics.find(t => t.id === id);
    const currentUser = getCurrentUser();

    if (!topic) {
        showToast("Accès refusé ou sujet inexistant.");
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
            <div class="message-meta">Posté par <strong>${topic.author}</strong></div>
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
        <div id="topic-state-note" class="topic-state-note"></div>
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
            const banBtn = (isOwner && !isMsgAuthor) ? `<button onclick="banUser('${m.author}')" class="btn-delete-message" title="Bannir et nettoyer">🚫 Bannir</button>` : '';

            return `
                <div class="message">
                    <div class="message-meta">
                        <strong>${m.author}</strong> le ${new Date(m.date).toLocaleDateString()}
                        <div class="msg-actions">${banBtn} ${deleteBtn}</div>
                    </div>
                    <p>${m.body}</p>
                </div>
            `;
        }).join('');

    const isClosed = topic.state !== 'ouvert';
    document.getElementById('msg-body').disabled = isClosed;
    document.querySelector('#add-message-form button').disabled = isClosed;
}

function handleVote(topicId, type) {
    const currentUser = getCurrentUser();
    if (!currentUser) return showToast("Connectez-vous.");
    const topics = getStoredTopics();
    const t = topics.find(topic => topic.id === topicId);
    if (!t || !t.userVotes) return;
    
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
    if (confirm("Supprimer ce sujet ?")) {
        saveTopics(getStoredTopics().filter(t => t.id !== id));
        updateTagFilter();
        showView('view-home');
    }
}

function deleteMessage(index) {
    if (confirm("Supprimer ce message ?")) {
        const topics = getStoredTopics();
        const t = topics.find(topic => topic.id === currentTopicId);
        t.messages.splice(index, 1);
        saveTopics(topics);
        renderMessages(t);
    }
}

function editTopic(id) {
    const t = getVisibleTopics().find(topic => topic.id === id);
    document.getElementById('edit-topic-title').value = t.title;
    document.getElementById('edit-topic-body').value = t.body;
    document.getElementById('edit-topic-tags').value = t.tag;
    document.getElementById('edit-topic-form').dataset.topicId = id;
    showView('view-edit-topic');
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==========================================
// 2. LISTENERS ET INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) return window.location.href = 'index.html';
    
    document.getElementById('user-welcome').textContent = `Salut, ${user.username}`;
    if (user.role === 'admin') document.getElementById('btn-admin-dashboard').classList.remove('hidden');

    window.renderTopics = () => {
        let topics = getVisibleTopics();
        const q = document.getElementById('search-input').value.toLowerCase();
        const tagFilter = document.getElementById('filter-tag').value;
        const sort = document.getElementById('sort-order').value;

        topics = topics.filter(t => t.title.toLowerCase().includes(q) || (t.tag && t.tag.toLowerCase().includes(q)));
        if (tagFilter) {
            topics = topics.filter(t => t.tag && t.tag.split(',').map(s => s.trim()).includes(tagFilter));
        }
        
        if (sort === 'newest') topics.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sort === 'popular') topics.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));

        document.getElementById('topics-list').innerHTML = topics.map(t => `
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

    window.renderAdmin = () => {
        document.getElementById('admin-topics-list').innerHTML = getVisibleTopics().map(t => `
            <div class="admin-row"><span>${t.title}</span><button onclick="deleteTopic(${t.id})" class="btn-delete">Supprimer</button></div>
        `).join('');
    };

    document.getElementById('btn-logout').onclick = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };
    document.getElementById('btn-create-topic-nav').onclick = () => showView('view-create-topic');
    document.getElementById('btn-admin-dashboard').onclick = () => showView('view-admin');
    document.querySelectorAll('.btn-cancel').forEach(b => b.onclick = () => showView('view-home'));
    
    ['search-input', 'filter-tag', 'sort-order'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.oninput = el.onchange = renderTopics;
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
        updateTagFilter();
        showView('view-home');
        showToast("Sujet créé !");
    };

    document.getElementById('edit-topic-form').onsubmit = (e) => {
        e.preventDefault();
        const id = parseInt(e.target.dataset.topicId);
        const topics = getStoredTopics();
        const idx = topics.findIndex(t => t.id === id);
        topics[idx].title = document.getElementById('edit-topic-title').value;
        topics[idx].body = document.getElementById('edit-topic-body').value;
        topics[idx].tag = document.getElementById('edit-topic-tags').value;
        saveTopics(topics);
        updateTagFilter();
        viewTopicDetail(id);
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