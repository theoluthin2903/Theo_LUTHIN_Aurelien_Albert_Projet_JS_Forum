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