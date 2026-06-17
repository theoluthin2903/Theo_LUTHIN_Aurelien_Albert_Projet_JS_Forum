# 🚀 Démarrage Rapide du Backend Forum

## Étapes pour démarrer le projet

### 1️⃣ Installer Node.js
Si Node.js n'est pas installé, téléchargez-le depuis https://nodejs.org/ (LTS recommandé)

### 2️⃣ Installer les dépendances
```bash
npm install
```

### 3️⃣ Configurer MySQL
```bash
# Créer la base de données et les tables
mysql -u root -p < database.sql

# Insérer les données de test (optionnel)
mysql -u root -p forum_db < seed.sql
```

**Alternative** : Utilisez MySQL Workbench ou PHPMyAdmin pour importer les fichiers SQL

### 4️⃣ Configurer les variables d'environnement
Modifier `.env` avec vos identifiants MySQL :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votreMotDePasse
DB_NAME=forum_db
```

### 5️⃣ Lancer le serveur
```bash
npm start
```

Ou en mode développement :
```bash
npm run dev
```

### 6️⃣ Accéder à l'application
Ouvrez http://localhost:3000/forum dans votre navigateur

## 📝 Compte de test
- **Username**: admin
- **Password**: Password123!

---

## ✅ Fonctionnalités Implémentées

- ✅ Authentification (inscription/connexion)
- ✅ CRUD Topics avec tags
- ✅ Système de messages/réponses
- ✅ Like/Dislike des messages
- ✅ Pagination et recherche
- ✅ Profils utilisateurs
- ✅ Système d'amis
- ✅ Dashboard Admin (bannir, modérer)
- ✅ States (ouvert/fermé/archivé)
- ✅ Topics publics/privés

## 🆘 Troubleshooting

**Erreur: "npm: command not found"**
→ Installer Node.js complètement et redémarrer votre terminal

**Erreur: "Can't connect to MySQL server"**
→ Vérifier que MySQL est démarré et les identifiants dans `.env` sont corrects

**Port 3000 déjà utilisé**
→ Changer `PORT` dans `.env` ou arrêter l'autre processus

---

Bon développement! 🎉
