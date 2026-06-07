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

// Voir le détail d'un topic (FT-4)
function viewTopicDetail(id) {
    const topics = JSON.parse(localStorage.getItem('topics') || "[]");
    const topic = topics.find(t => t.id === id);

    if (topic) {
        const detailZone = document.getElementById('topic-detail-content');
        detailZone.innerHTML = `
            <div class="topic-header-detail">
                <h2>${topic.title}</h2>
                <span class="tag">${topic.tag}</span>
            </div>
            <div class="message main-post">
                <p>${topic.body}</p>
                <div class="message-meta">
                    Posté par <strong>${topic.author}</strong> le ${new Date(topic.date).toLocaleDateString()}
                </div>
            </div>
            <div class="votes">
                <button onclick="handleVote(${topic.id}, 'like')" class="btn-vote">👍 Like (${topic.likes || 0})</button>
                <button onclick="handleVote(${topic.id}, 'dislike')" class="btn-vote">👎 Dislike</button>
            </div>
        `;
        showView('view-topic-detail');
    }
}

// Fonction pour les likes (FT-7)
function handleVote(topicId, type) {
    let topics = JSON.parse(localStorage.getItem('topics') || "[]");
    const index = topics.findIndex(t => t.id === topicId);
    
    if (index !== -1) {
        if (type === 'like') topics[index].likes = (topics[index].likes || 0) + 1;
        if (type === 'dislike') topics[index].likes = (topics[index].likes || 0) - 1;
        
        localStorage.setItem('topics', JSON.stringify(topics));
        viewTopicDetail(topicId); // Rafraîchir la vue détail
        showToast("Vote pris en compte !");
    }
}

// Suppression Admin (FT-11)
function deleteTopic(id) {
    if (confirm("Supprimer ce sujet définitivement ?")) {
        let topics = JSON.parse(localStorage.getItem('topics') || "[]");
        topics = topics.filter(t => t.id !== id);
        localStorage.setItem('topics', JSON.stringify(topics));
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
    function renderTopics() {
        let topics = JSON.parse(localStorage.getItem('topics') || "[]");
        
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
        list.innerHTML = topics.map(t => `
            <div class="topic-item" onclick="viewTopicDetail(${t.id})">
                <div class="topic-info">
                    <h3>${t.title}</h3>
                    <p>Par ${t.author} • ${new Date(t.date).toLocaleDateString()}</p>
                </div>
                <div class="topic-meta">
                    <span class="tag">${t.tag}</span>
                    <span>👍 ${t.likes || 0}</span>
                </div>
            </div>
        `).join('');
    }

    // --- FONCTION RENDU ADMIN ---
    window.renderAdmin = () => {
        const topics = JSON.parse(localStorage.getItem('topics') || "[]");
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
            status: "ouvert",
            likes: 0
        };
        topics.push(newTopic);
        localStorage.setItem('topics', JSON.stringify(topics));
        
        document.getElementById('create-topic-form').reset();
        showToast("Topic créé avec succès !");
        showView('view-home');
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