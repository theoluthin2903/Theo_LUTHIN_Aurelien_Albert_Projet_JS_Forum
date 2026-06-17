# 📊 Architecture Backend - Forum Ynov

## Vue d'Ensemble Technique

### Stack Technologique
```
Frontend: HTML5 + CSS3 + JavaScript vanilla (ES6+)
Backend:  Node.js + Express.js
Database: MySQL 5.7+
Auth:     Sessions + SHA512 hashing
API:      REST
```

## Architecture du Backend

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend)                        │
│            HTML/CSS/JavaScript (localStorage fallback)       │
└────────────────────────┬────────────────────────────────────┘
                         │
                   HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   EXPRESS SERVER (3000)                      │
├──────────────────────────────────────────────────────────────┤
│  Middleware Layer                                            │
│  ├─ CORS                                                     │
│  ├─ Body Parser (JSON)                                       │
│  ├─ Cookie Parser                                            │
│  └─ Session Management (express-session)                     │
├──────────────────────────────────────────────────────────────┤
│  Route Handlers (src/routes/)                                │
│  ├─ /api/auth        → authCtrl                              │
│  ├─ /api/topics      → topicCtrl                             │
│  ├─ /api/messages    → messageCtrl                           │
│  ├─ /api/users       → userCtrl                              │
│  ├─ /api/friends     → friendCtrl                            │
│  └─ /api/admin       → adminCtrl                             │
├──────────────────────────────────────────────────────────────┤
│  Middleware d'Auth (src/middleware/auth.js)                  │
│  ├─ hashPassword()                                           │
│  ├─ verifyPassword()                                         │
│  ├─ isAuthenticated()                                        │
│  └─ isAdmin()                                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                    MySQL Protocol
                         │
┌────────────────────────▼────────────────────────────────────┐
│              MYSQL DATABASE (localhost:3306)                 │
├──────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  ├─ users              (id, username, email, password_hash) │
│  ├─ topics             (id, title, body, author_id)         │
│  ├─ messages           (id, topic_id, author_id, body)      │
│  ├─ votes              (id, message_id, user_id, type)      │
│  ├─ tags               (id, name)                            │
│  ├─ topic_tags         (topic_id, tag_id)                   │
│  ├─ friends            (id, user_id, friend_id, status)     │
│  ├─ admin_actions      (admin_id, action, target, etc)      │
│  └─ bans               (user_id, banned_by, reason)         │
└──────────────────────────────────────────────────────────────┘
```

## Flux d'Authentification

```
1. Inscription (FT-1)
   POST /api/auth/register
   ├─ Valider username (lettre + chiffre uniquement)
   ├─ Valider email (unique)
   ├─ Valider password (8+ chars, 1 maj, 1 spécial)
   ├─ Hasher password (SHA512)
   └─ Insérer user dans DB

2. Connexion (FT-2)
   POST /api/auth/login
   ├─ Chercher user par username OU email
   ├─ Vérifier password (SHA512)
   ├─ Créer session utilisateur
   └─ Retourner user info

3. Middleware Protection
   req.session.userId + isAuthenticated()
   ├─ Vérifier présence du sessionId
   └─ Refuser si pas authentifié (401)

4. Admin Check
   req.session.role === 'admin' + isAdmin()
   └─ Refuser si pas admin (403)
```

## Flux Topic/Message

```
Créer Topic (FT-3)
  POST /api/topics
  ├─ Authentification requise
  ├─ Valider title + body
  ├─ Insérer topic
  ├─ Lier tags
  └─ Retourner topicId

Lister Topics (FT-4, FT-9, FT-10)
  GET /api/topics?page=1&limit=10&tag=Tech&search=node&sort=popular
  ├─ Pagination (10, 20, 30, all)
  ├─ Filtrer par tags
  ├─ Recherche par titre
  ├─ Tri par date ou popularité
  └─ Exclure topics archivés

Poster Message (FT-5)
  POST /api/messages
  ├─ Authentification requise
  ├─ Vérifier que topic est 'ouvert'
  ├─ Insérer message
  └─ Retourner messageId

Like/Dislike Message (FT-7)
  POST /api/messages/vote {messageId, voteType}
  ├─ Empêcher like + dislike en même temps
  ├─ Toggle vote si même type
  ├─ Modifier vote si type différent
  └─ Retourner scores

Trier Messages (FT-8)
  GET /api/messages?sort=recent|popular
  ├─ Par défaut: ordre chronologique décroissant
  ├─ Populaire: calcul (likes - dislikes)
  └─ Avec pagination
```

## Système d'Amis (FTB-3)

```
Envoi Demande
  POST /api/friends/request {friendId}
  └─ Insérer dans friends (status: pending)

Accepter Demande
  POST /api/friends/accept {requestId}
  └─ Update status = accepted

Topics Privés
  POST /api/topics {visibility: private}
  ├─ Créer avec visibility=private
  └─ Accessible uniquement aux amis
```

## Dashboard Admin (FT-11)

```
Bannir Utilisateur
  POST /api/admin/ban-user {userId, reason}
  ├─ SET is_banned = TRUE
  ├─ Enregistrer action admin
  └─ L'user ne peut plus se connecter

Modifier État Topic
  PUT /api/admin/topic-state {topicId, state}
  ├─ States: ouvert, ferme, archive
  └─ Archive = invisible pour autres users

Supprimer Topic/Message
  DELETE /api/admin/{topic,message}
  ├─ Cascade delete tous les messages
  ├─ Enregistrer action
  └─ Libérer espace DB

Stats Dashboard
  GET /api/admin/stats
  ├─ Nombre users
  ├─ Nombre topics
  ├─ Nombre messages
  ├─ Nombre utilisateurs bannés
  └─ Historique actions admin
```

## Pagination System (FT-9)

```
Support: 10, 20, 30 items per page, or ALL

Requête:
  GET /api/topics?page=2&limit=20
  ├─ Offset = (page - 1) * limit
  ├─ LIMIT {limit} OFFSET {offset}
  └─ Retourner: {items, total, pages, current_page}

Réponse:
  {
    "success": true,
    "topics": [...],
    "pagination": {
      "total": 145,
      "page": 2,
      "limit": 20,
      "pages": 8
    }
  }
```

## Recherche & Filtrage (FT-12)

```
Recherche Titre (FT-12)
  GET /api/topics?search=node
  └─ LIKE %node% sur topic.title

Filtrage Tags (FT-10)
  GET /api/topics?tag=JavaScript
  └─ JOIN topics → topic_tags → tags
     WHERE tags.name = ?

Combiné:
  GET /api/topics?search=forum&tag=Tech&sort=popular&limit=20
```

## Sécurité Implémentée

```
✅ Hashage SHA512 des mots de passe
✅ Sessions sécurisées (httpOnly, secure en prod)
✅ CORS restrictif
✅ Authentification obligatoire pour écriture
✅ Vérification propriété pour modifications
✅ Admin check pour actions sensibles
✅ Validation entrées (email, username, password)
✅ Gestion des bans
```

## Codes HTTP

```
200 - OK
201 - Created
400 - Bad Request (validation error)
401 - Unauthorized (not authenticated)
403 - Forbidden (no permission)
404 - Not Found
409 - Conflict (already exists)
500 - Server Error
```

## Performance Considerations

```
✓ Indexes sur: username, email, topic_id, author_id, created_at
✓ Connection pooling MySQL (10 connections)
✓ Pagination obligatoire (pas de récupération de 1M items)
✓ Topics archivés exclus des listes publiques
✓ Votes: UNIQUE (user_id, message_id) → pas de doublons
```

## Déploiement

```
Développement:
  npm run dev  (nodemon + hot reload)

Production:
  npm start    (node server.js)
  Reverse proxy: nginx
  SSL: Let's Encrypt
  Database: managed MySQL
  Monitoring: logs, uptime checks
```

---

**Architecture complète et sécurisée prête pour la production!** 🎉
