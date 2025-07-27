# API Documentation - TrueNumber Multijoueur

## Base URL
```
http://localhost:5000/api
```

## Authentification
Toutes les routes nécessitent un token JWT dans le header Authorization :
```
Authorization: Bearer <your-jwt-token>
```

## Routes d'authentification

### POST /auth/register
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "0123456789",
  "password": "password123"
}
```

### POST /auth/login
Se connecter avec un compte existant.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Routes de jeu solo

### POST /game/play
Jouer une partie solo de TrueNumber.

**Response:**
```json
{
  "success": true,
  "message": "Partie terminée avec succès",
  "data": {
    "gameId": "game-id",
    "number": 75,
    "result": "win",
    "pointsChange": 50,
    "newBalance": 150,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /game/history
Récupérer l'historique des parties solo.

**Query Parameters:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Nombre d'éléments par page (défaut: 10)

### GET /game/balance
Récupérer le solde de points actuel.

## Routes multijoueur

### POST /game/multiplayer
Créer une nouvelle partie multijoueur.

**Body:**
```json
{
  "stake": 50,
  "timeLimit": 60
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partie créée",
  "data": {
    "_id": "game-id",
    "creator": "user-id",
    "stake": 50,
    "timeLimit": 60,
    "status": "waiting",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /game/multiplayer/waiting
Lister toutes les parties en attente.

**Response:**
```json
{
  "success": true,
  "message": "Parties en attente",
  "data": [
    {
      "_id": "game-id",
      "creator": {
        "_id": "user-id",
        "firstName": "John",
        "lastName": "Doe",
        "points": 150
      },
      "stake": 50,
      "timeLimit": 60,
      "status": "waiting",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /game/multiplayer/join/:gameId
Rejoindre une partie existante.

**Response:**
```json
{
  "success": true,
  "message": "Partie rejointe",
  "data": {
    "_id": "game-id",
    "creator": "user-id",
    "opponent": "user-id",
    "stake": 50,
    "timeLimit": 60,
    "status": "playing",
    "startedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /game/multiplayer/status/:gameId
Obtenir l'état actuel d'une partie.

**Response:**
```json
{
  "success": true,
  "message": "État de la partie récupéré",
  "data": {
    "game": {
      "_id": "game-id",
      "creator": {
        "_id": "user-id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "opponent": {
        "_id": "user-id",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "stake": 50,
      "timeLimit": 60,
      "status": "playing",
      "creatorNumber": 75,
      "opponentNumber": null,
      "startedAt": "2024-01-01T00:00:00.000Z"
    },
    "currentPlayer": "opponent-user-id",
    "timeRemaining": 45,
    "isMyTurn": true,
    "gameState": {
      "creatorPlayed": true,
      "opponentPlayed": false,
      "finished": false
    }
  }
}
```

### POST /game/multiplayer/play/:gameId
Jouer un tour (génération automatique du nombre).

**Response:**
```json
{
  "success": true,
  "message": "Coup enregistré",
  "data": {
    "number": 85,
    "game": {
      "_id": "game-id",
      "status": "finished",
      "creatorNumber": 75,
      "opponentNumber": 85,
      "winner": "opponent-user-id"
    },
    "finished": true,
    "nextPlayer": null
  }
}
```

### GET /game/multiplayer/history
Récupérer l'historique des parties multijoueur.

**Query Parameters:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Nombre d'éléments par page (défaut: 10)

## Codes d'erreur

### 400 - Bad Request
- Solde insuffisant pour rejoindre une partie
- Partie non disponible
- Ce n'est pas votre tour
- Partie non en cours

### 401 - Unauthorized
- Token manquant ou invalide
- Utilisateur introuvable

### 403 - Forbidden
- Accès non autorisé à une partie

### 404 - Not Found
- Utilisateur non trouvé
- Partie non trouvée
- Ressource non trouvée

### 500 - Internal Server Error
- Erreur serveur générique

## Communication en temps réel

Le jeu utilise Socket.IO pour la communication en temps réel. Voir le fichier `SOCKET_EVENTS.md` pour plus de détails.

## Séquence de jeu typique

1. **Création de partie** : `POST /game/multiplayer`
2. **Liste des parties** : `GET /game/multiplayer/waiting`
3. **Rejoindre une partie** : `POST /game/multiplayer/join/:gameId`
4. **Connexion Socket.IO** : Rejoindre la room de la partie
5. **Jouer un tour** : `POST /game/multiplayer/play/:gameId` ou événement Socket.IO
6. **Suivre l'état** : `GET /game/multiplayer/status/:gameId`
7. **Historique** : `GET /game/multiplayer/history`

## Validation des données

### Création de partie
- `stake` : Nombre positif minimum 1
- `timeLimit` : Nombre positif minimum 10 secondes

### Authentification
- `email` : Format email valide
- `password` : Minimum 6 caractères
- `firstName`, `lastName` : Non vides
- `phone` : Format téléphone valide 