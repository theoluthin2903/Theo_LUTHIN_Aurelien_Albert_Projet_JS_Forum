# Ynov Forum - Application Web de Discussion

Une application de forum moderne et intuitive développée en **JavaScript vanilla** avec **HTML/CSS**. Les données sont stockées localement via `localStorage` pour une utilisation sans serveur backend.

## 🎯 Fonctionnalités

### Authentification
- ✅ **Inscription** et **Connexion** utilisateurs
- ✅ Stockage sécurisé des identifiants (localStorage)
- ✅ **Rôles** : utilisateur standard et admin
- ✅ Toggle pour afficher/masquer le mot de passe

### Gestion des Topics
- ✅ **Créer** de nouveaux sujets de discussion
- ✅ **Voir le détail** d'un topic avec les réponses
- ✅ **Supprimer** ses propres topics (créateur ou admin)
- ✅ **Like** et **Dislike** sur les topics
- ✅ **Répondre** aux topics ouverts
- ✅ Filtrer par **catégorie/tag**
- ✅ **Recherche** en temps réel
- ✅ **Tri** (plus récent, plus populaire)

### Gestion des États
- 🔵 **Ouvert** : topic actif, on peut répondre
- 🟡 **Fermé** : on ne peut plus ajouter de réponses
- ⚫ **Archivé** : en lecture seule

### Thème
- 🌙 **Mode Sombre/Clair** avec toggle
- 🎨 Variables CSS pour personnalisation

### Admin
- 👨‍💼 **Tableau de bord** de modération
- 🗑️ Suppression des topics
- 👥 Gestion des utilisateurs

## 📁 Structure du Projet

```
.
├── public/
│   ├── index.html              # Page de connexion/inscription
│   ├── forum.html              # Page principale du forum
│   ├── css/
│   │   └── style.css           # Styles (thème, composants)
│   └── js/
│       ├── auth.js             # Logique authentification
│       └── forum.js            # Logique forum (topics, votes, réponses)
├── server.js                   # Serveur Node.js (optionnel)
├── package.json                # Dépendances
└── README.md                   # Ce fichier
```

## 🚀 Installation & Utilisation

### 1. Cloner/Télécharger le projet
```bash
git clone <url-du-repo>
cd Theo_LUTHIN_Aurelien_Albert_Projet_JS_Forum
```

### 2. Lancer l'application
**Option 1 : Directement dans le navigateur**
```bash
# Ouvrir public/index.html dans le navigateur
```

**Option 2 : Avec Node.js (optionnel)**
```bash
node server.js
# Puis ouvrir http://localhost:3000
```

### 3. Premiers pas
1. **Créer un compte** (Inscription)
2. **Se connecter** avec ses identifiants
3. **Explorer** les topics existants
4. **Créer** un nouveau sujet
5. **Voter** (Like/Dislike)
6. **Répondre** aux topics

## 💾 Données Stockées (localStorage)

```json
{
  "currentUser": {
    "username": "utilisateur",
    "password": "motdepasse",
    "role": "user|admin"
  },
  "users": [
    { "username": "utilisateur", "password": "motdepasse", "role": "user" }
  ],
  "topics": [
    {
      "id": 1687234567890,
      "title": "Titre du topic",
      "body": "Description détaillée...",
      "author": "utilisateur",
      "date": "2026-06-14T10:30:00.000Z",
      "tag": "tech|aide|loisirs",
      "state": "ouvert|ferme|archivé",
      "messages": [
        {
          "author": "autre_utilisateur",
          "body": "Réponse...",
          "date": "2026-06-14T11:00:00.000Z"
        }
      ],
      "likes": 5,
      "dislikes": 1
    }
  ]
}
```

## 🎨 Personnalisation

### Changer les couleurs
Éditer les variables CSS dans `public/css/style.css` :
```css
:root {
  --bg-body: #f8fafc;
  --primary: #004a99;        /* Bleu Ynov */
  --accent: #00c2cb;         /* Turquoise Ynov */
  /* ... */
}

[data-theme="dark"] {
  --bg-body: #0f172a;
  /* ... */
}
```

### Ajouter des catégories
Modifier dans `public/forum.html` :
```html
<select id="filter-tag">
  <option value="">Toutes les catégories</option>
  <option value="tech">Tech</option>
  <option value="aide">Aide</option>
  <option value="loisirs">Loisirs</option>
  <!-- Ajouter ici -->
</select>
```

## 🛠️ Outils & Technologies

- **HTML5** : Structure
- **CSS3** : Styling & thème
- **JavaScript vanilla** : Logique (ES6+)
- **localStorage** : Persistance des données
- **Node.js** : Serveur optionnel

## 📝 Comptes de Test

```
Admin :
- Username: admin
- Password: admin
- Role: admin

User :
- Username: user
- Password: user
- Role: user
```

## ⚠️ Limitations Connues

- Données stockées localement (perdues si cache vidé)
- Pas de validation côté serveur
- Pas d'authentification sécurisée (demo)
- Une seule session par navigateur

## 🔮 Améliorations Futures

- [ ] Backend Node.js/Express avec base de données
- [ ] Authentification sécurisée (JWT)
- [ ] Édition des topics/réponses
- [ ] Système de réputations (karma)
- [ ] Notifications
- [ ] Paginées avancée
- [ ] Recherche avancée (filtres multiples)
- [ ] Utilisateurs en ligne

## 📄 Licence

Projet scolaire - Libre d'utilisation

## 👥 Auteurs

- **Théo LUTHIN**
- **Aurélien ALBERT**

---

**Dernière mise à jour** : 14/06/2026