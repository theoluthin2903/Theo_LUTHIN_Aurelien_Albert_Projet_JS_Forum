document.addEventListener('DOMContentLoaded', () => {
    // On récupère l'utilisateur connecté dans la simulation
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        alert("Vous devez être connecté !");
        window.location.href = 'index.html';
        return;
    }

    // FT-11 : Si c'est un admin (tu peux te créer un compte admin à la main dans localStorage)
    if (user.role === 'admin') {
        document.getElementById('btn-admin-dashboard').classList.remove('hidden');
    }

    console.log("Connecté en tant que :", user.username);
      // 1. On récupère les éléments
    const btnCreate = document.getElementById('btn-create-topic');
    const viewCreate = document.getElementById('view-create-topic');
    const viewHome = document.getElementById('view-home'); // La liste des topics

    // 2. On écoute le clic sur le bouton "+ Créer Topic"
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            console.log("Clic sur créer topic détecté !");
            
            // On cache l'accueil (la liste des topics)
            if (viewHome) viewHome.classList.add('hidden');
            
            // On affiche le formulaire de création
            if (viewCreate) viewCreate.classList.remove('hidden');
        });
    }

    // 3. (Optionnel) Gérer le bouton "Annuler" dans le formulaire
    const btnCancel = document.querySelector('.btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            viewCreate.classList.add('hidden');
            viewHome.classList.remove('hidden');
        });
    }
    
    // --- GESTION DE LA DÉCONNEXION ---
    const btnLogout = document.getElementById('btn-logout');

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
        // 1. On vide le localStorage (on oublie l'utilisateur)
        localStorage.removeItem('currentUser');
        
        // 2. Optionnel : On peut aussi vider 'user' si tu l'as utilisé
        localStorage.clear(); // Ceci vide tout d'un coup

        alert("Vous avez été déconnecté.");

        // 3. On redirige vers la page d'accueil/connexion
        window.location.href = 'index.html';
        });
    }
});

// Navigation entre les vues
function showView(viewId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

// FT-7: Gestion Like/Dislike (Exclusion mutuelle)
function toggleVote(messageId, type) {
    console.log(`Vote ${type} pour message ${messageId}`);
}

// FT-12: Recherche automatique
document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value;
    if(query.length > 2) {
        console.log("Recherche de : " + query);
    }
});

// FT-6: Gestion propriétaire
// Lors de l'affichage d'un topic, vérifier si auteur == user_connecté
// pour afficher les boutons "Supprimer" ou "Modifier".

// Exemple pour afficher un topic (FT-4)
function renderTopicDetail(topic) {
    const container = document.getElementById('topic-content');
    container.innerHTML = `
        <h1>${topic.title}</h1>
        <p>${topic.body}</p>
        <small>Par ${topic.author} le ${topic.date} - État: ${topic.status}</small>
    `;
    showView('view-topic-detail');
}

async function loadTopics() {
    const response = await fetch('/api/topics');
    const topics = await response.json();
    
    const container = document.getElementById('topics-list');
    container.innerHTML = ''; // On vide avant d'ajouter

    topics.forEach(topic => {
        const div = document.createElement('div');
        div.className = 'topic-item';
        div.innerHTML = `
            <h3>${topic.title}</h3>
            <p>Par ${topic.author} - ${new Date(topic.createdAt).toLocaleDateString()}</p>
            <span class="tag">${topic.tag}</span>
        `;
        div.onclick = () => loadOneTopic(topic.id); // FT-4: Consulter un topic
        container.appendChild(div);
    });
}
