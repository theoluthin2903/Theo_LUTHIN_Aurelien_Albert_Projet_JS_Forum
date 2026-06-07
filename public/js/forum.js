document.addEventListener('DOMContentLoaded', () => {
    // --- SECURITÉ & AUTH ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('user-welcome').textContent = `Salut, ${currentUser.username}`;
    if (currentUser.role === 'admin') document.getElementById('btn-admin-dashboard').classList.remove('hidden');

    // --- INITIALISATION DONNÉES (Simulées pour le front) ---
    if (!localStorage.getItem('topics')) {
        const fakeTopics = [
            { id: 1, title: "Bienvenue sur Ynov Forum", body: "Premier post !", author: "Admin", tag: "tech", date: new Date().toISOString(), status: "ouvert", likes: 10 },
            { id: 2, title: "Besoin d'aide en Go", body: "Comment faire un serveur ?", author: "Alice", tag: "aide", date: new Date().toISOString(), status: "ouvert", likes: 2 }
        ];
        localStorage.setItem('topics', JSON.stringify(fakeTopics));
    }

    // --- NAVIGATION ---
    function showView(viewId) {
        document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        if (viewId === 'view-home') renderTopics();
        if (viewId === 'view-admin') renderAdmin();
    }

    // --- FT-12 & FT-10 : AFFICHAGE & FILTRES ---
    function renderTopics() {
        let topics = JSON.parse(localStorage.getItem('topics') || "[]");
        const searchQuery = document.getElementById('search-input').value.toLowerCase();
        const tagFilter = document.getElementById('filter-tag').value;
        const sortOrder = document.getElementById('sort-order').value;
        const pageSize = document.getElementById('page-size').value;

        // Filtrage recherche (Titre ou Tag)
        topics = topics.filter(t => t.title.toLowerCase().includes(searchQuery) || t.tag.toLowerCase().includes(searchQuery));
        
        // Filtrage catégorie
        if (tagFilter) topics = topics.filter(t => t.tag === tagFilter);

        // Tri
        if (sortOrder === 'newest') topics.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sortOrder === 'popular') topics.sort((a, b) => b.likes - a.likes);

        // Pagination (FT-9)
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
                    <span>👍 ${t.likes}</span>
                </div>
            </div>
        `).join('');
    }

    // --- FT-3 : CRÉATION TOPIC ---
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
        showToast("Sujet publié !");
        showView('view-home');
    };

    // --- FT-4 & FT-5 : DÉTAIL & MESSAGES ---
    window.viewTopicDetail = (id) => {
        const topic = JSON.parse(localStorage.getItem('topics')).find(t => t.id === id);
        const detailZone = document.getElementById('topic-detail-content');
        detailZone.innerHTML = `
            <h2>${topic.title}</h2>
            <p class="topic-body-text">${topic.body}</p>
            <small>Posté par ${topic.author} • État : ${topic.status}</small>
            <div class="votes">
                <button onclick="handleLike(${topic.id}, 'like')">👍 Like</button>
                <button onclick="handleLike(${topic.id}, 'dislike')">👎 Dislike</button>
            </div>
        `;
        showView('view-topic-detail');
    };

    // --- FT-11 : ADMIN DASHBOARD ---
    function renderAdmin() {
        const topics = JSON.parse(localStorage.getItem('topics') || "[]");
        const users = JSON.parse(localStorage.getItem('users') || "[]");

        document.getElementById('admin-topics-list').innerHTML = topics.map(t => `
            <div class="admin-row">
                <span>${t.title}</span>
                <button onclick="deleteTopic(${t.id})" class="btn-delete">Supprimer</button>
            </div>
        `).join('');

        document.getElementById('admin-users-list').innerHTML = users.map(u => `
            <div class="admin-row">
                <span>${u.username}</span>
                <button onclick="banUser('${u.username}')" class="btn-delete">Bannir</button>
            </div>
        `).join('');
    }

    window.deleteTopic = (id) => {
        let topics = JSON.parse(localStorage.getItem('topics'));
        topics = topics.filter(t => t.id !== id);
        localStorage.setItem('topics', JSON.stringify(topics));
        renderAdmin();
        showToast("Topic supprimé.");
    };

    // --- GESTION THÈME ---
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.onclick = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeBtn.textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    // --- UTILS ---
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.getElementById('toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // --- LISTENERS ---
    document.getElementById('btn-create-topic-nav').onclick = () => showView('view-create-topic');
    document.getElementById('btn-admin-dashboard').onclick = () => showView('view-admin');
    document.getElementById('search-input').oninput = renderTopics;
    document.getElementById('filter-tag').onchange = renderTopics;
    document.getElementById('page-size').onchange = renderTopics;
    document.getElementById('btn-logout').onclick = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    };
    document.querySelector('.btn-cancel').onclick = () => showView('view-home');

    renderTopics();
});