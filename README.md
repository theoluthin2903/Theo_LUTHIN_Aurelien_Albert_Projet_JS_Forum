# Ynov Forum - Application Web de Discussion

Une application de forum moderne et intuitive développée en **Node.js/Express** avec **HTML/CSS/JavaScript vanilla** et **MySQL**. 

## 🎯 Fonctionnalités Implémentées

### ✅ Authentification (FT-1, FT-2)
- **Inscription** avec validation : username (lettres/chiffres uniquement), email unique, mot de passe (8+ chars, 1 majuscule, 1 caractère spécial)
- **Connexion** avec username ou email
- Hashage des mots de passe en SHA512
- Sessions utilisateur sécurisées

### ✅ Gestion des Topics (FT-3, FT-4, FT-6, FT-10)
- **Créer** de nouveaux sujets de discussion avec tags
- **Voir le détail** d'un topic avec les réponses
- **Supprimer** ses propres topics (créateur ou admin)
- **Modifier l'état** (ouvert, fermé, archivé)
- **Visibilité** (public ou privé)
- **Filtrer par tags/catégories**
- **Recherche** en temps réel par titre

### ✅ Gestion des Messages (FT-5, FT-6, FT-7, FT-8, FT-9)
- **Poster** des messages dans les topics ouverts
- **Like/Dislike** sur les messages (un utilisateur ne peut pas like et dislike en même temps)
- **Tri des messages** (plus récent par défaut, ou par popularité)
- **Système de pagination** (10, 20, 30, ou tous les éléments)
- **Suppression** par le créateur du message, le propriétaire du topic, ou admin

## 📁 Structure du Projet

```
.
├── public/                           # Frontend
│   ├── index.html                    # Page d'authentification
│   ├── forum.html                    # Page principale du forum
│   ├── css/
│   │   └── style.css                 # Styles
│   └── js/
│       ├── auth.js                   # Logique frontend d'authentification
│       └── forum.js                  # Logique frontend du forum
├── src/
│   ├── config/
│   │   └── db.js                     # Configuration MySQL
│   ├── controllers/
│   │   ├── authCtrl.js               # Contrôleurs d'authentification
│   │   ├── topicCtrl.js              # Contrôleurs des topics
│   │   ├── messageCtrl.js            # Contrôleurs des messages
│   │   ├── userCtrl.js               # Contrôleurs des utilisateurs
│   │   ├── friendCtrl.js             # Contrôleurs des amis
│   │   └── adminCtrl.js              # Contrôleurs admin
│   ├── routes/
│   │   ├── auth.js                   # Routes d'authentification
│   │   ├── topics.js                 # Routes des topics
│   │   ├── messages.js               # Routes des messages
│   │   ├── users.js                  # Routes des utilisateurs
│   │   ├── friends.js                # Routes des amis
│   │   └── admin.js                  # Routes admin
│   └── middleware/
│       └── auth.js                   # Middleware d'authentification
├── server.js                         # Serveur Express
├── package.json                      # Dépendances
├── .env                              # Variables d'environnement
├── database.sql                      # Schéma de la base de données
├── seed.sql                          # Données de test
└── README.md                         # Ce fichier
```

## 🚀 Installation & Utilisation

### Prérequis
- **Node.js** v14+
- **npm** ou **yarn**
- **MySQL** v5.7+

### 1. Installation de Node.js
Téléchargez Node.js depuis [https://nodejs.org/](https://nodejs.org/) et installez-le.

### 2. Cloner/Télécharger le projet
```bash
git clone https://github.com/theoluthin2903/Theo_LUTHIN_Aurelien_Albert_Projet_JS_Forum
cd Theo_LUTHIN_Aurelien_Albert_Projet_JS_Forum
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configurer la base de données MySQL

#### Option A: MySQL CLI
```bash
mysql -u root -p < database.sql
mysql -u root -p forum_db < seed.sql
```

#### Option B: MySQL Workbench ou autre GUI
1. Créer une nouvelle base de données `forum_db`
2. Importer `database.sql`
3. Importer `seed.sql` (données de test)

### 5. Configurer les variables d'environnement
Modifier le fichier `.env` :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votreMotDePasse
DB_NAME=forum_db
DB_PORT=3306
PORT=3000
NODE_ENV=development
SESSION_SECRET=changez_ceci_en_production
```

### 6. Lancer le serveur
```bash
npm start
```

Ou en mode développement avec auto-reload :
```bash
npm run dev
```

### 7. Accéder à l'application
Ouvrir le navigateur et aller à : **http://localhost:3000/forum**

## 📝 Comptes de Test

```
Admin:
- Username: admin
- Password: Password123!

Utilisateur:
- Username: john_doe
- Password: Password123!

Utilisateur:
- Username: jane_smith
- Password: Password123!

Utilisateur:
- Username: bob_wilson
- Password: Password123!
```

## 📡 Routes API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/current` - Utilisateur courant

### Topics
- `GET /api/topics` - Lister les topics (avec pagination, filtres, recherche)
- `POST /api/topics` - Créer un topic
- `GET /api/topics/:id` - Détail d'un topic
- `PUT /api/topics/:id` - Modifier un topic
- `DELETE /api/topics/:id` - Supprimer un topic

### Messages
- `GET /api/messages?topicId=X` - Lister les messages d'un topic
- `POST /api/messages` - Poster un message
- `POST /api/messages/vote` - Like/Dislike un message
- `DELETE /api/messages/:id` - Supprimer un message

### Utilisateurs
- `GET /api/users/:userId` - Profil d'un utilisateur
- `PUT /api/users/profile` - Modifier son profil

### Amis
- `POST /api/friends/request` - Envoyer une demande d'ami
- `POST /api/friends/accept` - Accepter une demande
- `POST /api/friends/reject` - Refuser une demande
- `GET /api/friends/list` - Lister ses amis
- `GET /api/friends/requests/pending` - Demandes en attente

### Admin
- `POST /api/admin/ban-user` - Bannir un utilisateur
- `PUT /api/admin/topic-state` - Modifier l'état d'un topic
- `DELETE /api/admin/topic` - Supprimer un topic
- `DELETE /api/admin/message` - Supprimer un message
- `GET /api/admin/stats` - Statistiques du dashboard
- `GET /api/admin/users` - Lister tous les utilisateurs

## 🗄️ Schéma de la Base de Données

**Utilisateurs** → Topics + Messages + Votes + Amis
- `users`: Profils utilisateurs
- `topics`: Sujets de discussion
- `messages`: Réponses aux topics
- `votes`: Like/Dislike sur les messages
- `tags`: Catégories
- `topic_tags`: Junction pour topics ↔ tags
- `friends`: Système d'amis
- `admin_actions`: Historique des actions admin
- `bans`: Historique des bans

## 🛠️ Technologies

- **Backend** : Node.js, Express.js
- **Base de données** : MySQL 5.7+
- **Frontend** : HTML5, CSS3, JavaScript vanilla (ES6+)
- **Authentification** : Sessions sécurisées + SHA512
- **API** : REST

## 📋 Spécifications Respectées

✅ FT-1: Inscription avec validation complète
✅ FT-2: Connexion avec username ou email
✅ FT-3: Création de topics avec tags
✅ FT-4: Consultation des topics
✅ FT-5: Poster des messages
✅ FT-6: Gestion des topics et messages par le propriétaire
✅ FT-7: Like/Dislike des messages
✅ FT-8: Tri des messages (récent/populaire)
✅ FT-9: Pagination des topics et messages (10, 20, 30, tous)
✅ FT-10: Filtrage par tags/catégories
✅ FT-12: Recherche par titre


## 🔐 Sécurité

- Mots de passe hashés en SHA512
- Sessions sécurisées avec HttpOnly cookies
- Protection CORS
- Validation des entrées
- Autorisation par rôles (user/admin)
- Vérification de propriété pour les modifications

## 🚀 Déploiement en Production

1. Changer le `NODE_ENV` à `production` dans `.env`
2. Générer un `SESSION_SECRET` sécurisé
3. Utiliser un reverse proxy (nginx) devant Node.js
4. Configurer HTTPS/SSL
5. Utiliser un pool de connexions MySQL optimisé
6. Mettre en place des backups de base de données réguliers

## 📞 Support & Documentation

Pour plus d'informations, consultez le [schéma SQL](database.sql) ou les commentaires dans le code.

## 👥 Auteurs

- **Théo LUTHIN**
- **Aurélien ALBERT**

---

**Dernière mise à jour** : Juin 2026
