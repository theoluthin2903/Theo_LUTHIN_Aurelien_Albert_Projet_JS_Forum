// ==========================================
// 1. FONCTIONS GLOBALES (Accessibles par le HTML)
// ==========================================

// Navigation entre les vues (FT-4)
function showView(viewId) {
    console.log("Navigation vers : " + viewId);
    
    // On cache toutes les sections
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    
    // On affiche la section demandée
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    // Actions spécifiques au chargement de la vue
    if (viewId === 'view-home') {
        renderTopics(); // On rafraîchit la liste
    }
    if (viewId === 'view-admin') {
        renderAdmin(); // On rafraîchit le dashboard admin
    }
}

let currentTopicId = null;

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function getStoredTopics() {
    return (JSON.parse(localStorage.getItem('topics') || "[]") || []).map(topic => ({
        state: topic.state || topic.status || 'ouvert',
        messages: Array.isArray(topic.messages) ? topic.messages : [],
        likes: typeof topic.likes === 'number' ? topic.likes : 0,
        dislikes: typeof topic.dislikes === 'number' ? topic.dislikes : 0,
        ...topic
    }));
}

function isExampleTopic(topic) {
    const exampleTitles = [
        "Bienvenue sur Ynov Forum",
        "Besoin d'aide en Go"
    ];
    return exampleTitles.some(example => topic.title?.includes(example));
}

function isRealTopic(topic) {
    return topic
        && typeof topic.title === 'string'
        && topic.title.trim() !== ''
        && typeof topic.body === 'string'
        && topic.body.trim() !== ''
        && typeof topic.author === 'string'
        && topic.author.trim() !== ''
        && typeof topic.date === 'string'
        && topic.date.trim() !== '';
}

function getVisibleTopics() {
    const allTopics = getStoredTopics();
    const topics = allTopics.filter(t => !t.fake && !t.isFake && isRealTopic(t) && !isExampleTopic(t));
    if (topics.length !== allTopics.length) {
        saveTopics(topics);
    }
    return topics;
}

function saveTopics(topics) {
    localStorage.setItem('topics', JSON.stringify(topics));
}

function setTopicState(id, state) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast("Action non autorisée.");
        return;
    }

    const topics = getStoredTopics();
    const index = topics.findIndex(t => t.id === id);
    if (index === -1) return;

    const topic = topics[index];
    if (currentUser.role !== 'admin' && topic.author !== currentUser.username) {
        showToast("Vous ne pouvez modifier que vos propres sujets.");
        return;
    }

    topics[index].state = state;
    saveTopics(topics);
    if (currentTopicId === id && !document.getElementById('view-topic-detail').classList.contains('hidden')) {
        viewTopicDetail(id);
    } else {
        renderTopics();
    }
    showToast(`Topic ${state}.`);
}

// Voir le détail d'un topic (FT-4)
function viewTopicDetail(id) {
    const topics = getVisibleTopics();
    const topic = topics.find(t => t.id === id);
    const currentUser = getCurrentUser();

    if (topic) {
        currentTopicId = id;
        const canDelete = currentUser && (currentUser.role === 'admin' || topic.author === currentUser.username);
        const canManage = currentUser && topic.author === currentUser.username;
        const managementButtons = canManage ? `
            <div class="topic-state-actions">
                ${topic.state !== 'ouvert' ? `<button onclick="setTopicState(${topic.id}, 'ouvert')" class="btn-accent">Ouvrir</button>` : ''}
                ${topic.state !== 'ferme' ? `<button onclick="setTopicState(${topic.id}, 'ferme')" class="btn-accent">Fermer</button>` : ''}
                ${topic.state !== 'archivé' ? `<button onclick="setTopicState(${topic.id}, 'archivé')" class="btn-delete">Archiver</button>` : ''}
            </div>
        ` : '';

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
                <div class="message-meta">
                    Posté par <strong>${topic.author}</strong> le ${new Date(topic.date).toLocaleDateString()}
                </div>
            </div>
            <div class="votes">
                <button onclick="handleVote(${topic.id}, 'like')" class="btn-vote">👍 Like (${topic.likes || 0})</button>
                <button onclick="handleVote(${topic.id}, 'dislike')" class="btn-vote">👎 Dislike (${topic.dislikes || 0})</button>
                ${canDelete ? `<button onclick="deleteTopic(${topic.id})" class="btn-delete">Supprimer ce sujet</button>` : ''}
            </div>
            ${managementButtons}
            <div id="topic-state-note" class="topic-state-note"></div>
            <h3>Réponses</h3>
            <div id="messages-list"></div>
        `;
        showView('view-topic-detail');
        renderMessages(topic);
    }
}

function renderMessages(topic) {
    const list = document.getElementById('messages-list');
    if (!topic.messages || topic.messages.length === 0) {
        list.innerHTML = '<p class="no-messages">Aucune réponse pour l’instant.</p>';
    } else {
        list.innerHTML = topic.messages.map(message => `
            <div class="message">
                <div class="message-meta">Posté par <strong>${message.author}</strong> le ${new Date(message.date).toLocaleDateString()}</div>
                <p>${message.body}</p>
            </div>
        `).join('');
    }

    const stateNote = document.getElementById('topic-state-note');
    const messageInput = document.getElementById('msg-body');
    const submitButton = document.querySelector('#add-message-form button[type="submit"]');

    if (topic.state !== 'ouvert') {
        messageInput.disabled = true;
        submitButton.disabled = true;
        stateNote.textContent = topic.state === 'ferme'
            ? 'Ce topic est fermé : les nouvelles réponses sont désactivées.'
            : 'Ce topic est archivé : la discussion est en lecture seule.';
    } else {
        messageInput.disabled = false;
        submitButton.disabled = false;
        stateNote.textContent = '';
    }
}

// Fonction pour les likes (FT-7)
function handleVote(topicId, type) {
    const topics = getStoredTopics();
    const index = topics.findIndex(t => t.id === topicId);
    
    if (index !== -1) {
        if (type === 'like') topics[index].likes = (topics[index].likes || 0) + 1;
        if (type === 'dislike') topics[index].dislikes = (topics[index].dislikes || 0) + 1;
        
        saveTopics(topics);
        viewTopicDetail(topicId); // Rafraîchir la vue détail
        showToast("Vote pris en compte !");
    }
}

// Suppression de topic par le créateur ou admin
function deleteTopic(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast("Action non autorisée.");
        return;
    }

    const topics = getStoredTopics();
    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    if (currentUser.role !== 'admin' && topic.author !== currentUser.username) {
        showToast("Vous ne pouvez supprimer que vos propres sujets.");
        return;
    }

    if (confirm("Supprimer ce sujet définitivement ?")) {
        const updatedTopics = topics.filter(t => t.id !== id);
        saveTopics(updatedTopics);
        const detailView = !document.getElementById('view-topic-detail').classList.contains('hidden');
        if (detailView) showView('view-home');
        renderTopics();
        renderAdmin();
        showToast("Topic supprimé.");
    }
}

// Notification Toast
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}


// ==========================================
// 2. LOGIQUE AU CHARGEMENT DU DOCUMENT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- SÉCURITÉ ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('user-welcome').textContent = `Salut, ${currentUser.username}`;
    if (currentUser.role === 'admin') {
        document.getElementById('btn-admin-dashboard').classList.remove('hidden');
    }


    // --- FONCTION DE RENDU DE LA LISTE (FT-10, 12, 9) ---
    window.renderTopics = function renderTopics() {
        let topics = getVisibleTopics();
        
        // Filtre Recherche
        const query = document.getElementById('search-input').value.toLowerCase();
        topics = topics.filter(t => t.title.toLowerCase().includes(query) || t.tag.toLowerCase().includes(query));

        // Filtre Catégorie
        const tagFilter = document.getElementById('filter-tag').value;
        if (tagFilter) topics = topics.filter(t => t.tag === tagFilter);

        // Tri
        const sort = document.getElementById('sort-order').value;
        if (sort === 'newest') topics.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sort === 'popular') topics.sort((a, b) => b.likes - a.likes);

        // Pagination (FT-9)
        const pageSize = document.getElementById('page-size').value;
        if (pageSize !== 'all') topics = topics.slice(0, parseInt(pageSize));

        const list = document.getElementById('topics-list');
        if (topics.length === 0) {
            list.innerHTML = '<p class="empty-state">Aucun sujet à afficher pour le moment.</p>';
            return;
        }
        list.innerHTML = topics.map(t => `
            <div class="topic-item" onclick="viewTopicDetail(${t.id})">
                <div class="topic-info">
                    <h3>${t.title}</h3>
                    <p>Par ${t.author} • ${new Date(t.date).toLocaleDateString()}</p>
                </div>
                <div class="topic-meta">
                    <span class="tag">${t.tag}</span>
                    <span class="state-badge ${t.state}">${t.state}</span>
                    <span>👍 ${t.likes || 0}</span>
                    <span>👎 ${t.dislikes || 0}</span>
                </div>
            </div>
        `).join('');
    }

    // --- FONCTION RENDU ADMIN ---
    window.renderAdmin = () => {
        const topics = getVisibleTopics();
        const adminZone = document.getElementById('admin-topics-list');
        adminZone.innerHTML = topics.map(t => `
            <div class="admin-row">
                <span>${t.title}</span>
                <button onclick="deleteTopic(${t.id})" class="btn-delete">Supprimer</button>
            </div>
        `).join('');
    };

    // --- ÉCOUTEURS D'ÉVÉNEMENTS (LISTENERS) ---

    // Bouton de déconnexion
    document.getElementById('btn-logout').onclick = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    };

    // Boutons Retour et Annuler
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            showView('view-home');
        };
    });

    // Navigation Header
    document.getElementById('btn-create-topic-nav').onclick = () => showView('view-create-topic');
    document.getElementById('btn-admin-dashboard').onclick = () => showView('view-admin');

    // Filtres et Recherche (Temps réel)
    document.getElementById('search-input').oninput = renderTopics;
    document.getElementById('filter-tag').onchange = renderTopics;
    document.getElementById('sort-order').onchange = renderTopics;
    document.getElementById('page-size').onchange = renderTopics;

    // Formulaire de création (FT-3)
    document.getElementById('create-topic-form').onsubmit = (e) => {
        e.preventDefault();
        const topics = JSON.parse(localStorage.getItem('topics') || "[]");
        const newTopic = {
            id: Date.now(),
            title: document.getElementById('topic-title').value,
            body: document.getElementById('topic-body').value,
            tag: document.getElementById('topic-tags').value || "général",
            author: currentUser.username,
            date: new Date().toISOString(),
            state: "ouvert",
            messages: [],
            likes: 0,
            dislikes: 0
        };
        topics.push(newTopic);
        saveTopics(topics);
        
        document.getElementById('create-topic-form').reset();
        showToast("Topic créé avec succès !");
        renderTopics();
        showView('view-home');
    };

    document.getElementById('add-message-form').onsubmit = (e) => {
        e.preventDefault();
        const messageBody = document.getElementById('msg-body').value.trim();
        if (!messageBody) return;

        const topics = getStoredTopics();
        const index = topics.findIndex(t => t.id === currentTopicId);
        if (index === -1) return;

        const topic = topics[index];
        if (topic.state !== 'ouvert') {
            showToast("Impossible d'ajouter une réponse sur ce topic.");
            return;
        }

        const currentUser = getCurrentUser();
        topic.messages = topic.messages || [];
        topic.messages.push({
            author: currentUser.username,
            body: messageBody,
            date: new Date().toISOString()
        });

        saveTopics(topics);
        document.getElementById('msg-body').value = '';
        renderMessages(topic);
        showToast("Réponse ajoutée.");
    };

    // Thème Sombre/Clair
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.onclick = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeBtn.textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    // Premier rendu au chargement
    renderTopics();
});